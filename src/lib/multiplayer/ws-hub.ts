import { RawData, WebSocket } from 'ws';
import { isMultiplayerError } from './errors';
import { MultiplayerService } from './service';

interface SocketContext {
  userId: string;
  roomCode: string | null;
  /** Room code extracted from the WS URL at connection time – used as fallback if the client omits it from the join_room payload. */
  initialRoomCode: string | null;
  pingTimer: ReturnType<typeof setInterval> | null;
  /** Stable id used in logs so you can correlate accept/attach/join/close lines for a single connection. */
  connectionId: string;
  /** When attachConnection ran, used to compute the socket lifetime on close. */
  attachedAt: number;
  /** True once a join_room has been processed for this socket (auto or explicit), used to dedupe. */
  hasJoined: boolean;
  /** True once a join is in-flight, used to drop duplicate join_room frames sent by the client right after open. */
  joinInFlight: boolean;
}

let connectionCounter = 0;

function makeConnectionId(): string {
  connectionCounter = (connectionCounter + 1) % Number.MAX_SAFE_INTEGER;
  return `c${connectionCounter.toString(36)}`;
}

type OutboundEventName =
  | 'room_joined'
  | 'player_joined'
  | 'player_left'
  | 'question_started'
  | 'progress_updated'
  | 'question_resolved'
  | 'game_finished'
  | 'room_updated'
  | 'error';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function shouldDebugLog(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.MULTIPLAYER_DEBUG === '1';
}

function debugLog(message: string, details?: Record<string, unknown>): void {
  if (!shouldDebugLog()) {
    return;
  }

  if (details) {
    console.info(`[multiplayer-ws-hub] ${message}`, details);
    return;
  }

  console.info(`[multiplayer-ws-hub] ${message}`);
}

function warnLog(message: string, details?: Record<string, unknown>): void {
  if (!shouldDebugLog()) {
    return;
  }

  if (details) {
    console.warn(`[multiplayer-ws-hub] ${message}`, details);
    return;
  }

  console.warn(`[multiplayer-ws-hub] ${message}`);
}

export class MultiplayerWsHub {
  private readonly service: MultiplayerService;
  private readonly roomSockets = new Map<string, Set<WebSocket>>();
  private readonly socketContexts = new Map<WebSocket, SocketContext>();

  constructor(service: MultiplayerService) {
    this.service = service;

    this.service.onBroadcast((event) => {
      debugLog('Broadcast event from service', {
        type: event.type,
        roomCode: event.roomCode,
      });
      this.broadcast(event.roomCode, event.type, event.payload);
    });
  }

  attachConnection(ws: WebSocket, userId: string, initialRoomCode: string | null): void {
    const normalizedInitialRoomCode = initialRoomCode ? initialRoomCode.trim().toUpperCase() : null;
    const connectionId = makeConnectionId();
    const attachedAt = Date.now();

    debugLog('Attach websocket connection', {
      connectionId,
      userId,
      initialRoomCode: normalizedInitialRoomCode,
    });

    // Send a ping every 25 s so the connection is kept alive through any
    // idle-timeout firewalls or reverse proxies. The browser WS implementation
    // responds with a pong automatically.
    const pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch {
          // ignore — close handler will clean up if the socket is broken
        }
      }
    }, 25_000);

    const context: SocketContext = {
      userId,
      roomCode: null,
      initialRoomCode: normalizedInitialRoomCode,
      pingTimer,
      connectionId,
      attachedAt,
      hasJoined: false,
      joinInFlight: false,
    };
    this.socketContexts.set(ws, context);

    ws.on('message', (data) => {
      void this.handleMessage(ws, data);
    });

    ws.on('close', (code, reason) => {
      void this.handleClose(ws, code, reason.toString('utf8'));
    });

    ws.on('error', (err) => {
      // Log the error; the 'close' event fires right after and handles cleanup.
      warnLog('Socket error event fired', {
        connectionId,
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    // Auto-join from the roomCode embedded in the WS URL. Some clients reconnect
    // aggressively or can drop before the first 'join_room' command is sent.
    // Keeping server-side auto-join restores a robust baseline and still allows
    // the explicit join_room command as an idempotent re-sync path.
    if (normalizedInitialRoomCode) {
      context.joinInFlight = true;
      void this.joinRoomForSocket(ws, userId, normalizedInitialRoomCode);
    }
  }

  private async handleMessage(ws: WebSocket, rawData: RawData): Promise<void> {
    const context = this.socketContexts.get(ws);
    if (!context) {
      return;
    }

    const messageText = typeof rawData === 'string' ? rawData : rawData.toString('utf8');

    let parsed: unknown;
    try {
      parsed = JSON.parse(messageText);
    } catch {
      this.sendError(ws, 'VALIDATION_ERROR', 'Invalid JSON message');
      return;
    }

    const envelope = asRecord(parsed);
    if (!envelope) {
      this.sendError(ws, 'VALIDATION_ERROR', 'Invalid message envelope');
      return;
    }

    const type = envelope.type;
    const payload = asRecord(envelope.payload);
    const payloadRoomCode = typeof payload?.roomCode === 'string' ? payload.roomCode.trim().toUpperCase() : null;

    debugLog('Received websocket command', {
      userId: context.userId,
      type: typeof type === 'string' ? type : 'unknown',
      // Show the payload room code (what the client sent) and the context room code (current room).
      payloadRoomCode: payloadRoomCode ?? '(not provided)',
      contextRoomCode: context.roomCode ?? '(not joined yet)',
    });

    if (type === 'join_room') {
      // Accept roomCode from the payload; if the client omitted it, fall back to
      // the one embedded in the WebSocket URL at connection time.
      const roomCode = payloadRoomCode || context.initialRoomCode || '';
      if (!roomCode) {
        warnLog('join_room rejected — no roomCode in payload and no initialRoomCode from URL', {
          connectionId: context.connectionId,
          userId: context.userId,
        });
        this.sendError(ws, 'VALIDATION_ERROR', 'roomCode is required');
        return;
      }

      // Ignore duplicate joins for the same socket/room. This is essential
      // because the client sends join_room on open while the server already
      // auto-joins from the URL roomCode — without dedup we'd race two
      // joinRoomForSocket calls and double-broadcast room_joined.
      if (context.roomCode === roomCode) {
        return;
      }

      // If a join is already in-flight (e.g. server auto-join hasn't completed
      // yet), drop the duplicate from the client. The auto-join will produce
      // the same outcome (room_joined to this socket).
      if (context.joinInFlight) {
        return;
      }

      context.joinInFlight = true;
      await this.joinRoomForSocket(ws, context.userId, roomCode);
      return;
    }

    if (type === 'leave_room') {
      const roomCode = payloadRoomCode || context.roomCode;
      if (!roomCode) {
        this.sendError(ws, 'VALIDATION_ERROR', 'roomCode is required');
        return;
      }

      await this.leaveRoomForSocket(ws, context.userId, roomCode);
      return;
    }

    if (type === 'ping') {
      // Application-level keepalive sent by the client; no response needed.
      return;
    }

    this.sendError(ws, 'VALIDATION_ERROR', 'Unsupported socket message type');
  }

  private async joinRoomForSocket(ws: WebSocket, userId: string, roomCodeRaw: string): Promise<void> {
    const roomCode = roomCodeRaw.trim().toUpperCase();
    const context = this.socketContexts.get(ws);
    const connectionId = context?.connectionId ?? '(unknown)';

    if (!roomCode) {
      this.sendError(ws, 'VALIDATION_ERROR', 'roomCode is required');
      if (context) {
        context.joinInFlight = false;
      }
      return;
    }

    debugLog('Socket attempting to join room', { connectionId, userId, roomCode });

    try {
      const room = await this.service.joinSocketRoom({
        userId,
        roomCode,
      });

      // The socket may have been closed/torn down while we awaited the lock.
      // Don't attempt to send to a dead socket; just bail.
      if (!this.socketContexts.has(ws) || ws.readyState !== WebSocket.OPEN) {
        debugLog('Socket disappeared before join could be finalized', {
          connectionId,
          userId,
          roomCode,
          readyState: ws.readyState,
        });
        return;
      }

      this.moveSocketToRoom(ws, roomCode);
      if (context) {
        context.hasJoined = true;
        context.joinInFlight = false;
      }
      debugLog('Socket joined room', {
        connectionId,
        userId,
        roomCode,
        playerCount: room.players.length,
        status: room.status,
      });

      // Send the joining socket its room snapshot.
      this.send(ws, 'room_joined', { room });

      // Broadcast updated player list to everyone else already in the room
      // (the sender already gets room_joined above).
      const sockets = this.roomSockets.get(roomCode);
      if (sockets) {
        sockets.forEach((socket) => {
          if (socket !== ws) {
            this.send(socket, 'room_updated', { roomCode, room });
          }
        });
      }
    } catch (error) {
      if (context) {
        context.joinInFlight = false;
      }
      warnLog('Socket failed to join room', {
        connectionId,
        userId,
        roomCode,
        error: error instanceof Error ? error.message : String(error),
      });
      this.sendErrorFromException(ws, error);
    }
  }

  private async leaveRoomForSocket(ws: WebSocket, userId: string, roomCodeRaw: string): Promise<void> {
    const roomCode = roomCodeRaw.trim().toUpperCase();
    if (!roomCode) {
      this.sendError(ws, 'VALIDATION_ERROR', 'roomCode is required');
      return;
    }

    try {
      await this.service.leaveSocketRoom({
        userId,
        roomCode,
      });
      this.detachSocketFromRoom(ws, roomCode);
      debugLog('Socket left room', {
        userId,
        roomCode,
      });
    } catch (error) {
      this.sendErrorFromException(ws, error);
    }
  }

  private async handleClose(ws: WebSocket, closeCode: number, closeReason: string): Promise<void> {
    const context = this.socketContexts.get(ws);
    if (!context) {
      return;
    }

    // Stop the keepalive ping timer for this socket.
    if (context.pingTimer) {
      clearInterval(context.pingTimer);
      context.pingTimer = null;
    }

    const closeType = closeCode === 1000 ? 'clean' : closeCode === 1001 ? 'going-away' : 'abnormal';
    const lifetimeMs = Date.now() - context.attachedAt;
    debugLog('Socket closed', {
      connectionId: context.connectionId,
      userId: context.userId,
      roomCode: context.roomCode,
      closeCode,
      closeType,
      closeReason: closeReason || '(none)',
      lifetimeMs,
      hadJoined: context.hasJoined,
    });

    this.socketContexts.delete(ws);

    if (!context.roomCode) {
      return;
    }

    this.detachSocketFromRoom(ws, context.roomCode);

    try {
      await this.service.handleSocketDisconnect({
        userId: context.userId,
        roomCode: context.roomCode,
      });
    } catch {
      // Ignore disconnect cleanup errors.
    }
  }

  private moveSocketToRoom(ws: WebSocket, roomCode: string): void {
    const context = this.socketContexts.get(ws);
    if (!context) {
      return;
    }

    if (context.roomCode && context.roomCode !== roomCode) {
      this.detachSocketFromRoom(ws, context.roomCode);
    }

    context.roomCode = roomCode;
    this.socketContexts.set(ws, context);

    let sockets = this.roomSockets.get(roomCode);
    if (!sockets) {
      sockets = new Set<WebSocket>();
      this.roomSockets.set(roomCode, sockets);
    }

    sockets.add(ws);
  }

  private detachSocketFromRoom(ws: WebSocket, roomCode: string): void {
    const sockets = this.roomSockets.get(roomCode);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.roomSockets.delete(roomCode);
      }
    }

    const context = this.socketContexts.get(ws);
    if (context && context.roomCode === roomCode) {
      context.roomCode = null;
      this.socketContexts.set(ws, context);
    }
  }

  private broadcast(roomCode: string, type: OutboundEventName, payload: Record<string, unknown>): void {
    const sockets = this.roomSockets.get(roomCode);
    if (!sockets || sockets.size === 0) {
      debugLog('No sockets to broadcast to', {
        roomCode,
        type,
      });
      return;
    }

    debugLog('Broadcasting event to sockets', {
      roomCode,
      type,
      socketCount: sockets.size,
    });

    sockets.forEach((socket) => {
      this.send(socket, type, payload);
    });
  }

  private send(socket: WebSocket, type: OutboundEventName, payload: Record<string, unknown>): void {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      JSON.stringify({
        type,
        payload,
      }),
    );
  }

  private sendErrorFromException(socket: WebSocket, error: unknown): void {
    if (isMultiplayerError(error)) {
      warnLog('Sending multiplayer error to websocket client', {
        code: error.code,
        message: error.message,
      });
      this.sendError(socket, error.code, error.message);
      return;
    }

    warnLog('Sending internal websocket error to client');
    this.sendError(socket, 'INTERNAL_ERROR', 'Unexpected socket error');
  }

  private sendError(socket: WebSocket, code: string, message: string): void {
    this.send(socket, 'error', {
      code,
      message,
    });
  }
}
