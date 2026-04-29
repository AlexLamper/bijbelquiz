import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateMultiplayerRequest } from '@/lib/multiplayer/auth';
import { MultiplayerError } from '@/lib/multiplayer/errors';
import { multiplayerErrorResponse, parseJsonBody } from '@/lib/multiplayer/http';
import { getMultiplayerRuntime } from '@/lib/multiplayer/runtime';
import { connectDB, User } from '@/database';

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
    await connectDB();

    const user = await User.findById(auth.userId)
      .select('isPremium hasLifetimePremium freeMultiplayerRoomCreated')
      .lean();

    if (!user) {
      throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const isPremiumUser = Boolean(user.isPremium || user.hasLifetimePremium);
    let reservedFreeRoomCreation = false;

    if (!isPremiumUser) {
      const reservation = await User.findOneAndUpdate(
        { _id: auth.userId, freeMultiplayerRoomCreated: { $ne: true } },
        { $set: { freeMultiplayerRoomCreated: true } },
      )
        .select('_id')
        .lean();

      if (!reservation) {
        throw new MultiplayerError(
          'PREMIUM_REQUIRED',
          'Room aanmaken is Premium. Je kunt als gratis gebruiker 1 room maken; daarna is Premium nodig.',
          403,
        );
      }

      reservedFreeRoomCreation = true;
    }

    const { service } = getMultiplayerRuntime();
    try {
      const room = await service.createRoom({
        userId: auth.userId,
        quizId: body.quizId,
        maxPlayers: body.maxPlayers,
      });

      return NextResponse.json({ room }, { status: 201 });
    } catch (error) {
      if (reservedFreeRoomCreation) {
        await User.updateOne(
          { _id: auth.userId },
          { $set: { freeMultiplayerRoomCreated: false } },
        );
      }

      throw error;
    }
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}
