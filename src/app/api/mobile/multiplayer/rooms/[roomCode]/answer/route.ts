import { NextRequest } from 'next/server';
import { handleSubmitAnswer } from '@/lib/multiplayer/handlers';

/** Legacy alias for `/api/multiplayer/rooms/:roomCode/answer`. */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  return handleSubmitAnswer(req, roomCode);
}
