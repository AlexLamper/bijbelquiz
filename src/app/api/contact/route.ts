import { NextRequest, NextResponse } from 'next/server';

import { clientIpFrom, handleContactSubmission } from '@/lib/support-mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The contact form on `/contact`. Validation, spam checks and mail live in `support-mail.ts`. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as unknown;
  const result = await handleContactSubmission(body, {
    ip: clientIpFrom(req.headers),
    userAgent: req.headers.get('user-agent') || 'unknown',
  });
  return NextResponse.json(result.body, { status: result.status });
}
