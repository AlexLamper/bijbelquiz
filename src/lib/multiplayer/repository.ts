import { MultiplayerError } from './errors';
import type { ImmutableQuestion, RoomStatus } from './types';

/**
 * In-memory representation of a room, identical to what we persist in
 * MongoDB. The service operates entirely on this shape — the repository
 * implementation translates to/from the Mongoose document.
 */
export interface PersistedRoomPlayer {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  isHost: boolean;
  isConnected: boolean;
  hasAnswered: boolean;
  lastSeenAtMs: number;
}

export interface PersistedRoom {
  /** Generated client-friendly code (e.g. "DGD4VW"). Stored uppercase. */
  code: string;
  /** Mongo ObjectId string OR a UUID assigned at create time. */
  id: string;
  quizId: string;
  quizTitle: string;
  hostUserId: string;
  maxPlayers: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: RoomStatus;
  players: PersistedRoomPlayer[];
  questions: ImmutableQuestion[];
  /** ms since epoch; null when no question is active. */
  questionDeadlineAtMs: number | null;
  /** ms since epoch; null unless we're showing a question result. */
  questionResultUntilAtMs: number | null;
  /** Increments every time we transition to a new question state. */
  questionSequence: number;
  /** Map<userId, answerId> — current question only. */
  submittedAnswers: Record<string, string>;
  /** ms since epoch — Mongo TTL deletes the room past this. */
  expiresAtMs: number;
  /** Optimistic concurrency token. Bumped by repository on every save. */
  revision: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface RoomRepository {
  /** Insert a brand-new room. Throws ROOM_CODE_TAKEN if `code` already exists. */
  insert(room: PersistedRoom): Promise<void>;
  /** Get a room by code, or null. */
  findByCode(code: string): Promise<PersistedRoom | null>;
  /**
   * Persist the room with optimistic concurrency. Returns `true` if the write
   * succeeded, `false` if the in-DB revision moved past `expectedRevision`
   * (caller should retry the mutation).
   */
  save(room: PersistedRoom, expectedRevision: number): Promise<boolean>;
  /** Permanently delete a room. */
  delete(code: string): Promise<void>;
  /** Diagnostic snapshot of all rooms (lightweight projection). */
  listAll(): Promise<Array<{
    code: string;
    id: string;
    status: RoomStatus;
    quizTitle: string;
    hostUserId: string;
    playerCount: number;
    updatedAtMs: number;
  }>>;
}

/**
 * Internal sentinel used by the service mutate helper to signal that a
 * concurrent writer beat us. The service catches this and retries.
 */
export class RoomConcurrencyError extends Error {
  constructor() {
    super('Concurrent room modification — retry');
    this.name = 'RoomConcurrencyError';
  }
}

export const ROOM_NOT_FOUND_ERROR = (): MultiplayerError =>
  new MultiplayerError('ROOM_NOT_FOUND', 'Room not found', 404);
