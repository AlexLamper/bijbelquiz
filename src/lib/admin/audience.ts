import { AnalyticsEvent, User, connectDB } from '@/database';
import { COUNTED_COMPLETION } from '@/lib/analytics/events';
import { getInternalAccountIds } from '@/lib/analytics/internal-accounts';
import { amsterdamDayKey, amsterdamWindowStart, dayKeyLabel, shiftDayKey } from '@/lib/admin/time';
import { PREMIUM_SNAPSHOT_FIELDS } from '@/lib/premium-state';
import { summarizePremium, type PremiumSource } from '@/lib/admin/premium-grants';
import {
  deriveSignupMethod,
  deriveSignupPlatform,
  isSignupPlatform,
  loadPlatformEvidence,
  webPlatformFromDevice,
  type MethodKey,
  type PlatformEvidence,
  type PlatformKey,
} from '@/lib/admin/platform';

/**
 * Who the accounts are and where they come from, for `/beheer`, the
 * statistics page and the app's admin screen (`/api/mobile/admin/overview`).
 *
 * Reads every account once (a narrow projection), resolves its sign-up
 * platform (stored, or derived for older accounts) and builds all splits from
 * that one pass, so the numbers on every surface add up the same way.
 */

export type PlatformCounts = Partial<Record<PlatformKey, number>>;

export interface CountByPlatform {
  total: number;
  byPlatform: PlatformCounts;
}

export interface RateRow {
  cohort: number;
  retained: number;
  rate: number;
}

export interface ConversionRow {
  accounts: number;
  premium: number;
  rate: number;
}

export interface AudienceStats {
  generatedAt: string;
  totalUsers: number;
  internalExcluded: number;
  /** Accounts whose sign-up platform is derived rather than recorded. */
  derivedPlatforms: number;
  registrations: {
    today: CountByPlatform;
    days7: CountByPlatform;
    days30: CountByPlatform;
    allTime: CountByPlatform;
    weekly: Array<{ weekStart: string; label: string } & CountByPlatform>;
  };
  byMethod: Partial<Record<MethodKey, number>>;
  active: { today: CountByPlatform; days7: CountByPlatform; days30: CountByPlatform };
  retention: { description: string; total: RateRow; byPlatform: Partial<Record<PlatformKey, RateRow>> };
  premium: {
    total: number;
    bySource: Record<PremiumSource, number>;
    bySignupPlatform: PlatformCounts;
    conversion: {
      description: string;
      total: ConversionRow;
      paid: { premium: number; rate: number };
      byPlatform: Partial<Record<PlatformKey, ConversionRow>>;
      newLast30d: ConversionRow;
    };
    grantsActive: number;
    grantsExpiringIn7d: number;
  };
  quizPlays: {
    description: string;
    days7: { total: number; byPlatform: Partial<Record<'web' | 'ios' | 'android', number>> };
    days30: { total: number; byPlatform: Partial<Record<'web' | 'ios' | 'android', number>> };
  };
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function bump<K extends string>(target: Partial<Record<K, number>>, key: K, by = 1) {
  target[key] = (target[key] ?? 0) + by;
}

const EVIDENCE_TTL_MS = 10 * 60 * 1000;
let evidenceCache: { at: number; map: Map<string, PlatformEvidence> } | null = null;

/**
 * Evidence for the accounts without a stored platform. Cached for ten
 * minutes: it is about their first events, which do not change, and the set
 * only shrinks (new accounts carry the stored value).
 */
export async function platformEvidenceFor(ids: string[]): Promise<Map<string, PlatformEvidence>> {
  const fresh = evidenceCache && Date.now() - evidenceCache.at < EVIDENCE_TTL_MS ? evidenceCache.map : null;
  const missing = fresh ? ids.filter((id) => !fresh.has(id)) : ids;
  const map = fresh ?? new Map<string, PlatformEvidence>();
  if (missing.length > 0) {
    const loaded = await loadPlatformEvidence(missing);
    for (const id of missing) map.set(id, loaded.get(id) ?? {});
  }
  evidenceCache = { at: fresh ? evidenceCache!.at : Date.now(), map };
  return map;
}

/** For tests that swap databases. */
export function resetAudienceCache() {
  evidenceCache = null;
}

/** Monday (Amsterdam calendar) of the week a day key falls in. */
export function weekStartKey(dayKey: string): string {
  const weekday = new Date(`${dayKey}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return shiftDayKey(dayKey, -((weekday + 6) % 7));
}

type LeanAudienceUser = {
  _id: unknown;
  email?: string;
  createdAt?: Date;
  signupPlatform?: string;
  signupMethod?: string;
  hasPassword?: boolean;
  googleId?: string;
  appleId?: string;
  lastPlayedAt?: Date | null;
  lastActiveAt?: Date | null;
  lastSeenPlatform?: string | null;
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | null;
  hasLifetimePremium?: boolean;
  groupPremiumUntil?: Date | null;
  premiumGranted?: boolean;
  premiumGrantedUntil?: Date | null;
  stripeCurrentPeriodEnd?: Date | null;
};

/** Signed-in activity per account and platform key since `from`, from the analytics events. */
async function eventActivity(from: Date) {
  const rows = await AnalyticsEvent.aggregate<{ _id: { u: unknown; p: string; d: string | null }; lastAt: Date }>([
    { $match: { createdAt: { $gte: from }, userId: { $type: 'objectId' } } },
    {
      $group: {
        _id: {
          u: '$userId',
          p: '$platform',
          d: { $cond: [{ $eq: ['$name', 'session_start'] }, { $ifNull: ['$props.device', null] }, null] },
        },
        lastAt: { $max: '$createdAt' },
      },
    },
  ]);
  return rows;
}

export async function getAudienceStats(now: Date = new Date()): Promise<AudienceStats> {
  await connectDB();

  const start1 = amsterdamWindowStart(1, now);
  const start7 = amsterdamWindowStart(7, now);
  const start30 = amsterdamWindowStart(30, now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const in7Days = now.getTime() + 7 * 24 * 60 * 60 * 1000;

  const projection: Record<string, unknown> = {
    email: 1,
    createdAt: 1,
    signupPlatform: 1,
    signupMethod: 1,
    googleId: 1,
    appleId: 1,
    lastPlayedAt: 1,
    lastActiveAt: 1,
    lastSeenPlatform: 1,
    stripeCurrentPeriodEnd: 1,
    // Whether a password exists, without reading the hash.
    hasPassword: { $gt: [{ $strLenCP: { $ifNull: ['$password', ''] } }, 0] },
  };
  for (const field of PREMIUM_SNAPSHOT_FIELDS.split(' ')) projection[field] = 1;

  const [users, internalIds, activityRows, playRows7, playRows30] = await Promise.all([
    User.aggregate<LeanAudienceUser>([{ $project: projection }]),
    getInternalAccountIds(),
    eventActivity(start30),
    AnalyticsEvent.aggregate([
      { $match: { name: 'quiz_completed', createdAt: { $gte: start7 }, ...COUNTED_COMPLETION } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { name: 'quiz_completed', createdAt: { $gte: start30 }, ...COUNTED_COMPLETION } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]),
  ]);

  const internal = new Set(internalIds.map(String));
  const existing = new Set(users.map((user) => String(user._id)));
  const legacyIds = users.filter((user) => !isSignupPlatform(user.signupPlatform)).map((user) => String(user._id));
  const evidence = legacyIds.length > 0 ? await platformEvidenceFor(legacyIds) : new Map<string, PlatformEvidence>();

  // ── Activity: account -> platform keys, per window ─────────────────────
  type Windowed = { today: Map<string, Set<PlatformKey>>; days7: Map<string, Set<PlatformKey>>; days30: Map<string, Set<PlatformKey>> };
  const active: Windowed = { today: new Map(), days7: new Map(), days30: new Map() };
  const mark = (window: keyof Windowed, userId: string, key: PlatformKey | null) => {
    const set = active[window].get(userId) ?? new Set<PlatformKey>();
    if (key) set.add(key);
    active[window].set(userId, set);
  };
  const markAll = (userId: string, at: Date | null | undefined, key: PlatformKey | null) => {
    if (!at) return;
    const t = new Date(at).getTime();
    if (t >= start30.getTime()) mark('days30', userId, key);
    if (t >= start7.getTime()) mark('days7', userId, key);
    if (t >= start1.getTime()) mark('today', userId, key);
  };

  for (const row of activityRows) {
    const userId = String(row._id.u);
    const platform = row._id.p;
    let key: PlatformKey | null = null;
    if (platform === 'ios' || platform === 'android') key = platform;
    // A web row without a device is still activity; its device comes from
    // the visit's session_start row of the same window, if there is one.
    else if (platform === 'web') key = webPlatformFromDevice(row._id.d);
    markAll(userId, row.lastAt, key);
    if (platform === 'web' && !key) markAll(userId, row.lastAt, 'web');
  }

  // ── One pass over the accounts ─────────────────────────────────────────
  const empty = (): CountByPlatform => ({ total: 0, byPlatform: {} });
  const registrations = { today: empty(), days7: empty(), days30: empty(), allTime: empty() };
  const weeks = new Map<string, CountByPlatform>();
  const todayKey = amsterdamDayKey(now);
  const currentWeek = weekStartKey(todayKey);
  const weekKeys = Array.from({ length: 12 }, (_, index) => shiftDayKey(currentWeek, (index - 11) * 7));
  for (const key of weekKeys) weeks.set(key, empty());
  const byMethod: Partial<Record<MethodKey, number>> = {};

  const retentionTotal: RateRow = { cohort: 0, retained: 0, rate: 0 };
  const retentionBy: Partial<Record<PlatformKey, RateRow>> = {};
  const premiumBySource: Record<PremiumSource, number> = { lifetime: 0, stripe: 0, store: 0, group: 0, manual: 0 };
  const premiumByPlatform: PlatformCounts = {};
  const conversionTotal: ConversionRow = { accounts: 0, premium: 0, rate: 0 };
  const conversionBy: Partial<Record<PlatformKey, ConversionRow>> = {};
  const conversionNew: ConversionRow = { accounts: 0, premium: 0, rate: 0 };
  let paidPremium = 0;
  let premiumTotal = 0;
  let grantsActive = 0;
  let grantsExpiring = 0;
  let derivedPlatforms = 0;

  for (const user of users) {
    const id = String(user._id);
    const { platform, derived } = deriveSignupPlatform(user.signupPlatform, evidence.get(id));
    if (derived) derivedPlatforms += 1;
    const createdAt = user.createdAt ? new Date(user.createdAt) : null;
    const isInternal = internal.has(id);

    // Registrations: everyone, test accounts included (they are accounts).
    const count = (bucket: CountByPlatform) => {
      bucket.total += 1;
      bump(bucket.byPlatform, platform);
    };
    count(registrations.allTime);
    if (createdAt) {
      const t = createdAt.getTime();
      if (t >= start30.getTime()) count(registrations.days30);
      if (t >= start7.getTime()) count(registrations.days7);
      if (t >= start1.getTime()) count(registrations.today);
      const week = weeks.get(weekStartKey(amsterdamDayKey(createdAt)));
      if (week) count(week);
    }
    bump(byMethod, deriveSignupMethod(user));

    // Activity recorded on the account itself.
    const seen = isSignupPlatform(user.lastSeenPlatform) ? user.lastSeenPlatform : null;
    markAll(id, user.lastActiveAt, seen);
    markAll(id, user.lastPlayedAt, null);

    if (isInternal) continue;

    // Premium and conversion: real accounts only.
    const premium = summarizePremium(user, now.getTime());
    conversionTotal.accounts += 1;
    const conv = (conversionBy[platform] ??= { accounts: 0, premium: 0, rate: 0 });
    conv.accounts += 1;
    const isNew = createdAt && createdAt.getTime() >= start30.getTime();
    if (isNew) conversionNew.accounts += 1;
    if (premium.active && premium.source) {
      premiumTotal += 1;
      premiumBySource[premium.source] += 1;
      bump(premiumByPlatform, platform);
      conversionTotal.premium += 1;
      conv.premium += 1;
      if (isNew) conversionNew.premium += 1;
      if (premium.sources.some((source) => source === 'stripe' || source === 'store' || source === 'lifetime')) paidPremium += 1;
    }
    if (premium.sources.includes('manual') && user.premiumGranted === true) {
      grantsActive += 1;
      const until = user.premiumGrantedUntil ? new Date(user.premiumGrantedUntil).getTime() : null;
      if (until !== null && until <= in7Days) grantsExpiring += 1;
    }

    // Retention: accounts older than 30 days, active in the last 7.
    if (createdAt && createdAt.getTime() <= thirtyDaysAgo.getTime()) {
      const row = (retentionBy[platform] ??= { cohort: 0, retained: 0, rate: 0 });
      retentionTotal.cohort += 1;
      row.cohort += 1;
      if (active.days7.has(id)) {
        retentionTotal.retained += 1;
        row.retained += 1;
      }
    }
  }

  const finishRates = <T extends { rate: number }>(row: T, num: number, den: number) => {
    row.rate = pct(num, den);
    return row;
  };
  finishRates(retentionTotal, retentionTotal.retained, retentionTotal.cohort);
  for (const row of Object.values(retentionBy)) if (row) finishRates(row, row.retained, row.cohort);
  finishRates(conversionTotal, conversionTotal.premium, conversionTotal.accounts);
  finishRates(conversionNew, conversionNew.premium, conversionNew.accounts);
  for (const row of Object.values(conversionBy)) if (row) finishRates(row, row.premium, row.accounts);

  const activeCounts = (window: keyof Windowed): CountByPlatform => {
    const out = empty();
    for (const [userId, keys] of active[window]) {
      // Events of an account that has since been deleted.
      if (!existing.has(userId)) continue;
      out.total += 1;
      if (keys.size === 0) bump(out.byPlatform, 'onbekend');
      // A web visit with a known device makes the device-less "web" redundant.
      const hasWebDevice = keys.has('web-desktop') || keys.has('web-mobile');
      for (const key of keys) if (!(key === 'web' && hasWebDevice)) bump(out.byPlatform, key);
    }
    return out;
  };

  const plays = (rows: Array<{ _id: unknown; count: number }>) => {
    const byPlatform: Partial<Record<'web' | 'ios' | 'android', number>> = {};
    let total = 0;
    for (const row of rows) {
      const key = row._id === 'ios' || row._id === 'android' ? row._id : 'web';
      bump(byPlatform, key, row.count);
      total += row.count;
    }
    return { total, byPlatform };
  };

  return {
    generatedAt: now.toISOString(),
    totalUsers: users.length,
    internalExcluded: internal.size,
    derivedPlatforms,
    registrations: {
      ...registrations,
      weekly: weekKeys.map((key) => ({ weekStart: key, label: dayKeyLabel(key), ...weeks.get(key)! })),
    },
    byMethod,
    active: { today: activeCounts('today'), days7: activeCounts('days7'), days30: activeCounts('days30') },
    retention: {
      description: 'Accounts ouder dan 30 dagen die in de laatste 7 dagen actief waren',
      total: retentionTotal,
      byPlatform: retentionBy,
    },
    premium: {
      total: premiumTotal,
      bySource: premiumBySource,
      bySignupPlatform: premiumByPlatform,
      conversion: {
        description: 'Deel van de echte accounts met Premium (test niet meegeteld)',
        total: conversionTotal,
        paid: { premium: paidPremium, rate: pct(paidPremium, conversionTotal.accounts) },
        byPlatform: conversionBy,
        newLast30d: conversionNew,
      },
      grantsActive,
      grantsExpiringIn7d: grantsExpiring,
    },
    quizPlays: {
      description: 'Afgeronde quizzen volgens de app- en website-metingen',
      days7: plays(playRows7 as Array<{ _id: unknown; count: number }>),
      days30: plays(playRows30 as Array<{ _id: unknown; count: number }>),
    },
  };
}

