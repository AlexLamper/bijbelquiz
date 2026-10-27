import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database';
import { processRevenueCatWebhook, verifyRevenueCatAuthorization } from '@/lib/revenuecat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * RevenueCat webhook: https://www.bijbelquiz.com/api/mobile/revenuecat-webhook
 *
 * RevenueCat sends the "Authorization header value" from its dashboard; it
 * must equal `REVENUECAT_WEBHOOK_AUTHORIZATION`. A non-2xx answer makes
 * RevenueCat retry, so only real failures return one.
 */
export async function POST(req: NextRequest) {
  if (!process.env.REVENUECAT_WEBHOOK_AUTHORIZATION) {
    console.error('[REVENUECAT_WEBHOOK_CONFIG_ERROR] REVENUECAT_WEBHOOK_AUTHORIZATION is not set');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!verifyRevenueCatAuthorization(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
  }

  try {
    await connectDB();
    const result = await processRevenueCatWebhook(payload);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('[REVENUECAT_WEBHOOK_UNHANDLED_ERROR]', error);
    return NextResponse.json({ received: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
