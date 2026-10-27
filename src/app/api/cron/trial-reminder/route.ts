import { NextRequest, NextResponse } from 'next/server';

import { runTrialReminders } from '@/lib/trial-reminder';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily Vercel Cron (see vercel.json): mails trialing yearly subscribers on
 * day 5 of their trial, once. Vercel sends `Authorization: Bearer
 * $CRON_SECRET`; anything else is refused, and without CRON_SECRET the route
 * refuses everything rather than run open.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron/trial-reminder] CRON_SECRET is not set; refusing to run');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }

  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const run = await runTrialReminders();
    console.info('[cron/trial-reminder]', run);
    return NextResponse.json({ ok: true, ...run });
  } catch (error) {
    console.error('[cron/trial-reminder] Run failed', error);
    return NextResponse.json({ ok: false, error: 'Run failed' }, { status: 500 });
  }
}
