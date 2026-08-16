import { NextRequest } from 'next/server';

import { POST as handleEvents } from '@/app/api/events/route';

/**
 * Alias for `/api/events`, so the Flutter client - whose base URL is
 * `/api/mobile` - can post funnel events without hardcoding a second origin.
 * Mirrors how the multiplayer routes are aliased.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleEvents(req);
}
