import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMultiplayerRuntime } from '@/lib/multiplayer/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint that reports the current state of the multiplayer
 * runtime: which process is serving requests, which rooms are alive, and how
 * many WebSocket sockets are attached. Authenticated, dev-only access by
 * default — set `MULTIPLAYER_DEBUG=1` to enable in production.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.MULTIPLAYER_DEBUG !== '1') {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Not found',
        },
      },
      { status: 404 },
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
      },
      { status: 401 },
    );
  }

  const { instanceId, bootedAt, service, wsHub } = getMultiplayerRuntime();

  return NextResponse.json(
    {
      runtime: {
        instanceId,
        bootedAt,
        bootedAtIso: new Date(bootedAt).toISOString(),
        uptimeMs: Date.now() - bootedAt,
        pid: process.pid,
        nodeEnv: process.env.NODE_ENV ?? 'unknown',
      },
      rooms: service.debugListRooms(),
      sockets: wsHub.debugListSockets(),
    },
    { status: 200 },
  );
}
