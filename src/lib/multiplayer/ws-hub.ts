import { RawData, WebSocket } from 'ws';
import { isMultiplayerError } from './errors';
import { MultiplayerService } from './service';

interface SocketContext {
  userId: string;
  roomCode: string | null;
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

export class MultiplayerWsHub {
  private readonly service: MultiplayerService;
  private readonly roomSockets = new Map<string, Set<WebSocket>>();
  private readonly socketContexts = new Map<WebSocket, SocketContext>();

  constructor(service: MultiplayerService) {
    this.service = service;

    this.service.onBroadcast((event) => {
      this.broadcast(event.roomCode, event.type, event.payload);
    });
  }

  attachConnection(ws: WebSocket, userId: string, initialRoomCode: string | null): void {
    this.socketContexts.set(ws, {
      userId,
      roomCode: null,
    });

    ws.on('message', (data) => {
      void this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      void this.handleClose(ws);
    });

    ws.on('error', () => {
      void this.handleClose(ws);
    });

    if (initialRoomCode) {
      void this.joinRoomForSocket(ws, userId, initialRoomCode);
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

    if (type === 'join_room') {
      const roomCode = typeof payload?.roomCode === 'string' ? payload.roomCode : '';
      if (!roomCode) {
        this.sendError(ws, 'VALIDATION_ERROR', 'roomCode is required');
        return;
      }

      await this.joinRoomForSocket(ws, context.userId, roomCode);
      return;
    }

    if (type === 'leave_room') {
      const roomCode = typeof payload?.roomCode === 'string' ? payload.roomCode : context.roomCode;
      if (!roomCode) {
        this.sendError(ws, 'VALIDATION_ERROR', 'roomCode is required');
        return;
      }

      await this.leaveRoomForSocket(ws, context.userId, roomCode);
      return;
    }

    this.sendError(ws, 'VALIDATION_ERROR', 'Unsupported socket message type');
  }

  private async joinRoomForSocket(ws: WebSocket, userId: string, roomCodeRaw: string): Promise<void> {
    const roomCode = roomCodeRaw.trim().toUpperCase();

    if (!roomCode) {
      this.sendError(ws, 'VALIDATION_ERROR', 'roomCode is required');
      return;
    }

    try {
      const room = await this.service.joinSocketRoom({
        userId,
        roomCode,
      });

      this.moveSocketToRoom(ws, roomCode);
      this.send(ws, 'room_joined', { room });
    } catch (error) {
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
    } catch (error) {
      this.sendErrorFromException(ws, error);
    }
  }

  private async handleClose(ws: WebSocket): Promise<void> {
    const context = this.socketContexts.get(ws);
    if (!context) {
      return;
    }

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
      return;
    }

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
      this.sendError(socket, error.code, error.message);
      return;
    }

    this.sendError(socket, 'INTERNAL_ERROR', 'Unexpected socket error');
  }

  private sendError(socket: WebSocket, code: string, message: string): void {
    this.send(socket, 'error', {
      code,
      message,
    });
  }
}
