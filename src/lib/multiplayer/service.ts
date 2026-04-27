import { randomInt, randomUUID } from 'node:crypto';
import { MultiplayerError, validationError } from './errors';
import { RoomLockManager } from './mutex';
import {
  MultiplayerBroadcastEvent,
  MultiplayerDataProvider,
  MultiplayerServiceConfig,
  RoomPlayerSnapshot,
  RoomResultEntry,
  RoomSession,
  RoomSnapshot,
} from './types';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_ROOM_CODE_LENGTH = 6;
const CREATE_ROOM_LOCK_KEY = '__create_room__';

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

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
    questionResultDelayMs: parsePositiveNumber(process.env.QUESTION_RESULT_DELAY_MS, 2000),
    now: () => Date.now(),
    setTimeoutFn: (callback, delayMs) => {
      const timer = setTimeout(callback, delayMs);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }

      return timer;
    },
    clearTimeoutFn: (timer) => clearTimeout(timer),
    createRoomId: () => randomUUID(),
    createRoomCode: () => createRandomRoomCode(),
  };
}

interface MultiplayerServiceOptions {
  provider: MultiplayerDataProvider;
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

type BroadcastListener = (event: MultiplayerBroadcastEvent) => void;

export class MultiplayerService {
  private readonly provider: MultiplayerDataProvider;
  private readonly config: MultiplayerServiceConfig;
  private readonly rooms = new Map<string, RoomSession>();
  private readonly lockManager = new RoomLockManager();
  private readonly listeners = new Set<BroadcastListener>();

  constructor(options: MultiplayerServiceOptions) {
    this.provider = options.provider;
    this.config = {
      ...createDefaultConfig(),
      ...options.config,
    };
  }

  onBroadcast(listener: BroadcastListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async createRoom(input: CreateRoomInput): Promise<RoomSnapshot> {
    const quizId = input.quizId.trim();
    if (!quizId) {
      throw validationError('quizId is required');
    }

    if (!Number.isInteger(input.maxPlayers) || input.maxPlayers < 2 || input.maxPlayers > 4) {
      throw validationError('maxPlayers must be an integer between 2 and 4');
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

    const roomCode = await this.createUniqueRoomCode();

    const room: RoomSession = {
      id: this.config.createRoomId(),
      code: roomCode,
      quizId: quiz.id,
      quizTitle: quiz.title,
      hostUserId: input.userId,
      maxPlayers: input.maxPlayers,
      currentQuestionIndex: 0,
      totalQuestions: quiz.questions.length,
      status: 'lobby',
      players: [
        {
          id: input.userId,
          name: playerName,
          score: 0,
          correctAnswers: 0,
          isHost: true,
          isConnected: true,
          hasAnswered: false,
        },
      ],
      questions: quiz.questions,
      questionDeadlineAtMs: null,
      questionSequence: 0,
      submittedAnswers: new Map<string, string>(),
      questionTimerHandle: null,
      resultTimerHandle: null,
    };

    this.rooms.set(roomCode, room);
    this.emitRoomUpdated(room);

    return this.buildRoomSnapshot(room);
  }

  async joinRoom(input: RoomUserInput): Promise<RoomSnapshot> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    return this.lockManager.runExclusive(roomCode, async () => {
      const room = this.getRoomOrThrow(roomCode);
      const existingPlayer = room.players.find((player) => player.id === input.userId);

      if (existingPlayer) {
        if (!existingPlayer.isConnected) {
          existingPlayer.isConnected = true;
          this.emitRoomUpdated(room);
        }

        return this.buildRoomSnapshot(room);
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

      const newPlayer: RoomPlayerSnapshot = {
        id: input.userId,
        name: playerName,
        score: 0,
        correctAnswers: 0,
        isHost: false,
        isConnected: true,
        hasAnswered: false,
      };

      room.players.push({ ...newPlayer });

      this.emit({
        type: 'player_joined',
        roomCode,
        payload: {
          roomCode,
          player: newPlayer,
          room: this.buildRoomSnapshot(room),
        },
      });
      this.emitRoomUpdated(room);

      return this.buildRoomSnapshot(room);
    });
  }

  getRoom(roomCodeRaw: string): RoomSnapshot {
    const roomCode = this.normalizeRoomCode(roomCodeRaw);
    const room = this.getRoomOrThrow(roomCode);
    return this.buildRoomSnapshot(room);
  }

  async startRoom(input: RoomUserInput): Promise<RoomSnapshot> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    return this.lockManager.runExclusive(roomCode, async () => {
      const room = this.getRoomOrThrow(roomCode);

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
        throw new MultiplayerError('MIN_PLAYERS_REQUIRED', 'At least 2 players are required to start', 409);
      }

      this.startQuestionLocked(room, 0);
      return this.buildRoomSnapshot(room);
    });
  }

  async submitAnswer(input: SubmitAnswerInput): Promise<void> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    await this.lockManager.runExclusive(roomCode, async () => {
      const room = this.getRoomOrThrow(roomCode);

      if (room.status !== 'in_progress') {
        throw new MultiplayerError('GAME_NOT_IN_PROGRESS', 'Game is not in progress', 409);
      }

      const player = room.players.find((roomPlayer) => roomPlayer.id === input.userId);
      if (!player) {
        throw new MultiplayerError('PLAYER_NOT_IN_ROOM', 'Player is not in room', 403);
      }

      const currentQuestion = room.questions[room.currentQuestionIndex];
      if (!currentQuestion) {
        throw new MultiplayerError('GAME_NOT_IN_PROGRESS', 'Game is not in progress', 409);
      }

      if (currentQuestion.id !== input.questionId) {
        throw new MultiplayerError('QUESTION_MISMATCH', 'questionId does not match current question', 409);
      }

      if (player.hasAnswered) {
        throw new MultiplayerError('ANSWER_ALREADY_SUBMITTED', 'Answer already submitted', 409);
      }

      const answerExists = currentQuestion.answers.some((answer) => answer.id === input.answerId);
      if (!answerExists) {
        throw validationError('answerId is invalid for the current question');
      }

      player.hasAnswered = true;
      room.submittedAnswers.set(player.id, input.answerId);

      if (input.answerId === currentQuestion.correctAnswerId) {
        player.score += 1;
        player.correctAnswers += 1;
      }

      const activePlayers = room.players.filter((roomPlayer) => roomPlayer.isConnected);
      const answeredCount = activePlayers.filter((roomPlayer) => roomPlayer.hasAnswered).length;

      this.emit({
        type: 'progress_updated',
        roomCode,
        payload: {
          roomCode,
          answeredCount,
          totalActivePlayers: activePlayers.length,
          room: this.buildRoomSnapshot(room),
        },
      });
      this.emitRoomUpdated(room);

      if (this.areAllActivePlayersAnswered(room)) {
        this.finalizeQuestionLocked(room, 'all_answered');
      }
    });
  }

  getResults(roomCodeRaw: string): RoomResultEntry[] {
    const roomCode = this.normalizeRoomCode(roomCodeRaw);
    const room = this.getRoomOrThrow(roomCode);
    return this.buildResults(room);
  }

  async leaveRoom(input: RoomUserInput): Promise<void> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    await this.lockManager.runExclusive(roomCode, async () => {
      const room = this.rooms.get(roomCode);
      if (!room) {
        return;
      }

      const playerIndex = room.players.findIndex((player) => player.id === input.userId);
      if (playerIndex === -1) {
        return;
      }

      if (room.status === 'lobby') {
        const [removedPlayer] = room.players.splice(playerIndex, 1);

        if (room.players.length === 0) {
          this.clearTimers(room);
          this.rooms.delete(roomCode);
          return;
        }

        if (removedPlayer.isHost) {
          const nextHost = room.players[0];
          room.hostUserId = nextHost.id;
          room.players = room.players.map((player) => ({
            ...player,
            isHost: player.id === nextHost.id,
          }));
        }

        this.emit({
          type: 'player_left',
          roomCode,
          payload: {
            roomCode,
            playerId: removedPlayer.id,
            room: this.buildRoomSnapshot(room),
          },
        });
        this.emitRoomUpdated(room);
        return;
      }

      const player = room.players[playerIndex];
      if (player.isConnected) {
        player.isConnected = false;
        this.emit({
          type: 'player_left',
          roomCode,
          payload: {
            roomCode,
            playerId: player.id,
            room: this.buildRoomSnapshot(room),
          },
        });
        this.emitRoomUpdated(room);
      }
    });
  }

  async joinSocketRoom(input: RoomUserInput): Promise<RoomSnapshot> {
    const roomCode = this.normalizeRoomCode(input.roomCode);

    return this.lockManager.runExclusive(roomCode, async () => {
      const room = this.getRoomOrThrow(roomCode);
      const player = room.players.find((roomPlayer) => roomPlayer.id === input.userId);
      if (!player) {
        throw new MultiplayerError('PLAYER_NOT_IN_ROOM', 'Player is not in room', 403);
      }

      if (!player.isConnected) {
        player.isConnected = true;
        this.emitRoomUpdated(room);
      }

      return this.buildRoomSnapshot(room);
    });
  }

  async leaveSocketRoom(input: RoomUserInput): Promise<void> {
    await this.markPlayerDisconnected(input.roomCode, input.userId);
  }

  async handleSocketDisconnect(input: RoomUserInput): Promise<void> {
    await this.markPlayerDisconnected(input.roomCode, input.userId);
  }

  private async markPlayerDisconnected(roomCodeRaw: string, userId: string): Promise<void> {
    const roomCode = this.normalizeRoomCode(roomCodeRaw);

    await this.lockManager.runExclusive(roomCode, async () => {
      const room = this.rooms.get(roomCode);
      if (!room) {
        return;
      }

      const player = room.players.find((roomPlayer) => roomPlayer.id === userId);
      if (!player) {
        return;
      }

      if (!player.isConnected) {
        return;
      }

      player.isConnected = false;

      this.emit({
        type: 'player_left',
        roomCode,
        payload: {
          roomCode,
          playerId: player.id,
          room: this.buildRoomSnapshot(room),
        },
      });
      this.emitRoomUpdated(room);
    });
  }

  private async createUniqueRoomCode(): Promise<string> {
    return this.lockManager.runExclusive(CREATE_ROOM_LOCK_KEY, async () => {
      for (let attempts = 0; attempts < 50; attempts += 1) {
        const roomCode = this.config.createRoomCode().toUpperCase();
        if (!this.rooms.has(roomCode)) {
          return roomCode;
        }
      }

      throw new MultiplayerError('INTERNAL_ERROR', 'Unable to allocate room code', 500);
    });
  }

  private getRoomOrThrow(roomCode: string): RoomSession {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new MultiplayerError('ROOM_NOT_FOUND', 'Room not found', 404);
    }

    return room;
  }

  private normalizeRoomCode(roomCode: string): string {
    const normalized = roomCode.trim().toUpperCase();
    if (!normalized) {
      throw validationError('roomCode is required');
    }

    return normalized;
  }

  private startQuestionLocked(room: RoomSession, questionIndex: number): void {
    room.currentQuestionIndex = questionIndex;
    room.status = 'in_progress';
    room.questionSequence += 1;
    room.submittedAnswers.clear();
    room.players.forEach((player) => {
      player.hasAnswered = false;
    });

    if (room.questionTimerHandle) {
      this.config.clearTimeoutFn(room.questionTimerHandle);
      room.questionTimerHandle = null;
    }

    if (room.resultTimerHandle) {
      this.config.clearTimeoutFn(room.resultTimerHandle);
      room.resultTimerHandle = null;
    }

    const timerMs = Math.max(1, Math.round(this.config.questionTimerSeconds * 1000));
    room.questionDeadlineAtMs = this.config.now() + timerMs;

    const sequence = room.questionSequence;
    room.questionTimerHandle = this.config.setTimeoutFn(() => {
      void this.handleQuestionTimer(room.code, sequence);
    }, timerMs);

    this.emit({
      type: 'question_started',
      roomCode: room.code,
      payload: {
        roomCode: room.code,
        room: this.buildRoomSnapshot(room),
      },
    });
    this.emitRoomUpdated(room);
  }

  private async handleQuestionTimer(roomCode: string, expectedSequence: number): Promise<void> {
    await this.lockManager.runExclusive(roomCode, async () => {
      const room = this.rooms.get(roomCode);
      if (!room) {
        return;
      }

      if (room.status !== 'in_progress') {
        return;
      }

      if (room.questionSequence !== expectedSequence) {
        return;
      }

      this.finalizeQuestionLocked(room, 'timer');
    });
  }

  private finalizeQuestionLocked(room: RoomSession, reason: 'timer' | 'all_answered'): void {
    if (room.status !== 'in_progress') {
      return;
    }

    if (room.questionTimerHandle) {
      this.config.clearTimeoutFn(room.questionTimerHandle);
      room.questionTimerHandle = null;
    }

    room.questionDeadlineAtMs = null;
    room.status = 'question_result';

    const currentQuestion = room.questions[room.currentQuestionIndex];

    this.emit({
      type: 'question_resolved',
      roomCode: room.code,
      payload: {
        roomCode: room.code,
        reason,
        questionId: currentQuestion?.id ?? null,
        correctAnswerId: currentQuestion?.correctAnswerId ?? null,
        room: this.buildRoomSnapshot(room),
      },
    });
    this.emitRoomUpdated(room);

    const isLastQuestion = room.currentQuestionIndex >= room.totalQuestions - 1;
    if (isLastQuestion) {
      this.finishGameLocked(room);
      return;
    }

    const expectedSequence = room.questionSequence;
    room.resultTimerHandle = this.config.setTimeoutFn(() => {
      void this.advanceToNextQuestion(room.code, expectedSequence);
    }, this.config.questionResultDelayMs);
  }

  private async advanceToNextQuestion(roomCode: string, expectedSequence: number): Promise<void> {
    await this.lockManager.runExclusive(roomCode, async () => {
      const room = this.rooms.get(roomCode);
      if (!room) {
        return;
      }

      if (room.status !== 'question_result') {
        return;
      }

      if (room.questionSequence !== expectedSequence) {
        return;
      }

      if (room.resultTimerHandle) {
        this.config.clearTimeoutFn(room.resultTimerHandle);
        room.resultTimerHandle = null;
      }

      const nextQuestionIndex = room.currentQuestionIndex + 1;
      if (nextQuestionIndex >= room.totalQuestions) {
        this.finishGameLocked(room);
        return;
      }

      this.startQuestionLocked(room, nextQuestionIndex);
    });
  }

  private finishGameLocked(room: RoomSession): void {
    if (room.resultTimerHandle) {
      this.config.clearTimeoutFn(room.resultTimerHandle);
      room.resultTimerHandle = null;
    }

    if (room.questionTimerHandle) {
      this.config.clearTimeoutFn(room.questionTimerHandle);
      room.questionTimerHandle = null;
    }

    room.questionDeadlineAtMs = null;
    room.status = 'finished';

    const results = this.buildResults(room);

    this.emit({
      type: 'game_finished',
      roomCode: room.code,
      payload: {
        roomCode: room.code,
        room: this.buildRoomSnapshot(room),
        results,
      },
    });
    this.emitRoomUpdated(room);
  }

  private areAllActivePlayersAnswered(room: RoomSession): boolean {
    const activePlayers = room.players.filter((player) => player.isConnected);
    if (activePlayers.length === 0) {
      return false;
    }

    return activePlayers.every((player) => player.hasAnswered);
  }

  private clearTimers(room: RoomSession): void {
    if (room.questionTimerHandle) {
      this.config.clearTimeoutFn(room.questionTimerHandle);
      room.questionTimerHandle = null;
    }

    if (room.resultTimerHandle) {
      this.config.clearTimeoutFn(room.resultTimerHandle);
      room.resultTimerHandle = null;
    }

    room.questionDeadlineAtMs = null;
  }

  private buildRoomSnapshot(room: RoomSession): RoomSnapshot {
    const question =
      room.status === 'in_progress' || room.status === 'question_result'
        ? room.questions[room.currentQuestionIndex]
        : null;

    let remainingSeconds = 0;
    if (question && room.status === 'in_progress') {
      const now = this.config.now();
      const deadline = room.questionDeadlineAtMs ?? now;
      remainingSeconds = Math.max(0, Math.ceil((deadline - now) / 1000));
    }

    return {
      id: room.id,
      code: room.code,
      quizId: room.quizId,
      quizTitle: room.quizTitle,
      hostUserId: room.hostUserId,
      maxPlayers: room.maxPlayers,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.totalQuestions,
      status: room.status,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        correctAnswers: player.correctAnswers,
        isHost: player.isHost,
        isConnected: player.isConnected,
        hasAnswered: player.hasAnswered,
      })),
      currentQuestion: question
        ? {
            id: question.id,
            text: question.text,
            bibleReference: question.bibleReference,
            questionNumber: room.currentQuestionIndex + 1,
            totalQuestions: room.totalQuestions,
            remainingSeconds,
            answers: question.answers.map((answer) => ({
              id: answer.id,
              text: answer.text,
            })),
          }
        : null,
    };
  }

  private buildResults(room: RoomSession): RoomResultEntry[] {
    const sortedPlayers = [...room.players].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.correctAnswers !== left.correctAnswers) {
        return right.correctAnswers - left.correctAnswers;
      }

      return left.name.localeCompare(right.name);
    });

    return sortedPlayers.map((player, index) => ({
      rank: index + 1,
      playerId: player.id,
      playerName: player.name,
      score: player.score,
      correctAnswers: player.correctAnswers,
    }));
  }

  private emit(event: MultiplayerBroadcastEvent): void {
    this.listeners.forEach((listener) => {
      listener(event);
    });
  }

  private emitRoomUpdated(room: RoomSession): void {
    this.emit({
      type: 'room_updated',
      roomCode: room.code,
      payload: {
        roomCode: room.code,
        room: this.buildRoomSnapshot(room),
      },
    });
  }
}
