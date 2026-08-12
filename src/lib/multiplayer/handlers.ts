import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  MULTIPLAYER_FREE_MAX_PLAYERS,
  MULTIPLAYER_FREE_ROOM_QUOTA,
  MULTIPLAYER_PREMIUM_MAX_PLAYERS,
} from '@/lib/premium-benefits';
import { authenticateMultiplayerRequest } from './auth';
import { MultiplayerError } from './errors';
import { multiplayerErrorResponse, normalizeRoomCode, parseJsonBody } from './http';
import { loadMultiplayerQuota, releaseHostedGame, reserveHostedGame } from './quota';
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

/** Shown whenever a free host has no games left. */
function freeQuotaExhaustedError(): MultiplayerError {
  return new MultiplayerError(
    'PREMIUM_REQUIRED',
    `Je hebt je ${MULTIPLAYER_FREE_ROOM_QUOTA} gratis spellen gebruikt. Word Premium om onbeperkt spellen te hosten met tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers. Meedoen met andermans spel blijft gratis.`,
    403,
  );
}

/** GET /rooms — what this user is allowed to do before they try it. */
export async function handleGetCapability(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const quota = await loadMultiplayerQuota(auth.userId);
    const { isPremiumUser, freeGamesRemaining } = quota;

    return NextResponse.json({
      canCreateRoom: quota.canHost,
      isPremium: isPremiumUser,
      // Kept for older mobile builds that only understand the one-room model.
      hasUsedFreeRoom: !isPremiumUser && freeGamesRemaining === 0,
      freeRoomsRemaining: freeGamesRemaining,
      freeRoomsQuota: MULTIPLAYER_FREE_ROOM_QUOTA,
      freeRoomsUsed: isPremiumUser ? null : quota.gamesHosted,
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
    const { isPremiumUser, canHost } = await loadMultiplayerQuota(auth.userId);

    if (!isPremiumUser && body.maxPlayers > MULTIPLAYER_FREE_MAX_PLAYERS) {
      throw new MultiplayerError(
        'PREMIUM_REQUIRED',
        `Met een gratis account speel je tot ${MULTIPLAYER_FREE_MAX_PLAYERS} spelers per room. Upgrade naar Premium voor rooms tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers.`,
        403,
      );
    }

    // Creating a room is free — the credit is only spent when the game
    // actually starts. This check exists purely so a host with an empty quota
    // isn't led into a lobby that can never start.
    if (!canHost) {
      throw freeQuotaExhaustedError();
    }

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

/**
 * POST /rooms/:roomCode/start — host only.
 *
 * This is where a free game is paid for. The credit is reserved atomically
 * before the room transitions, and handed straight back if the transition is
 * rejected (not the host, too few players, room already started), so a failed
 * start never costs the user anything. `startRoom` only succeeds out of the
 * lobby state, so a room can never be charged twice.
 */
export async function handleStartRoom(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const reservation = await reserveHostedGame(auth.userId);
    if (!reservation.ok) {
      throw freeQuotaExhaustedError();
    }

    const { service } = getMultiplayerRuntime();
    try {
      const room = await service.startRoom({ userId: auth.userId, roomCode });

      return NextResponse.json({ room }, { status: 200 });
    } catch (error) {
      if (reservation.metered) {
        await releaseHostedGame(auth.userId);
      }
      throw error;
    }
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** POST /rooms/:roomCode/advance - host only, ends the reveal pause early. */
export async function handleAdvanceQuestion(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const { service } = getMultiplayerRuntime();
    const room = await service.advanceQuestion({ userId: auth.userId, roomCode });

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
