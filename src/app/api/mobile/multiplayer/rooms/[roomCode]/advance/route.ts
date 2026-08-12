import { NextRequest } from 'next/server';
import { handleAdvanceQuestion } from '@/lib/multiplayer/handlers';

/**
 * Legacy alias for `/api/multiplayer/rooms/:roomCode/advance`, kept so the
 * mobile tree exposes the same surface as the canonical one.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  return handleAdvanceQuestion(req, roomCode);
}
