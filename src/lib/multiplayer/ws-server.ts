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

  const wsServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    void handleUpgrade(wsServer, request as MultiplayerUpgradeRequest, socket as Socket, head);
  });

  wsServer.on('connection', (socket, request) => {
    const multiplayerRequest = request as MultiplayerUpgradeRequest;
    const userId = multiplayerRequest.multiplayerUserId;

    if (!userId) {
      socket.close(1008, 'Unauthorized');
      return;
    }

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
    rejectUpgrade(socket, 401, 'Unauthorized');
    return;
  }

  let userId: string;
  try {
    const auth = await verifyMultiplayerToken(token);
    userId = auth.userId;
  } catch {
    rejectUpgrade(socket, 401, 'Unauthorized');
    return;
  }

  request.multiplayerUserId = userId;
  request.multiplayerRoomCode = url.searchParams.get('roomCode')?.toUpperCase() ?? null;

  wsServer.handleUpgrade(request, socket, head, (wsSocket) => {
    wsServer.emit('connection', wsSocket, request);
  });
}
