import { User, connectDB } from '@/database';
import { getAudienceStats } from '@/lib/admin/audience';
import { getAdminOverview } from '@/lib/admin/overview';
import { listAdminPayments } from '@/lib/admin/payments-list';
import { ADMIN_USER_ROW_FIELDS, toAdminUserRows } from '@/lib/admin/users';
import { getPaymentsHealth, type PaymentsHealthReport } from '@/lib/payments-health';

/**
 * JSON shapes for the app's admin screen (docs/setup/admin-api.md), built
 * from the same loaders the `/beheer` pages render.
 */

/** The health summary the app shows (also what `/api/mobile/admin/stats` sends). */
export function healthSummary(health: PaymentsHealthReport | null) {
  if (!health) return null;
  return {
    overall: health.overall,
    checkedAt: health.generatedAt,
    issues: health.checks
      .filter((c) => c.status !== 'ok')
      .map((c) => ({ label: c.label, status: c.status, detail: c.detail, action: c.action ?? null })),
    okCount: health.checks.filter((c) => c.status === 'ok').length,
    funnel30d: health.funnel30d,
    accessGapCount: health.accessGaps.length,
    stripeKeyMode: health.stripe.keyMode,
    revenuecatConfigured: health.revenuecat.webhookAuthConfigured && health.revenuecat.restKeyConfigured,
  };
}

export async function buildAdminOverviewPayload({ deep = false }: { deep?: boolean } = {}, now: Date = new Date()) {
  await connectDB();
  const [audience, overview, health, recentUsers, recentPayments] = await Promise.all([
    getAudienceStats(now),
    getAdminOverview(now),
    getPaymentsHealth({ deep }).catch(() => null),
    User.aggregate([
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: 10 },
      {
        $project: {
          ...Object.fromEntries(ADMIN_USER_ROW_FIELDS.split(' ').map((field) => [field, 1])),
          hasPassword: { $gt: [{ $strLenCP: { $ifNull: ['$password', ''] } }, 0] },
        },
      },
    ]),
    listAdminPayments({ q: '', provider: null, status: null, page: 1, pageSize: 10 }),
  ]);

  const stats = overview.premium;
  return {
    generatedAt: now.toISOString(),
    internalExcluded: stats.internalExcluded,
    users: {
      total: audience.totalUsers,
      derivedPlatforms: audience.derivedPlatforms,
      registrations: audience.registrations,
      byMethod: audience.byMethod,
      active: audience.active,
      retention: audience.retention,
    },
    premium: {
      total: stats.premiumUsers,
      share: stats.premiumShareExact,
      bySource: {
        stripe: stats.breakdown.stripe,
        store: stats.breakdown.store,
        lifetime: stats.breakdown.lifetime,
        group: stats.breakdown.group,
        manual: stats.breakdown.other,
      },
      bySignupPlatform: audience.premium.bySignupPlatform,
      conversion: audience.premium.conversion,
      grantsActive: audience.premium.grantsActive,
      grantsExpiringIn7d: audience.premium.grantsExpiringIn7d,
    },
    revenue: revenueBlock(stats),
    quizzes: {
      total: overview.totalQuizzes,
      pending: overview.pendingQuizzes,
      plays: audience.quizPlays,
    },
    health: (() => {
      const summary = healthSummary(health);
      if (!summary) return null;
      const { overall, checkedAt, okCount, issues, accessGapCount } = summary;
      return { overall, checkedAt, okCount, issues, accessGapCount };
    })(),
    recentUsers: await toAdminUserRows(recentUsers, now),
    recentPayments: recentPayments.payments,
  };
}

/** The revenue block on its own, for the payments endpoint. */
export function revenueBlock(stats: Awaited<ReturnType<typeof getAdminOverview>>['premium']) {
  return {
    currency: stats.revenue.currency,
    netCentsLast30d: stats.revenue.netCentsLast30d,
    netCentsAllTime: stats.revenue.netCentsAllTime,
    refundedCentsAllTime: stats.revenue.refundedCentsAllTime,
    paymentsCompleted: stats.revenue.paymentsCompleted,
    renewalsAllTime: stats.revenue.renewalsAllTime,
    bySource: stats.revenue.bySource,
    otherCurrenciesAllTime: stats.revenue.otherCurrenciesAllTime,
    otherCurrenciesLast30d: stats.revenue.otherCurrenciesLast30d,
  };
}
