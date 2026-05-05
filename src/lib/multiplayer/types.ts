export type RoomStatus = 'lobby' | 'in_progress' | 'question_result' | 'finished';

export interface RoomPlayerSnapshot {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  isHost: boolean;
  isConnected: boolean;
  hasAnswered: boolean;
}

export interface RoomAnswerSnapshot {
  id: string;
  text: string;
}

export interface RoomCurrentQuestionSnapshot {
  id: string;
  text: string;
  bibleReference: string;
  questionNumber: number;
  totalQuestions: number;
  remainingSeconds: number;
  /**
   * Server-supplied absolute deadline (ms since epoch) for the current
   * question. Clients should use this instead of `remainingSeconds` when they
   * want a sub-second-accurate countdown that survives polling jitter.
   */
  deadlineAtMs: number | null;
  answers: RoomAnswerSnapshot[];
}

export interface RoomSnapshot {
  id: string;
  code: string;
  quizId: string;
  quizTitle: string;
  hostUserId: string;
  maxPlayers: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: RoomStatus;
  players: RoomPlayerSnapshot[];
  currentQuestion: RoomCurrentQuestionSnapshot | null;
  /**
   * Wallclock timestamp at which the server built this snapshot. Clients can
   * compute drift between local and server clocks using this.
   */
  serverTimeMs: number;
  /**
   * Optimistic concurrency / freshness counter. Clients can use this to drop
   * older snapshots that arrive out-of-order over slow networks.
   */
  revision: number;
}

export interface RoomResultEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  correctAnswers: number;
}

export interface ImmutableAnswer {
  id: string;
  text: string;
}

export interface ImmutableQuestion {
  id: string;
  text: string;
  bibleReference: string;
  answers: ImmutableAnswer[];
  correctAnswerId: string;
}

export interface ProviderQuizSnapshot {
  id: string;
  title: string;
  questions: ImmutableQuestion[];
}

export interface MultiplayerDataProvider {
  getUserDisplayName(userId: string): Promise<string | null>;
  getQuizSnapshot(quizId: string): Promise<ProviderQuizSnapshot | null>;
}

export interface MultiplayerServiceConfig {
  questionTimerSeconds: number;
  questionResultDelayMs: number;
  /**
   * After this many milliseconds since `lastSeenAt`, a player is considered
   * disconnected. The "isConnected" flag in the snapshot is computed from
   * this — there is no socket-level connection any more.
   */
  playerOfflineAfterMs: number;
  /**
   * Throttle: only update a player's `lastSeenAt` if it's older than this.
   * Avoids writing on every poll. Default 10s.
   */
  heartbeatThrottleMs: number;
  /** Room TTL in MongoDB. Bumped on every write. Default 24h. */
  roomTtlMs: number;
  now: () => number;
  createRoomId: () => string;
  createRoomCode: () => string;
}

export interface AuthenticatedMultiplayerUser {
  userId: string;
}
