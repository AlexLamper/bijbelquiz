import { z } from 'zod';
import type {
  MultiplayerApiErrorBody,
  MultiplayerOkResponse,
  MultiplayerResultsResponse,
  MultiplayerRoomResponse,
  MultiplayerTokenResponse,
} from './contracts';

const roomStatusSchema = z.enum(['lobby', 'in_progress', 'question_result', 'finished']);

const roomPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
  correctAnswers: z.number(),
  isHost: z.boolean(),
  isConnected: z.boolean(),
  hasAnswered: z.boolean(),
});

const roomAnswerSchema = z.object({
  id: z.string(),
  text: z.string(),
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
  players: z.array(roomPlayerSchema),
  currentQuestion: roomQuestionSchema.nullable(),
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
