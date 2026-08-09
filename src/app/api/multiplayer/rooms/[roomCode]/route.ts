import { NextRequest } from 'next/server';
import { handleGetRoom } from '@/lib/multiplayer/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  return handleGetRoom(req, roomCode);
}
