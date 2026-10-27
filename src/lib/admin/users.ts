import mongoose from 'mongoose';

import { AnalyticsEvent, Duel, GroupLicense, Payment, PlayerGroup, User, UserProgress, connectDB } from '@/database';
import { getInternalAccountIds, isInternalAccount } from '@/lib/analytics/internal-accounts';
import { getLevelInfo } from '@/lib/gamification';
import { PREMIUM_SNAPSHOT_FIELDS } from '@/lib/premium-state';
import { platformEvidenceFor } from '@/lib/admin/audience';
import {
  PREMIUM_SOURCES,
  grantLogEntryOut,
  summarizePremium,
  type GrantLogEntryOut,
  type PremiumSource,
  type PremiumSummary,
} from '@/lib/admin/premium-grants';
import {
  SIGNUP_PLATFORMS,
  deriveSignupMethod,
  deriveSignupPlatform,
  isPlatformKey,
  isSignupPlatform,
  webPlatformFromDevice,
  type MethodKey,
  type PlatformKey,
} from '@/lib/admin/platform';
import { toPaymentRow, type AdminPaymentRow } from '@/lib/admin/payments-list';
import type { PaymentLike } from '@/lib/admin/revenue';

/**
 * The beheer user list and user page, shared by `/beheer/gebruikers` and
 * `/api/mobile/admin/users` (contract: docs/setup/admin-api.md).
 */

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
  signupPlatform: PlatformKey;
  signupPlatformDerived: boolean;
  signupMethod: MethodKey;
  lastActiveAt: string | null;
  lastSeenPlatform: PlatformKey | null;
  premium: PremiumSummary;
  quizzesPlayed: number;
  xp: number;
  level: number;
  role: string;
  isInternal: boolean;
}

export const USER_SORTS = ['createdAt', 'lastActive', 'name', 'email', 'xp', 'quizzesPlayed', 'premiumUntil'] as const;
export type UserSort = (typeof USER_SORTS)[number];

export interface UserListQuery {
  q: string;
  platform: PlatformKey | null;
  premium: 'yes' | 'no' | null;
  source: PremiumSource | null;
  test: 'include' | 'exclude' | 'only';
  sort: UserSort;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface UserListResult {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  users: AdminUserRow[];
}

function first(value: unknown): string | undefined {
  if (Array.isArray(value)) return first(value[0]);
  return typeof value === 'string' ? value : undefined;
}

/** Query string (URLSearchParams or a Next `searchParams` object) to a checked query. */
export function readUserListQuery(input: URLSearchParams | Record<string, string | string[] | undefined>): UserListQuery {
  const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : first(input[key]));
  const platform = get('platform');
  const premium = get('premium');
  const source = get('source');
  const test = get('test');
  const sort = get('sort');
  const order = get('order');
  const page = Number.parseInt(get('page') ?? '', 10);
  const pageSize = Number.parseInt(get('pageSize') ?? '', 10);
  return {
    q: (get('q') ?? '').trim().slice(0, 100),
    platform: isPlatformKey(platform) ? platform : null,
    premium: premium === 'yes' || premium === 'no' ? premium : null,
    source: (PREMIUM_SOURCES as readonly string[]).includes(source ?? '') ? (source as PremiumSource) : null,
    test: test === 'exclude' || test === 'only' ? test : 'include',
    sort: (USER_SORTS as readonly string[]).includes(sort ?? '') ? (sort as UserSort) : 'createdAt',
    order: order === 'asc' ? 'asc' : 'desc',
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 100000) : 1,
    pageSize: Number.isFinite(pageSize) && pageSize >= 1 ? Math.min(pageSize, 100) : 25,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Mongo condition: the account has Premium from this source right now. */
export function premiumSourceFilter(source: PremiumSource, now: Date): Record<string, unknown> {
  const notExpired = { premiumGrantedUntil: { $not: { $lte: now } } };
  switch (source) {
    case 'lifetime':
      return { hasLifetimePremium: true };
    case 'stripe':
      return { premiumStripe: true };
    case 'store':
      return { premiumStore: true };
    case 'group':
      return { groupPremiumUntil: { $gt: now } };
    case 'manual':
      return {
        $or: [
          { premiumGranted: true, ...notExpired },
          {
            isPremium: true,
            premiumStripe: { $ne: true },
            premiumStore: { $ne: true },
            hasLifetimePremium: { $ne: true },
            premiumGranted: { $ne: false },
            ...notExpired,
          },
        ],
      };
  }
}

function anyPremiumFilter(now: Date) {
  return { $or: PREMIUM_SOURCES.map((source) => premiumSourceFilter(source, now)) };
}

const LIST_FIELDS = [
  'name',
  'email',
  'createdAt',
  'signupPlatform',
  'signupMethod',
  'googleId',
  'appleId',
  'lastActiveAt',
  'lastSeenPlatform',
  'lastPlayedAt',
  'quizzesPlayed',
  'xp',
  'level',
  'role',
  'stripeCurrentPeriodEnd',
  ...PREMIUM_SNAPSHOT_FIELDS.split(' '),
];

type LeanListUser = {
  _id: unknown;
  name?: string;
  email?: string;
  createdAt?: Date;
  signupPlatform?: string;
  signupMethod?: string;
  hasPassword?: boolean;
  googleId?: string;
  appleId?: string;
  lastActiveAt?: Date | null;
  lastSeenPlatform?: string | null;
  lastPlayedAt?: Date | null;
  quizzesPlayed?: number;
  xp?: number;
  level?: number;
  role?: string;
  stripeCurrentPeriodEnd?: Date | null;
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | null;
  hasLifetimePremium?: boolean;
  groupPremiumUntil?: Date | null;
  premiumGranted?: boolean;
  premiumGrantedUntil?: Date | null;
};

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function laterOf(a?: Date | null, b?: Date | null): Date | null {
  const ta = a ? new Date(a).getTime() : NaN;
  const tb = b ? new Date(b).getTime() : NaN;
  if (Number.isNaN(ta) && Number.isNaN(tb)) return null;
  if (Number.isNaN(ta)) return new Date(tb);
  if (Number.isNaN(tb)) return new Date(ta);
  return new Date(Math.max(ta, tb));
}

function toRow(
  user: LeanListUser,
  evidence: Map<string, Parameters<typeof deriveSignupPlatform>[1]>,
  internal: Set<string>,
  now: Date,
): AdminUserRow {
  const id = String(user._id);
  const { platform, derived } = deriveSignupPlatform(user.signupPlatform, evidence.get(id));
  return {
    id,
    name: user.name || 'Naamloos',
    email: user.email ?? '',
    createdAt: iso(user.createdAt),
    signupPlatform: platform,
    signupPlatformDerived: derived,
    signupMethod: deriveSignupMethod(user),
    lastActiveAt: iso(laterOf(user.lastActiveAt, user.lastPlayedAt)),
    lastSeenPlatform: isSignupPlatform(user.lastSeenPlatform) ? user.lastSeenPlatform : null,
    premium: summarizePremium(user, now.getTime()),
    quizzesPlayed: user.quizzesPlayed ?? 0,
    xp: user.xp ?? 0,
    level: user.level ?? getLevelInfo(user.xp ?? 0).level,
    role: user.role ?? 'user',
    isInternal: internal.has(id) || isInternalAccount(user.email),
  };
}

/** Rows for users already loaded elsewhere (the overview's recent list). */
export async function toAdminUserRows(users: LeanListUser[], now: Date = new Date()): Promise<AdminUserRow[]> {
  const internal = new Set((await getInternalAccountIds()).map(String));
  const legacy = users.filter((user) => !isSignupPlatform(user.signupPlatform)).map((user) => String(user._id));
  const evidence = legacy.length > 0 ? await platformEvidenceFor(legacy) : new Map();
  return users.map((user) => toRow(user, evidence, internal, now));
}

export const ADMIN_USER_ROW_FIELDS = LIST_FIELDS.join(' ');

/** Legacy accounts whose derived platform is `key`. */
async function legacyIdsWithPlatform(key: PlatformKey): Promise<mongoose.Types.ObjectId[]> {
  const legacy = await User.find({ signupPlatform: { $nin: [...SIGNUP_PLATFORMS] } })
    .select('_id')
    .lean<Array<{ _id: mongoose.Types.ObjectId }>>();
  if (legacy.length === 0) return [];
  const evidence = await platformEvidenceFor(legacy.map((row) => String(row._id)));
  return legacy.filter((row) => deriveSignupPlatform(null, evidence.get(String(row._id))).platform === key).map((row) => row._id);
}

export async function listAdminUsers(query: UserListQuery, now: Date = new Date()): Promise<UserListResult> {
  await connectDB();

  const internalIds = await getInternalAccountIds();
  const and: Record<string, unknown>[] = [];

  if (query.q) {
    const pattern = new RegExp(escapeRegExp(query.q), 'i');
    and.push({ $or: [{ name: pattern }, { email: pattern }] });
  }
  if (query.test === 'exclude' && internalIds.length > 0) and.push({ _id: { $nin: internalIds } });
  if (query.test === 'only') and.push({ _id: { $in: internalIds } });
  if (query.source) and.push(premiumSourceFilter(query.source, now));
  else if (query.premium === 'yes') and.push(anyPremiumFilter(now));
  if (query.premium === 'no') and.push({ $nor: [anyPremiumFilter(now)] });
  if (query.platform) {
    const legacy = await legacyIdsWithPlatform(query.platform);
    and.push(
      isSignupPlatform(query.platform)
        ? { $or: [{ signupPlatform: query.platform }, { _id: { $in: legacy } }] }
        : { _id: { $in: legacy } },
    );
  }

  const match = and.length > 0 ? { $and: and } : {};
  const direction = query.order === 'asc' ? 1 : -1;

  const sortField: Record<UserSort, string> = {
    createdAt: 'createdAt',
    lastActive: '_lastActive',
    name: '_name',
    email: '_email',
    xp: 'xp',
    quizzesPlayed: 'quizzesPlayed',
    premiumUntil: '_premiumUntil',
  };

  const projection: Record<string, unknown> = Object.fromEntries(LIST_FIELDS.map((field) => [field, 1]));
  projection.hasPassword = { $gt: [{ $strLenCP: { $ifNull: ['$password', ''] } }, 0] };

  const farFuture = new Date('9999-12-31T00:00:00Z');
  const [result] = await User.aggregate<{ rows: LeanListUser[]; total: Array<{ n: number }> }>([
    { $match: match },
    {
      $addFields: {
        _lastActive: { $max: [{ $ifNull: ['$lastActiveAt', null] }, { $ifNull: ['$lastPlayedAt', null] }] },
        _name: { $toLower: { $ifNull: ['$name', ''] } },
        _email: { $toLower: { $ifNull: ['$email', ''] } },
        // The furthest end of any running source; lifetime sorts last (or first).
        _premiumUntil: {
          $cond: [
            { $eq: ['$hasLifetimePremium', true] },
            farFuture,
            {
              $max: [
                { $cond: [{ $eq: ['$premiumStripe', true] }, { $ifNull: ['$stripeCurrentPeriodEnd', null] }, null] },
                { $cond: [{ $eq: ['$premiumStore', true] }, { $ifNull: ['$storePremiumExpiresAt', null] }, null] },
                { $cond: [{ $gt: ['$groupPremiumUntil', now] }, '$groupPremiumUntil', null] },
                {
                  $cond: [
                    { $and: [{ $eq: ['$premiumGranted', true] }, { $eq: [{ $ifNull: ['$premiumGrantedUntil', null] }, null] }] },
                    farFuture,
                    { $cond: [{ $gt: ['$premiumGrantedUntil', now] }, '$premiumGrantedUntil', null] },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    { $sort: { [sortField[query.sort]]: direction, _id: direction } },
    {
      $facet: {
        rows: [{ $skip: (query.page - 1) * query.pageSize }, { $limit: query.pageSize }, { $project: projection }],
        total: [{ $count: 'n' }],
      },
    },
  ]);

  const total = result?.total[0]?.n ?? 0;
  const rows = result?.rows ?? [];
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    pages: Math.max(1, Math.ceil(total / query.pageSize)),
    users: await toAdminUserRows(rows, now),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Detail
// ───────────────────────────────────────────────────────────────────────────

export interface AdminUserDetail {
  user: AdminUserRow & {
    image: string | null;
    updatedAt: string | null;
    lastPlayedAt: string | null;
    auth: { password: boolean; google: boolean; apple: boolean };
    levelTitle: string;
    streak: number;
    bestStreak: number;
    averageScore: number;
    badges: string[];
    multiplayerGamesHosted: number;
    onboarding: { bibleReadingFrequency: string | null; knowledgeLevel: string | null; interests: string[] } | null;
  };
  premium: PremiumSummary & {
    stripe: {
      active: boolean;
      status: string | null;
      plan: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      trialEnd: string | null;
      customerId: string | null;
      subscriptionId: string | null;
    };
    store: { active: boolean; expiresAt: string | null };
    lifetime: { active: boolean };
    group: {
      active: boolean;
      until: string | null;
      licenses: Array<{ id: string; name: string; role: 'owner' | 'member'; status: string; expiresAt: string | null }>;
    };
    manual: {
      active: boolean;
      until: string | null;
      grantedAt: string | null;
      grantedBy: { id: string; name: string | null; email: string | null } | null;
      note: string | null;
      legacy: boolean;
    };
  };
  grantLog: GrantLogEntryOut[];
  platformHistory: Array<{ platform: PlatformKey; firstAt: string | null; lastAt: string | null; events: number; sessions: number }>;
  payments: AdminPaymentRow[];
  recentAttempts: Array<{
    id: string;
    quizId: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    xpEarned: number;
    completedAt: string | null;
  }>;
  counts: {
    attempts: number;
    duels: { total: number; finished: number; won: number };
    playerGroups: { owned: number; member: number };
    groupLicenses: { owned: number; member: number };
  };
}

type LeanDetailUser = LeanListUser & {
  image?: string;
  updatedAt?: Date;
  password?: string;
  levelTitle?: string;
  streak?: number;
  bestStreak?: number;
  averageScore?: number;
  badges?: string[];
  multiplayerGamesHosted?: number;
  onboarding?: { bibleReadingFrequency?: string; knowledgeLevel?: string; interests?: string[] };
  stripeSubscriptionStatus?: string;
  stripeSubscriptionPlan?: string;
  stripeCancelAtPeriodEnd?: boolean;
  stripeTrialEnd?: Date | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  premiumGrantedAt?: Date | null;
  premiumGrantedBy?: mongoose.Types.ObjectId | null;
  premiumGrantedNote?: string | null;
  premiumGrantLog?: Array<Parameters<typeof grantLogEntryOut>[0]>;
};

export async function getAdminUserDetail(userId: string, now: Date = new Date()): Promise<AdminUserDetail | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  await connectDB();

  const user = await User.findById(userId).lean<LeanDetailUser>();
  if (!user) return null;
  const oid = new mongoose.Types.ObjectId(userId);

  const [rows, history, payments, attempts, attemptCount, duelTotal, duelFinished, duelWon, groupsOwned, groupsMember, licenses, grantedBy] =
    await Promise.all([
      toAdminUserRows([{ ...user, hasPassword: Boolean(user.password) }], now),
      AnalyticsEvent.aggregate<{ _id: { p: string; d: string | null }; firstAt: Date; lastAt: Date; events: number; sessions: number }>([
        { $match: { userId: oid } },
        {
          $group: {
            _id: {
              p: '$platform',
              d: { $cond: [{ $eq: ['$name', 'session_start'] }, { $ifNull: ['$props.device', null] }, null] },
            },
            firstAt: { $min: '$createdAt' },
            lastAt: { $max: '$createdAt' },
            events: { $sum: 1 },
            sessions: { $sum: { $cond: [{ $eq: ['$name', 'session_start'] }, 1, 0] } },
          },
        },
      ]),
      Payment.find({ user: oid }).sort({ createdAt: -1 }).limit(50).populate('user', 'name email').lean<PaymentLike[]>(),
      UserProgress.find({ userId: oid }).sort({ completedAt: -1 }).limit(20).populate('quizId', 'title').lean(),
      UserProgress.countDocuments({ userId: oid }),
      Duel.countDocuments({ participants: oid }),
      Duel.countDocuments({ participants: oid, status: 'finished' }),
      Duel.countDocuments({ winnerId: oid }),
      PlayerGroup.countDocuments({ ownerId: oid }),
      PlayerGroup.countDocuments({ memberIds: oid, ownerId: { $ne: oid } }),
      GroupLicense.find({ $or: [{ ownerId: oid }, { memberIds: oid }] })
        .select('name ownerId status expiresAt')
        .lean<Array<{ _id: unknown; name: string; ownerId: unknown; status: string; expiresAt?: Date | null }>>(),
      user.premiumGrantedBy ? User.findById(user.premiumGrantedBy).select('name email').lean<{ name?: string; email?: string }>() : null,
    ]);

  const row = rows[0];
  const internal = new Set((await getInternalAccountIds()).map(String));

  // Platform history: web rows split by the visit's device where known.
  const merged = new Map<PlatformKey, { firstAt: number; lastAt: number; events: number; sessions: number }>();
  for (const item of history) {
    const platform = item._id.p;
    const key: PlatformKey =
      platform === 'ios' || platform === 'android' ? platform : platform === 'web' ? webPlatformFromDevice(item._id.d) ?? 'web' : 'onbekend';
    const current = merged.get(key) ?? { firstAt: Infinity, lastAt: 0, events: 0, sessions: 0 };
    current.firstAt = Math.min(current.firstAt, new Date(item.firstAt).getTime());
    current.lastAt = Math.max(current.lastAt, new Date(item.lastAt).getTime());
    current.events += item.events;
    current.sessions += item.sessions;
    merged.set(key, current);
  }
  // Only a visit's first event (session_start) names the device. The other
  // web events of the account fold into its most recently used web device,
  // so the history shows devices rather than a separate "Website" row.
  const web = merged.get('web');
  const devices = (['web-desktop', 'web-mobile'] as const)
    .filter((key) => merged.has(key))
    .sort((a, b) => merged.get(b)!.lastAt - merged.get(a)!.lastAt);
  if (web && devices.length > 0) {
    const target = merged.get(devices[0])!;
    target.firstAt = Math.min(target.firstAt, web.firstAt);
    target.lastAt = Math.max(target.lastAt, web.lastAt);
    target.events += web.events;
    merged.delete('web');
  }

  const summary = summarizePremium(user, now.getTime());
  const groupUntil = user.groupPremiumUntil ? new Date(user.groupPremiumUntil) : null;
  const manualActive = summary.sources.includes('manual');

  return {
    user: {
      ...row,
      image: user.image || null,
      updatedAt: iso(user.updatedAt),
      lastPlayedAt: iso(user.lastPlayedAt),
      auth: { password: Boolean(user.password), google: Boolean(user.googleId), apple: Boolean(user.appleId) },
      levelTitle: user.levelTitle || getLevelInfo(user.xp ?? 0).title,
      streak: user.streak ?? 0,
      bestStreak: user.bestStreak ?? 0,
      averageScore: user.averageScore ?? 0,
      badges: user.badges ?? [],
      multiplayerGamesHosted: user.multiplayerGamesHosted ?? 0,
      onboarding: user.onboarding
        ? {
            bibleReadingFrequency: user.onboarding.bibleReadingFrequency ?? null,
            knowledgeLevel: user.onboarding.knowledgeLevel ?? null,
            interests: user.onboarding.interests ?? [],
          }
        : null,
    },
    premium: {
      ...summary,
      stripe: {
        active: Boolean(user.premiumStripe),
        status: user.stripeSubscriptionStatus ?? null,
        plan: user.stripeSubscriptionPlan ?? null,
        currentPeriodEnd: iso(user.stripeCurrentPeriodEnd),
        cancelAtPeriodEnd: Boolean(user.stripeCancelAtPeriodEnd),
        trialEnd: iso(user.stripeTrialEnd),
        customerId: user.stripeCustomerId ?? null,
        subscriptionId: user.stripeSubscriptionId ?? null,
      },
      store: { active: Boolean(user.premiumStore), expiresAt: iso(user.storePremiumExpiresAt) },
      lifetime: { active: Boolean(user.hasLifetimePremium) },
      group: {
        active: Boolean(groupUntil && groupUntil.getTime() > now.getTime()),
        until: iso(groupUntil),
        licenses: licenses.map((license) => ({
          id: String(license._id),
          name: license.name,
          role: String(license.ownerId) === userId ? ('owner' as const) : ('member' as const),
          status: license.status,
          expiresAt: iso(license.expiresAt ?? null),
        })),
      },
      manual: {
        active: manualActive,
        until: manualActive ? iso(user.premiumGrantedUntil) : null,
        grantedAt: iso(user.premiumGrantedAt),
        grantedBy: user.premiumGrantedBy
          ? { id: String(user.premiumGrantedBy), name: grantedBy?.name ?? null, email: grantedBy?.email ?? null }
          : null,
        note: user.premiumGrantedNote ?? null,
        // Set by hand before grants were dated: no audit entry behind it.
        legacy: manualActive && !user.premiumGrantedAt,
      },
    },
    grantLog: (user.premiumGrantLog ?? []).map(grantLogEntryOut).reverse(),
    platformHistory: [...merged.entries()]
      .map(([platform, item]) => ({
        platform,
        firstAt: Number.isFinite(item.firstAt) ? new Date(item.firstAt).toISOString() : null,
        lastAt: item.lastAt ? new Date(item.lastAt).toISOString() : null,
        events: item.events,
        sessions: item.sessions,
      }))
      .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? '')),
    payments: payments.map((payment) => toPaymentRow(payment, internal)),
    recentAttempts: attempts.map((attempt) => {
      const quiz = attempt.quizId as unknown as { _id?: unknown; title?: string } | null;
      return {
        id: String(attempt._id),
        quizId: quiz && typeof quiz === 'object' && '_id' in quiz ? String(quiz._id) : String(attempt.quizId ?? ''),
        quizTitle: quiz && typeof quiz === 'object' && quiz.title ? quiz.title : 'Verwijderde quiz',
        score: attempt.score ?? 0,
        totalQuestions: attempt.totalQuestions ?? 0,
        xpEarned: attempt.xpEarned ?? 0,
        completedAt: iso(attempt.completedAt),
      };
    }),
    counts: {
      attempts: attemptCount,
      duels: { total: duelTotal, finished: duelFinished, won: duelWon },
      playerGroups: { owned: groupsOwned, member: groupsMember },
      groupLicenses: {
        owned: licenses.filter((license) => String(license.ownerId) === userId).length,
        member: licenses.filter((license) => String(license.ownerId) !== userId).length,
      },
    },
  };
}

/** Find an account by e-mail for "Premium geven" by address (case-insensitive). */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const value = email.trim();
  if (!value || value.length > 320) return null;
  await connectDB();
  const user = await User.findOne({ email: new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`, 'i') })
    .select('_id')
    .lean<{ _id: unknown }>();
  return user ? String(user._id) : null;
}

export async function getAdminUserRow(userId: string, now: Date = new Date()): Promise<AdminUserRow | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  await connectDB();
  const user = await User.findById(userId).select(`${ADMIN_USER_ROW_FIELDS} password`).lean<LeanListUser & { password?: string }>();
  if (!user) return null;
  const { password, ...rest } = user;
  return (await toAdminUserRows([{ ...rest, hasPassword: Boolean(password) }], now))[0];
}
