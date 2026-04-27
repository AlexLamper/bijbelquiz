import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { attachMultiplayerWebSocketServer } from './src/lib/multiplayer/ws-server';

async function bootstrap(): Promise<void> {
  const mode = process.argv[2] ?? 'dev';
  const dev = mode !== 'start';
  const hostname = process.env.HOST || process.env.HOSTNAME || '0.0.0.0';
  const port = Number(process.env.PORT || 3000);

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    void handle(req, res, parsedUrl);
  });

  attachMultiplayerWebSocketServer(server);

  server.listen(port, hostname, () => {
    const modeLabel = dev ? 'development' : 'production';
    console.log(`> Server listening on http://${hostname}:${port} (${modeLabel})`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
