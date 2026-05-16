import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateMultiplayerRequest } from '@/lib/multiplayer/auth';
import { MultiplayerError } from '@/lib/multiplayer/errors';
import { multiplayerErrorResponse, parseJsonBody } from '@/lib/multiplayer/http';
import { getMultiplayerRuntime } from '@/lib/multiplayer/runtime';
import { connectDB, User } from '@/database';
import {
  MULTIPLAYER_FREE_MAX_PLAYERS,
  MULTIPLAYER_FREE_ROOM_QUOTA,
  MULTIPLAYER_PREMIUM_MAX_PLAYERS,
} from '@/lib/premium-benefits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createRoomSchema = z
  .object({
    quizId: z.string().trim().min(1, 'quizId is required'),
    maxPlayers: z
      .number()
      .int()
      .min(2)
      .max(MULTIPLAYER_PREMIUM_MAX_PLAYERS)
      .optional()
      .default(4),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    await connectDB();

    const user = await User.findById(auth.userId)
      .select('isPremium hasLifetimePremium freeMultiplayerRoomCreated')
      .lean();

    if (!user) {
      throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const isPremiumUser = Boolean(user.isPremium || user.hasLifetimePremium);
    const hasUsedFreeRoom = Boolean(user.freeMultiplayerRoomCreated);
    const freeRoomsRemaining = isPremiumUser
      ? null
      : Math.max(0, MULTIPLAYER_FREE_ROOM_QUOTA - (hasUsedFreeRoom ? 1 : 0));

    return NextResponse.json({
      canCreateRoom: isPremiumUser || !hasUsedFreeRoom,
      isPremium: isPremiumUser,
      hasUsedFreeRoom,
      freeRoomsRemaining,
      maxPlayersFree: MULTIPLAYER_FREE_MAX_PLAYERS,
      maxPlayersPremium: MULTIPLAYER_PREMIUM_MAX_PLAYERS,
      maxPlayersForUser: isPremiumUser
        ? MULTIPLAYER_PREMIUM_MAX_PLAYERS
        : MULTIPLAYER_FREE_MAX_PLAYERS,
    });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

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

    if (!isPremiumUser && body.maxPlayers > MULTIPLAYER_FREE_MAX_PLAYERS) {
      throw new MultiplayerError(
        'PREMIUM_REQUIRED',
        `Met een gratis account speel je tot ${MULTIPLAYER_FREE_MAX_PLAYERS} spelers per room. Upgrade naar Premium voor rooms tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers.`,
        403,
      );
    }

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
          `Je gratis room is al gebruikt. Word Premium om onbeperkt rooms te hosten met tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers.`,
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
