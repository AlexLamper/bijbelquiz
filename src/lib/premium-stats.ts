import { connectDB, User, Payment } from '@/database';
import { getInternalAccountIds } from '@/lib/analytics/internal-accounts';

/**
 * One definition of "is this account premium" for reporting.
 *
 * The admin panel used to count `isPremium: true` only. That misses two real
 * groups: store (RevenueCat) purchasers whose webhook has not written the
 * denormalized flag yet, and group-licence members - whose premium is computed
 * at read time from `groupPremiumUntil` and never written to `isPremium` at
 * all. This `$or` matches `getPremiumSnapshot` in `premium-state.ts`, so the
 * dashboard agrees with what the app actually unlocks.
 */
export function effectivePremiumOr(now: Date = new Date()) {
  return [
    { isPremium: true },
    { premiumStripe: true },
    { premiumStore: true },
    { hasLifetimePremium: true },
    { groupPremiumUntil: { $gt: now } },
  ];
}

export interface PremiumStats {
  totalUsers: number;
  premiumUsers: number;
  premiumShare: number;
  internalExcluded: number;
  breakdown: {
    stripe: number;
    store: number;
    lifetime: number;
    group: number;
  };
  revenue: {
    paymentsCompleted: number;
    grossCentsAllTime: number;
    grossCentsLast30d: number;
    currency: string;
  };
  recentPayments: Array<{
    id: string;
    userName: string;
    userEmail: string;
    provider: string;
    planType: string;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

/**
 * Everything the admin surfaces (web dashboard + the mobile admin screen) need
 * about who pays and how much. One round of queries, shared by both.
 */
export async function getPremiumStats(): Promise<PremiumStats> {
  await connectDB();

  const now = new Date();
  const internalIds = await getInternalAccountIds();
  const notInternal = internalIds.length > 0 ? { _id: { $nin: internalIds } } : {};
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    premiumUsers,
    stripeCount,
    storeCount,
    lifetimeCount,
    groupCount,
    revenueAllTime,
    revenue30d,
    recent,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ ...notInternal, $or: effectivePremiumOr(now) }),
    User.countDocuments({ ...notInternal, premiumStripe: true }),
    User.countDocuments({ ...notInternal, premiumStore: true }),
    User.countDocuments({ ...notInternal, hasLifetimePremium: true }),
    User.countDocuments({ ...notInternal, groupPremiumUntil: { $gt: now } }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, cents: { $sum: '$amount' }, n: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, cents: { $sum: '$amount' } } },
    ]),
    Payment.find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('user', 'name email')
      .lean(),
  ]);

  const grossCentsAllTime = revenueAllTime[0]?.cents ?? 0;

  return {
    totalUsers,
    premiumUsers,
    premiumShare: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
    internalExcluded: internalIds.length,
    breakdown: {
      stripe: stripeCount,
      store: storeCount,
      lifetime: lifetimeCount,
      group: groupCount,
    },
    revenue: {
      paymentsCompleted: revenueAllTime[0]?.n ?? 0,
      grossCentsAllTime,
      grossCentsLast30d: revenue30d[0]?.cents ?? 0,
      currency: 'eur',
    },
    recentPayments: (recent as unknown as Array<Record<string, unknown>>).map((payment) => {
      const user = (payment.user ?? {}) as { name?: string; email?: string };
      return {
        id: String(payment._id),
        userName: user.name ?? 'Onbekend',
        userEmail: user.email ?? '',
        provider: String(payment.provider ?? 'stripe'),
        planType: String(payment.planType ?? ''),
        amountCents: Number(payment.amount ?? 0),
        currency: String(payment.currency ?? 'eur'),
        status: String(payment.status ?? ''),
        createdAt:
          payment.createdAt instanceof Date
            ? payment.createdAt.toISOString()
            : String(payment.createdAt ?? ''),
      };
    }),
  };
}

/** `€ 12,34` from an integer number of cents. */
export function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(
    (cents || 0) / 100
  );
}
