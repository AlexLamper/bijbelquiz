// Smoke test: connects to a running multiplayer WS endpoint with a forged JWT,
// holds the connection idle for several seconds, and reports any unexpected
// closes. Use after `npm run dev` to validate that real-stack websocket
// connections stay stable (no 1006 reconnect loops).
//
// Usage:
//   node scripts/smoke-multiplayer-ws.mjs <roomCode>
//
// Env:
//   PORT (default 3000)
//   NEXTAUTH_SECRET (required)

import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnv() {
  try {
    const text = readFileSync(join(process.cwd(), '.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const eq = trimmed.indexOf('=');
      if (eq === -1) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore — env is optional, NEXTAUTH_SECRET may already be set
  }
}

loadEnv();

const roomCode = (process.argv[2] || 'TESTRM').toUpperCase();
const port = process.env.PORT || '3000';
const secret =
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';

const userId = 'smoke-' + Math.random().toString(36).slice(2, 10);
const token = jwt.sign({ userId }, secret, { expiresIn: '5m' });

const host = process.env.SMOKE_HOST || 'localhost';
const url = `ws://${host}:${port}/api/mobile/multiplayer/ws?roomCode=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(token)}`;

console.log('[smoke] Connecting', { url, userId, roomCode });

const ws = new WebSocket(url);
const startedAt = Date.now();
let opens = 0;
let closes = 0;
let messages = 0;
let lastCloseDetails = null;

ws.on('open', () => {
  opens += 1;
  console.log('[smoke] open', { lifetimeBeforeOpenMs: Date.now() - startedAt });
});

ws.on('message', (data) => {
  messages += 1;
  let parsed;
  try {
    parsed = JSON.parse(data.toString('utf8'));
  } catch {
    parsed = '(unparsable)';
  }
  console.log('[smoke] message', { type: parsed?.type ?? 'unknown' });
});

ws.on('close', (code, reason) => {
  closes += 1;
  lastCloseDetails = { code, reason: reason.toString('utf8') || '(none)' };
  console.log('[smoke] close', {
    ...lastCloseDetails,
    lifetimeMs: Date.now() - startedAt,
  });
});

ws.on('error', (err) => {
  console.log('[smoke] error', { message: err instanceof Error ? err.message : String(err) });
});

const HOLD_MS = Number(process.env.SMOKE_HOLD_MS || 5000);

setTimeout(() => {
  const lifetimeMs = Date.now() - startedAt;
  const summary = {
    opens,
    closes,
    messages,
    lifetimeMs,
    finalReadyState: ws.readyState,
    lastCloseDetails,
  };
  console.log('[smoke] summary', summary);

  let exitCode = 0;
  if (opens === 0) {
    console.error('[smoke] FAIL: socket never opened');
    exitCode = 2;
  } else if (closes > 0 && summary.lastCloseDetails && summary.lastCloseDetails.code !== 1000) {
    console.error('[smoke] FAIL: socket closed abnormally during hold period', summary.lastCloseDetails);
    exitCode = 3;
  } else if (closes === 0 && ws.readyState === WebSocket.OPEN) {
    console.log('[smoke] PASS: connection remained open and stable');
  } else if (closes > 0 && summary.lastCloseDetails?.code === 1000) {
    console.log('[smoke] PASS: clean close observed (manual or expected)');
  } else {
    console.log('[smoke] PASS (with caveats): finalReadyState', ws.readyState);
  }

  try {
    ws.close(1000, 'smoke_complete');
  } catch {
    /* ignore */
  }

  setTimeout(() => process.exit(exitCode), 200);
}, HOLD_MS);
