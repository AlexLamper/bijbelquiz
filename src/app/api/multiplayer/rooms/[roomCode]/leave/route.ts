import { NextRequest } from 'next/server';
import { handleLeaveRoom } from '@/lib/multiplayer/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  return handleLeaveRoom(req, roomCode);
}
