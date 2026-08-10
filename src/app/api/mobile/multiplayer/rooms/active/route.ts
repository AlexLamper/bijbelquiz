import { NextRequest } from 'next/server';
import { handleGetActiveRoom } from '@/lib/multiplayer/handlers';

/**
 * Legacy alias for `/api/multiplayer/rooms/active`. This is what lets a mobile
 * app that was killed mid-game drop the player straight back into their room on
 * next launch instead of asking them to re-enter a code they never saw.
 *
 * Declared before the `[roomCode]` segment in the routing table by virtue of
 * being a static path, so it cannot be swallowed by the dynamic route.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleGetActiveRoom(req);
}
