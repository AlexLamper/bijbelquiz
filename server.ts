import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { attachMultiplayerWebSocketServer } from './src/lib/multiplayer/ws-server';

const MULTIPLAYER_WS_PATH = '/api/mobile/multiplayer/ws';

async function bootstrap(): Promise<void> {
  const mode = process.argv[2] ?? 'dev';
  const dev = mode !== 'start';
  const hostname = process.env.HOST || 'localhost';
  const port = Number(process.env.PORT || 3000);

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  // Must be called after prepare(). This returns the handler that Next.js uses
  // for its own WebSocket upgrade events (e.g. Turbopack HMR in development).
  // Without routing non-multiplayer upgrade events to this handler, Next.js
  // registers a duplicate internal listener that ends up processing — and
  // destroying — our multiplayer WebSocket sockets, causing 1006 closes.
  const nextUpgradeHandler = app.getUpgradeHandler();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    void handle(req, res, parsedUrl);
  });

  // Route WebSocket upgrade events: multiplayer path is handled by our
  // ws-server listener (attached below); everything else (e.g. HMR) goes to
  // Next.js so it can maintain its own internal WebSocket connections.
  server.on('upgrade', (req, socket, head) => {
    const host = req.headers.host ?? hostname;
    let pathname = '/';
    try {
      pathname = new URL(req.url ?? '/', `http://${host}`).pathname;
    } catch {
      // malformed URL — treat as non-multiplayer
    }

    if (pathname !== MULTIPLAYER_WS_PATH) {
      void nextUpgradeHandler(req, socket, head);
    }
    // Multiplayer path: handled exclusively by the ws-server upgrade listener
    // registered inside attachMultiplayerWebSocketServer below.
  });

  attachMultiplayerWebSocketServer(server);

  server.listen(port, hostname, () => {
    const modeLabel = dev ? 'development' : 'production';
    console.log(`> Server listening on http://${hostname}:${port} (${modeLabel})`);
    console.log(`> Multiplayer WebSocket upgrade ready at ws://${hostname}:${port}${MULTIPLAYER_WS_PATH}`);

    if (dev) {
      console.log('> For plain Next.js dev without WebSocket upgrades, run: npm run dev:next');
    }
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
