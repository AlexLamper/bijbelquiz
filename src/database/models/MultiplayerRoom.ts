import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Persistent representation of a multiplayer room.
 *
 * Why MongoDB?
 *  Vercel runs API routes as serverless functions where each request can be
 *  served by a different instance with its own memory. The previous in-memory
 *  approach worked locally but caused random "ROOM_NOT_FOUND" errors in
 *  production because rooms only existed in the memory of whichever instance
 *  happened to handle the create request. Persisting to MongoDB removes that
 *  fragmentation entirely — every instance reads and writes the same source
 *  of truth.
 *
 *  Game timers (question deadlines, post-question result delay) are NOT run
 *  via setTimeout — those don't survive serverless cold starts. Instead we
 *  store deadline timestamps in this document and the service "lazily"
 *  advances state on every read. As long as at least one client polls within
 *  a few seconds of the deadline, transitions still happen on time.
 */

export type MultiplayerRoomStatus = 'lobby' | 'in_progress' | 'question_result' | 'finished';

export interface IRoomPlayer {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  isHost: boolean;
  isConnected: boolean;
  hasAnswered: boolean;
  lastSeenAt: Date;
}

export interface IRoomQuestionAnswer {
  id: string;
  text: string;
}

export interface IRoomQuestion {
  id: string;
  text: string;
  bibleReference: string;
  correctAnswerId: string;
  explanation?: string;
  answers: IRoomQuestionAnswer[];
}

export interface IMultiplayerRoom extends Document {
  code: string;
  quizId: string;
  quizTitle: string;
  hostUserId: string;
  maxPlayers: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: MultiplayerRoomStatus;
  players: IRoomPlayer[];
  questions: IRoomQuestion[];
  questionDeadlineAt: Date | null;
  questionResultUntilAt: Date | null;
  questionSequence: number;
  /**
   * Map<userId, answerId> for the CURRENT question only. Reset on each new
   * question. Stored as Map so serialization is consistent across drivers.
   */
  submittedAnswers: Map<string, string>;
  expiresAt: Date;
  /** Optimistic-locking version (Mongoose's __v isn't always reliable for our patterns). */
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoomPlayerSchema = new Schema<IRoomPlayer>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    score: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    isHost: { type: Boolean, default: false },
    isConnected: { type: Boolean, default: true },
    hasAnswered: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const RoomQuestionAnswerSchema = new Schema<IRoomQuestionAnswer>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const RoomQuestionSchema = new Schema<IRoomQuestion>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    bibleReference: { type: String, default: '' },
    correctAnswerId: { type: String, required: true },
    explanation: { type: String, default: '' },
    answers: { type: [RoomQuestionAnswerSchema], default: [] },
  },
  { _id: false },
);

const MultiplayerRoomSchema = new Schema<IMultiplayerRoom>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    quizId: { type: String, required: true },
    quizTitle: { type: String, required: true },
    hostUserId: { type: String, required: true, index: true },
    maxPlayers: { type: Number, required: true, min: 2, max: 20 },
    currentQuestionIndex: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    status: {
      type: String,
      enum: ['lobby', 'in_progress', 'question_result', 'finished'],
      default: 'lobby',
      index: true,
    },
    players: { type: [RoomPlayerSchema], default: [] },
    questions: { type: [RoomQuestionSchema], default: [] },
    questionDeadlineAt: { type: Date, default: null },
    questionResultUntilAt: { type: Date, default: null },
    questionSequence: { type: Number, default: 0 },
    submittedAnswers: { type: Map, of: String, default: () => new Map<string, string>() },
    expiresAt: { type: Date, required: true },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// TTL index — Mongo will auto-delete rooms after `expiresAt`. We keep
// every room alive for 24h after creation; if you need to extend a long-running
// game you bump expiresAt on every write below.
MultiplayerRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Convenience index for "rooms a user is currently in" queries.
MultiplayerRoomSchema.index({ 'players.id': 1, status: 1 });

const MultiplayerRoom: Model<IMultiplayerRoom> =
  (mongoose.models.MultiplayerRoom as Model<IMultiplayerRoom>) ||
  mongoose.model<IMultiplayerRoom>('MultiplayerRoom', MultiplayerRoomSchema);

export default MultiplayerRoom;
