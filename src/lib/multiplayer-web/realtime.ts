import type { RoomSnapshot } from '@/lib/multiplayer/types';
import type { MultiplayerConnectionStatus, MultiplayerWsInboundEvent, MultiplayerWsOutboundCommand } from './contracts';
import { parseWsEvent } from './mappers';

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
  /** How often (ms) to poll for a room snapshot while the WebSocket is down. Default 2000. */
  snapshotFallbackIntervalMs?: number;
  /** How often (ms) to send a client-side keepalive ping over the WebSocket. Default 20000. */
  keepalivePingIntervalMs?: number;
  reconnectMinDelayMs?: number;
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

/**
 * Tracks all per-socket state so that stale sockets cannot interfere with the
 * currently active connection. Every socket created by `connect()` gets its own
 * SocketSession; only the session that matches `this.activeSession` may mutate
 * shared client state (status, reconnect, keepalive, etc.).
 */
interface SocketSession {
  generation: number;
  socket: WebSocket;
  keepaliveTimer: ReturnType<typeof setInterval> | null;
  joinSent: boolean;
  openedAt: number | null;
  /**
   * When true, the session was retired while the socket was still CONNECTING.
   * The onopen handler must close the socket gracefully (code 1000) once the
   * handshake completes, instead of the caller using ws.close() on a CONNECTING
   * socket (which sends a TCP RST → server sees code 1006, not 1000).
   */
  closeOnOpen: boolean;
}

export class MultiplayerRealtimeClient {
  private readonly options: MultiplayerRealtimeOptions;
  private activeSession: SocketSession | null = null;
  private generationCounter = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private manuallyClosed = false;
  private lastConnectionStatus: MultiplayerConnectionStatus = 'idle';

  constructor(options: MultiplayerRealtimeOptions) {
    this.options = {
      // Poll every 2 s when WS is offline so lobby player count stays fresh and
      // the host sees new joiners quickly enough to enable the start button.
      snapshotFallbackIntervalMs: 2000,
      keepalivePingIntervalMs: 20_000,
      reconnectMinDelayMs: 800,
      reconnectMaxDelayMs: 8000,
      ...options,
    };
  }

  private debug(level: MultiplayerRealtimeDebugLevel, message: string, details?: Record<string, unknown>): void {
    this.options.onDebug?.({
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    });

    if (process.env.NODE_ENV !== 'production') {
      if (details) {
        console[level](`[multiplayer-realtime] ${message}`, details);
        return;
      }

      console[level](`[multiplayer-realtime] ${message}`);
    }
  }

  private setStatus(status: MultiplayerConnectionStatus): void {
    if (this.lastConnectionStatus === status) {
      return;
    }

    this.lastConnectionStatus = status;
    this.options.onConnectionStatus(status);
  }

  private emitConnectionError(): void {
    this.options.onError(buildError(CONNECTION_ERROR_NAME, CONNECTION_ERROR_MESSAGE));
  }

  /**
   * Returns true when the supplied session is still the currently active one.
   * Old sockets retain a reference to their original session via closure, so
   * even after `connect()` swaps in a new session, their event handlers can
   * see they are obsolete and bail out.
   */
  private isActive(session: SocketSession): boolean {
    return this.activeSession !== null && this.activeSession.generation === session.generation;
  }

  /**
   * Detach a socket cleanly: clear all listeners, stop its keepalive, and close
   * the underlying WebSocket if it is not already closed. This never triggers
   * reconnect because we only call it from contexts that already decided what
   * to do next (e.g. disconnect, replacement, or explicit teardown).
   *
   * IMPORTANT: we mark the session as no-longer-active *before* calling
   * `ws.close()`, because some WebSocket implementations (and our test mock)
   * fire the close event synchronously inside close(). Without this guard, the
   * synchronous close handler would still see the session as active and
   * schedule a reconnect for a socket we just deliberately retired.
   *
   * CONNECTING state: calling ws.close() while the socket is still in the
   * CONNECTING state causes browsers to abort the TCP handshake with a RST
   * instead of sending a WebSocket close frame. The server then observes close
   * code 1006 (abnormal) rather than 1000 (clean). To avoid this, we set the
   * `closeOnOpen` flag and let the `onopen` handler send the close frame once
   * the connection is actually established. The handlers are registered via
   * direct property assignment (`ws.onopen = ...`) so they can be removed with
   * a null assignment — unlike addEventListener, which cannot be removed without
   * a reference to the exact handler function.
   */
  private retireSession(session: SocketSession, reason: string): void {
    if (this.activeSession === session) {
      this.activeSession = null;
    }

    if (session.keepaliveTimer) {
      clearInterval(session.keepaliveTimer);
      session.keepaliveTimer = null;
    }

    const ws = session.socket;

    if (ws.readyState === WebSocket.CONNECTING) {
      // Cannot send a close frame while still connecting — the browser would
      // abort with TCP RST and the server would see 1006. Instead, mark the
      // session so the onopen handler sends a clean 1000 close frame once the
      // handshake completes. Remove all handlers except onopen (we need it to
      // do the deferred close); onopen will null itself out after firing.
      session.closeOnOpen = true;
      try {
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
      } catch {
        // ignore
      }
      return;
    }

    // Socket is OPEN, CLOSING, or CLOSED — safe to null all handlers now.
    try {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
    } catch {
      // Some environments throw on null assignment; swallow.
    }

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.close(1000, reason);
      } catch {
        // ignore
      }
    }
  }

  connect(): void {
    this.manuallyClosed = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    // Fallback HTTP polling only kicks in once we've already had at least one
    // failed attempt. On the very first connect we let the WebSocket have a
    // clean shot at coming up.
    if (this.reconnectAttempts > 0) {
      this.startSnapshotFallback();
    }

    // Retire any previous session before opening a fresh one. retireSession
    // detaches listeners and marks it inactive so the obsolete socket can never
    // trigger reconnect or mutate client state again.
    if (this.activeSession) {
      this.debug('warn', 'Retiring previous websocket before opening a new connection', {
        readyState: this.activeSession.socket.readyState,
        previousGeneration: this.activeSession.generation,
      });
      this.retireSession(this.activeSession, 'replaced');
    }

    // Also clear any pending reconnect timer; we are establishing a fresh
    // connection right now.
    this.clearReconnectTimer();

    const generation = ++this.generationCounter;
    const socketUrl = getWebSocketUrl(this.options.token, this.options.roomCode);
    this.debug('info', 'Opening websocket connection', {
      url: sanitizeSocketUrl(socketUrl),
      roomCode: this.options.roomCode,
      reconnectAttempts: this.reconnectAttempts,
      generation,
    });

    let socket: WebSocket;
    try {
      socket = new WebSocket(socketUrl);
    } catch (error) {
      this.debug('error', 'Websocket constructor failed', {
        reason: error instanceof Error ? error.message : 'unknown_error',
        generation,
      });
      this.emitConnectionError();
      this.startSnapshotFallback();
      this.scheduleReconnect();
      return;
    }

    const session: SocketSession = {
      generation,
      socket,
      keepaliveTimer: null,
      joinSent: false,
      openedAt: null,
      closeOnOpen: false,
    };
    this.activeSession = session;

    // Use direct property assignment (ws.onX = ...) rather than addEventListener
    // so that retireSession can reliably remove every handler with a null
    // assignment. With addEventListener the listener reference is needed to
    // remove it; with the onX API a null assignment is sufficient and avoids
    // leaving stale handlers on retired sockets.
    socket.onopen = () => {
      // Always clear the onopen handler first — whether we proceed normally or
      // do a deferred close below, we must not fire again.
      socket.onopen = null;

      if (session.closeOnOpen) {
        // The session was retired while the socket was still CONNECTING. Now that
        // the connection is OPEN we can send a proper close frame (1000) instead
        // of the TCP RST that ws.close() on a CONNECTING socket would produce.
        this.debug('warn', 'Closing socket that was retired during handshake (deferred clean close)', {
          generation: session.generation,
        });
        try {
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close(1000, 'retired');
        } catch {
          // ignore
        }
        return;
      }

      if (!this.isActive(session)) {
        // We were replaced or torn down during the handshake. Close gracefully.
        this.debug('warn', 'Discarding open event from stale socket, closing gracefully', {
          generation: session.generation,
        });
        try {
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close(1000, 'stale');
        } catch {
          // ignore
        }
        return;
      }

      session.openedAt = Date.now();
      this.reconnectAttempts = 0;
      this.debug('info', 'Websocket connection opened', {
        roomCode: this.options.roomCode,
        generation: session.generation,
      });

      this.stopSnapshotFallback();
      this.setStatus('connected');
      this.startKeepalivePing(session);

      if (!session.joinSent) {
        session.joinSent = true;
        this.sendOnSession(session, {
          type: 'join_room',
          payload: {
            roomCode: this.options.roomCode,
          },
        });
      }
    };

    socket.onmessage = (message) => {
      if (!this.isActive(session)) {
        return;
      }

      void this.handleMessage(message.data);
    };

    socket.onerror = () => {
      if (!this.isActive(session)) {
        return;
      }

      this.debug('warn', 'Websocket error event received', {
        generation: session.generation,
      });
      this.emitConnectionError();
      // The 'close' event fires immediately after; reconnect handling lives there.
    };

    socket.onclose = (event) => {
      // Clean up this session's resources unconditionally — they are tied to
      // this specific socket only.
      if (session.keepaliveTimer) {
        clearInterval(session.keepaliveTimer);
        session.keepaliveTimer = null;
      }

      const closeType =
        event.code === 1000 ? 'clean' :
        event.code === 1001 ? 'going-away' :
        event.code === 1006 ? 'abnormal-no-close-frame' :
        'abnormal';

      const lifetimeMs = session.openedAt !== null ? Date.now() - session.openedAt : null;

      this.debug('warn', 'Websocket connection closed', {
        code: event.code,
        closeType,
        reason: event.reason || null,
        wasClean: event.wasClean,
        manuallyClosed: this.manuallyClosed,
        generation: session.generation,
        lifetimeMs,
        wasActive: this.isActive(session),
      });

      // If this close belongs to a replaced/torn-down socket, do absolutely
      // nothing else. The active session (if any) drives state.
      if (!this.isActive(session)) {
        return;
      }

      this.activeSession = null;

      if (this.manuallyClosed) {
        this.stopSnapshotFallback();
        this.setStatus('disconnected');
        return;
      }

      this.emitConnectionError();
      this.startSnapshotFallback();
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.clearReconnectTimer();
    this.stopSnapshotFallback();

    const session = this.activeSession;
    if (session) {
      // Best-effort leave_room only if the socket is open. We do this before
      // retireSession so the leave frame can flush.
      if (session.socket.readyState === WebSocket.OPEN) {
        try {
          session.socket.send(
            JSON.stringify({
              type: 'leave_room',
              payload: { roomCode: this.options.roomCode },
            } satisfies MultiplayerWsOutboundCommand),
          );
        } catch {
          // ignore — we're shutting down anyway
        }
      }

      // retireSession now also marks activeSession as null internally.
      this.retireSession(session, 'disconnect');
    }

    this.setStatus('disconnected');
    this.debug('info', 'Realtime client disconnected by caller');
  }

  private async handleMessage(data: unknown): Promise<void> {
    try {
      const parsed = await this.parseIncomingMessage(data);
      const event = parseWsEvent(parsed);
      this.debug('info', 'Received websocket event', {
        type: event.type,
      });
      this.options.onEvent(event);
    } catch (error) {
      const parseError =
        error instanceof Error
          ? buildError(MESSAGE_PARSE_ERROR_NAME, error.message)
          : buildError(MESSAGE_PARSE_ERROR_NAME, 'Invalid websocket event payload');

      this.debug('error', 'Failed to parse websocket message', {
        reason: parseError.message,
      });
      this.options.onError(parseError);
    }
  }

  private async parseIncomingMessage(data: unknown): Promise<unknown> {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }

    if (data instanceof ArrayBuffer) {
      const text = new TextDecoder().decode(data);
      return JSON.parse(text);
    }

    if (ArrayBuffer.isView(data)) {
      const typedArray = data as ArrayBufferView;
      const text = new TextDecoder().decode(
        typedArray.buffer.slice(typedArray.byteOffset, typedArray.byteOffset + typedArray.byteLength),
      );
      return JSON.parse(text);
    }

    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      const text = await data.text();
      return JSON.parse(text);
    }

    throw new Error('Unsupported websocket message data type');
  }

  /**
   * Send a command on a specific session. We deliberately scope sends to a
   * session rather than to `this.activeSession` so that messages queued during
   * the open handler can never be sent on a newer session by accident.
   */
  private sendOnSession(session: SocketSession, command: MultiplayerWsOutboundCommand): void {
    if (!this.isActive(session)) {
      return;
    }

    if (session.socket.readyState !== WebSocket.OPEN) {
      this.debug('warn', 'Skipped websocket send because socket is not open', {
        commandType: command.type,
        readyState: session.socket.readyState,
      });
      return;
    }

    try {
      session.socket.send(JSON.stringify(command));
    } catch (error) {
      this.debug('warn', 'Websocket send failed', {
        commandType: command.type,
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
      return;
    }

    this.debug('info', 'Sent websocket command', {
      commandType: command.type,
      roomCode: this.options.roomCode,
      generation: session.generation,
    });
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed) {
      return;
    }

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
      this.connect();
    }, delayMs);
  }

  private startKeepalivePing(session: SocketSession): void {
    if (session.keepaliveTimer) {
      clearInterval(session.keepaliveTimer);
      session.keepaliveTimer = null;
    }

    const intervalMs = this.options.keepalivePingIntervalMs ?? 20_000;
    session.keepaliveTimer = setInterval(() => {
      if (!this.isActive(session)) {
        return;
      }

      if (session.socket.readyState === WebSocket.OPEN) {
        try {
          session.socket.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // ignore — close handler will drive reconnect if the socket is broken
        }
      }
    }, intervalMs);
  }

  private startSnapshotFallback(): void {
    this.stopSnapshotFallback();

    const intervalMs = this.options.snapshotFallbackIntervalMs ?? 5000;
    this.debug('info', 'Starting snapshot fallback polling (WS offline)', {
      intervalMs,
      roomCode: this.options.roomCode,
    });

    const runSnapshot = () => {
      void this.options
        .getSnapshot()
        .then((room) => {
          this.options.onSnapshot(room);
          this.debug('info', 'Snapshot fallback refreshed room state', {
            roomStatus: room.status,
            playerCount: room.players.length,
          });
        })
        .catch((error) => {
          const snapshotError =
            error instanceof Error
              ? buildError(SNAPSHOT_ERROR_NAME, error.message)
              : buildError(SNAPSHOT_ERROR_NAME, 'Snapshot refresh failed');

          this.debug('warn', 'Snapshot fallback refresh failed', {
            reason: snapshotError.message,
          });
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
      this.debug('info', 'Stopped snapshot fallback polling (WS online)');
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
