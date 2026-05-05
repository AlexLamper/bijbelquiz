import type { RoomSnapshot } from '@/lib/multiplayer/types';
import type { MultiplayerConnectionStatus, MultiplayerWsInboundEvent, MultiplayerWsOutboundCommand } from './contracts';
import { parseWsEvent } from './mappers';

/**
 * MultiplayerRealtimeClient — minimal, predictable WebSocket client.
 *
 * Design goals:
 *  - Every public method is safe to call multiple times (idempotent).
 *  - Once `dispose()` is called, the client never opens another socket again.
 *  - Stale sockets cannot mutate observable state because every internal
 *    callback first checks the current `phase`.
 *  - Closing a socket that is still in CONNECTING is handled by deferring the
 *    close to the `open` event — calling `ws.close()` while CONNECTING aborts
 *    the TCP handshake with an RST, which the server observes as code 1006.
 */

type MultiplayerRealtimeDebugLevel = 'info' | 'warn' | 'error';

export interface MultiplayerRealtimeDebugEntry {
  timestamp: string;
  level: MultiplayerRealtimeDebugLevel;
  message: string;
  details?: Record<string, unknown>;
}

interface MultiplayerRealtimeOptions {
  token: string;
  roomCode: string;
  /** Polling cadence (ms) when the WebSocket is offline. Default 3000. */
  snapshotFallbackIntervalMs?: number;
  /** Application-level keepalive cadence (ms). Default 20000. */
  keepalivePingIntervalMs?: number;
  /** Reconnect backoff floor in ms. Default 800. */
  reconnectMinDelayMs?: number;
  /** Reconnect backoff ceiling in ms. Default 8000. */
  reconnectMaxDelayMs?: number;
  getSnapshot: () => Promise<RoomSnapshot>;
  onSnapshot: (room: RoomSnapshot) => void;
  onEvent: (event: MultiplayerWsInboundEvent) => void;
  onConnectionStatus: (status: MultiplayerConnectionStatus) => void;
  onError: (error: Error) => void;
  onDebug?: (entry: MultiplayerRealtimeDebugEntry) => void;
}

const CONNECTION_ERROR_NAME = 'MultiplayerRealtimeConnectionError';
const MESSAGE_PARSE_ERROR_NAME = 'MultiplayerRealtimeMessageParseError';
const SNAPSHOT_ERROR_NAME = 'MultiplayerSnapshotRefreshError';
const CONNECTION_ERROR_MESSAGE = 'Realtime connection error';

type Phase = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disposed';

function getWebSocketUrl(token: string, roomCode: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const query = new URLSearchParams({
    token,
    roomCode: roomCode.trim().toUpperCase(),
  });
  return `${protocol}//${window.location.host}/api/mobile/multiplayer/ws?${query.toString()}`;
}

function buildError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

function sanitizeSocketUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('token');
    if (token) {
      parsed.searchParams.set('token', `${token.slice(0, 6)}...${token.slice(-4)}`);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export class MultiplayerRealtimeClient {
  private readonly options: MultiplayerRealtimeOptions;

  private phase: Phase = 'idle';
  /**
   * The socket associated with the current phase. May be null when phase is
   * 'reconnecting' (between attempts) or 'disposed'.
   */
  private socket: WebSocket | null = null;
  /**
   * Monotonic counter used to invalidate stale socket callbacks. When connect()
   * runs we bump this, so any pending event handler from a previous socket
   * can compare its captured value against `this.openGen` and bail.
   */
  private openGen = 0;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  private reconnectAttempts = 0;
  private joinSent = false;
  private socketOpenedAt: number | null = null;
  private lastReportedStatus: MultiplayerConnectionStatus = 'idle';

  constructor(options: MultiplayerRealtimeOptions) {
    this.options = {
      snapshotFallbackIntervalMs: 3000,
      keepalivePingIntervalMs: 20_000,
      reconnectMinDelayMs: 800,
      reconnectMaxDelayMs: 8000,
      ...options,
    };
  }

  /** Begin (or resume) attempting to connect. Idempotent. */
  connect(): void {
    if (this.phase === 'disposed') {
      this.debug('warn', 'connect() called on disposed client; ignoring');
      return;
    }
    if (this.phase === 'connecting' || this.phase === 'connected') {
      this.debug('info', 'connect() called while already connecting/connected; ignoring', {
        phase: this.phase,
      });
      return;
    }

    this.openSocket();
  }

  /**
   * Permanently dispose of the client: closes the socket cleanly (or defers
   * the close until the handshake completes), stops all timers, and prevents
   * any future reconnect attempts.
   */
  disconnect(): void {
    if (this.phase === 'disposed') {
      this.debug('info', 'disconnect() called on already-disposed client; ignoring');
      return;
    }

    this.debug('info', 'Disposing realtime client', { phase: this.phase });

    const previousPhase = this.phase;
    this.phase = 'disposed';
    this.openGen += 1; // invalidate any stale handlers

    // Best-effort leave_room frame if we currently hold an open socket.
    if (previousPhase === 'connected' && this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(
          JSON.stringify({
            type: 'leave_room',
            payload: { roomCode: this.options.roomCode },
          } satisfies MultiplayerWsOutboundCommand),
        );
      } catch {
        // ignore — we are tearing down anyway
      }
    }

    this.cleanupSocket('disposed');
    this.clearReconnectTimer();
    this.stopSnapshotFallback();
    this.stopKeepalive();
    this.setStatus('disconnected');
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private setStatus(status: MultiplayerConnectionStatus): void {
    if (this.lastReportedStatus === status) return;
    this.lastReportedStatus = status;
    this.options.onConnectionStatus(status);
  }

  private debug(level: MultiplayerRealtimeDebugLevel, message: string, details?: Record<string, unknown>): void {
    this.options.onDebug?.({
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    });

    if (process.env.NODE_ENV !== 'production') {
      const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
      if (details) {
        fn(`[multiplayer-realtime] ${message}`, details);
      } else {
        fn(`[multiplayer-realtime] ${message}`);
      }
    }
  }

  private openSocket(): void {
    // Set status before constructing the socket so `connecting`/`reconnecting`
    // is reflected immediately in the UI.
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
    this.phase = this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting';
    this.joinSent = false;
    this.socketOpenedAt = null;

    // Ensure we don't have a stale socket lurking from a previous attempt.
    if (this.socket) {
      this.cleanupSocket('replaced');
    }

    // Snapshot polling kicks in only after the first failed attempt; the very
    // first connect should give the WS a clean shot at coming up.
    if (this.reconnectAttempts > 0) {
      this.startSnapshotFallback();
    }

    const gen = ++this.openGen;
    const socketUrl = getWebSocketUrl(this.options.token, this.options.roomCode);
    this.debug('info', 'Opening websocket connection', {
      url: sanitizeSocketUrl(socketUrl),
      roomCode: this.options.roomCode,
      reconnectAttempts: this.reconnectAttempts,
      gen,
    });

    let ws: WebSocket;
    try {
      ws = new WebSocket(socketUrl);
    } catch (error) {
      this.debug('error', 'Websocket constructor threw', {
        reason: error instanceof Error ? error.message : 'unknown_error',
        gen,
      });
      this.options.onError(buildError(CONNECTION_ERROR_NAME, CONNECTION_ERROR_MESSAGE));
      this.startSnapshotFallback();
      this.scheduleReconnect();
      return;
    }

    this.socket = ws;

    // Direct property assignment (not addEventListener) so that nulling the
    // properties later actually removes the handlers. With addEventListener,
    // null does nothing — you'd need a reference to the original function.
    ws.onopen = () => this.handleOpen(ws, gen);
    ws.onmessage = (event) => this.handleSocketMessage(ws, gen, event);
    ws.onerror = () => this.handleSocketError(ws, gen);
    ws.onclose = (event) => this.handleSocketClose(ws, gen, event);
  }

  private handleOpen(ws: WebSocket, gen: number): void {
    if (gen !== this.openGen) {
      this.debug('warn', 'Discarding open event from stale socket', { gen, current: this.openGen });
      // This socket was retired during connect; close cleanly now that we can.
      this.tryCleanCloseLateOpen(ws);
      return;
    }

    if (this.phase === 'disposed') {
      this.debug('warn', 'Open event arrived after disposal; closing late socket', { gen });
      this.tryCleanCloseLateOpen(ws);
      return;
    }

    this.socketOpenedAt = Date.now();
    this.reconnectAttempts = 0;
    this.phase = 'connected';

    this.debug('info', 'Websocket connection opened', {
      roomCode: this.options.roomCode,
      gen,
    });

    this.stopSnapshotFallback();
    this.setStatus('connected');
    this.startKeepalive();

    if (!this.joinSent) {
      this.joinSent = true;
      this.send({
        type: 'join_room',
        payload: { roomCode: this.options.roomCode },
      });
    }
  }

  private handleSocketMessage(ws: WebSocket, gen: number, event: MessageEvent): void {
    if (gen !== this.openGen || this.phase === 'disposed') return;
    if (ws !== this.socket) return;
    void this.handleMessage(event.data);
  }

  private handleSocketError(ws: WebSocket, gen: number): void {
    if (gen !== this.openGen || this.phase === 'disposed') return;
    if (ws !== this.socket) return;

    this.debug('warn', 'Websocket error event received', { gen });
    this.options.onError(buildError(CONNECTION_ERROR_NAME, CONNECTION_ERROR_MESSAGE));
    // The 'close' event fires immediately after; reconnect logic lives there.
  }

  private handleSocketClose(ws: WebSocket, gen: number, event: CloseEvent): void {
    const lifetimeMs = this.socketOpenedAt !== null ? Date.now() - this.socketOpenedAt : null;
    const closeType =
      event.code === 1000 ? 'clean' :
      event.code === 1001 ? 'going-away' :
      event.code === 1006 ? 'abnormal-no-close-frame' :
      'abnormal';

    this.debug('warn', 'Websocket connection closed', {
      code: event.code,
      closeType,
      reason: event.reason || null,
      wasClean: event.wasClean,
      gen,
      currentGen: this.openGen,
      phase: this.phase,
      lifetimeMs,
    });

    // Stop keepalive — it's tied to this specific socket.
    this.stopKeepalive();

    // Stale or post-disposal close events are pure cleanup.
    if (gen !== this.openGen || this.phase === 'disposed') {
      return;
    }

    // Detach from `this.socket` so subsequent calls don't operate on a closed ws.
    if (ws === this.socket) {
      this.socket = null;
    }

    this.options.onError(buildError(CONNECTION_ERROR_NAME, CONNECTION_ERROR_MESSAGE));
    this.startSnapshotFallback();
    this.scheduleReconnect();
  }

  /**
   * Close a socket that is no longer the active one (gen mismatch). If it's
   * still CONNECTING we have to defer to the open event, otherwise we'd send
   * a TCP RST instead of a close frame and the server would see code 1006.
   */
  private tryCleanCloseLateOpen(ws: WebSocket): void {
    try {
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.onopen = null;
    } catch {
      // ignore
    }
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.close(1000, 'late'); } catch { /* ignore */ }
    }
    // If readyState is CONNECTING here we've already nulled onopen, so when the
    // handshake finishes the socket will simply linger until it times out
    // server-side. That's still better than a 1006.
  }

  /**
   * Tear down the currently-tracked socket. Marks generation invalid so any
   * pending callbacks bail out, removes all listeners, and closes the socket
   * gracefully — including handling the CONNECTING-state edge case.
   */
  private cleanupSocket(reason: string): void {
    const ws = this.socket;
    if (!ws) return;

    this.socket = null;
    // Bumping gen invalidates any pending callbacks (open/message/error/close)
    // that were captured against the old gen.
    this.openGen += 1;

    if (ws.readyState === WebSocket.CONNECTING) {
      // We cannot close a CONNECTING socket without TCP RST. Strategy: let it
      // open, then close cleanly in the open handler. Because we just bumped
      // openGen the handler will go through the `gen !== this.openGen` branch
      // and call tryCleanCloseLateOpen.
      this.debug('info', 'cleanupSocket called while CONNECTING; deferring close to onopen', { reason });
      return;
    }

    try {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
    } catch {
      // ignore
    }

    if (ws.readyState === WebSocket.OPEN) {
      try { ws.close(1000, reason); } catch { /* ignore */ }
    }
  }

  private async handleMessage(data: unknown): Promise<void> {
    try {
      const parsed = await this.parseIncomingMessage(data);
      const event = parseWsEvent(parsed);
      this.debug('info', 'Received websocket event', { type: event.type });
      this.options.onEvent(event);
    } catch (error) {
      const parseError = error instanceof Error
        ? buildError(MESSAGE_PARSE_ERROR_NAME, error.message)
        : buildError(MESSAGE_PARSE_ERROR_NAME, 'Invalid websocket event payload');

      this.debug('error', 'Failed to parse websocket message', { reason: parseError.message });
      this.options.onError(parseError);
    }
  }

  private async parseIncomingMessage(data: unknown): Promise<unknown> {
    if (typeof data === 'string') return JSON.parse(data);
    if (data instanceof ArrayBuffer) {
      return JSON.parse(new TextDecoder().decode(data));
    }
    if (ArrayBuffer.isView(data)) {
      const view = data as ArrayBufferView;
      return JSON.parse(
        new TextDecoder().decode(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)),
      );
    }
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return JSON.parse(await data.text());
    }
    throw new Error('Unsupported websocket message data type');
  }

  private send(command: MultiplayerWsOutboundCommand): void {
    if (this.phase !== 'connected' || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.debug('warn', 'Skipped websocket send because socket is not open', {
        commandType: command.type,
        phase: this.phase,
        readyState: this.socket?.readyState ?? 'no_socket',
      });
      return;
    }

    try {
      this.socket.send(JSON.stringify(command));
      this.debug('info', 'Sent websocket command', {
        commandType: command.type,
        roomCode: this.options.roomCode,
      });
    } catch (error) {
      this.debug('warn', 'Websocket send failed', {
        commandType: command.type,
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.phase === 'disposed') return;

    this.phase = 'reconnecting';
    this.setStatus('reconnecting');
    this.clearReconnectTimer();

    this.reconnectAttempts += 1;
    const base = this.options.reconnectMinDelayMs ?? 800;
    const max = this.options.reconnectMaxDelayMs ?? 8000;
    const backoff = Math.min(base * 2 ** (this.reconnectAttempts - 1), max);
    const jitter = Math.floor(Math.random() * 250);
    const delayMs = backoff + jitter;

    this.debug('warn', 'Scheduling websocket reconnect', {
      reconnectAttempts: this.reconnectAttempts,
      delayMs,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.phase === 'disposed') return;
      this.openSocket();
    }, delayMs);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startKeepalive(): void {
    this.stopKeepalive();
    const intervalMs = this.options.keepalivePingIntervalMs ?? 20_000;
    this.keepaliveTimer = setInterval(() => {
      if (this.phase !== 'connected') return;
      const ws = this.socket;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      try {
        ws.send(JSON.stringify({ type: 'ping' }));
      } catch {
        // close handler drives reconnect if the socket is broken
      }
    }, intervalMs);
  }

  private stopKeepalive(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  private startSnapshotFallback(): void {
    this.stopSnapshotFallback();
    const intervalMs = this.options.snapshotFallbackIntervalMs ?? 3000;
    this.debug('info', 'Starting snapshot fallback polling (WS offline)', {
      intervalMs,
      roomCode: this.options.roomCode,
    });

    const runSnapshot = () => {
      if (this.phase === 'disposed') return;
      void this.options
        .getSnapshot()
        .then((room) => {
          if (this.phase === 'disposed') return;
          this.options.onSnapshot(room);
          this.debug('info', 'Snapshot fallback refreshed room state', {
            roomStatus: room.status,
            playerCount: room.players.length,
          });
        })
        .catch((error) => {
          if (this.phase === 'disposed') return;
          const snapshotError = error instanceof Error
            ? buildError(SNAPSHOT_ERROR_NAME, error.message)
            : buildError(SNAPSHOT_ERROR_NAME, 'Snapshot refresh failed');
          this.debug('warn', 'Snapshot fallback refresh failed', { reason: snapshotError.message });
          this.options.onError(snapshotError);
        });
    };

    runSnapshot();
    this.snapshotTimer = setInterval(runSnapshot, intervalMs);
  }

  private stopSnapshotFallback(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
      this.debug('info', 'Stopped snapshot fallback polling');
    }
  }
}
