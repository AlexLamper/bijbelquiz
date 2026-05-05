import assert from 'node:assert/strict';
import test from 'node:test';
import type { RoomSnapshot } from '@/lib/multiplayer/types';
import type { MultiplayerConnectionStatus, MultiplayerWsInboundEvent } from '@/lib/multiplayer-web/contracts';
import { MultiplayerRealtimeClient } from '@/lib/multiplayer-web/realtime';

/**
 * Minimal WebSocket mock mirroring the parts of the browser API the realtime
 * client uses. Tests drive the lifecycle (open, message, close) deterministically.
 */
class MockWebSocket {
  static CONNECTING = 0 as const;
  static OPEN = 1 as const;
  static CLOSING = 2 as const;
  static CLOSED = 3 as const;

  static instances: MockWebSocket[] = [];

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: ((event: { code: number; reason: string; wasClean: boolean }) => void) | null = null;

  sentMessages: string[] = [];
  closedBy: 'manual' | 'remote' | null = null;
  closeCalls: Array<{ code?: number; reason?: string }> = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closeCalls.push({ code, reason });
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.closedBy = 'manual';
    const wasOpen = this.readyState === MockWebSocket.OPEN;
    this.readyState = MockWebSocket.CLOSED;
    if (wasOpen && this.onclose) {
      this.onclose({ code: code ?? 1000, reason: reason ?? '', wasClean: (code ?? 1000) === 1000 });
    }
  }

  triggerOpen(): void {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen({});
  }

  triggerMessage(payload: unknown): void {
    if (this.readyState !== MockWebSocket.OPEN) return;
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (this.onmessage) this.onmessage({ data });
  }

  triggerClose(code = 1006, reason = ''): void {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.closedBy = 'remote';
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ code, reason, wasClean: code === 1000 });
  }

  triggerError(): void {
    if (this.onerror) this.onerror({});
  }
}

interface GlobalsBackup {
  hadWindow: boolean;
  prevWindow: unknown;
  hadWebSocket: boolean;
  prevWebSocket: unknown;
}

function installBrowserGlobals(): GlobalsBackup {
  const g = globalThis as unknown as Record<string, unknown>;
  const backup: GlobalsBackup = {
    hadWindow: 'window' in g,
    prevWindow: g.window,
    hadWebSocket: 'WebSocket' in g,
    prevWebSocket: g.WebSocket,
  };
  g.window = {
    location: { protocol: 'http:', host: '127.0.0.1:0' },
  };
  g.WebSocket = MockWebSocket as unknown;
  return backup;
}

function restoreBrowserGlobals(backup: GlobalsBackup): void {
  const g = globalThis as unknown as Record<string, unknown>;
  if (backup.hadWindow) g.window = backup.prevWindow;
  else delete g.window;
  if (backup.hadWebSocket) g.WebSocket = backup.prevWebSocket;
  else delete g.WebSocket;
}

function buildRoomSnapshot(): RoomSnapshot {
  return {
    id: 'room-1',
    code: 'ABC123',
    quizId: 'quiz-1',
    quizTitle: 'Quiz',
    status: 'lobby',
    maxPlayers: 8,
    currentQuestionIndex: 0,
    totalQuestions: 1,
    hostUserId: 'u1',
    players: [
      {
        id: 'u1',
        name: 'Alice',
        isHost: true,
        isConnected: true,
        score: 0,
        correctAnswers: 0,
        hasAnswered: false,
      },
    ],
    currentQuestion: null,
  } satisfies RoomSnapshot;
}

interface TrackedClient {
  client: MultiplayerRealtimeClient;
  events: MultiplayerWsInboundEvent[];
  statuses: MultiplayerConnectionStatus[];
  errors: Error[];
  snapshots: RoomSnapshot[];
}

function buildClient(overrides: Partial<{ snapshotProvider: () => Promise<RoomSnapshot> }> = {}): TrackedClient {
  const events: MultiplayerWsInboundEvent[] = [];
  const statuses: MultiplayerConnectionStatus[] = [];
  const errors: Error[] = [];
  const snapshots: RoomSnapshot[] = [];

  const client = new MultiplayerRealtimeClient({
    token: 'test-token',
    roomCode: 'ABC123',
    keepalivePingIntervalMs: 60_000,
    snapshotFallbackIntervalMs: 60_000,
    reconnectMinDelayMs: 5,
    reconnectMaxDelayMs: 5,
    getSnapshot: overrides.snapshotProvider ?? (() => Promise.resolve(buildRoomSnapshot())),
    onSnapshot: (room) => snapshots.push(room),
    onEvent: (event) => events.push(event),
    onConnectionStatus: (status) => statuses.push(status),
    onError: (error) => errors.push(error),
  });

  return { client, events, statuses, errors, snapshots };
}

async function flushMicrotasks(times = 4): Promise<void> {
  for (let i = 0; i < times; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

test.beforeEach(() => {
  MockWebSocket.instances.length = 0;
});

async function withClient(
  fn: (tracked: TrackedClient) => Promise<void>,
  options: Partial<{ snapshotProvider: () => Promise<RoomSnapshot> }> = {},
): Promise<void> {
  const backup = installBrowserGlobals();
  const tracked = buildClient(options);
  try {
    await fn(tracked);
  } finally {
    try {
      tracked.client.disconnect();
    } catch {
      // already disposed
    }
    restoreBrowserGlobals(backup);
  }
}

test('realtime client: opens socket and sends join_room on open', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();

    assert.equal(MockWebSocket.instances.length, 1, 'one socket should be created');
    const socket = MockWebSocket.instances[0];
    socket.triggerOpen();
    await flushMicrotasks();

    assert.deepEqual(JSON.parse(socket.sentMessages[0]), {
      type: 'join_room',
      payload: { roomCode: 'ABC123' },
    });
    assert.ok(tracked.statuses.includes('connected'));
  });
});

test('realtime client: idempotent connect() does not open a second socket while connected', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();
    const first = MockWebSocket.instances[0];
    first.triggerOpen();
    await flushMicrotasks();

    tracked.client.connect();
    tracked.client.connect();

    assert.equal(MockWebSocket.instances.length, 1, 'extra connect() calls must not open new sockets');
  });
});

test('realtime client: real abnormal close triggers exactly one reconnect attempt', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();
    const first = MockWebSocket.instances[0];
    first.triggerOpen();
    await flushMicrotasks();

    first.triggerClose(1006, 'simulated_abnormal');

    const deadline = Date.now() + 600;
    while (MockWebSocket.instances.length < 2 && Date.now() < deadline) {
      await new Promise<void>((resolve) => setTimeout(resolve, 20));
    }

    assert.equal(MockWebSocket.instances.length, 2, 'should reconnect exactly once');
    const second = MockWebSocket.instances[1];
    second.triggerOpen();
    await flushMicrotasks();

    assert.equal(second.sentMessages.length, 1, 'second socket should re-send join_room');
    assert.deepEqual(JSON.parse(second.sentMessages[0]).type, 'join_room');
  });
});

test('realtime client: disconnect prevents further reconnect after close fires', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();
    const first = MockWebSocket.instances[0];
    first.triggerOpen();
    await flushMicrotasks();

    tracked.client.disconnect();
    assert.equal(first.readyState, MockWebSocket.CLOSED);

    // Even if a stray close arrives later it must not reconnect.
    first.triggerClose(1006);
    await new Promise<void>((resolve) => setTimeout(resolve, 400));

    assert.equal(MockWebSocket.instances.length, 1, 'no reconnect should happen after disconnect');
    assert.equal(tracked.statuses[tracked.statuses.length - 1], 'disconnected');
  });
});

test('realtime client: disconnect on a CONNECTING socket defers close to onopen (avoids 1006)', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();
    const socket = MockWebSocket.instances[0];
    assert.equal(socket.readyState, MockWebSocket.CONNECTING);

    // Disconnect BEFORE the socket finishes its handshake. The new client
    // must NOT call ws.close() while CONNECTING — that would TCP-RST and
    // surface as 1006. Instead, the close should be deferred to onopen.
    tracked.client.disconnect();

    assert.equal(socket.closeCalls.length, 0, 'close() must not be called on a CONNECTING socket');

    // Now simulate the handshake completing late (server got there first).
    socket.triggerOpen();
    await flushMicrotasks();

    // Either we close on the late open, or the socket is left to time out;
    // either is acceptable as long as it didn't 1006 the connection.
    // What we DO require: no further reconnect attempts.
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    assert.equal(MockWebSocket.instances.length, 1, 'no reconnect after disconnect-while-CONNECTING');
  });
});

test('realtime client: parses and forwards inbound room_joined event', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();
    const socket = MockWebSocket.instances[0];
    socket.triggerOpen();
    await flushMicrotasks();

    socket.triggerMessage({
      type: 'room_joined',
      payload: { room: buildRoomSnapshot() },
    });
    await flushMicrotasks();

    assert.equal(tracked.events.length, 1);
    assert.equal(tracked.events[0].type, 'room_joined');
  });
});

test('realtime client: rapid abnormal close → reconnect cycles do not accumulate sockets', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();
    const cycles = 5;
    for (let i = 0; i < cycles; i++) {
      const socket = MockWebSocket.instances[MockWebSocket.instances.length - 1];
      socket.triggerOpen();
      await flushMicrotasks();
      socket.triggerClose(1006, `cycle_${i}`);

      const targetCount = MockWebSocket.instances.length + 1;
      const deadline = Date.now() + 600;
      while (MockWebSocket.instances.length < targetCount && Date.now() < deadline) {
        await new Promise<void>((resolve) => setTimeout(resolve, 20));
      }
    }

    // One new socket per cycle plus the original.
    assert.equal(MockWebSocket.instances.length, cycles + 1, 'one new socket per close cycle');
  });
});
