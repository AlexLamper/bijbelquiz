import { connectDB, User, Payment } from '@/database';
import { effectivePremiumOr, getInternalAccountIds } from '@/lib/analytics/internal-accounts';
import {
  classifyPayment,
  euro,
  formatMoneyCents,
  otherCurrencies,
  paymentDate,
  summarizeRevenue,
  type MoneyByCurrency,
  type PaymentLike,
  type RevenueSummary,
} from '@/lib/admin/revenue';
import { amsterdamWindowStart } from '@/lib/admin/time';

/**
 * One definition of "is this account premium" for reporting. Lives in
 * `internal-accounts.ts` (so the statistics page uses the same one) and is
 * re-exported here for existing callers.
 */
export { effectivePremiumOr };

export interface PremiumStats {
  totalUsers: number;
  /** Accounts with Premium right now, test/reviewer accounts excluded. */
  premiumUsers: number;
  /** premiumUsers as a whole percent of the real (non-internal) accounts. */
  premiumShare: number;
  /** The same share with one decimal (6.8), for the web dashboard. */
  premiumShareExact: number;
  /** Internal test/reviewer accounts that exist and are left out of the premium figures. */
  internalExcluded: number;
  /**
   * Where that Premium comes from. Exclusive and in this order, so the four
   * (five) add up to `premiumUsers`: a lifetime buyer is "Levenslang" even
   * though the Stripe flag is also on; an account with both a Stripe and a
   * store subscription is "Stripe"; `other` is Premium set by hand (only
   * `isPremium`).
   */
  breakdown: {
    stripe: number;
    store: number;
    lifetime: number;
    group: number;
    other: number;
  };
  revenue: {
    /** Counted payments: real money, received, not test, not internal, amount above 0. */
    paymentsCompleted: number;
    /** Euro, before refunds. Kept for the app's admin screen. */
    grossCentsAllTime: number;
    grossCentsLast30d: number;
    /** Euro, after refunds: what the dashboard shows as "Netto omzet". */
    netCentsAllTime: number;
    netCentsLast30d: number;
    refundedCentsAllTime: number;
    refundsAllTime: number;
    renewalsAllTime: number;
    /** Euro net per source, all time and last 30 days. */
    bySource: {
      stripe: { netCentsAllTime: number; netCentsLast30d: number; payments: number };
      store: { netCentsAllTime: number; netCentsLast30d: number; payments: number };
    };
    /** Net amounts in other currencies (never converted). */
    otherCurrenciesAllTime: Array<{ currency: string; netCents: number }>;
    otherCurrenciesLast30d: Array<{ currency: string; netCents: number }>;
    excluded: RevenueSummary['excluded'];
    currency: string;
  };
  recentPayments: Array<{
    id: string;
    userName: string;
    userEmail: string;
    /** The account behind the payment was deleted (payments are kept for the books). */
    userDeleted: boolean;
    provider: string;
    planType: string;
    amountCents: number;
    currency: string;
    /** `refunded` when fully refunded; the stored status otherwise. */
    status: string;
    refundedCents: number;
    isTest: boolean;
    isInternal: boolean;
    isRenewal: boolean;
    createdAt: string;
  }>;
}

function sourceTotals(all: MoneyByCurrency, window: MoneyByCurrency) {
  return {
    netCentsAllTime: euro(all).netCents,
    netCentsLast30d: euro(window).netCents,
    payments: Object.values(all).reduce((sum, total) => sum + total.payments, 0),
  };
}

/**
 * Everything the admin surfaces (web dashboard + the mobile admin screen) need
 * about who pays and how much. One round of queries, shared by both.
 *
 * "30 dagen" is today plus the 29 Amsterdam calendar days before it.
 */
export async function getPremiumStats(now: Date = new Date()): Promise<PremiumStats> {
  await connectDB();

  const internalIds = await getInternalAccountIds();
  const internalSet = new Set(internalIds.map(String));
  const notInternal = internalIds.length > 0 ? { _id: { $nin: internalIds } } : {};
  const windowStart = amsterdamWindowStart(30, now);
  const groupActive = { groupPremiumUntil: { $gt: now } };
  const notLifetime = { hasLifetimePremium: { $ne: true } };
  const notStripe = { premiumStripe: { $ne: true } };
  const notStore = { premiumStore: { $ne: true } };
  const notGroup = { $or: [{ groupPremiumUntil: null }, { groupPremiumUntil: { $lte: now } }] };

  const [totalUsers, premiumUsers, lifetimeCount, stripeCount, storeCount, groupCount, otherCount, payments, recent] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ ...notInternal, $or: effectivePremiumOr(now) }),
      User.countDocuments({ ...notInternal, hasLifetimePremium: true }),
      User.countDocuments({ ...notInternal, ...notLifetime, premiumStripe: true }),
      User.countDocuments({ ...notInternal, ...notLifetime, ...notStripe, premiumStore: true }),
      User.countDocuments({ ...notInternal, ...notLifetime, ...notStripe, ...notStore, ...groupActive }),
      User.countDocuments({ ...notInternal, ...notLifetime, ...notStripe, ...notStore, ...notGroup, isPremium: true }),
      Payment.find({}).lean<PaymentLike[]>(),
      Payment.find({})
        .sort({ createdAt: -1 })
        .limit(15)
        .populate('user', 'name email')
        .lean<PaymentLike[]>(),
    ]);

  const summary = summarizeRevenue(payments, { internalIds: internalSet, windowStart });
  const allEuro = euro(summary.allTime);
  const windowEuro = euro(summary.window);
  const realAccounts = Math.max(0, totalUsers - internalIds.length);

  return {
    totalUsers,
    premiumUsers,
    premiumShare: realAccounts > 0 ? Math.round((premiumUsers / realAccounts) * 100) : 0,
    premiumShareExact: realAccounts > 0 ? Math.round((premiumUsers / realAccounts) * 1000) / 10 : 0,
    internalExcluded: internalIds.length,
    breakdown: {
      stripe: stripeCount,
      store: storeCount,
      lifetime: lifetimeCount,
      group: groupCount,
      other: otherCount,
    },
    revenue: {
      paymentsCompleted: Object.values(summary.allTime).reduce((sum, total) => sum + total.payments, 0),
      grossCentsAllTime: allEuro.grossCents,
      grossCentsLast30d: windowEuro.grossCents,
      netCentsAllTime: allEuro.netCents,
      netCentsLast30d: windowEuro.netCents,
      refundedCentsAllTime: allEuro.refundedCents,
      refundsAllTime: Object.values(summary.allTime).reduce((sum, total) => sum + total.refunds, 0),
      renewalsAllTime: Object.values(summary.allTime).reduce((sum, total) => sum + total.renewals, 0),
      bySource: {
        stripe: sourceTotals(summary.bySource.stripe, summary.windowBySource.stripe),
        store: sourceTotals(summary.bySource.store, summary.windowBySource.store),
      },
      otherCurrenciesAllTime: otherCurrencies(summary.allTime),
      otherCurrenciesLast30d: otherCurrencies(summary.window),
      excluded: summary.excluded,
      currency: 'eur',
    },
    recentPayments: recent.map((payment) => {
      const user = (payment.user ?? null) as { name?: string; email?: string } | null;
      const row = classifyPayment(payment, internalSet);
      const at = paymentDate(payment);
      return {
        id: String(payment._id),
        userName: user ? user.name || user.email || 'Naamloos' : 'Verwijderd account',
        userEmail: user?.email ?? '',
        userDeleted: !user,
        provider: String(payment.provider ?? 'stripe'),
        planType: String(payment.planType ?? ''),
        amountCents: Math.max(0, Math.round(Number(payment.amount ?? 0))),
        currency: row.currency,
        status: row.displayStatus,
        refundedCents: row.verdict === 'paid' ? row.refundedCents : 0,
        isTest: row.isTest,
        isInternal: row.isInternal,
        isRenewal: row.isRenewal,
        createdAt: at ? at.toISOString() : '',
      };
    }),
  };
}

/** `€ 12,34` from an integer number of cents. */
export function formatEuroCents(cents: number): string {
  return formatMoneyCents(cents, 'eur');
}

export { formatMoneyCents };
