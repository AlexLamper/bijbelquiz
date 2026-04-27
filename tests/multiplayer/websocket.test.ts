import assert from 'node:assert/strict';
import { createServer, IncomingMessage, Server } from 'node:http';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyMultiplayerToken } from '@/lib/multiplayer/auth';
import { MultiplayerService } from '@/lib/multiplayer/service';
import {
  ImmutableAnswer,
  ImmutableQuestion,
  MultiplayerDataProvider,
  ProviderQuizSnapshot,
} from '@/lib/multiplayer/types';
import { MultiplayerWsHub } from '@/lib/multiplayer/ws-hub';

const USERS: Record<string, string> = {
  host: 'Host',
  p2: 'Player Two',
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

interface WsTestContext {
  service: MultiplayerService;
  server: Server;
  wsServer: WebSocketServer;
  port: number;
}

interface MultiplayerUpgradeRequest extends IncomingMessage {
  multiplayerUserId?: string;
  multiplayerRoomCode?: string | null;
}

function buildQuiz(): ProviderQuizSnapshot {
  const answerA: ImmutableAnswer = { id: 'q1-a1', text: 'A1' };
  const answerB: ImmutableAnswer = { id: 'q1-a2', text: 'A2' };

  const question: ImmutableQuestion = {
    id: 'q1',
    text: 'Question 1',
    bibleReference: 'Reference 1',
    answers: [answerA, answerB],
    correctAnswerId: answerA.id,
  };

  return {
    id: 'quiz-1',
    title: 'Test Quiz',
    questions: [question],
  };
}

function issueToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'test-secret';
  return jwt.sign({ userId }, secret, { expiresIn: '1h' });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

async function setupWsContext(): Promise<WsTestContext> {
  process.env.NEXTAUTH_SECRET = 'test-secret';

  const quiz = buildQuiz();
  const service = new MultiplayerService({
    provider: new FakeProvider(USERS, {
      [quiz.id]: quiz,
    }),
    config: {
      questionTimerSeconds: 10,
      questionResultDelayMs: 10,
      createRoomCode: () => 'ABC123',
      createRoomId: () => 'room-1',
    },
  });

  const hub = new MultiplayerWsHub(service);
  const server = createServer((_req, res) => {
    res.statusCode = 404;
    res.end('Not Found');
  });

  const wsServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    void (async () => {
      const req = request as MultiplayerUpgradeRequest;
      const url = new URL(req.url || '/', 'http://127.0.0.1');

      if (url.pathname !== '/api/mobile/multiplayer/ws') {
        socket.destroy();
        return;
      }

      const token = url.searchParams.get('token');
      const roomCode = url.searchParams.get('roomCode');
      const auth = await verifyMultiplayerToken(token);

      req.multiplayerUserId = auth.userId;
      req.multiplayerRoomCode = roomCode ? roomCode.toUpperCase() : null;

      wsServer.handleUpgrade(req, socket, head, (websocket) => {
        wsServer.emit('connection', websocket, req);
      });
    })().catch(() => {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    });
  });

  wsServer.on('connection', (socket, request) => {
    const req = request as MultiplayerUpgradeRequest;
    if (!req.multiplayerUserId) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    hub.attachConnection(socket, req.multiplayerUserId, req.multiplayerRoomCode ?? null);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve test server port');
  }

  return {
    service,
    server,
    wsServer,
    port: address.port,
  };
}

interface BufferedSocket {
  socket: WebSocket;
  events: Array<{ type: string; payload: Record<string, unknown> }>;
}

async function connectClient(url: string): Promise<BufferedSocket> {
  return new Promise<BufferedSocket>((resolve, reject) => {
    const socket = new WebSocket(url);
    const events: Array<{ type: string; payload: Record<string, unknown> }> = [];

    socket.on('message', (rawData) => {
      const text = typeof rawData === 'string' ? rawData : rawData.toString('utf8');

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return;
      }

      const envelope = asRecord(parsed);
      if (!envelope) {
        return;
      }

      if (typeof envelope.type !== 'string') {
        return;
      }

      const payload = asRecord(envelope.payload) ?? {};
      events.push({
        type: envelope.type,
        payload,
      });
    });

    socket.once('open', () => resolve({ socket, events }));
    socket.once('error', (error) => reject(error));
  });
}

async function closeServer(server: Server, wsServer: WebSocketServer): Promise<void> {
  await new Promise<void>((resolve) => {
    wsServer.close(() => resolve());
  });

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function waitForEvent(
  events: Array<{ type: string; payload: Record<string, unknown> }>,
  expectedType: string,
  timeoutMs = 1500,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const eventIndex = events.findIndex((event) => event.type === expectedType);
    if (eventIndex !== -1) {
      const [matchedEvent] = events.splice(eventIndex, 1);
      return matchedEvent.payload;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 10);
    });
  }

  throw new Error(`Timed out waiting for event ${expectedType}`);
}

test('websocket events contract: room_joined, player_joined, progress_updated, game_finished', async () => {
  const context = await setupWsContext();

  try {
    await context.service.createRoom({
      userId: 'host',
      quizId: 'quiz-1',
      maxPlayers: 4,
    });

    const hostToken = issueToken('host');
    const hostClient = await connectClient(
      `ws://127.0.0.1:${context.port}/api/mobile/multiplayer/ws?roomCode=ABC123&token=${encodeURIComponent(hostToken)}`,
    );
    const hostSocket = hostClient.socket;

    try {
      const roomJoinedPayload = await waitForEvent(hostClient.events, 'room_joined');
      assert.ok(roomJoinedPayload.room);

      const playerJoinedPromise = waitForEvent(hostClient.events, 'player_joined');
      await context.service.joinRoom({
        userId: 'p2',
        roomCode: 'ABC123',
      });
      const playerJoinedPayload = await playerJoinedPromise;
      assert.equal(playerJoinedPayload.roomCode, 'ABC123');

      await context.service.startRoom({
        userId: 'host',
        roomCode: 'ABC123',
      });

      const room = context.service.getRoom('ABC123');
      const question = room.currentQuestion;
      assert.ok(question);

      const progressPromise = waitForEvent(hostClient.events, 'progress_updated');
      await context.service.submitAnswer({
        userId: 'host',
        roomCode: 'ABC123',
        questionId: question.id,
        answerId: question.answers[0].id,
      });
      const progressPayload = await progressPromise;
      assert.equal(progressPayload.roomCode, 'ABC123');

      const gameFinishedPromise = waitForEvent(hostClient.events, 'game_finished');
      await context.service.submitAnswer({
        userId: 'p2',
        roomCode: 'ABC123',
        questionId: question.id,
        answerId: question.answers[0].id,
      });
      const gameFinishedPayload = await gameFinishedPromise;
      assert.ok(Array.isArray(gameFinishedPayload.results));
    } finally {
      hostSocket.close();
    }
  } finally {
    await closeServer(context.server, context.wsServer);
  }
});
