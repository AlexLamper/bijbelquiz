import { createServer } from 'node:http';
import { createConnection } from 'node:net';
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
    ? await findAvailablePort(requestedPort)
    : requestedPort;

  if (port !== requestedPort) {
    console.log(`> Port ${requestedPort} in use, using ${port} instead`);
  }

  // An explicitly requested port that someone else already owns must fail loudly.
  // `listen()` alone won't tell us: see the note on isPortAvailable below.
  if (!shouldAutoPickPort && !(await isPortAvailable(port))) {
    throw new Error(
      `Port ${port} is already in use by another process. Stop it, or start with a different PORT.`,
    );
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

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    port += 1;
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Ask whether anything already answers on this port, by connecting to it.
 *
 * The obvious implementation — try to `listen()` and treat EADDRINUSE as "taken"
 * — does not work here. `listen(port, 'localhost')` resolves to ::1, and Windows
 * happily lets a socket bound to ::1 coexist with another process already
 * holding `:::port` or `0.0.0.0:port`. Both servers then believe they own the
 * port and each answers on a different IP stack, so `http://localhost:port`
 * reaches this app or the other one depending on which stack the client picks.
 * Requests that land in the wrong app come back as bare 404s, which looks
 * exactly like a missing API route.
 *
 * Connecting sidesteps every bind-semantics quirk: if either loopback address
 * accepts a TCP connection, something is already serving this port.
 */
async function isPortAvailable(port: number): Promise<boolean> {
  for (const host of ['127.0.0.1', '::1']) {
    if (await isSomethingListening(host, port)) {
      return false;
    }
  }

  return true;
}

function isSomethingListening(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });

    const settle = (listening: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(listening);
    };

    socket.setTimeout(1000);
    socket.once('connect', () => settle(true));
    socket.once('timeout', () => settle(false));
    // ECONNREFUSED (nothing there) and EADDRNOTAVAIL (stack unavailable) both
    // mean this address isn't serving the port.
    socket.once('error', () => settle(false));
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
