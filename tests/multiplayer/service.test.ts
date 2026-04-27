import assert from 'node:assert/strict';
import test from 'node:test';
import { MultiplayerError } from '@/lib/multiplayer/errors';
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
  private readonly users: Record<string, string>;
  private readonly quizzes: Record<string, ProviderQuizSnapshot>;

  constructor(users: Record<string, string>, quizzes: Record<string, ProviderQuizSnapshot>) {
    this.users = users;
    this.quizzes = quizzes;
  }

  async getUserDisplayName(userId: string): Promise<string | null> {
    return this.users[userId] ?? null;
  }

  async getQuizSnapshot(quizId: string): Promise<ProviderQuizSnapshot | null> {
    const quiz = this.quizzes[quizId];
    if (!quiz) {
      return null;
    }

    return {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        text: question.text,
        bibleReference: question.bibleReference,
        correctAnswerId: question.correctAnswerId,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
        })),
      })),
    };
  }
}

function buildQuestions(questionCount: number): ImmutableQuestion[] {
  const questions: ImmutableQuestion[] = [];

  for (let index = 0; index < questionCount; index += 1) {
    const answerA: ImmutableAnswer = {
      id: `q${index + 1}-a1`,
      text: `Answer A${index + 1}`,
    };

    const answerB: ImmutableAnswer = {
      id: `q${index + 1}-a2`,
      text: `Answer B${index + 1}`,
    };

    questions.push({
      id: `q${index + 1}`,
      text: `Question ${index + 1}`,
      bibleReference: `Reference ${index + 1}`,
      answers: [answerA, answerB],
      correctAnswerId: answerA.id,
    });
  }

  return questions;
}

function createService(options?: {
  questionCount?: number;
  questionTimerSeconds?: number;
  questionResultDelayMs?: number;
}): MultiplayerService {
  const questionCount = options?.questionCount ?? 3;
  const questionTimerSeconds = options?.questionTimerSeconds ?? 20;
  const questionResultDelayMs = options?.questionResultDelayMs ?? 2000;

  const quiz: ProviderQuizSnapshot = {
    id: 'quiz-1',
    title: 'Test Quiz',
    questions: buildQuestions(questionCount),
  };

  return new MultiplayerService({
    provider: new FakeProvider(USERS, {
      [quiz.id]: quiz,
    }),
    config: {
      questionTimerSeconds,
      questionResultDelayMs,
      createRoomCode: () => 'ABC123',
      createRoomId: () => 'room-1',
    },
  });
}

async function expectError(promise: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    return error instanceof MultiplayerError && error.code === code;
  });
}

async function waitForCondition(
  condition: () => boolean,
  timeoutMs = 1000,
  stepMs = 10,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    if (condition()) {
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, stepMs);
    });
  }

  throw new Error('Timed out waiting for condition');
}

test('create room success', async () => {
  const service = createService();

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
  const service = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });

  const room = await service.joinRoom({
    userId: 'p2',
    roomCode: 'abc123',
  });

  assert.equal(room.code, 'ABC123');
  assert.equal(room.players.length, 2);
  assert.equal(room.players.some((player) => player.id === 'p2'), true);
});

test('join room full conflict', async () => {
  const service = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 2 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

  await expectError(
    service.joinRoom({ userId: 'p3', roomCode: 'ABC123' }),
    'ROOM_FULL',
  );
});

test('host start success', async () => {
  const service = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

  const room = await service.startRoom({
    userId: 'host',
    roomCode: 'ABC123',
  });

  assert.equal(room.status, 'in_progress');
  assert.equal(room.currentQuestionIndex, 0);
  assert.ok(room.currentQuestion);
  assert.equal(room.currentQuestion?.questionNumber, 1);
});

test('non-host start forbidden', async () => {
  const service = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

  await expectError(
    service.startRoom({ userId: 'p2', roomCode: 'ABC123' }),
    'NOT_HOST',
  );
});

test('submit answer success', async () => {
  const service = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  const before = service.getRoom('ABC123');
  const question = before.currentQuestion;
  assert.ok(question);

  await service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });

  const after = service.getRoom('ABC123');
  const host = after.players.find((player) => player.id === 'host');
  assert.ok(host);
  assert.equal(host.hasAnswered, true);
  assert.equal(host.score, 1);
  assert.equal(host.correctAnswers, 1);
});

test('duplicate answer conflict', async () => {
  const service = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  const room = service.getRoom('ABC123');
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

test('timer-based auto-advance', async () => {
  const service = createService({
    questionCount: 2,
    questionTimerSeconds: 0.05,
    questionResultDelayMs: 10,
  });

  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  await waitForCondition(() => {
    const room = service.getRoom('ABC123');
    return room.currentQuestionIndex === 1 && room.status === 'in_progress';
  }, 1000);

  const room = service.getRoom('ABC123');
  assert.equal(room.currentQuestionIndex, 1);
  assert.equal(room.status, 'in_progress');
});

test('all-answered early advance', async () => {
  const service = createService({
    questionCount: 2,
    questionTimerSeconds: 2,
    questionResultDelayMs: 10,
  });

  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  const room = service.getRoom('ABC123');
  const question = room.currentQuestion;
  assert.ok(question);

  const startedAt = Date.now();

  await service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });

  await service.submitAnswer({
    userId: 'p2',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });

  await waitForCondition(() => {
    const nextRoom = service.getRoom('ABC123');
    return nextRoom.currentQuestionIndex === 1 && nextRoom.status === 'in_progress';
  }, 1000);

  assert.ok(Date.now() - startedAt < 1000);
});

test('game completion and results ordering', async () => {
  const service = createService({
    questionCount: 2,
    questionTimerSeconds: 2,
    questionResultDelayMs: 10,
  });

  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  let room = service.getRoom('ABC123');
  let question = room.currentQuestion;
  assert.ok(question);

  await service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });
  await service.submitAnswer({
    userId: 'p2',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[1].id,
  });

  await waitForCondition(() => {
    const nextRoom = service.getRoom('ABC123');
    return nextRoom.currentQuestionIndex === 1 && nextRoom.status === 'in_progress';
  }, 1000);

  room = service.getRoom('ABC123');
  question = room.currentQuestion;
  assert.ok(question);

  await service.submitAnswer({
    userId: 'host',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[0].id,
  });
  await service.submitAnswer({
    userId: 'p2',
    roomCode: 'ABC123',
    questionId: question.id,
    answerId: question.answers[1].id,
  });

  await waitForCondition(() => service.getRoom('ABC123').status === 'finished', 1000);

  const results = service.getResults('ABC123');
  assert.equal(results[0].playerId, 'host');
  assert.equal(results[0].score, 2);
  assert.equal(results[1].playerId, 'p2');
  assert.equal(results[1].score, 0);
});

test('no mid-game new join', async () => {
  const service = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  await expectError(
    service.joinRoom({ userId: 'p3', roomCode: 'ABC123' }),
    'ROOM_ALREADY_STARTED',
  );
});

test('reconnect existing player allowed', async () => {
  const service = createService();
  await service.createRoom({ userId: 'host', quizId: 'quiz-1', maxPlayers: 4 });
  await service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });
  await service.startRoom({ userId: 'host', roomCode: 'ABC123' });

  await service.handleSocketDisconnect({
    userId: 'p2',
    roomCode: 'ABC123',
  });

  await service.joinRoom({
    userId: 'p2',
    roomCode: 'abc123',
  });

  const room = service.getRoom('ABC123');
  const playerTwo = room.players.find((player) => player.id === 'p2');
  assert.ok(playerTwo);
  assert.equal(playerTwo.isConnected, true);
});

test('integration flow: create join start finish results', async () => {
  const service = createService({
    questionCount: 2,
    questionTimerSeconds: 2,
    questionResultDelayMs: 10,
  });

  const created = await service.createRoom({
    userId: 'host',
    quizId: 'quiz-1',
    maxPlayers: 4,
  });

  const joined = await service.joinRoom({
    userId: 'p2',
    roomCode: created.code,
  });

  assert.equal(joined.players.length, 2);

  const started = await service.startRoom({
    userId: 'host',
    roomCode: created.code,
  });

  assert.equal(started.status, 'in_progress');

  for (let index = 0; index < 2; index += 1) {
    const room = service.getRoom(created.code);
    const question = room.currentQuestion;
    assert.ok(question);

    await service.submitAnswer({
      userId: 'host',
      roomCode: created.code,
      questionId: question.id,
      answerId: question.answers[0].id,
    });

    await service.submitAnswer({
      userId: 'p2',
      roomCode: created.code,
      questionId: question.id,
      answerId: question.answers[0].id,
    });

    if (index === 0) {
      await waitForCondition(() => {
        const updatedRoom = service.getRoom(created.code);
        return updatedRoom.currentQuestionIndex === 1 && updatedRoom.status === 'in_progress';
      }, 1000);
    }
  }

  await waitForCondition(() => service.getRoom(created.code).status === 'finished', 1000);

  const results = service.getResults(created.code);
  assert.equal(results.length, 2);
  assert.equal(results[0].score, 2);
  assert.equal(results[1].score, 2);
});
