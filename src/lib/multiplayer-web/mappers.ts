import { z } from 'zod';
import type {
  MultiplayerApiErrorBody,
  MultiplayerOkResponse,
  MultiplayerResultsResponse,
  MultiplayerRoomResponse,
  MultiplayerTokenResponse,
  MultiplayerWsInboundEvent,
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

const wsEnvelopeSchema = z.object({
  type: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

const wsEventSchemas = {
  room_joined: z.object({
    type: z.literal('room_joined'),
    payload: z.object({
      room: roomSnapshotSchema,
    }),
  }),
  player_joined: z.object({
    type: z.literal('player_joined'),
    payload: z.object({
      roomCode: z.string(),
      player: roomPlayerSchema,
      room: roomSnapshotSchema,
    }),
  }),
  player_left: z.object({
    type: z.literal('player_left'),
    payload: z.object({
      roomCode: z.string(),
      playerId: z.string(),
      room: roomSnapshotSchema,
    }),
  }),
  question_started: z.object({
    type: z.literal('question_started'),
    payload: z.object({
      roomCode: z.string(),
      room: roomSnapshotSchema,
    }),
  }),
  progress_updated: z.object({
    type: z.literal('progress_updated'),
    payload: z.object({
      roomCode: z.string(),
      answeredCount: z.number(),
      totalActivePlayers: z.number(),
      room: roomSnapshotSchema,
    }),
  }),
  question_resolved: z.object({
    type: z.literal('question_resolved'),
    payload: z.object({
      roomCode: z.string(),
      reason: z.enum(['timer', 'all_answered']),
      questionId: z.string().nullable(),
      correctAnswerId: z.string().nullable(),
      room: roomSnapshotSchema,
    }),
  }),
  game_finished: z.object({
    type: z.literal('game_finished'),
    payload: z.object({
      roomCode: z.string(),
      room: roomSnapshotSchema,
      results: z.array(resultsEntrySchema),
    }),
  }),
  room_updated: z.object({
    type: z.literal('room_updated'),
    payload: z.object({
      roomCode: z.string(),
      room: roomSnapshotSchema,
    }),
  }),
  error: z.object({
    type: z.literal('error'),
    payload: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
} as const;

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

export function parseWsEvent(input: unknown): MultiplayerWsInboundEvent {
  const envelope = wsEnvelopeSchema.parse(input);
  const schema = wsEventSchemas[envelope.type as keyof typeof wsEventSchemas];

  if (!schema) {
    throw new Error(`Unsupported websocket event: ${envelope.type}`);
  }

  return schema.parse(envelope) as MultiplayerWsInboundEvent;
}
