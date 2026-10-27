import mongoose from 'mongoose';

import { AnalyticsEvent, User, connectDB } from '@/database';
import { MULTIPLAYER_FREE_ROOM_QUOTA } from '@/lib/premium-benefits';

import { amsterdamWindowStart } from '@/lib/admin/time';

import { COUNTED_COMPLETION } from './events';
import { effectivePremiumOr, getInternalAccountIds } from './internal-accounts';

/**
 * The four numbers the revenue plan says to run the business on, plus the
 * per-trigger breakdown that tells you which paywall is actually earning.
 *
 * Everything is computed from `AnalyticsEvent` except the host funnel, which
 * reads `multiplayerGamesHosted` off the user document - that counter is
 * authoritative and predates the event stream, so it answers "how many hosts
 * reach game five" for accounts that existed before this shipped.
 */

export interface FunnelReport {
  windowDays: number;
  hosts: {
    /** Accounts that have started at least one game as host. */
    startedOne: number;
    /** Of those, how many spent the whole free allowance. */
    reachedQuota: number;
    /** Share of hosts that made it to the wall, 0-100. */
    reachRate: number;
    freeQuota: number;
  };
  paywall: {
    shown: number;
    purchases: number;
    /** Purchases divided by paywall views, 0-100. */
    conversionRate: number;
    byTrigger: Array<{
      trigger: string;
      shown: number;
      purchases: number;
      conversionRate: number;
    }>;
  };
  plans: {
    monthly: number;
    yearly: number;
    lifetime: number;
    /** Share of purchases that were not monthly, 0-100. */
    nonMonthlyShare: number;
  };
  trials: {
    started: number;
    converted: number;
    conversionRate: number;
  };
  activation: {
    quizzesCompleted: number;
    firstQuizzesCompleted: number;
  };
  /**
   * Clicks through to BijbelStudie, by placement.
   *
   * The number this product is now run on. `perCompletion` is the one that
   * says whether the handover works at all: paywall conversion could only ever
   * be judged against purchases, and there were none, but a quiz that is
   * finished and never followed anywhere is measurable from day one.
   */
  handover: {
    clicks: number;
    /** Times the post-quiz popup opened. */
    shown: number;
    dismissals: number;
    /** Times the promo code was copied. Redemptions live in BijbelStudie's Stripe. */
    codeCopies: number;
    /** Clicks per finished quiz, as a percentage. */
    perCompletion: number;
    bySurface: Array<{ surface: string; clicks: number }>;
  };
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Label for a purchase that no paywall preceded (within the two-hour lookback). */
export const NO_TRIGGER = 'geen';

/**
 * Counts per property value. A row without the property is counted under
 * `fallback` when one is given, so the parts still add up to the whole.
 */
async function countByProp(
  match: Record<string, unknown>,
  prop: string,
  fallback?: string,
): Promise<Map<string, number>> {
  const rows = await AnalyticsEvent.aggregate([
    { $match: match },
    { $group: { _id: `$props.${prop}`, count: { $sum: 1 } } },
  ]);

  const out = new Map<string, number>();
  for (const row of rows) {
    const key = typeof row._id === 'string' && row._id ? row._id : fallback;
    if (key) out.set(key, (out.get(key) ?? 0) + row.count);
  }
  return out;
}

/**
 * @param windowDays  Today plus the days before it, on the Amsterdam calendar.
 *
 * Events by the internal developer and app-reviewer accounts are left out
 * everywhere: their test purchases and paywall views would otherwise be most
 * of the conversion numbers.
 */
export async function getFunnelReport(windowDays = 30, now: Date = new Date()): Promise<FunnelReport> {
  await connectDB();

  const since = amsterdamWindowStart(windowDays, now);
  const internalIds = await getInternalAccountIds();
  const notInternalUser = internalIds.length > 0 ? { _id: { $nin: internalIds } } : {};
  const notInternalEvent = internalIds.length > 0 ? { userId: { $nin: internalIds } } : {};
  const inWindow = (name: string, extra: Record<string, unknown> = {}) => ({
    name,
    createdAt: { $gte: since },
    ...notInternalEvent,
    ...extra,
  });

  const [
    startedOne,
    reachedQuota,
    paywallShownByTrigger,
    purchasesByTrigger,
    purchasesByPlan,
    purchases,
    trialsStarted,
    trialsConverted,
    quizzesCompleted,
    firstQuizzesCompleted,
    studieClicksBySurface,
    studiePromptDismissals,
    studiePromptShown,
    studieCodeCopies,
  ] = await Promise.all([
    User.countDocuments({ ...notInternalUser, multiplayerGamesHosted: { $gte: 1 } }),
    User.countDocuments({ ...notInternalUser, multiplayerGamesHosted: { $gte: MULTIPLAYER_FREE_ROOM_QUOTA } }),
    countByProp(inWindow('paywall_shown'), 'trigger', 'direct'),
    countByProp(inWindow('purchase_completed'), 'trigger', NO_TRIGGER),
    countByProp(inWindow('purchase_completed'), 'plan', 'onbekend'),
    AnalyticsEvent.countDocuments(inWindow('purchase_completed')),
    AnalyticsEvent.countDocuments(inWindow('trial_started')),
    AnalyticsEvent.countDocuments(inWindow('trial_converted')),
    AnalyticsEvent.countDocuments(inWindow('quiz_completed', COUNTED_COMPLETION)),
    // Not filtered with COUNTED_COMPLETION on purpose: a guest's first quiz
    // reaches the account only as the claimed (`claimed: true`) completion,
    // and that row is the one that carries `isFirst`.
    AnalyticsEvent.countDocuments(inWindow('quiz_completed', { 'props.isFirst': true })),
    countByProp(inWindow('bijbelstudie_click'), 'surface', 'onbekend'),
    AnalyticsEvent.countDocuments(inWindow('bijbelstudie_prompt_dismissed')),
    AnalyticsEvent.countDocuments(inWindow('bijbelstudie_prompt_shown')),
    AnalyticsEvent.countDocuments(inWindow('bijbelstudie_code_copied')),
  ]);

  const shown = [...paywallShownByTrigger.values()].reduce((sum, n) => sum + n, 0);

  const triggers = new Set([...paywallShownByTrigger.keys(), ...purchasesByTrigger.keys()]);
  const byTrigger = [...triggers]
    .map((trigger) => {
      const triggerShown = paywallShownByTrigger.get(trigger) ?? 0;
      const triggerPurchases = purchasesByTrigger.get(trigger) ?? 0;
      return {
        trigger,
        shown: triggerShown,
        purchases: triggerPurchases,
        conversionRate: rate(triggerPurchases, triggerShown),
      };
    })
    .sort((a, b) => b.purchases - a.purchases || b.shown - a.shown);

  const studieClicks = [...studieClicksBySurface.values()].reduce((sum, n) => sum + n, 0);

  const monthly = purchasesByPlan.get('monthly') ?? 0;
  const yearly = purchasesByPlan.get('yearly') ?? 0;
  const lifetime = purchasesByPlan.get('lifetime') ?? 0;

  return {
    windowDays,
    hosts: {
      startedOne,
      reachedQuota,
      reachRate: rate(reachedQuota, startedOne),
      freeQuota: MULTIPLAYER_FREE_ROOM_QUOTA,
    },
    paywall: {
      shown,
      purchases,
      conversionRate: rate(purchases, shown),
      byTrigger,
    },
    plans: {
      monthly,
      yearly,
      lifetime,
      nonMonthlyShare: rate(yearly + lifetime, purchases),
    },
    trials: {
      started: trialsStarted,
      converted: trialsConverted,
      conversionRate: rate(trialsConverted, trialsStarted),
    },
    activation: {
      quizzesCompleted,
      firstQuizzesCompleted,
    },
    handover: {
      clicks: studieClicks,
      shown: studiePromptShown,
      dismissals: studiePromptDismissals,
      codeCopies: studieCodeCopies,
      perCompletion: rate(studieClicks, quizzesCompleted),
      bySurface: [...studieClicksBySurface.entries()]
        .map(([surface, clicks]) => ({ surface, clicks }))
        .sort((a, b) => b.clicks - a.clicks),
    },
  };
}

/**
 * Day-30 retention, split by whether the account pays.
 *
 * "Retained" means the account has played something in the last 7 days, at
 * least 30 days after signing up. A cohort read rather than a rolling one:
 * accounts younger than 30 days cannot answer the question yet and are
 * excluded rather than counted as churned.
 *
 * The developer and app-reviewer accounts are left out of both cohorts. They
 * all carry Premium, so counting them would make the premium cohort mostly
 * ourselves - and a reviewer account that is used once a year would report as
 * churn we cannot act on.
 */
export async function getDayThirtyRetention(now: Date = new Date()): Promise<{
  free: { cohort: number; retained: number; rate: number };
  premium: { cohort: number; retained: number; rate: number };
}> {
  await connectDB();

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // "Played in the last 7 days": today plus the six days before, Amsterdam.
  const activeSince = amsterdamWindowStart(7, now);
  const internalIds = await getInternalAccountIds();
  const cohort = {
    createdAt: { $lte: thirtyDaysAgo },
    ...(internalIds.length > 0 ? { _id: { $nin: internalIds } } : {}),
  };
  // Premium as the app unlocks it (Stripe, store, lifetime, group, manual),
  // not only the denormalized `isPremium` flag, which group members never get.
  const premium = { $or: effectivePremiumOr(now) };
  const free = { $nor: effectivePremiumOr(now) };
  const retained = { lastPlayedAt: { $gte: activeSince } };

  const [freeCohort, freeRetained, premiumCohort, premiumRetained] = await Promise.all([
    User.countDocuments({ ...cohort, ...free }),
    User.countDocuments({ ...cohort, ...free, ...retained }),
    User.countDocuments({ ...cohort, ...premium }),
    User.countDocuments({ ...cohort, ...premium, ...retained }),
  ]);

  return {
    free: { cohort: freeCohort, retained: freeRetained, rate: rate(freeRetained, freeCohort) },
    premium: { cohort: premiumCohort, retained: premiumRetained, rate: rate(premiumRetained, premiumCohort) },
  };
}

/** Raw recent events, newest first. For eyeballing that ingest is alive. */
export async function getRecentEvents(limit = 50) {
  await connectDB();

  return AnalyticsEvent.find()
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 200))
    .select('name platform props createdAt userId')
    .lean();
}

export function isValidObjectId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value);
}
