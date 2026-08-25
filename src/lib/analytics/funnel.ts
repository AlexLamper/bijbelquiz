import mongoose from 'mongoose';

import { AnalyticsEvent, User, connectDB } from '@/database';
import { MULTIPLAYER_FREE_ROOM_QUOTA } from '@/lib/premium-benefits';

import { getInternalAccountIds } from './internal-accounts';

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
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

async function countByProp(
  name: string,
  since: Date,
  prop: string,
): Promise<Map<string, number>> {
  const rows = await AnalyticsEvent.aggregate([
    { $match: { name, createdAt: { $gte: since } } },
    { $group: { _id: `$props.${prop}`, count: { $sum: 1 } } },
  ]);

  const out = new Map<string, number>();
  for (const row of rows) {
    if (typeof row._id === 'string') out.set(row._id, row.count);
  }
  return out;
}

export async function getFunnelReport(windowDays = 30): Promise<FunnelReport> {
  await connectDB();

  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [
    startedOne,
    reachedQuota,
    paywallShownByTrigger,
    purchasesByTrigger,
    purchasesByPlan,
    trialsStarted,
    trialsConverted,
    quizzesCompleted,
    firstQuizzesCompleted,
  ] = await Promise.all([
    User.countDocuments({ multiplayerGamesHosted: { $gte: 1 } }),
    User.countDocuments({ multiplayerGamesHosted: { $gte: MULTIPLAYER_FREE_ROOM_QUOTA } }),
    countByProp('paywall_shown', since, 'trigger'),
    countByProp('purchase_completed', since, 'trigger'),
    countByProp('purchase_completed', since, 'plan'),
    AnalyticsEvent.countDocuments({ name: 'trial_started', createdAt: { $gte: since } }),
    AnalyticsEvent.countDocuments({ name: 'trial_converted', createdAt: { $gte: since } }),
    AnalyticsEvent.countDocuments({ name: 'quiz_completed', createdAt: { $gte: since } }),
    AnalyticsEvent.countDocuments({
      name: 'quiz_completed',
      createdAt: { $gte: since },
      'props.isFirst': true,
    }),
  ]);

  const shown = [...paywallShownByTrigger.values()].reduce((sum, n) => sum + n, 0);
  const purchases = [...purchasesByPlan.values()].reduce((sum, n) => sum + n, 0);

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
export async function getDayThirtyRetention(): Promise<{
  free: { cohort: number; retained: number; rate: number };
  premium: { cohort: number; retained: number; rate: number };
}> {
  await connectDB();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const internalIds = await getInternalAccountIds();

  const rows = await User.aggregate([
    {
      $match: {
        createdAt: { $lte: thirtyDaysAgo },
        ...(internalIds.length > 0 ? { _id: { $nin: internalIds } } : {}),
      },
    },
    {
      $group: {
        _id: { $ifNull: ['$isPremium', false] },
        cohort: { $sum: 1 },
        retained: {
          $sum: { $cond: [{ $gte: ['$lastPlayedAt', sevenDaysAgo] }, 1, 0] },
        },
      },
    },
  ]);

  const read = (isPremium: boolean) => {
    const row = rows.find((entry) => Boolean(entry._id) === isPremium);
    const cohort = row?.cohort ?? 0;
    const retained = row?.retained ?? 0;
    return { cohort, retained, rate: rate(retained, cohort) };
  };

  return { free: read(false), premium: read(true) };
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
