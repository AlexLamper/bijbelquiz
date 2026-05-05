import assert from 'node:assert/strict';
import test from 'node:test';
import { MultiplayerError } from '@/lib/multiplayer/errors';
import { InMemoryRoomRepository } from '@/lib/multiplayer/repository-memory';
import { MultiplayerService } from '@/lib/multiplayer/service';
import {
  ImmutableAnswer,
  ImmutableQuestion,
  MultiplayerDataProvider,
  ProviderQuizSnapshot,
} from '@/lib/multiplayer/types';

const USERS: Record<string, string> = {
  host: 'Host',
  p2: 'Player Two',
  p3: 'Player Three',
  p4: 'Player Four',
  p5: 'Player Five',
};

class FakeProvider implements MultiplayerDataProvider {
  constructor(
    private readonly users: Record<string, string>,
    private readonly quizzes: Record<string, ProviderQuizSnapshot>,
  ) {}

  async getUserDisplayName(userId: string): Promise<string | null> {
    return this.users[userId] ?? null;
  }

  async getQuizSnapshot(quizId: string): Promise<ProviderQuizSnapshot | null> {
    const quiz = this.quizzes[quizId];
    if (!quiz) return null;

    return {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        bibleReference: q.bibleReference,
        correctAnswerId: q.correctAnswerId,
        answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
      })),
    };
  }
}

function buildQuestions(count: number): ImmutableQuestion[] {
  const out: ImmutableQuestion[] = [];
  for (let i = 0; i < count; i += 1) {
    const a: ImmutableAnswer = { id: `q${i + 1}-a1`, text: `Answer A${i + 1}` };
    const b: ImmutableAnswer = { id: `q${i + 1}-a2`, text: `Answer B${i + 1}` };
    out.push({
      id: `q${i + 1}`,
      text: `Question ${i + 1}`,
      bibleReference: `Reference ${i + 1}`,
      answers: [a, b],
      correctAnswerId: a.id,
    });
  }
  return out;
}

interface ServiceOptions {
  questionCount?: number;
  questionTimerSeconds?: number;
  questionResultDelayMs?: number;
  /** Test clock; mutate it via the returned `setNow` function. */
  initialNow?: number;
}

function createService(options: ServiceOptions = {}) {
  const questionCount = options.questionCount ?? 3;
  const quiz: ProviderQuizSnapshot = {
    id: 'quiz-1',
    title: 'Test Quiz',
    questions: buildQuestions(questionCount),
  };

  let now = options.initialNow ?? 1_700_000_000_000;
  const repository = new InMemoryRoomRepository();

  const service = new MultiplayerService({
    provider: new FakeProvider(USERS, { [quiz.id]: quiz }),
    repository,
    config: {
      questionTimerSeconds: options.questionTimerSeconds ?? 20,
      questionResultDelayMs: options.questionResultDelayMs ?? 2000,
      heartbeatThrottleMs: 0, // always heartbeat in tests for determinism
      playerOfflineAfterMs: 30_000,
      roomTtlMs: 24 * 60 * 60 * 1000,
      now: () => now,
      createRoomCode: () => 'ABC123',
      createRoomId: () => 'room-1',
    },
  });

  return {
    service,
    repository,
    setNow(value: number) {
      now = value;
    },
    advance(ms: number) {
      now += ms;
    },
    nowFn() {
      return now;
    },
  };
}

async function expectError(promise: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    return error instanceof MultiplayerError && error.code === code;
  });
}

test('create room success', async () => {
  const { service } = createService();

  const room = await service.createRoom({
    userId: 'host',
    quizId: 'quiz-1',
    maxPlayers: 4,
  });

  assert.equal(room.code, 'ABC123');
  assert.equal(room.status, 'lobby');
  assert.equal(room.players.length, 1);
  assert.equal(room.players[0].id, 'host');
  assert.equal(room.players[0].isHost, true);
  assert.equal(room.currentQuestion, null);
});

test('join room success', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });

  const room = await service.joinRoom({ userId: 'p2', roomCode: 'abc123' });

  assert.equal(room.code, 'ABC123');
  assert.equal(room.players.length, 2);
  assert.ok(room.players.some((p) => p.id === 'p2'));
});

test('join room full conflict', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 2 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

  await expectError(service.joinRoom({ userId: 'p3', roomCode: 'ABC123' }), 'ROOM_FULL');
});

test('host start success', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

  const room = await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  assert.equal(room.status, 'in_progress');
  assert.equal(room.currentQuestionIndex, 0);
  assert.ok(room.currentQuestion);
  assert.equal(room.currentQuestion?.questionNumber, 1);
});

test('non-host start forbidden', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

  await expectError(service.startRoom({ userId: 'p2', roomCode: 'ABC123' }), 'NOT_HOST');
});

test('submit answer success', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  const before = await service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  const question = before.currentQuestion;
  assert.ok(question);

  await service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });

  const after = await service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  const host = after.players.find((p) => p.id === 'host');
  assert.ok(host);
  assert.equal(host.hasAnswered, true);
  assert.equal(host.score, 1);
  assert.equal(host.correctAnswers, 1);
});

test('duplicate answer conflict', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  const room = await service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  const question = room.currentQuestion;
  assert.ok(question);

  await service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });

  await expectError(
    service.submitAnswer({
      userId: 'host',
      roomCode: 'ABC123',
      questionId: question.id,
      answerId: question.answers[0].id,
    }),
    'ANSWER_ALREADY_SUBMITTED',
  );
});

test('lazy timer advance: deadline expiry transitions to question_result on next read', async () => {
  const ctx = createService({
    questionCount: 2,
    questionTimerSeconds: 20,
    questionResultDelayMs: 5000,
  });

  await ctx.service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await ctx.service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await ctx.service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  // Advance virtual clock past the question timer.
  ctx.advance(21_000);

  const room = await ctx.service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  assert.equal(room.status, 'question_result');
});

test('lazy timer advance: result delay expiry transitions to next question', async () => {
  const ctx = createService({
    questionCount: 2,
    questionTimerSeconds: 20,
    questionResultDelayMs: 5000,
  });

  await ctx.service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await ctx.service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await ctx.service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  // Past question timer + result delay
  ctx.advance(20_000 + 5_001);

  const room = await ctx.service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  assert.equal(room.currentQuestionIndex, 1);
  assert.equal(room.status, 'in_progress');
});

test('all-answered immediately advances to question_result', async () => {
  const { service } = createService({
    questionCount: 2,
    questionTimerSeconds: 20,
    questionResultDelayMs: 2000,
  });

  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  const room = await service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  const question = room.currentQuestion;
  assert.ok(question);

  await service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });

  const last = await service.submitAnswer({
    userId: 'p2',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });

  assert.equal(last.status, 'question_result');
});

test('full game completion through lazy timer', async () => {
  const ctx = createService({
    questionCount: 2,
    questionTimerSeconds: 20,
    questionResultDelayMs: 2000,
  });

  await ctx.service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await ctx.service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await ctx.service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  // Q1: both answer correctly → question_result → result delay → Q2
  let room = await ctx.service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  let question = room.currentQuestion!;

  await ctx.service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });
  await ctx.service.submitAnswer({
    userId: 'p2',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[1].id,
  });

  ctx.advance(2_001);
  room = await ctx.service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  assert.equal(room.currentQuestionIndex, 1);
  assert.equal(room.status, 'in_progress');

  question = room.currentQuestion!;
  await ctx.service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });
  await ctx.service.submitAnswer({
    userId: 'p2',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[1].id,
  });

  // After last question we go straight to finished (no result delay needed)
  room = await ctx.service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  assert.equal(room.status, 'finished');

  const results = await ctx.service.getResults({ userId: 'host', roomCode: 'ABC123' });
  assert.equal(results[0].playerId, 'host');
  assert.equal(results[0].score, 2);
  assert.equal(results[1].playerId, 'p2');
  assert.equal(results[1].score, 0);
});

test('no mid-game new join', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  await expectError(service.joinRoom({ userId: 'p3', roomCode: 'ABC123' }), 'ROOM_ALREADY_STARTED');
});

test('reconnect existing player allowed', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });
  await service.leaveRoom({ userId: 'p2', roomCode: 'ABC123' });

  await service.joinRoom({ userId: 'p2', roomCode: 'abc123' });

  const room = await service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  const playerTwo = room.players.find((p) => p.id === 'p2');
  assert.ok(playerTwo);
  assert.equal(playerTwo.isConnected, true);
});

test('player offline after heartbeat timeout', async () => {
  const ctx = createService();
  await ctx.service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await ctx.service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

  ctx.advance(60_000); // > 30s offline threshold

  // Fetching the snapshot from host's perspective marks p2 as offline
  const room = await ctx.service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  const p2 = room.players.find((p) => p.id === 'p2');
  assert.ok(p2);
  assert.equal(p2.isConnected, false);
});

test('leaving lobby host transfers ownership', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

  await service.leaveRoom({ userId: 'host', roomCode: 'ABC123' });

  const room = await service.getRoom({ userId: 'p2', roomCode: 'ABC123' });
  assert.equal(room.hostUserId, 'p2');
  assert.equal(room.players.length, 1);
  assert.equal(room.players[0].isHost, true);
});

test('integration flow: create join start finish results', async () => {
  const ctx = createService({
    questionCount: 2,
    questionTimerSeconds: 20,
    questionResultDelayMs: 1000,
  });

  const created = await ctx.service.createRoom({
    userId: 'host',
    quizId: 'quiz-1',
    maxPlayers: 4,
  });

  const joined = await ctx.service.joinRoom({ userId: 'p2', roomCode: created.code });
  assert.equal(joined.players.length, 2);

  const started = await ctx.service.startRoom({ userId: 'host', roomCode: created.code });
  assert.equal(started.status, 'in_progress');

  for (let index = 0; index < 2; index += 1) {
    const room = await ctx.service.getRoom({ userId: 'host', roomCode: created.code });
    const question = room.currentQuestion!;

    await ctx.service.submitAnswer({
      userId: 'host',
      roomCode: created.code,
      questionId: question.id,
      answerId: question.answers[0].id,
    });

    await ctx.service.submitAnswer({
      userId: 'p2',
      roomCode: created.code,
      questionId: question.id,
      answerId: question.answers[0].id,
    });

    if (index === 0) {
      ctx.advance(1_001);
    }
  }

  const finalRoom = await ctx.service.getRoom({ userId: 'host', roomCode: created.code });
  assert.equal(finalRoom.status, 'finished');

  const results = await ctx.service.getResults({ userId: 'host', roomCode: created.code });
  assert.equal(results.length, 2);
  assert.equal(results[0].score, 2);
  assert.equal(results[1].score, 2);
});

test('concurrency: parallel joins both succeed when there is room', async () => {
  const { service } = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });

  const [r1, r2] = await Promise.all([
    service.joinRoom({ userId: 'p2', roomCode: 'ABC123' }),
    service.joinRoom({ userId: 'p3', roomCode: 'ABC123' }),
  ]);

  // Both responses should reflect the eventual state, but the player
  // returned in either may not include both yet. Pick the one with more
  // players to verify final consistency.
  const final = await service.getRoom({ userId: 'host', roomCode: 'ABC123' });
  assert.equal(final.players.length, 3);
  assert.ok(final.players.some((p) => p.id === 'p2'));
  assert.ok(final.players.some((p) => p.id === 'p3'));

  // Both should at least mention the room
  assert.equal(r1.code, 'ABC123');
  assert.equal(r2.code, 'ABC123');
});
