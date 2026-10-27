import { NextResponse } from 'next/server';

import { healthSummary } from '@/lib/admin/api-overview';
import { requireAdmin, serverError } from '@/lib/admin/api-auth';
import { getPaymentsHealth } from '@/lib/payments-health';

export const dynamic = 'force-dynamic';

/** The betaal-pijplijn check. Contract: docs/setup/admin-api.md (7). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const deep = new URL(req.url).searchParams.get('deep') === '1';
    const health = await getPaymentsHealth({ deep });
    return NextResponse.json({ ...healthSummary(health), accessGaps: health.accessGaps });
  } catch (error) {
    return serverError('ADMIN_PAYMENTS_HEALTH', error);
  }
}
