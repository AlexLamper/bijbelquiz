import { NextRequest, NextResponse } from 'next/server';
import { authenticateMultiplayerRequest } from '@/lib/multiplayer/auth';
import { multiplayerErrorResponse, normalizeRoomCode } from '@/lib/multiplayer/http';
import { getMultiplayerRuntime } from '@/lib/multiplayer/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    await authenticateMultiplayerRequest(req);
    const resolvedParams = await params;
    const roomCode = normalizeRoomCode(resolvedParams.roomCode);

    const { service } = getMultiplayerRuntime();
    const results = service.getResults(roomCode);

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}
