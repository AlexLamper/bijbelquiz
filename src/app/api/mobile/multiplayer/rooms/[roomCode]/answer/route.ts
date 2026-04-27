import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateMultiplayerRequest } from '@/lib/multiplayer/auth';
import { multiplayerErrorResponse, normalizeRoomCode, parseJsonBody } from '@/lib/multiplayer/http';
import { getMultiplayerRuntime } from '@/lib/multiplayer/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const answerSchema = z
  .object({
    questionId: z.string().trim().min(1, 'questionId is required'),
    answerId: z.string().trim().min(1, 'answerId is required'),
  })
  .strict();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const body = await parseJsonBody(req, answerSchema);
    const resolvedParams = await params;
    const roomCode = normalizeRoomCode(resolvedParams.roomCode);

    const { service } = getMultiplayerRuntime();
    await service.submitAnswer({
      userId: auth.userId,
      roomCode,
      questionId: body.questionId,
      answerId: body.answerId,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}
