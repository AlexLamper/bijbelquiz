import { NextResponse } from 'next/server';

import { connectDB, User } from '@/database';
import { getMobileUserId } from '@/lib/mobile-auth';
import { getPremiumStats } from '@/lib/premium-stats';
import { getPaymentsHealth } from '@/lib/payments-health';

export const dynamic = 'force-dynamic';

/**
 * Premium / revenue figures for the in-app admin screen. Same numbers as the
 * website's `/beheer` dashboard (both call `getPremiumStats`), so an admin on
 * the phone sees exactly what an admin on the web sees.
 *
 * Admin-only: a non-admin bearer token gets 403.
 */
export async function GET(req: Request) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(userId).select('role').lean();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deep = new URL(req.url).searchParams.get('deep') === '1';

  try {
    const [stats, health] = await Promise.all([
      getPremiumStats(),
      getPaymentsHealth({ deep }).catch(() => null),
    ]);

    // Trim the health report to what the phone screen renders.
    const healthSummary = health
      ? {
          overall: health.overall,
          checkedAt: health.generatedAt,
          issues: health.checks
            .filter((c) => c.status !== 'ok')
            .map((c) => ({ label: c.label, status: c.status, detail: c.detail, action: c.action ?? null })),
          okCount: health.checks.filter((c) => c.status === 'ok').length,
          funnel30d: health.funnel30d,
          accessGapCount: health.accessGaps.length,
          stripeKeyMode: health.stripe.keyMode,
          revenuecatConfigured:
            health.revenuecat.webhookAuthConfigured && health.revenuecat.restKeyConfigured,
        }
      : null;

    return NextResponse.json({ ...stats, health: healthSummary }, { status: 200 });
  } catch (error) {
    console.error('Mobile API - Admin Stats Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
