import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateMultiplayerRequest } from '@/lib/multiplayer/auth';
import { multiplayerErrorResponse, parseJsonBody } from '@/lib/multiplayer/http';
import { getMultiplayerRuntime } from '@/lib/multiplayer/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createRoomSchema = z
  .object({
    quizId: z.string().trim().min(1, 'quizId is required'),
    maxPlayers: z.number().int().min(2).max(4).optional().default(4),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const body = await parseJsonBody(req, createRoomSchema);

    const { service } = getMultiplayerRuntime();
    const room = await service.createRoom({
      userId: auth.userId,
      quizId: body.quizId,
      maxPlayers: body.maxPlayers,
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}
