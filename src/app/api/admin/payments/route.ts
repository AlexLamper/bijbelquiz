import { NextResponse } from 'next/server';

import { revenueBlock } from '@/lib/admin/api-overview';
import { listAdminPayments, readPaymentListQuery } from '@/lib/admin/payments-list';
import { requireAdmin, serverError } from '@/lib/admin/api-auth';
import { getPremiumStats } from '@/lib/premium-stats';

export const dynamic = 'force-dynamic';

/** Every payment, paged, with the revenue totals. Contract: docs/setup/admin-api.md (7). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const [list, stats] = await Promise.all([
      listAdminPayments(readPaymentListQuery(new URL(req.url).searchParams)),
      getPremiumStats(),
    ]);
    return NextResponse.json({ ...list, revenue: revenueBlock(stats) });
  } catch (error) {
    return serverError('ADMIN_PAYMENTS', error);
  }
}
