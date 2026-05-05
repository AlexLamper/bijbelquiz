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

async function waitFor(predicate: () => boolean, timeoutMs = 1500): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    if (predicate()) {
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('waitFor predicate not satisfied within timeout');
}

test('websocket: server-side auto-join + client join_room should produce a single room_joined', async () => {
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

    try {
      // Wait for the auto-join's room_joined.
      await waitForEvent(hostClient.events, 'room_joined');

      // Client emulation: send an explicit join_room (which the realtime client
      // does on socket open) — server must dedupe and NOT produce a second
      // room_joined event for the same socket/room.
      hostClient.socket.send(
        JSON.stringify({ type: 'join_room', payload: { roomCode: 'ABC123' } }),
      );

      // Give the server time to process the duplicate.
      await new Promise<void>((resolve) => setTimeout(resolve, 200));

      const extraJoins = hostClient.events.filter((event) => event.type === 'room_joined');
      assert.equal(extraJoins.length, 0, 'duplicate join_room must not produce a second room_joined');
    } finally {
      hostClient.socket.close();
    }
  } finally {
    await closeServer(context.server, context.wsServer);
  }
});

test('websocket: idle connection survives without spontaneous close', async () => {
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

    let closeEvent: { code: number; reason: string } | null = null;
    hostClient.socket.on('close', (code, reason) => {
      closeEvent = { code, reason: reason.toString('utf8') };
    });

    try {
      await waitForEvent(hostClient.events, 'room_joined');

      // Wait long enough that any premature server timeout would have fired.
      await new Promise<void>((resolve) => setTimeout(resolve, 750));

      assert.equal(hostClient.socket.readyState, WebSocket.OPEN, 'socket should remain open while idle');
      assert.equal(closeEvent, null, `expected no close event, got ${JSON.stringify(closeEvent)}`);
    } finally {
      hostClient.socket.close();
    }
  } finally {
    await closeServer(context.server, context.wsServer);
  }
});

test('websocket: rapid reconnect from same user works without errors', async () => {
  const context = await setupWsContext();

  try {
    await context.service.createRoom({
      userId: 'host',
      quizId: 'quiz-1',
      maxPlayers: 4,
    });

    const hostToken = issueToken('host');
    const url = `ws://127.0.0.1:${context.port}/api/mobile/multiplayer/ws?roomCode=ABC123&token=${encodeURIComponent(hostToken)}`;

    for (let attempt = 0; attempt < 4; attempt++) {
      const client = await connectClient(url);
      try {
        const payload = await waitForEvent(client.events, 'room_joined');
        assert.ok(payload.room, `attempt ${attempt}: room_joined payload should include room`);
      } finally {
        client.socket.close();
        // Wait for the server to finish handling close before next attempt.
        await waitFor(() => client.socket.readyState === WebSocket.CLOSED, 1500);
      }
    }
  } finally {
    await closeServer(context.server, context.wsServer);
  }
});

test('websocket: abrupt client terminate triggers single player_left broadcast', async () => {
  const context = await setupWsContext();

  try {
    await context.service.createRoom({
      userId: 'host',
      quizId: 'quiz-1',
      maxPlayers: 4,
    });
    await context.service.joinRoom({ userId: 'p2', roomCode: 'ABC123' });

    const hostToken = issueToken('host');
    const p2Token = issueToken('p2');
    const baseUrl = `ws://127.0.0.1:${context.port}/api/mobile/multiplayer/ws?roomCode=ABC123`;

    const hostClient = await connectClient(`${baseUrl}&token=${encodeURIComponent(hostToken)}`);
    const p2Client = await connectClient(`${baseUrl}&token=${encodeURIComponent(p2Token)}`);

    try {
      await waitForEvent(hostClient.events, 'room_joined');
      await waitForEvent(p2Client.events, 'room_joined');

      // Drain anything produced by the join handshake.
      hostClient.events.length = 0;

      // Simulate abrupt browser close by terminating the underlying socket.
      p2Client.socket.terminate();

      const playerLeftPayload = await waitForEvent(hostClient.events, 'player_left', 2000);
      assert.equal(playerLeftPayload.roomCode, 'ABC123');
    } finally {
      hostClient.socket.close();
      try { p2Client.socket.close(); } catch { /* already terminated */ }
    }
  } finally {
    await closeServer(context.server, context.wsServer);
  }
});

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
