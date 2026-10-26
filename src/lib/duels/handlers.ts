import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/get-session';
import { DuelError, duelErrorResponse, duelValidationError } from './errors';
import {
  createDuel,
  declineDuel,
  forfeitDuel,
  getDuel,
  getInvitePreview,
  joinDuelByInvite,
  listDuelPlayers,
  listDuels,
  submitDuelAnswer,
} from './service';

/**
 * Every duel HTTP handler. Both route trees - `/api/duels/*` for the website
 * and `/api/mobile/duels/*` for the app, whose base URL is `/api/mobile` - are
 * thin wrappers around these, the same split the multiplayer routes use.
 *
 * Auth is `getSession`, which accepts the NextAuth cookie as well as the app's
 * bearer token, so one implementation serves both clients.
 */

async function requireUserId(req: NextRequest): Promise<string> {
  const session = await getSession(req);
  const id = session?.user?.id;
  if (!id) throw new DuelError('UNAUTHORIZED', 'Niet geautoriseerd', 401);
  return String(id);
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw duelValidationError('Ongeldige aanvraag.');
  }
}

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw duelValidationError(result.error.issues[0]?.message ?? 'Ongeldige aanvraag.');
  }
  return result.data;
}

const createSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('friend'),
    opponentId: z.string().trim().min(1).max(64).optional(),
    opponentName: z.string().trim().min(1).max(80).optional(),
  }),
  z.object({ mode: z.literal('random') }),
  z.object({ mode: z.literal('invite') }),
]);

const joinSchema = z.object({
  token: z.string().trim().min(1, 'De uitnodiging ontbreekt.').max(64),
});

const answerSchema = z.object({
  roundIndex: z.number().int().min(0).max(10),
  questionIndex: z.number().int().min(0).max(10),
  answerId: z.string().trim().min(1, 'Kies een antwoord.').max(64),
});

/** GET /duels - my duels grouped for the list, plus my win/loss record. */
export async function handleListDuels(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req);
    return NextResponse.json(await listDuels(userId));
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_LIST]');
  }
}

/** POST /duels - challenge a friend, find a random opponent, or make an invite. */
export async function handleCreateDuel(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req);
    const input = parse(createSchema, await readJson(req));
    const result = await createDuel(userId, input);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_CREATE]');
  }
}

/** POST /duels/join - take the seat of an invite duel. */
export async function handleJoinDuel(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req);
    const { token } = parse(joinSchema, await readJson(req));
    return NextResponse.json(await joinDuelByInvite(userId, token));
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_JOIN]');
  }
}

/** GET /duels/invite/:token - who sent this invite. Needs no account. */
export async function handleInvitePreview(_req: NextRequest, token: string): Promise<NextResponse> {
  try {
    return NextResponse.json({ invite: await getInvitePreview(token) });
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_INVITE]');
  }
}

/** GET /duels/players?q= - people to challenge, or a name search. */
export async function handleListPlayers(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req);
    const query = req.nextUrl.searchParams.get('q');
    return NextResponse.json(await listDuelPlayers(userId, query));
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_PLAYERS]');
  }
}

/** GET /duels/:id - the duel as this player may see it. */
export async function handleGetDuel(req: NextRequest, duelId: string): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req);
    return NextResponse.json({ duel: await getDuel(userId, duelId) });
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_GET]');
  }
}

/** POST /duels/:id/answer - one answer; graded here, never trusted from the client. */
export async function handleSubmitAnswer(req: NextRequest, duelId: string): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req);
    const input = parse(answerSchema, await readJson(req));
    return NextResponse.json(await submitDuelAnswer(userId, duelId, input));
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_ANSWER]');
  }
}

/** POST /duels/:id/decline - say no to a challenge before playing. */
export async function handleDeclineDuel(req: NextRequest, duelId: string): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req);
    return NextResponse.json({ duel: await declineDuel(userId, duelId) });
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_DECLINE]');
  }
}

/** POST /duels/:id/forfeit - give up, or cancel a duel nobody joined yet. */
export async function handleForfeitDuel(req: NextRequest, duelId: string): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req);
    return NextResponse.json({ duel: await forfeitDuel(userId, duelId) });
  } catch (error) {
    return duelErrorResponse(error, '[DUELS_FORFEIT]');
  }
}
