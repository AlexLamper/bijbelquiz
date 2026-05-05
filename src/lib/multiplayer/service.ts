import { randomInt, randomUUID } from 'node:crypto';
import { MultiplayerError, validationError } from './errors';
import type {
  PersistedRoom,
  PersistedRoomPlayer,
  RoomRepository,
} from './repository';
import { ROOM_NOT_FOUND_ERROR } from './repository';
import type {
  ImmutableQuestion,
  MultiplayerDataProvider,
  MultiplayerServiceConfig,
  RoomCurrentQuestionSnapshot,
  RoomPlayerSnapshot,
  RoomResultEntry,
  RoomSnapshot,
  RoomStatus,
} from './types';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_ROOM_CODE_LENGTH = 6;
const MAX_ROOM_CODE_ATTEMPTS = 50;
const MAX_CONCURRENCY_RETRIES = 8;

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function createRandomRoomCode(length = DEFAULT_ROOM_CODE_LENGTH): string {
  let result = '';
  for (let index = 0; index < length; index += 1) {
    const randomIndex = randomInt(0, ROOM_CODE_ALPHABET.length);
    result += ROOM_CODE_ALPHABET[randomIndex];
  }
  return result;
}

function createDefaultConfig(): MultiplayerServiceConfig {
  return {
    questionTimerSeconds: parsePositiveNumber(process.env.QUESTION_TIMER_SECONDS, 20),
    questionResultDelayMs: parsePositiveNumber(process.env.QUESTION_RESULT_DELAY_MS, 2500),
    playerOfflineAfterMs: parsePositiveNumber(process.env.MULTIPLAYER_OFFLINE_AFTER_MS, 30_000),
    heartbeatThrottleMs: parsePositiveNumber(process.env.MULTIPLAYER_HEARTBEAT_MS, 10_000),
    roomTtlMs: parsePositiveNumber(process.env.MULTIPLAYER_ROOM_TTL_MS, 24 * 60 * 60 * 1000),
    now: () => Date.now(),
    createRoomId: () => randomUUID(),
    createRoomCode: () => createRandomRoomCode(),
  };
}

export interface MultiplayerServiceOptions {
  provider: MultiplayerDataProvider;
  repository: RoomRepository;
  config?: Partial<MultiplayerServiceConfig>;
}

interface CreateRoomInput {
  userId: string;
  quizId: string;
  maxPlayers: number;
}

interface RoomUserInput {
  userId: string;
  roomCode: string;
}

interface SubmitAnswerInput extends RoomUserInput {
  questionId: string;
  answerId: string;
}

interface MutationOutcome<T> {
  /** Value returned to the caller. */
  value: T;
  /** If true, the helper will save the room and retry on conflict. */
  mutated: boolean;
}

/**
 * MultiplayerService — stateless, persistence-backed multiplayer game engine.
 *
 * Architecture (post-Vercel rewrite):
 *  - All room state lives in MongoDB. No in-memory `this.rooms` map. This is
 *    the only thing that makes the previous "Room niet gevonden" errors go
 *    away in serverless environments where each request can hit a different
 *    instance.
 *  - No `setTimeout` for question deadlines. Instead deadlines are stored as
 *    timestamps and we *lazily* advance state on every read or write. As
 *    long as at least one client polls within a few seconds of expiry, the
 *    server transitions on time. If everyone leaves the page mid-game the
 *    next poll picks up where the world left off.
 *  - Concurrency is handled via optimistic locking on `revision`. The
 *    repository performs a conditional write (`updateOne` with `{ revision }`
 *    in the filter); if a writer beat us we re-read and re-apply.
 */
export class MultiplayerService {
  private readonly provider: MultiplayerDataProvider;
  private readonly repository: RoomRepository;
  private readonly config: MultiplayerServiceConfig;

  constructor(options: MultiplayerServiceOptions) {
    this.provider = options.provider;
    this.repository = options.repository;
    this.config = { ...createDefaultConfig(), ...options.config };
  }

  // ── Public API ───────────────────────────────────────────────────────────

  async createRoom(input: CreateRoomInput): Promise<RoomSnapshot> {
    const quizId = input.quizId.trim();
    if (!quizId) {
      throw validationError('quizId is required');
    }

    if (!Number.isInteger(input.maxPlayers) || input.maxPlayers < 2 || input.maxPlayers > 20) {
      throw validationError('maxPlayers must be an integer between 2 and 20');
    }

    const [quiz, playerName] = await Promise.all([
      this.provider.getQuizSnapshot(quizId),
      this.provider.getUserDisplayName(input.userId),
    ]);

    if (!playerName) {
      throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
    }
    if (!quiz) {
      throw new MultiplayerError('QUIZ_NOT_FOUND', 'Quiz not found', 404);
    }

    const now = this.config.now();
    const code = await this.allocateUniqueCode(quiz.questions, {
      userId: input.userId,
      playerName,
      quizId: quiz.id,
      quizTitle: quiz.title,
      maxPlayers: input.maxPlayers,
      now,
    });

    const created = await this.repository.findByCode(code);
    if (!created) {
      throw new MultiplayerError('INTERNAL_ERROR', 'Room creation failed', 500);
    }

    return this.buildSnapshot(created, now, input.userId);
  }

  async joinRoom(input: RoomUserInput): Promise<RoomSnapshot> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    return this.mutateRoom(roomCode, async (room) => {
      const now = this.config.now();
      this.advanceTimers(room, now);

      const existing = room.players.find((p) => p.id === input.userId);
      if (existing) {
        existing.isConnected = true;
        existing.lastSeenAtMs = now;
        return { value: this.buildSnapshot(room, now, input.userId), mutated: true };
      }

      if (room.status === 'finished') {
        throw new MultiplayerError('ROOM_FINISHED', 'Room has already finished', 409);
      }
      if (room.status !== 'lobby') {
        throw new MultiplayerError('ROOM_ALREADY_STARTED', 'Room has already started', 409);
      }
      if (room.players.length >= room.maxPlayers) {
        throw new MultiplayerError('ROOM_FULL', 'Room is full', 409);
      }

      const playerName = await this.provider.getUserDisplayName(input.userId);
      if (!playerName) {
        throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
      }

      room.players.push({
        id: input.userId,
        name: playerName,
        score: 0,
        correctAnswers: 0,
        isHost: false,
        isConnected: true,
        hasAnswered: false,
        lastSeenAtMs: now,
      });

      return { value: this.buildSnapshot(room, now, input.userId), mutated: true };
    });
  }

  /**
   * Read a room snapshot. Implicitly:
   *  1. Advances expired timers (in_progress → question_result, etc.)
   *  2. Throttled-bumps `lastSeenAt` for the polling user (acts as heartbeat).
   *  3. Marks players as offline if their lastSeenAt is too old.
   */
  async getRoom(input: RoomUserInput): Promise<RoomSnapshot> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    return this.mutateRoom(roomCode, async (room) => {
      const now = this.config.now();

      let mutated = this.advanceTimers(room, now);
      mutated = this.bumpHeartbeat(room, input.userId, now) || mutated;
      mutated = this.recomputeConnectedFlags(room, now) || mutated;

      return { value: this.buildSnapshot(room, now, input.userId), mutated };
    });
  }

  async startRoom(input: RoomUserInput): Promise<RoomSnapshot> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    return this.mutateRoom(roomCode, async (room) => {
      const now = this.config.now();
      this.advanceTimers(room, now);

      if (room.hostUserId !== input.userId) {
        throw new MultiplayerError('NOT_HOST', 'Only the host can start the game', 403);
      }
      if (room.status === 'finished') {
        throw new MultiplayerError('ROOM_FINISHED', 'Room has already finished', 409);
      }
      if (room.status !== 'lobby') {
        throw new MultiplayerError('ROOM_ALREADY_STARTED', 'Room has already started', 409);
      }
      if (room.players.length < 2) {
        throw new MultiplayerError(
          'MIN_PLAYERS_REQUIRED',
          'At least 2 players are required to start',
          409,
        );
      }

      this.startQuestion(room, 0, now);
      return { value: this.buildSnapshot(room, now, input.userId), mutated: true };
    });
  }

  async submitAnswer(input: SubmitAnswerInput): Promise<RoomSnapshot> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    return this.mutateRoom(roomCode, async (room) => {
      const now = this.config.now();
      this.advanceTimers(room, now);

      if (room.status !== 'in_progress') {
        throw new MultiplayerError('GAME_NOT_IN_PROGRESS', 'Game is not in progress', 409);
      }

      const player = room.players.find((p) => p.id === input.userId);
      if (!player) {
        throw new MultiplayerError('PLAYER_NOT_IN_ROOM', 'Player is not in room', 403);
      }

      const currentQuestion = room.questions[room.currentQuestionIndex];
      if (!currentQuestion) {
        throw new MultiplayerError('GAME_NOT_IN_PROGRESS', 'Game is not in progress', 409);
      }
      if (currentQuestion.id !== input.questionId) {
        throw new MultiplayerError(
          'QUESTION_MISMATCH',
          'questionId does not match current question',
          409,
        );
      }
      if (player.hasAnswered) {
        throw new MultiplayerError('ANSWER_ALREADY_SUBMITTED', 'Answer already submitted', 409);
      }

      const answerExists = currentQuestion.answers.some((a) => a.id === input.answerId);
      if (!answerExists) {
        throw validationError('answerId is invalid for the current question');
      }

      player.hasAnswered = true;
      player.lastSeenAtMs = now;
      player.isConnected = true;
      room.submittedAnswers[player.id] = input.answerId;

      if (input.answerId === currentQuestion.correctAnswerId) {
        player.score += 1;
        player.correctAnswers += 1;
      }

      // If everyone connected has answered, immediately finalize the question
      // (no need to wait for the timer).
      if (this.allActivePlayersAnswered(room)) {
        this.finalizeQuestion(room, now);
      }

      return { value: this.buildSnapshot(room, now, input.userId), mutated: true };
    });
  }

  async leaveRoom(input: RoomUserInput): Promise<void> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    let shouldDelete = false;
    await this.mutateRoom(roomCode, async (room) => {
      const now = this.config.now();
      this.advanceTimers(room, now);

      const playerIndex = room.players.findIndex((p) => p.id === input.userId);
      if (playerIndex === -1) {
        return { value: undefined, mutated: false };
      }

      if (room.status === 'lobby') {
        const [removedPlayer] = room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          shouldDelete = true;
          return { value: undefined, mutated: false };
        }

        if (removedPlayer.isHost) {
          const nextHost = room.players[0];
          room.hostUserId = nextHost.id;
          room.players = room.players.map((p) => ({
            ...p,
            isHost: p.id === nextHost.id,
          }));
        }
      } else {
        const player = room.players[playerIndex];
        if (player.isConnected) {
          player.isConnected = false;
        }
        // Keep the player in the array so their score is preserved through the
        // game; they're just marked offline.
      }

      return { value: undefined, mutated: true };
    }, { allowMissing: true });

    if (shouldDelete) {
      await this.repository.delete(roomCode);
    }
  }

  async getResults(input: RoomUserInput): Promise<RoomResultEntry[]> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    return this.mutateRoom(roomCode, async (room) => {
      const now = this.config.now();
      const mutated = this.advanceTimers(room, now);
      return { value: this.buildResults(room), mutated };
    });
  }

  /**
   * Diagnostic snapshot used by /api/multiplayer/debug. Returns lightweight
   * info without exposing per-question answers.
   */
  async debugListRooms() {
    return this.repository.listAll();
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  /**
   * Read-modify-write loop with optimistic concurrency. Calls `fn(room)`,
   * persists the room if `mutated`, and retries up to N times on conflict.
   *
   * The `allowMissing` flag changes the behaviour when the room doesn't exist:
   * - false (default): throw ROOM_NOT_FOUND
   * - true: silently no-op (used by leaveRoom for idempotency)
   */
  private async mutateRoom<T>(
    roomCode: string,
    fn: (room: PersistedRoom) => Promise<MutationOutcome<T>>,
    options: { allowMissing?: boolean } = {},
  ): Promise<T> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt < MAX_CONCURRENCY_RETRIES; attempt += 1) {
      const room = await this.repository.findByCode(roomCode);
      if (!room) {
        if (options.allowMissing) {
          return undefined as unknown as T;
        }
        throw ROOM_NOT_FOUND_ERROR();
      }

      const expectedRevision = room.revision;
      let outcome: MutationOutcome<T>;

      try {
        outcome = await fn(room);
      } catch (error) {
        throw error;
      }

      if (!outcome.mutated) {
        return outcome.value;
      }

      // Bump TTL on every write so active rooms don't get evicted by the
      // 24h Mongo TTL index.
      room.expiresAtMs = this.config.now() + this.config.roomTtlMs;

      const saved = await this.repository.save(room, expectedRevision);
      if (saved) {
        return outcome.value;
      }

      lastError = new MultiplayerError(
        'CONCURRENCY_CONFLICT',
        'Concurrent room modification, retrying',
        503,
      );
      // Brief backoff before retry
      await sleep(20 + Math.floor(Math.random() * 40));
    }

    throw (
      lastError instanceof MultiplayerError
        ? lastError
        : new MultiplayerError(
            'CONCURRENCY_CONFLICT',
            'Failed to apply mutation after multiple retries',
            503,
          )
    );
  }

  private async allocateUniqueCode(
    questions: ImmutableQuestion[],
    seed: {
      userId: string;
      playerName: string;
      quizId: string;
      quizTitle: string;
      maxPlayers: number;
      now: number;
    },
  ): Promise<string> {
    for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
      const code = this.config.createRoomCode().toUpperCase();

      const newRoom: PersistedRoom = {
        code,
        id: this.config.createRoomId(),
        quizId: seed.quizId,
        quizTitle: seed.quizTitle,
        hostUserId: seed.userId,
        maxPlayers: seed.maxPlayers,
        currentQuestionIndex: 0,
        totalQuestions: questions.length,
        status: 'lobby',
        players: [
          {
            id: seed.userId,
            name: seed.playerName,
            score: 0,
            correctAnswers: 0,
            isHost: true,
            isConnected: true,
            hasAnswered: false,
            lastSeenAtMs: seed.now,
          },
        ],
        questions,
        questionDeadlineAtMs: null,
        questionResultUntilAtMs: null,
        questionSequence: 0,
        submittedAnswers: {},
        expiresAtMs: seed.now + this.config.roomTtlMs,
        revision: 0,
        createdAtMs: seed.now,
        updatedAtMs: seed.now,
      };

      try {
        await this.repository.insert(newRoom);
        return code;
      } catch (error) {
        if (error instanceof MultiplayerError && error.code === 'ROOM_CODE_TAKEN') {
          continue;
        }
        throw error;
      }
    }

    throw new MultiplayerError('INTERNAL_ERROR', 'Unable to allocate room code', 500);
  }

  private normalizeRoomCode(roomCode: string): string {
    const normalized = roomCode.trim().toUpperCase();
    if (!normalized) {
      throw validationError('roomCode is required');
    }
    return normalized;
  }

  /**
   * Lazy state-machine advancement. Mutates `room` in place. Returns true if
   * any field changed. Called from every read/write so transitions happen on
   * the next request after their deadline.
   */
  private advanceTimers(room: PersistedRoom, now: number): boolean {
    let mutated = false;

    // Multiple transitions might fire from a single advance — e.g. if many
    // seconds passed since the last poll the question may have ended AND the
    // result delay may have passed. We loop until we're stable.
    let safety = 0;
    while (safety < 5) {
      safety += 1;

      if (
        room.status === 'in_progress' &&
        room.questionDeadlineAtMs !== null &&
        room.questionDeadlineAtMs <= now
      ) {
        this.finalizeQuestion(room, now);
        mutated = true;
        continue;
      }

      if (
        room.status === 'question_result' &&
        room.questionResultUntilAtMs !== null &&
        room.questionResultUntilAtMs <= now
      ) {
        this.advanceToNextQuestion(room, now);
        mutated = true;
        continue;
      }

      break;
    }

    return mutated;
  }

  private startQuestion(room: PersistedRoom, questionIndex: number, now: number): void {
    room.currentQuestionIndex = questionIndex;
    room.status = 'in_progress';
    room.questionSequence += 1;
    room.submittedAnswers = {};
    room.players.forEach((player) => {
      player.hasAnswered = false;
    });

    const timerMs = Math.max(1, Math.round(this.config.questionTimerSeconds * 1000));
    room.questionDeadlineAtMs = now + timerMs;
    room.questionResultUntilAtMs = null;
  }

  private finalizeQuestion(room: PersistedRoom, now: number): void {
    if (room.status !== 'in_progress') return;

    // Compute the result-delay baseline. If we're finalizing on time (e.g.
    // because everyone answered) the baseline is `now`. If we're finalizing
    // late because the timer expired and a poll only just woke us up, the
    // baseline is the *original* deadline, so multiple late transitions can
    // collapse correctly during a single advanceTimers loop.
    const baseline =
      room.questionDeadlineAtMs !== null && room.questionDeadlineAtMs <= now
        ? room.questionDeadlineAtMs
        : now;

    room.status = 'question_result';
    room.questionDeadlineAtMs = null;

    const isLastQuestion = room.currentQuestionIndex >= room.totalQuestions - 1;
    if (isLastQuestion) {
      this.finishGame(room);
      return;
    }

    room.questionResultUntilAtMs = baseline + this.config.questionResultDelayMs;
  }

  private advanceToNextQuestion(room: PersistedRoom, now: number): void {
    if (room.status !== 'question_result') return;

    const nextQuestionIndex = room.currentQuestionIndex + 1;
    if (nextQuestionIndex >= room.totalQuestions) {
      this.finishGame(room);
      return;
    }

    this.startQuestion(room, nextQuestionIndex, now);
  }

  private finishGame(room: PersistedRoom): void {
    room.status = 'finished';
    room.questionDeadlineAtMs = null;
    room.questionResultUntilAtMs = null;
  }

  private allActivePlayersAnswered(room: PersistedRoom): boolean {
    const active = room.players.filter((p) => p.isConnected);
    if (active.length === 0) return false;
    return active.every((p) => p.hasAnswered);
  }

  /**
   * Throttled lastSeenAt update. Returns true if the player was found and
   * their timestamp was updated.
   */
  private bumpHeartbeat(room: PersistedRoom, userId: string, now: number): boolean {
    const player = room.players.find((p) => p.id === userId);
    if (!player) return false;

    if (now - player.lastSeenAtMs < this.config.heartbeatThrottleMs) {
      // If they were marked offline previously but are polling now, mark them
      // online (without writing the timestamp itself).
      if (!player.isConnected) {
        player.isConnected = true;
        return true;
      }
      return false;
    }

    player.lastSeenAtMs = now;
    if (!player.isConnected) {
      player.isConnected = true;
    }
    return true;
  }

  /**
   * Mark players as `isConnected = false` if their lastSeenAt is older than
   * the offline threshold. Returns true if anything changed.
   */
  private recomputeConnectedFlags(room: PersistedRoom, now: number): boolean {
    let mutated = false;
    const cutoff = now - this.config.playerOfflineAfterMs;

    for (const player of room.players) {
      const isStale = player.lastSeenAtMs < cutoff;
      if (isStale && player.isConnected) {
        player.isConnected = false;
        mutated = true;
      } else if (!isStale && !player.isConnected) {
        player.isConnected = true;
        mutated = true;
      }
    }

    return mutated;
  }

  private buildSnapshot(room: PersistedRoom, now: number, viewerUserId: string): RoomSnapshot {
    const status: RoomStatus = room.status;
    const showQuestion = status === 'in_progress' || status === 'question_result';
    const question = showQuestion ? room.questions[room.currentQuestionIndex] : null;

    let remainingSeconds = 0;
    let deadlineAtMs: number | null = null;
    if (question && status === 'in_progress' && room.questionDeadlineAtMs !== null) {
      deadlineAtMs = room.questionDeadlineAtMs;
      remainingSeconds = Math.max(0, Math.ceil((deadlineAtMs - now) / 1000));
    }

    const viewerChoice = room.submittedAnswers[viewerUserId] ?? null;
    const revealCorrect = status === 'question_result' && question !== null;

    const correctAnswerId = revealCorrect && question ? question.correctAnswerId : null;
    const explanation =
      revealCorrect && question?.explanation?.trim()
        ? question.explanation.trim()
        : null;

    const currentQuestion: RoomCurrentQuestionSnapshot | null = question
      ? {
          id: question.id,
          text: question.text,
          bibleReference: question.bibleReference,
          questionNumber: room.currentQuestionIndex + 1,
          totalQuestions: room.totalQuestions,
          remainingSeconds,
          deadlineAtMs,
          answers: question.answers.map((a) => ({ id: a.id, text: a.text })),
          yourAnswerId: viewerChoice,
          correctAnswerId,
          explanation,
        }
      : null;

    const resultPhaseEndsAtMs =
      status === 'question_result' && room.questionResultUntilAtMs !== null
        ? room.questionResultUntilAtMs
        : null;

    const players: RoomPlayerSnapshot[] = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      correctAnswers: p.correctAnswers,
      isHost: p.isHost,
      isConnected: p.isConnected,
      hasAnswered: p.hasAnswered,
    }));

    return {
      id: room.id,
      code: room.code,
      quizId: room.quizId,
      quizTitle: room.quizTitle,
      hostUserId: room.hostUserId,
      maxPlayers: room.maxPlayers,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.totalQuestions,
      status,
      players,
      currentQuestion,
      resultPhaseEndsAtMs,
      serverTimeMs: now,
      revision: room.revision,
    };
  }

  private buildResults(room: PersistedRoom): RoomResultEntry[] {
    return [...room.players]
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (right.correctAnswers !== left.correctAnswers) return right.correctAnswers - left.correctAnswers;
        return left.name.localeCompare(right.name);
      })
      .map((player, index) => ({
        rank: index + 1,
        playerId: player.id,
        playerName: player.name,
        score: player.score,
        correctAnswers: player.correctAnswers,
      }));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// PersistedRoomPlayer is re-exported for tests that introspect the data shape.
export type { PersistedRoomPlayer };
