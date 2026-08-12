import { NextRequest } from 'next/server';
import { handleAdvanceQuestion } from '@/lib/multiplayer/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  return handleAdvanceQuestion(req, roomCode);
}
