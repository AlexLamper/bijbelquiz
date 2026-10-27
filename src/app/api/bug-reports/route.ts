import { NextRequest, NextResponse } from 'next/server';

import { clientIpFrom, handleBugReport } from '@/lib/support-mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The bug report form (`/foutmelding`, the 404 page and the error page).
 * Validation, spam checks and mail live in `support-mail.ts`; without SMTP
 * the report is logged instead of refused.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as unknown;
  const result = await handleBugReport(body, {
    ip: clientIpFrom(req.headers),
    userAgent: req.headers.get('user-agent') || 'unknown',
  });
  return NextResponse.json(result.body, { status: result.status });
}
