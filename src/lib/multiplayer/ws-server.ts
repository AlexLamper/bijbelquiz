import { IncomingMessage, Server } from 'node:http';
import { Socket } from 'node:net';
import { WebSocketServer } from 'ws';
import { verifyMultiplayerToken } from './auth';
import { getMultiplayerRuntime } from './runtime';

interface MultiplayerUpgradeRequest extends IncomingMessage {
  multiplayerUserId?: string;
  multiplayerRoomCode?: string | null;
}

const ATTACHED_SERVERS = new WeakSet<Server>();

function shouldDebugLog(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.MULTIPLAYER_DEBUG === '1';
}

function debugLog(message: string, details?: Record<string, unknown>): void {
  if (!shouldDebugLog()) {
    return;
  }

  if (details) {
    console.info(`[multiplayer-ws] ${message}`, details);
    return;
  }

  console.info(`[multiplayer-ws] ${message}`);
}

function warnLog(message: string, details?: Record<string, unknown>): void {
  if (!shouldDebugLog()) {
    return;
  }

  if (details) {
    console.warn(`[multiplayer-ws] ${message}`, details);
    return;
  }

  console.warn(`[multiplayer-ws] ${message}`);
}

function rejectUpgrade(socket: Socket, statusCode: number, message: string): void {
  if (socket.destroyed) {
    return;
  }

  socket.write(
    `HTTP/1.1 ${statusCode} ${statusCode === 401 ? 'Unauthorized' : 'Bad Request'}\r\n` +
      'Connection: close\r\n' +
      'Content-Type: text/plain\r\n' +
      `Content-Length: ${Buffer.byteLength(message)}\r\n` +
      '\r\n' +
      message,
  );

  socket.destroy();
}

export function attachMultiplayerWebSocketServer(server: Server): void {
  if (ATTACHED_SERVERS.has(server)) {
    return;
  }

  ATTACHED_SERVERS.add(server);
  debugLog('Attaching websocket upgrade listeners to HTTP server');

  const wsServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const host = request.headers.host ?? 'localhost';
    const url = new URL(request.url ?? '/', `http://${host}`);

    if (url.pathname === '/api/mobile/multiplayer/ws') {
      debugLog('Received websocket upgrade request', {
        pathname: url.pathname,
        hasToken: Boolean(url.searchParams.get('token')),
        roomCode: url.searchParams.get('roomCode')?.toUpperCase() ?? null,
        userAgent: request.headers['user-agent'] ?? 'unknown',
      });
    }

    void handleUpgrade(wsServer, request as MultiplayerUpgradeRequest, socket as Socket, head);
  });

  wsServer.on('connection', (socket, request) => {
    const multiplayerRequest = request as MultiplayerUpgradeRequest;
    const userId = multiplayerRequest.multiplayerUserId;

    if (!userId) {
      warnLog('Closing websocket because userId is missing on request context');
      socket.close(1008, 'Unauthorized');
      return;
    }

    debugLog('Websocket connection accepted', {
      userId,
      roomCode: multiplayerRequest.multiplayerRoomCode ?? null,
    });

    const runtime = getMultiplayerRuntime();
    runtime.wsHub.attachConnection(socket, userId, multiplayerRequest.multiplayerRoomCode ?? null);
  });
}

async function handleUpgrade(
  wsServer: WebSocketServer,
  request: MultiplayerUpgradeRequest,
  socket: Socket,
  head: Buffer,
): Promise<void> {
  const host = request.headers.host ?? 'localhost';
  const url = new URL(request.url ?? '/', `http://${host}`);

  if (url.pathname !== '/api/mobile/multiplayer/ws') {
    return;
  }

  const token = url.searchParams.get('token');
  if (!token) {
    warnLog('Rejecting websocket upgrade because token is missing', {
      roomCode: url.searchParams.get('roomCode')?.toUpperCase() ?? null,
    });
    rejectUpgrade(socket, 401, 'Unauthorized');
    return;
  }

  let userId: string;
  try {
    const auth = await verifyMultiplayerToken(token);
    userId = auth.userId;
  } catch {
    warnLog('Rejecting websocket upgrade because token verification failed', {
      tokenLength: token.length,
      roomCode: url.searchParams.get('roomCode')?.toUpperCase() ?? null,
    });
    rejectUpgrade(socket, 401, 'Unauthorized');
    return;
  }

  request.multiplayerUserId = userId;
  request.multiplayerRoomCode = url.searchParams.get('roomCode')?.toUpperCase() ?? null;

  debugLog('Upgrading websocket request', {
    userId,
    roomCode: request.multiplayerRoomCode,
  });

  wsServer.handleUpgrade(request, socket, head, (wsSocket) => {
    wsServer.emit('connection', wsSocket, request);
  });
}
