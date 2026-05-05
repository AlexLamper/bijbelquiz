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

const MULTIPLAYER_WS_PATH = '/api/mobile/multiplayer/ws';

function shouldDebugLog(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.MULTIPLAYER_DEBUG === '1';
}

function logPrefix(): string {
  // Lazily fetch the runtime to include its instance id; fall back to a
  // placeholder if it has not been bootstrapped yet.
  if (globalThis.__multiplayerRuntime) {
    return `[multiplayer-ws:${globalThis.__multiplayerRuntime.instanceId}]`;
  }
  return '[multiplayer-ws]';
}

function debugLog(message: string, details?: Record<string, unknown>): void {
  if (!shouldDebugLog()) return;
  if (details) {
    console.info(`${logPrefix()} ${message}`, details);
  } else {
    console.info(`${logPrefix()} ${message}`);
  }
}

function warnLog(message: string, details?: Record<string, unknown>): void {
  if (!shouldDebugLog()) return;
  if (details) {
    console.warn(`${logPrefix()} ${message}`, details);
  } else {
    console.warn(`${logPrefix()} ${message}`);
  }
}

function rejectUpgrade(socket: Socket, statusCode: number, message: string): void {
  if (socket.destroyed) return;

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

/**
 * Returns true when this upgrade request belongs to the multiplayer WS path.
 */
function isMultiplayerUpgrade(request: IncomingMessage): boolean {
  if (!request.url) return false;
  // Cheap path check that avoids constructing a full URL for non-matching paths.
  // We compare just the pathname prefix; query strings (?token=...&roomCode=...)
  // are stripped naturally by indexOf('?').
  const queryIdx = request.url.indexOf('?');
  const pathname = queryIdx >= 0 ? request.url.slice(0, queryIdx) : request.url;
  return pathname === MULTIPLAYER_WS_PATH;
}

export function attachMultiplayerWebSocketServer(server: Server): void {
  if (ATTACHED_SERVERS.has(server)) {
    debugLog('attachMultiplayerWebSocketServer called on already-attached server; skipping');
    return;
  }
  ATTACHED_SERVERS.add(server);

  // Force the runtime to bootstrap NOW so its instanceId is available for log
  // prefixes from the very first request. (Otherwise the first few log lines
  // would say `[multiplayer-ws]` instead of `[multiplayer-ws:r-xxxxxxxx]`.)
  const runtime = getMultiplayerRuntime();

  debugLog('Attaching websocket upgrade listeners to HTTP server', {
    instanceId: runtime.instanceId,
    pid: process.pid,
  });

  const wsServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    // Only handle multiplayer paths. Other upgrade requests (Next.js HMR /
    // Turbopack dev tools) are routed by the listener registered earlier in
    // server.ts and we must not interfere with them.
    if (!isMultiplayerUpgrade(request)) {
      return;
    }

    const host = request.headers.host ?? 'localhost';
    const url = new URL(request.url ?? '/', `http://${host}`);

    debugLog('Received websocket upgrade request', {
      pathname: url.pathname,
      hasToken: Boolean(url.searchParams.get('token')),
      roomCode: url.searchParams.get('roomCode')?.toUpperCase() ?? null,
      userAgent: request.headers['user-agent'] ?? 'unknown',
      remoteAddress: request.socket.remoteAddress ?? 'unknown',
    });

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

  // Disable any inherited HTTP request timeouts and turn on TCP keepalive on
  // the underlying socket. Without this, an idle Node http server timeout can
  // destroy a perfectly healthy upgraded WebSocket and the browser observes
  // a 1006 abnormal close. We also set Nagle off for snappier delivery.
  try {
    socket.setTimeout(0);
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 30_000);
  } catch (error) {
    warnLog('Failed to configure underlying TCP socket for websocket upgrade', {
      reason: error instanceof Error ? error.message : 'unknown_error',
    });
  }

  wsServer.handleUpgrade(request, socket, head, (wsSocket) => {
    wsServer.emit('connection', wsSocket, request);
  });
}

export { MULTIPLAYER_WS_PATH };
