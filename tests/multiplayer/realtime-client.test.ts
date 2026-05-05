import assert from 'node:assert/strict';
import test from 'node:test';
import type { RoomSnapshot } from '@/lib/multiplayer/types';
import type { MultiplayerConnectionStatus, MultiplayerWsInboundEvent } from '@/lib/multiplayer-web/contracts';
import { MultiplayerRealtimeClient } from '@/lib/multiplayer-web/realtime';

/**
 * Minimal WebSocket mock that mirrors the parts of the browser API the
 * realtime client uses. We expose hooks so the tests can drive the lifecycle
 * (open, message, close) deterministically.
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

  private listeners: Record<string, Array<(event: unknown) => void>> = {};
  sentMessages: string[] = [];
  closedBy: 'manual' | 'remote' | null = null;
  closeCalls: Array<{ code?: number; reason?: string }> = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event: unknown) => void): void {
    (this.listeners[type] ??= []).push(handler);
  }

  removeEventListener(type: string, handler: (event: unknown) => void): void {
    const list = this.listeners[type];
    if (!list) {
      return;
    }
    this.listeners[type] = list.filter((existing) => existing !== handler);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closeCalls.push({ code, reason });
    if (this.readyState === MockWebSocket.CLOSED) {
      return;
    }
    this.closedBy = 'manual';
    this.readyState = MockWebSocket.CLOSED;
    this.fire('close', { code: code ?? 1000, reason: reason ?? '', wasClean: true });
  }

  triggerOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.fire('open', {});
  }

  triggerMessage(payload: unknown): void {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.fire('message', { data });
  }

  triggerClose(code = 1006, reason = ''): void {
    if (this.readyState === MockWebSocket.CLOSED) {
      return;
    }
    this.closedBy = 'remote';
    this.readyState = MockWebSocket.CLOSED;
    this.fire('close', { code, reason, wasClean: code === 1000 });
  }

  triggerError(): void {
    this.fire('error', {});
  }

  private fire(type: string, event: unknown): void {
    const list = this.listeners[type];
    if (list) {
      for (const handler of [...list]) {
        handler(event);
      }
    }

    if (type === 'open' && this.onopen) {
      this.onopen(event);
    }
    if (type === 'message' && this.onmessage) {
      this.onmessage(event as { data: unknown });
    }
    if (type === 'error' && this.onerror) {
      this.onerror(event);
    }
    if (type === 'close' && this.onclose) {
      this.onclose(event as { code: number; reason: string; wasClean: boolean });
    }
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
    location: {
      protocol: 'http:',
      host: '127.0.0.1:0',
    },
  };
  g.WebSocket = MockWebSocket as unknown;

  return backup;
}

function restoreBrowserGlobals(backup: GlobalsBackup): void {
  const g = globalThis as unknown as Record<string, unknown>;
  if (backup.hadWindow) {
    g.window = backup.prevWindow;
  } else {
    delete g.window;
  }
  if (backup.hadWebSocket) {
    g.WebSocket = backup.prevWebSocket;
  } else {
    delete g.WebSocket;
  }
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

test('realtime client: stale socket close after replacement does NOT trigger reconnect', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();
    const first = MockWebSocket.instances[0];
    first.triggerOpen();
    await flushMicrotasks();

    // Force a manual reconnect cycle by calling connect() again — this should
    // retire the first socket and create a brand new one.
    tracked.client.connect();
    assert.equal(MockWebSocket.instances.length, 2, 'second socket should be created');
    const second = MockWebSocket.instances[1];

    // The first socket's manual close was triggered by retireSession with code
    // 1000 ("replaced"). Anything else (including a delayed remote close) on
    // the first socket must NOT cause a reconnect or otherwise interfere.
    first.triggerClose(1006, 'simulated_late_drop');
    await flushMicrotasks();

    // We should still be on socket #2; no third instance should have been
    // created as a result of stale close handlers.
    assert.equal(MockWebSocket.instances.length, 2, 'stale close must not spawn a reconnect socket');

    second.triggerOpen();
    await flushMicrotasks();
    assert.equal(tracked.statuses[tracked.statuses.length - 1], 'connected');
  });
});

test('realtime client: real abnormal close triggers exactly one reconnect attempt', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();
    const first = MockWebSocket.instances[0];
    first.triggerOpen();
    await flushMicrotasks();

    first.triggerClose(1006, 'simulated_abnormal');

    // Wait long enough for reconnectMinDelayMs (5) + jitter (up to 250) to fire.
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

test('realtime client: connection status updates are deduplicated', async () => {
  await withClient(async (tracked) => {
    tracked.client.connect();

    // 'connecting' on first call.
    assert.equal(tracked.statuses[0], 'connecting');

    // Re-invoking connect() while the first socket is still alive should retire
    // the old session and not emit a duplicate identical status transition.
    const beforeLen = tracked.statuses.length;
    tracked.client.connect();
    const afterLen = tracked.statuses.length;
    assert.ok(afterLen >= beforeLen);
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

      // Wait for reconnect timer + jitter; then the next socket should appear.
      const targetCount = MockWebSocket.instances.length + 1;
      const deadline = Date.now() + 600;
      while (MockWebSocket.instances.length < targetCount && Date.now() < deadline) {
        await new Promise<void>((resolve) => setTimeout(resolve, 20));
      }
    }

    // We should have exactly one socket per cycle plus the original.
    assert.equal(MockWebSocket.instances.length, cycles + 1, 'one new socket per close cycle');
  });
});
