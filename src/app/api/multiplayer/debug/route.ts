import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMultiplayerRuntime } from '@/lib/multiplayer/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint that reports the state of the persistent multiplayer
 * runtime: which serverless instance handled the request, and what rooms
 * exist in MongoDB. Useful for debugging "Room niet gevonden" reports —
 * if /api/multiplayer/debug shows the room then we know the issue is
 * client-side (stale cache, wrong code) rather than missing persistence.
 *
 * Auth-gated. Returns 404 in production unless MULTIPLAYER_DEBUG=1.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.MULTIPLAYER_DEBUG !== '1') {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Not found' } },
      { status: 404 },
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 },
    );
  }

  const { instanceId, bootedAt, service } = getMultiplayerRuntime();
  const rooms = await service.debugListRooms();

  return NextResponse.json(
    {
      runtime: {
        instanceId,
        bootedAt,
        bootedAtIso: new Date(bootedAt).toISOString(),
        uptimeMs: Date.now() - bootedAt,
        pid: process.pid,
        nodeEnv: process.env.NODE_ENV ?? 'unknown',
        transport: 'http-polling',
      },
      rooms,
    },
    { status: 200 },
  );
}
