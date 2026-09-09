import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MULTIPLAYER_MAX_PLAYERS } from '@/lib/premium-benefits';
import { authenticateMultiplayerRequest } from './auth';
import { multiplayerErrorResponse, normalizeRoomCode, parseJsonBody } from './http';
import { assertRoomCreationAllowed } from './rate-limit';
import { loadMultiplayerQuota, releaseHostedGame, reserveHostedGame } from './quota';
import { getMultiplayerRuntime } from './runtime';
import { recordServerEvent } from '@/lib/analytics/record';
import { INVITE_SOURCE_PARAM, INVITE_SOURCE_VALUE } from './invite';
import type { AnalyticsPlatform } from '@/lib/analytics/events';

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
      .max(MULTIPLAYER_MAX_PLAYERS)
      .optional()
      .default(4),
    // Show the quiz's Bible chapter before question 1. Silently ignored server
    // side when the quiz has no single resolvable passage.
    readChapterFirst: z.boolean().optional().default(false),
    // Seconds per question. `0` = host tempo (no countdown, host advances every
    // step); the rest are the fixed auto-timer choices.
    questionTimerSeconds: z
      .union([z.literal(0), z.literal(30), z.literal(60), z.literal(90)])
      .optional()
      .default(0),
  })
  .strict();

const answerSchema = z
  .object({
    questionId: z.string().trim().min(1, 'questionId is required'),
    answerId: z.string().trim().min(1, 'answerId is required'),
  })
  .strict();

/**
 * Which client made this call.
 *
 * Read from the path rather than the user agent: the app talks to the
 * `/api/mobile/*` alias tree, the website to the canonical one, and that is
 * the only signal here that cannot be spoofed into a wrong answer by a browser
 * extension. iOS and Android are not separable this way, so both report as the
 * app; the events the app fires itself carry the exact platform.
 */
function platformOf(req: NextRequest): AnalyticsPlatform {
  return req.nextUrl.pathname.startsWith('/api/mobile') ? 'ios' : 'web';
}

/**
 * GET /rooms - what this user is allowed to do before they try it.
 *
 * The answer is now "everything", but the shape of the response is unchanged.
 * Published app builds parse these fields and will keep doing so for as long as
 * people leave them installed, so the quota fields still ship - reporting the
 * unlimited case they already know how to render (`freeRoomsRemaining: null`)
 * rather than disappearing and turning into `undefined` mid-session.
 */
export async function handleGetCapability(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const quota = await loadMultiplayerQuota(auth.userId);

    return NextResponse.json({
      canCreateRoom: true,
      isPremium: quota.isPremiumUser,
      hasUsedFreeRoom: false,
      freeRoomsRemaining: null,
      freeRoomsQuota: null,
      freeRoomsUsed: quota.gamesHosted,
      onMonthlyAllowance: false,
      monthlyRoomsQuota: null,
      maxPlayersFree: MULTIPLAYER_MAX_PLAYERS,
      maxPlayersPremium: MULTIPLAYER_MAX_PLAYERS,
      maxPlayersForUser: MULTIPLAYER_MAX_PLAYERS,
    });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** POST /rooms - create a room and become its host. */
export async function handleCreateRoom(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const body = await parseJsonBody(req, createRoomSchema);

    // No tier check: the schema's own `max` is the only limit on room size, and
    // it is a capacity number rather than a price tier. What used to keep a
    // script from opening rooms forever was the hosting quota; now that hosting
    // is free, this does it explicitly.
    assertRoomCreationAllowed(auth.userId);

    const { service } = getMultiplayerRuntime();
    const room = await service.createRoom({
      userId: auth.userId,
      quizId: body.quizId,
      maxPlayers: body.maxPlayers,
      readChapterFirst: body.readChapterFirst,
      questionTimerSeconds: body.questionTimerSeconds,
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/** GET /rooms/active - the room this user is already in, if any. */
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

/** GET /config - timing constants so clients never hardcode server env vars. */
export async function handleGetConfig(): Promise<NextResponse> {
  const { service } = getMultiplayerRuntime();
  return NextResponse.json(service.getClientConfig(), { status: 200 });
}

/** GET /rooms/:roomCode - the polling endpoint; also acts as a heartbeat. */
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

/** POST /rooms/:roomCode/join - idempotent; re-joining returns the snapshot. */
export async function handleJoinRoom(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const { service } = getMultiplayerRuntime();
    const room = await service.joinRoom({ userId: auth.userId, roomCode });

    await recordServerEvent('room_joined', {
      userId: auth.userId,
      platform: platformOf(req),
      props: {
        roomCode,
        playerCount: room.players.length,
        // Set by a client that arrived through a shared link, which is what
        // makes the invite channel measurable at all.
        viaInvite:
          req.nextUrl.searchParams.get(INVITE_SOURCE_PARAM) === INVITE_SOURCE_VALUE,
      },
    });

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    return multiplayerErrorResponse(error);
  }
}

/**
 * POST /rooms/:roomCode/start - host only.
 *
 * Nothing is charged here any more; the counter is incremented before the room
 * transitions and handed back if the transition is rejected (not the host, too
 * few players, room already started), so the host statistic keeps matching the
 * number of games that actually ran.
 */
export async function handleStartRoom(req: NextRequest, roomCodeRaw: string): Promise<NextResponse> {
  try {
    const auth = await authenticateMultiplayerRequest(req);
    const roomCode = normalizeRoomCode(roomCodeRaw);

    const reservation = await reserveHostedGame(auth.userId);

    const { service } = getMultiplayerRuntime();
    try {
      const room = await service.startRoom({ userId: auth.userId, roomCode });

      // Recorded after the transition succeeds, so a refused start (too few
      // players, not the host) is not counted as a hosted game - which is also
      // exactly when the count is taken back below.
      await recordServerEvent('room_started', {
        userId: auth.userId,
        platform: platformOf(req),
        props: {
          roomCode,
          playerCount: room.players.length,
          totalQuestions: room.totalQuestions,
        },
      });

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

/** POST /rooms/:roomCode/answer - one answer per player per question. */
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

/** POST /rooms/:roomCode/leave - idempotent, never 404s. */
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

/** GET /rooms/:roomCode/results - final standings. */
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
