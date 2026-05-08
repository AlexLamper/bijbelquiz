import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database';
import { processRevenueCatWebhook } from '@/lib/revenuecat';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  const expectedAuthorization = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION;

  if (!expectedAuthorization || authorization !== expectedAuthorization) {
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

