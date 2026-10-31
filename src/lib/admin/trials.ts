import { AnalyticsEvent, Payment, User, connectDB } from '@/database';
import { getInternalAccountIds } from '@/lib/analytics/internal-accounts';

/**
 * Free trials, for the admin dashboard: who started one, when it ends, and
 * whether it is on its way to a paid subscription.
 *
 * Every trial start - Stripe on the website, App Store / Google Play through
 * RevenueCat - is already recorded as a `trial_started` event, so this needs
 * no new bookkeeping and also shows trials started before it existed. What
 * happened next is read from the account and its payments:
 *
 *   loopt      the trial is running and will turn into a paid subscription
 *   opgezegd   still running, but the player turned renewal off: it will end
 *   omgezet    a paid charge came in after the trial started
 *   gestopt    the trial is over and nothing was paid
 *
 * "opgezegd" is known for Stripe (`stripeCancelAtPeriodEnd`) and, from the
 * RevenueCat webhook onward, for the stores (`storeWillRenew`). For a store
 * trial that started earlier it shows as "loopt" until the store reports it.
 */

export type TrialStatus = 'running' | 'cancelled' | 'converted' | 'ended';

export interface AdminTrial {
  userId: string;
  name: string | null;
  email: string | null;
  /** `stripe` (website) or `revenuecat` (App Store / Google Play). */
  provider: 'stripe' | 'revenuecat';
  platform: 'web' | 'ios' | 'android';
  plan: string | null;
  startedAt: string;
  endsAt: string;
  status: TrialStatus;
  /** Whole days left while running; 0 on the last day; null once over. */
  daysLeft: number | null;
}

export interface AdminTrials {
  /** How far back trials are listed. */
  windowDays: number;
  running: number;
  cancelled: number;
  converted: number;
  ended: number;
  /** converted / (converted + ended), as a whole percentage; null before any trial has finished. */
  conversionRate: number | null;
  /** Running and cancelled first (soonest end first), then the finished ones (newest first). */
  trials: AdminTrial[];
}

/** The length the paywalls offer; used when the account does not say when a trial ends. */
const DEFAULT_TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type TrialEvent = {
  userId?: unknown;
  platform?: 'web' | 'ios' | 'android';
  props?: { plan?: unknown; provider?: unknown };
  createdAt: Date;
};

type TrialUser = {
  _id: unknown;
  name?: string;
  email?: string;
  premiumStripe?: boolean;
  stripeTrialEnd?: Date | null;
  stripeCancelAtPeriodEnd?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | null;
  storeWillRenew?: boolean | null;
};

/** When a trial that started at `start` ends, read from the account where it can be. */
function trialEnd(provider: AdminTrial['provider'], start: Date, user: TrialUser | undefined): Date {
  const fallback = new Date(start.getTime() + DEFAULT_TRIAL_DAYS * DAY_MS);
  // Only an end date that plausibly belongs to this trial: a renewed or later
  // subscription has an end date months away.
  const plausible = (date: Date | null | undefined) =>
    date && date.getTime() > start.getTime() && date.getTime() - start.getTime() <= 31 * DAY_MS ? new Date(date) : null;
  if (provider === 'stripe') return plausible(user?.stripeTrialEnd) ?? fallback;
  return (user?.premiumStore ? plausible(user.storePremiumExpiresAt) : null) ?? fallback;
}

function renewalOff(provider: AdminTrial['provider'], user: TrialUser | undefined): boolean {
  if (!user) return false;
  return provider === 'stripe' ? Boolean(user.stripeCancelAtPeriodEnd) : user.storeWillRenew === false;
}

/** Pure part, exported for tests. */
export function classifyTrial(
  input: { provider: AdminTrial['provider']; startedAt: Date; paidAfterStart: boolean; user?: TrialUser },
  now: Date,
): { status: TrialStatus; endsAt: Date; daysLeft: number | null } {
  const endsAt = trialEnd(input.provider, input.startedAt, input.user);
  if (input.paidAfterStart) return { status: 'converted', endsAt, daysLeft: null };
  if (endsAt.getTime() <= now.getTime()) return { status: 'ended', endsAt, daysLeft: null };
  // Whole days, rounded up ("4 nov, nog 4 dagen" on 31 oct); 0 on the last day.
  const msLeft = endsAt.getTime() - now.getTime();
  const daysLeft = msLeft < DAY_MS ? 0 : Math.ceil(msLeft / DAY_MS);
  return { status: renewalOff(input.provider, input.user) ? 'cancelled' : 'running', endsAt, daysLeft };
}

export async function listAdminTrials(now: Date = new Date(), windowDays = 60): Promise<AdminTrials> {
  await connectDB();
  const since = new Date(now.getTime() - windowDays * DAY_MS);

  const [events, internalIds] = await Promise.all([
    AnalyticsEvent.find({ name: 'trial_started', userId: { $ne: null }, createdAt: { $gte: since } })
      .select('userId platform props createdAt')
      .sort({ createdAt: -1 })
      .lean<TrialEvent[]>(),
    getInternalAccountIds(),
  ]);
  const internal = new Set(internalIds.map(String));

  // The latest trial per account: a second trial (another plan, the other
  // store) replaces the first in this view.
  const latest = new Map<string, TrialEvent>();
  for (const event of events) {
    const id = String(event.userId);
    if (internal.has(id) || latest.has(id)) continue;
    latest.set(id, event);
  }
  const ids = [...latest.keys()];

  const [users, payments] = await Promise.all([
    User.find({ _id: { $in: ids } })
      .select('name email premiumStripe stripeTrialEnd stripeCancelAtPeriodEnd premiumStore storePremiumExpiresAt storeWillRenew')
      .lean<TrialUser[]>(),
    // Any real charge counts as the conversion, whichever provider took it.
    Payment.find({ user: { $in: ids }, status: 'completed', createdAt: { $gte: since } })
      .select('user createdAt')
      .lean<Array<{ user: unknown; createdAt: Date }>>(),
  ]);
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const paidAt = new Map<string, Date[]>();
  for (const payment of payments) {
    const id = String(payment.user);
    paidAt.set(id, [...(paidAt.get(id) ?? []), new Date(payment.createdAt)]);
  }

  const trials: AdminTrial[] = [];
  for (const [id, event] of latest) {
    const user = userById.get(id);
    if (!user) continue;
    const provider = event.props?.provider === 'stripe' ? 'stripe' : 'revenuecat';
    const startedAt = new Date(event.createdAt);
    const paidAfterStart = (paidAt.get(id) ?? []).some((date) => date.getTime() > startedAt.getTime());
    const { status, endsAt, daysLeft } = classifyTrial({ provider, startedAt, paidAfterStart, user }, now);
    trials.push({
      userId: id,
      name: user.name ?? null,
      email: user.email ?? null,
      provider,
      platform: event.platform ?? (provider === 'stripe' ? 'web' : 'ios'),
      plan: typeof event.props?.plan === 'string' ? event.props.plan : null,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status,
      daysLeft,
    });
  }

  const open = (status: TrialStatus) => status === 'running' || status === 'cancelled';
  trials.sort((a, b) => {
    if (open(a.status) !== open(b.status)) return open(a.status) ? -1 : 1;
    return open(a.status) ? a.endsAt.localeCompare(b.endsAt) : b.startedAt.localeCompare(a.startedAt);
  });

  const count = (status: TrialStatus) => trials.filter((trial) => trial.status === status).length;
  const converted = count('converted');
  const ended = count('ended');
  return {
    windowDays,
    running: count('running'),
    cancelled: count('cancelled'),
    converted,
    ended,
    conversionRate: converted + ended > 0 ? Math.round((converted / (converted + ended)) * 100) : null,
    trials,
  };
}

/** The latest trial of one account, for the user page; null when it never started one. */
export async function getAdminUserTrial(userId: string, now: Date = new Date()): Promise<Omit<AdminTrial, 'userId' | 'name' | 'email'> | null> {
  await connectDB();
  const event = await AnalyticsEvent.findOne({ name: 'trial_started', userId })
    .select('platform props createdAt')
    .sort({ createdAt: -1 })
    .lean<TrialEvent>();
  if (!event) return null;
  const startedAt = new Date(event.createdAt);
  const [user, paid] = await Promise.all([
    User.findById(userId)
      .select('premiumStripe stripeTrialEnd stripeCancelAtPeriodEnd premiumStore storePremiumExpiresAt storeWillRenew')
      .lean<TrialUser>(),
    Payment.exists({ user: userId, status: 'completed', createdAt: { $gt: startedAt } }),
  ]);
  const provider = event.props?.provider === 'stripe' ? 'stripe' : 'revenuecat';
  const { status, endsAt, daysLeft } = classifyTrial({ provider, startedAt, paidAfterStart: Boolean(paid), user: user ?? undefined }, now);
  return {
    provider,
    platform: event.platform ?? (provider === 'stripe' ? 'web' : 'ios'),
    plan: typeof event.props?.plan === 'string' ? event.props.plan : null,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status,
    daysLeft,
  };
}
