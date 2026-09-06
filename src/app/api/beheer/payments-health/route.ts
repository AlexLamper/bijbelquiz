import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getPaymentsHealth } from '@/lib/payments-health';

export const dynamic = 'force-dynamic';

/**
 * The full betaal-pijplijn report as JSON. Same data as `/beheer/betalingen`.
 * Admin session only. `?deep=0` skips the network-heavy Stripe list calls.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deep = req.nextUrl.searchParams.get('deep') !== '0';

  try {
    const report = await getPaymentsHealth({ deep });
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error('[PAYMENTS_HEALTH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
