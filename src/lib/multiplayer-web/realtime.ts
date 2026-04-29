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
  snapshotIntervalMs?: number;
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

export class MultiplayerRealtimeClient {
  private readonly options: MultiplayerRealtimeOptions;
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private manuallyClosed = false;

  constructor(options: MultiplayerRealtimeOptions) {
    this.options = {
      snapshotIntervalMs: 1500,
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

  private emitConnectionError(): void {
    this.options.onError(buildError(CONNECTION_ERROR_NAME, CONNECTION_ERROR_MESSAGE));
  }

  connect(): void {
    this.manuallyClosed = false;
    this.options.onConnectionStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
    this.startSnapshotFallback();

    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      this.debug('warn', 'Closing stale websocket before opening a new connection', {
        readyState: this.socket.readyState,
      });
      this.socket.close();
    }

    const socketUrl = getWebSocketUrl(this.options.token, this.options.roomCode);
    this.debug('info', 'Opening websocket connection', {
      url: sanitizeSocketUrl(socketUrl),
      roomCode: this.options.roomCode,
      reconnectAttempts: this.reconnectAttempts,
    });

    let socket: WebSocket;
    try {
      socket = new WebSocket(socketUrl);
    } catch (error) {
      this.debug('error', 'Websocket constructor failed', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
      this.emitConnectionError();
      this.scheduleReconnect();
      return;
    }

    this.socket = socket;

    socket.addEventListener('open', () => {
      this.reconnectAttempts = 0;
      this.debug('info', 'Websocket connection opened', {
        roomCode: this.options.roomCode,
      });
      this.options.onConnectionStatus('connected');

      this.send({
        type: 'join_room',
        payload: {
          roomCode: this.options.roomCode,
        },
      });
    });

    socket.addEventListener('message', (message) => {
      void this.handleMessage(message.data);
    });

    socket.addEventListener('error', () => {
      this.debug('warn', 'Websocket error event received');
      this.emitConnectionError();
    });

    socket.addEventListener('close', (event) => {
      this.debug('warn', 'Websocket connection closed', {
        code: event.code,
        reason: event.reason || null,
        wasClean: event.wasClean,
        manuallyClosed: this.manuallyClosed,
      });

      if (this.manuallyClosed) {
        this.options.onConnectionStatus('disconnected');
        return;
      }

      this.emitConnectionError();
      this.scheduleReconnect();
    });
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.clearReconnectTimer();
    this.stopSnapshotFallback();

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'leave_room',
        payload: {
          roomCode: this.options.roomCode,
        },
      });
    }

    this.socket?.close();
    this.socket = null;
    this.options.onConnectionStatus('disconnected');
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

  private send(command: MultiplayerWsOutboundCommand): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.debug('warn', 'Skipped websocket send because socket is not open', {
        commandType: command.type,
      });
      return;
    }

    this.socket.send(JSON.stringify(command));
    this.debug('info', 'Sent websocket command', {
      commandType: command.type,
      roomCode: this.options.roomCode,
    });
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed) {
      return;
    }

    this.options.onConnectionStatus('reconnecting');
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
      this.connect();
    }, delayMs);
  }

  private startSnapshotFallback(): void {
    this.stopSnapshotFallback();

    const intervalMs = this.options.snapshotIntervalMs ?? 6000;
    this.debug('info', 'Starting snapshot fallback polling', {
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
      this.debug('info', 'Stopped snapshot fallback polling');
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
