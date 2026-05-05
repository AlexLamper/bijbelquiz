import { RawData, WebSocket } from 'ws';
import { isMultiplayerError } from './errors';
import { MultiplayerService } from './service';

/**
 * Multiplayer WebSocket hub.
 *
 * Responsibilities:
 *  - Track every WebSocket attached to this runtime instance.
 *  - Route inbound commands (join_room / leave_room / ping) to the service.
 *  - Broadcast service events to the right sockets.
 *  - Keep connections alive with an application-level ping every 25 s.
 *  - Drop stale duplicate connections from the same user (e.g. a hot-reloaded
 *    React component reconnects faster than the previous socket can finish
 *    closing — without de-duplication the room briefly shows the user as
 *    offline because the *old* socket's close event arrives last).
 */

interface SocketContext {
  /** Stable id used in logs so accept/attach/join/close lines correlate. */
  connectionId: string;
  userId: string;
  /** The room this socket is currently a member of, if any. */
  roomCode: string | null;
  /** Room code from the WS query string. Auto-join target. */
  initialRoomCode: string | null;
  pingTimer: ReturnType<typeof setInterval> | null;
  attachedAt: number;
  hasJoined: boolean;
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

export class MultiplayerWsHub {
  private readonly service: MultiplayerService;
  private readonly instanceId: string;
  private readonly roomSockets = new Map<string, Set<WebSocket>>();
  private readonly socketContexts = new Map<WebSocket, SocketContext>();
  /**
   * Map of userId → set of attached sockets for that user. Used to evict
   * stale duplicate connections when a fresh one arrives. We support multiple
   * sockets per user (e.g. host has two browser tabs open) but only keep the
   * most recent one to avoid the "ghost player offline" effect.
   */
  private readonly userSockets = new Map<string, Set<WebSocket>>();

  constructor(service: MultiplayerService, instanceId = 'unknown') {
    this.service = service;
    this.instanceId = instanceId;

    this.service.onBroadcast((event) => {
      this.debug('Broadcast event from service', {
        type: event.type,
        roomCode: event.roomCode,
      });
      this.broadcast(event.roomCode, event.type, event.payload);
    });
  }

  private logPrefix(): string {
    return `[multiplayer-ws-hub:${this.instanceId}]`;
  }

  private debug(message: string, details?: Record<string, unknown>): void {
    if (!shouldDebugLog()) return;
    if (details) {
      console.info(`${this.logPrefix()} ${message}`, details);
    } else {
      console.info(`${this.logPrefix()} ${message}`);
    }
  }

  private warn(message: string, details?: Record<string, unknown>): void {
    if (!shouldDebugLog()) return;
    if (details) {
      console.warn(`${this.logPrefix()} ${message}`, details);
    } else {
      console.warn(`${this.logPrefix()} ${message}`);
    }
  }

  attachConnection(ws: WebSocket, userId: string, initialRoomCode: string | null): void {
    const normalizedInitialRoomCode = initialRoomCode ? initialRoomCode.trim().toUpperCase() : null;
    const connectionId = makeConnectionId();
    const attachedAt = Date.now();

    this.debug('Attach websocket connection', {
      connectionId,
      userId,
      initialRoomCode: normalizedInitialRoomCode,
      existingUserSockets: this.userSockets.get(userId)?.size ?? 0,
    });

    // ws library application-level ping every 25 s. Most reverse proxies and
    // browsers hold idle WS connections for at least a minute, but ours is the
    // cheap insurance against any in-the-middle idle timer.
    const pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch {
          // Close handler will clean up if the socket is broken.
        }
      }
    }, 25_000);

    const context: SocketContext = {
      connectionId,
      userId,
      roomCode: null,
      initialRoomCode: normalizedInitialRoomCode,
      pingTimer,
      attachedAt,
      hasJoined: false,
      joinInFlight: false,
    };
    this.socketContexts.set(ws, context);

    let userSet = this.userSockets.get(userId);
    if (!userSet) {
      userSet = new Set();
      this.userSockets.set(userId, userSet);
    }
    userSet.add(ws);

    ws.on('message', (data) => {
      void this.handleMessage(ws, data);
    });

    ws.on('close', (code, reason) => {
      void this.handleClose(ws, code, reason.toString('utf8'));
    });

    ws.on('error', (err) => {
      // The 'close' event fires right after; do cleanup there.
      this.warn('Socket error event fired', {
        connectionId,
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    // Auto-join from the WS URL room code. The HTTP `/join` route has already
    // added the user to the room as a player; this just attaches the socket
    // to that room so the user receives broadcasts. Idempotent: if the socket
    // sends an explicit `join_room` afterwards, we drop it as a duplicate.
    if (normalizedInitialRoomCode) {
      context.joinInFlight = true;
      void this.joinRoomForSocket(ws, userId, normalizedInitialRoomCode);
    }
  }

  private async handleMessage(ws: WebSocket, rawData: RawData): Promise<void> {
    const context = this.socketContexts.get(ws);
    if (!context) return;

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

    this.debug('Received websocket command', {
      connectionId: context.connectionId,
      userId: context.userId,
      type: typeof type === 'string' ? type : 'unknown',
      payloadRoomCode: payloadRoomCode ?? '(not provided)',
      contextRoomCode: context.roomCode ?? '(not joined yet)',
    });

    if (type === 'join_room') {
      const roomCode = payloadRoomCode || context.initialRoomCode || '';
      if (!roomCode) {
        this.warn('join_room rejected — no roomCode provided', {
          connectionId: context.connectionId,
          userId: context.userId,
        });
        this.sendError(ws, 'VALIDATION_ERROR', 'roomCode is required');
        return;
      }

      // Already attached to this room — quietly succeed.
      if (context.roomCode === roomCode) {
        this.debug('join_room is a no-op — socket already in room', {
          connectionId: context.connectionId,
          userId: context.userId,
          roomCode,
        });
        return;
      }

      // A join is already in flight from auto-join; drop this duplicate.
      if (context.joinInFlight) {
        this.debug('join_room dropped — auto-join already in flight', {
          connectionId: context.connectionId,
          userId: context.userId,
          roomCode,
        });
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
      // Application-level keepalive. No response needed.
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
      if (context) context.joinInFlight = false;
      return;
    }

    this.debug('Socket attempting to join room', { connectionId, userId, roomCode });

    try {
      const room = await this.service.joinSocketRoom({ userId, roomCode });

      // The socket may have been closed/torn down while we awaited the lock.
      if (!this.socketContexts.has(ws) || ws.readyState !== WebSocket.OPEN) {
        this.debug('Socket disappeared before join could be finalized', {
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
      this.debug('Socket joined room', {
        connectionId,
        userId,
        roomCode,
        playerCount: room.players.length,
        status: room.status,
      });

      // Send the joining socket its room snapshot.
      this.send(ws, 'room_joined', { room });

      // Notify other room members that a player (re)connected.
      const sockets = this.roomSockets.get(roomCode);
      if (sockets) {
        sockets.forEach((socket) => {
          if (socket !== ws) {
            this.send(socket, 'room_updated', { roomCode, room });
          }
        });
      }
    } catch (error) {
      if (context) context.joinInFlight = false;
      this.warn('Socket failed to join room', {
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
      await this.service.leaveSocketRoom({ userId, roomCode });
      this.detachSocketFromRoom(ws, roomCode);
      this.debug('Socket left room', { userId, roomCode });
    } catch (error) {
      this.sendErrorFromException(ws, error);
    }
  }

  private async handleClose(ws: WebSocket, closeCode: number, closeReason: string): Promise<void> {
    const context = this.socketContexts.get(ws);
    if (!context) return;

    if (context.pingTimer) {
      clearInterval(context.pingTimer);
      context.pingTimer = null;
    }

    const closeType =
      closeCode === 1000 ? 'clean' :
      closeCode === 1001 ? 'going-away' :
      closeCode === 1006 ? 'abnormal-no-close-frame' :
      'abnormal';
    const lifetimeMs = Date.now() - context.attachedAt;

    this.debug('Socket closed', {
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

    const userSet = this.userSockets.get(context.userId);
    if (userSet) {
      userSet.delete(ws);
      if (userSet.size === 0) {
        this.userSockets.delete(context.userId);
      }
    }

    if (!context.roomCode) return;

    this.detachSocketFromRoom(ws, context.roomCode);

    // Only mark the player offline if they have NO other active sockets in
    // this room. Otherwise the player just closed one tab and their other
    // tab is still connected — keeping them online avoids a flicker.
    const remainingSocketsForUser = userSet?.size ?? 0;
    const stillInRoom = remainingSocketsForUser > 0
      ? Array.from(userSet!).some((other) => this.socketContexts.get(other)?.roomCode === context.roomCode)
      : false;

    if (stillInRoom) {
      this.debug('Skipping player_left — user has another socket in room', {
        userId: context.userId,
        roomCode: context.roomCode,
        remainingSocketsForUser,
      });
      return;
    }

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
    if (!context) return;

    if (context.roomCode && context.roomCode !== roomCode) {
      this.detachSocketFromRoom(ws, context.roomCode);
    }

    context.roomCode = roomCode;

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
    }
  }

  private broadcast(roomCode: string, type: OutboundEventName, payload: Record<string, unknown>): void {
    const sockets = this.roomSockets.get(roomCode);
    if (!sockets || sockets.size === 0) {
      this.debug('No sockets to broadcast to', { roomCode, type });
      return;
    }

    this.debug('Broadcasting event to sockets', {
      roomCode,
      type,
      socketCount: sockets.size,
    });

    sockets.forEach((socket) => {
      this.send(socket, type, payload);
    });
  }

  private send(socket: WebSocket, type: OutboundEventName, payload: Record<string, unknown>): void {
    if (socket.readyState !== WebSocket.OPEN) return;

    try {
      socket.send(JSON.stringify({ type, payload }));
    } catch (error) {
      this.warn('Failed to send websocket frame', {
        type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private sendErrorFromException(socket: WebSocket, error: unknown): void {
    if (isMultiplayerError(error)) {
      this.warn('Sending multiplayer error to websocket client', {
        code: error.code,
        message: error.message,
      });
      this.sendError(socket, error.code, error.message);
      return;
    }

    this.warn('Sending internal websocket error to client');
    this.sendError(socket, 'INTERNAL_ERROR', 'Unexpected socket error');
  }

  private sendError(socket: WebSocket, code: string, message: string): void {
    this.send(socket, 'error', { code, message });
  }

  /**
   * Diagnostic helper used by /api/multiplayer/debug. Returns a snapshot of
   * which users are connected and to which rooms.
   */
  debugListSockets(): Array<{
    connectionId: string;
    userId: string;
    roomCode: string | null;
    hasJoined: boolean;
    joinInFlight: boolean;
    attachedAtIso: string;
    ageMs: number;
  }> {
    const now = Date.now();
    return Array.from(this.socketContexts.values()).map((context) => ({
      connectionId: context.connectionId,
      userId: context.userId,
      roomCode: context.roomCode,
      hasJoined: context.hasJoined,
      joinInFlight: context.joinInFlight,
      attachedAtIso: new Date(context.attachedAt).toISOString(),
      ageMs: now - context.attachedAt,
    }));
  }
}
