import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function shouldDebugLog(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.MULTIPLAYER_DEBUG === '1';
}

export async function GET() {
  if (shouldDebugLog()) {
    console.warn(
      '[multiplayer-ws] Received HTTP GET on websocket endpoint; upgrade did not happen. ' +
        'Use the custom server (npm run dev) for websocket upgrades in development.',
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'WebSocket upgrade required',
      },
    },
    { status: 426 },
  );
}
