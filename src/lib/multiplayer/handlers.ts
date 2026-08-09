import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDB, User } from '@/database';
import {
  MULTIPLAYER_FREE_MAX_PLAYERS,
  MULTIPLAYER_FREE_ROOM_QUOTA,
  MULTIPLAYER_PREMIUM_MAX_PLAYERS,
} from '@/lib/premium-benefits';
import { authenticateMultiplayerRequest } from './auth';
import { MultiplayerError } from './errors';
import { multiplayerErrorResponse, normalizeRoomCode, parseJsonBody } from './http';
import { getMultiplayerRuntime } from './runtime';

/**
 * Every multiplayer HTTP handler lives here, and both route trees
 * (`/api/multiplayer/*` and the legacy `/api/mobile/multiplayer/*`) are thin
 * wrappers around these functions. One implementation means the Next.js web
 * client, the Expo app and the Flutter app can never drift apart in behaviour.
 */

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

const answerSchema = z
  .object({
    questionId: z.string().trim().min(1, 'questionId is required'),
    answerId: z.string().trim().min(1, 'answerId is required'),
  })
  .strict();

interface PremiumStateSummary {
  isPremiumUser: boolean;
  hasUsedFreeRoom: boolean;
}

/**
 * A token can carry a userId that isn't a Mongo ObjectId (a stale token, or an
 * OAuth `sub` that was never mapped to a user). Querying with it throws a
 * CastError, which used to become a 500. Treat it as "unauthenticated".
 */
async function loadPremiumState(userId: string): Promise<PremiumStateSummary> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  await connectDB();

  const user = await User.findById(userId)
    .select('isPremium hasLifetimePremium freeMultiplayerRoomCreated')
    .lean();

  if (!user) {
    throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  return {
    isPremiumUser: Boolean(user.isPremium || user.hasLifetimePremium),
    hasUsedFreeRoom: Boolean(user.freeMultiplayerRoomCreated),
  };
}

/** GET /rooms — what this user is allowed to do before they try it. */
export async function handleGetCapability(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const { isPremiumUser, hasUsedFreeRoom } = await loadPremiumState(auth.userId);

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

/** POST /rooms — create a room and become its host. */
export async function handleCreateRoom(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const body = await parseJsonBody(req, createRoomSchema);
    const { isPremiumUser } = await loadPremiumState(auth.userId);

    if (!isPremiumUser && body.maxPlayers > MULTIPLAYER_FREE_MAX_PLAYERS) {
      throw new MultiplayerError(
        'PREMIUM_REQUIRED',
        `Met een gratis account speel je tot ${MULTIPLAYER_FREE_MAX_PLAYERS} spelers per room. Upgrade naar Premium voor rooms tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers.`,
        403,
      );
    }

    // Reserve the single free room atomically *before* creating it, so two
    // concurrent create requests can't both slip through the quota.
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

/** GET /rooms/active — the room this user is already in, if any. */
export async function handleGetActiveRoom(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const { service } = getMultiplayerRuntime();
    const room = await service.getActiveRoom(auth.userId);

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** GET /config — timing constants so clients never hardcode server env vars. */
export async function handleGetConfig(): Promise<NextResponse> {
  const { service } = getMultiplayerRuntime();
  return NextResponse.json(service.getClientConfig(), { status: 200 });
}

/** GET /rooms/:roomCode — the polling endpoint; also acts as a heartbeat. */
export async function handleGetRoom(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const { service } = getMultiplayerRuntime();
    const room = await service.getRoom({ userId: auth.userId, roomCode });

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** POST /rooms/:roomCode/join — idempotent; re-joining returns the snapshot. */
export async function handleJoinRoom(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const { service } = getMultiplayerRuntime();
    const room = await service.joinRoom({ userId: auth.userId, roomCode });

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** POST /rooms/:roomCode/start — host only. */
export async function handleStartRoom(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const { service } = getMultiplayerRuntime();
    const room = await service.startRoom({ userId: auth.userId, roomCode });

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** POST /rooms/:roomCode/answer — one answer per player per question. */
export async function handleSubmitAnswer(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const body = await parseJsonBody(req, answerSchema);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const { service } = getMultiplayerRuntime();
    const room = await service.submitAnswer({
      userId: auth.userId,
      roomCode,
      questionId: body.questionId,
      answerId: body.answerId,
    });

    // `room` is included so clients can render the result of their own answer
    // without waiting for the next poll.
    return NextResponse.json({ ok: true, room }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** POST /rooms/:roomCode/leave — idempotent, never 404s. */
export async function handleLeaveRoom(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const { service } = getMultiplayerRuntime();
    await service.leaveRoom({ userId: auth.userId, roomCode });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** GET /rooms/:roomCode/results — final standings. */
export async function handleGetResults(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const { service } = getMultiplayerRuntime();
    const results = await service.getResults({ userId: auth.userId, roomCode });

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}
