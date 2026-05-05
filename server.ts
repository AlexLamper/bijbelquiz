import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';
import { parse } from 'node:url';
import next from 'next';

/**
 * Minimal custom Next.js server.
 *
 * Why not just `next dev`? Vercel Production runs Next.js as serverless
 * functions, which is great for HTTP but precludes WebSocket upgrades. We
 * used to maintain a custom WS layer here, but the polling-based
 * multiplayer architecture made that obsolete — every transport now goes
 * through plain HTTP routes that work identically in dev and on Vercel.
 *
 * This file is kept (with no extra responsibilities) because `npm run dev`
 * already calls `tsx server.ts dev`. Removing it would require a package.json
 * scripts update and we'd lose nothing by leaving this as a passthrough.
 */
async function bootstrap(): Promise<void> {
  const mode = process.argv[2] ?? 'dev';
  const dev = mode !== 'start';
  const hostname = process.env.HOST || 'localhost';
  const requestedPort = Number(process.env.PORT || 3000);
  const shouldAutoPickPort = dev && !process.env.PORT;
  const port = shouldAutoPickPort
    ? await findAvailablePort(hostname, requestedPort)
    : requestedPort;

  if (port !== requestedPort) {
    console.log(`> Port ${requestedPort} in use, using ${port} instead`);
  }

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    void handle(req, res, parsedUrl);
  });

  server.listen(port, hostname, () => {
    const modeLabel = dev ? 'development' : 'production';
    console.log(`> Server listening on http://${hostname}:${port} (${modeLabel})`);
    console.log('> Multiplayer transport: HTTP polling (no WebSocket required)');
  });
}

async function findAvailablePort(hostname: string, startPort: number): Promise<number> {
  let port = startPort;
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const available = await isPortAvailable(hostname, port);
    if (available) {
      return port;
    }
    port += 1;
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

async function isPortAvailable(hostname: string, port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();

    probe.once('error', (error: NodeJS.ErrnoException) => {
      probe.close();
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }
      reject(error);
    });

    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });

    probe.listen(port, hostname);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
