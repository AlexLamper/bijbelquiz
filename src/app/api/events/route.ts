import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/get-session';
import { recordEvents } from '@/lib/analytics/record';
import type { AnalyticsPlatform } from '@/lib/analytics/events';

/**
 * POST /api/events - the funnel ingest endpoint.
 *
 * Accepts a batch so a client can queue and flush rather than firing a request
 * per tap. Auth is optional on purpose: the most interesting part of the
 * funnel happens before sign-in, and an `anonymousId` stitches those rows to
 * the account once one exists.
 *
 * Always answers 202, even on a malformed body. A client must never retry, log
 * an error, or - worst of all - surface a failure to a user because a metric
 * did not land.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function readPlatform(value: unknown): AnalyticsPlatform {
  return value === 'ios' || value === 'android' ? value : 'web';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const events = Array.isArray(body?.events) ? body.events : null;

    if (!events || events.length === 0) {
      return NextResponse.json({ accepted: 0 }, { status: 202 });
    }

    const session = await getSession(req);

    const accepted = await recordEvents(events, {
      userId: session?.user?.id ?? null,
      anonymousId: typeof body?.anonymousId === 'string' ? body.anonymousId : null,
      platform: readPlatform(body?.platform),
    });

    return NextResponse.json({ accepted }, { status: 202 });
  } catch (error) {
    console.error('[EVENTS_POST]', error);
    return NextResponse.json({ accepted: 0 }, { status: 202 });
  }
}
