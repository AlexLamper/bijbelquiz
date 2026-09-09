import { z } from 'zod';
import { normalizeAvatar } from '@/lib/avatar';
import type {
  MultiplayerApiErrorBody,
  MultiplayerCapability,
  MultiplayerOkResponse,
  MultiplayerResultsResponse,
  MultiplayerRoomResponse,
  MultiplayerRuntimeConfig,
  MultiplayerTokenResponse,
} from './contracts';

const roomStatusSchema = z.enum([
  'lobby',
  'reading',
  'in_progress',
  'question_result',
  'finished',
]);

const roomPassageSchema = z.object({
  book: z.string(),
  chapter: z.number(),
  label: z.string(),
});

const roomPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  // A room started before mascots shipped has none on its players, so this
  // repairs the row rather than rejecting the whole snapshot.
  avatar: z
    .unknown()
    .nullish()
    .transform((value) => normalizeAvatar(value)),
  score: z.number(),
  correctAnswers: z.number(),
  isHost: z.boolean(),
  isConnected: z.boolean(),
  hasAnswered: z.boolean(),
  // Nullish-tolerant so a client that is briefly newer than the deployed API
  // (or vice versa) keeps parsing snapshots instead of failing the whole room.
  answeredCorrectly: z.boolean().nullish().transform((value) => value ?? null),
  scoreGained: z.number().nullish().transform((value) => value ?? null),
});

const roomAnswerSchema = z.object({
  id: z.string(),
  text: z.string(),
  count: z.number().nullish().transform((value) => value ?? null),
});

const roomQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  bibleReference: z.string(),
  questionNumber: z.number(),
  totalQuestions: z.number(),
  remainingSeconds: z.number(),
  deadlineAtMs: z.number().nullable(),
  answers: z.array(roomAnswerSchema),
  yourAnswerId: z.string().nullable(),
  correctAnswerId: z.string().nullable(),
  explanation: z.string().nullable(),
});

const roomSnapshotSchema = z.object({
  id: z.string(),
  code: z.string(),
  quizId: z.string(),
  quizTitle: z.string(),
  hostUserId: z.string(),
  maxPlayers: z.number(),
  currentQuestionIndex: z.number(),
  totalQuestions: z.number(),
  status: roomStatusSchema,
  // Nullish-tolerant so a client briefly newer than the deployed API (rooms
  // created before these fields shipped) still parses the snapshot.
  readChapterFirst: z.boolean().nullish().transform((value) => value ?? false),
  questionTimerSeconds: z.number().nullish().transform((value) => value ?? 0),
  passage: roomPassageSchema.nullish().transform((value) => value ?? null),
  players: z.array(roomPlayerSchema),
  currentQuestion: roomQuestionSchema.nullable(),
  resultPhaseEndsAtMs: z.number().nullable(),
  serverTimeMs: z.number(),
  revision: z.number(),
});

const resultsEntrySchema = z.object({
  rank: z.number(),
  playerId: z.string(),
  playerName: z.string(),
  score: z.number(),
  correctAnswers: z.number(),
});

const tokenResponseSchema = z.object({
  token: z.string().min(1),
});

const roomResponseSchema = z.object({
  room: roomSnapshotSchema,
});

/**
 * `GET /rooms/active` and `POST /rooms/:code/answer` both carry an optional
 * room: the first because the user may not be in one, the second because it is
 * a convenience payload alongside `ok: true`.
 */
const optionalRoomResponseSchema = z.object({
  room: roomSnapshotSchema.nullish().transform((value) => value ?? null),
});

const capabilitySchema = z.object({
  canCreateRoom: z.boolean(),
  isPremium: z.boolean(),
  hasUsedFreeRoom: z.boolean(),
  freeRoomsRemaining: z.number().nullable(),
  // Nullish-tolerant so a client deployed ahead of the API keeps parsing.
  // Hosting is no longer metered, so the API now sends `null` for both quotas
  // and these are only still parsed for older responses in flight.
  freeRoomsQuota: z.number().nullish().transform((value) => value ?? null),
  freeRoomsUsed: z.number().nullish().transform((value) => value ?? null),
  onMonthlyAllowance: z.boolean().nullish().transform((value) => value ?? false),
  monthlyRoomsQuota: z.number().nullish().transform((value) => value ?? null),
  maxPlayersFree: z.number(),
  maxPlayersPremium: z.number(),
  maxPlayersForUser: z.number(),
});

const configSchema = z.object({
  questionTimerSeconds: z.number(),
  questionResultDelayMs: z.number(),
  playerOfflineAfterMs: z.number(),
  minPlayersToStart: z.number(),
  pollIntervalsMs: z.object({
    lobby: z.number(),
    reading: z.number(),
    in_progress: z.number(),
    question_result: z.number(),
    finished: z.number(),
  }),
});

const okResponseSchema = z.object({
  ok: z.literal(true),
});

const resultsResponseSchema = z.object({
  results: z.array(resultsEntrySchema),
});

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export function parseTokenResponse(input: unknown): MultiplayerTokenResponse {
  return tokenResponseSchema.parse(input);
}

export function parseRoomResponse(input: unknown): MultiplayerRoomResponse {
  return roomResponseSchema.parse(input);
}

export function parseOptionalRoomResponse(input: unknown): { room: MultiplayerRoomResponse['room'] | null } {
  return optionalRoomResponseSchema.parse(input);
}

export function parseCapabilityResponse(input: unknown): MultiplayerCapability {
  return capabilitySchema.parse(input);
}

export function parseConfigResponse(input: unknown): MultiplayerRuntimeConfig {
  return configSchema.parse(input);
}

export function parseOkResponse(input: unknown): MultiplayerOkResponse {
  return okResponseSchema.parse(input);
}

export function parseResultsResponse(input: unknown): MultiplayerResultsResponse {
  return resultsResponseSchema.parse(input);
}

export function parseApiError(input: unknown): MultiplayerApiErrorBody | null {
  const parsed = apiErrorSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
