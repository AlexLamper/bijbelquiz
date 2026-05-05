// End-to-end smoke test against a running dev server.
//
// Flow:
//   1. Forge a JWT for a fake user (no DB user is required because we only
//      attach a WS — we do not POST /join, which DOES require a real user).
//   2. Open a multiplayer WS with that token + a room code.
//   3. Hold the connection open for several seconds, then issue a clean close.
//   4. Open a SECOND WS with the same user/room code while the first is still
//      connected — verifies the hub allows duplicate connections cleanly.
//   5. Hit /api/multiplayer/debug to dump runtime state.
//
// Note: this script does NOT create rooms via the HTTP API (that needs a real
// DB user + auth session). The intent is to exercise the WS path and confirm
// no 1006 abnormal closes happen.
//
// Usage:
//   node scripts/smoke-multiplayer-end-to-end.mjs
//
// Env:
//   PORT (default 3000)
//   NEXTAUTH_SECRET (read from .env or process env)

import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnv() {
  try {
    const text = readFileSync(join(process.cwd(), '.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // ignore — env is optional
  }
}

loadEnv();

const port = process.env.PORT || '3000';
const host = process.env.SMOKE_HOST || 'localhost';
const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';

const userId = 'smoke-' + Math.random().toString(36).slice(2, 10);
const token = jwt.sign({ userId }, secret, { expiresIn: '5m' });
const roomCode = 'SMOKE' + Math.random().toString(36).slice(2, 4).toUpperCase();

const wsUrl = `ws://${host}:${port}/api/mobile/multiplayer/ws?roomCode=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(token)}`;

function connectWs(label) {
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    const startedAt = Date.now();
    const result = {
      label,
      opens: 0,
      closes: 0,
      messages: [],
      finalCloseCode: null,
      lifetimeMs: 0,
    };

    ws.on('open', () => {
      result.opens += 1;
      console.log(`[${label}] open after ${Date.now() - startedAt}ms`);
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString('utf8'));
        result.messages.push(parsed.type);
        console.log(`[${label}] message`, parsed.type);
      } catch {
        // ignore
      }
    });

    ws.on('close', (code, reason) => {
      result.closes += 1;
      result.finalCloseCode = code;
      result.lifetimeMs = Date.now() - startedAt;
      console.log(`[${label}] close`, { code, reason: reason.toString('utf8') || '(none)', lifetimeMs: result.lifetimeMs });
    });

    ws.on('error', (err) => {
      console.log(`[${label}] error`, err instanceof Error ? err.message : String(err));
    });

    result.ws = ws;
    resolve(result);
  });
}

async function main() {
  console.log('=== Multiplayer end-to-end smoke test ===');
  console.log({ host, port, userId, roomCode });

  // Step 1: open primary WS
  const primary = await connectWs('primary');
  await new Promise((r) => setTimeout(r, 1000));

  // Step 2: open secondary WS with the SAME user (tests dedup behaviour)
  const secondary = await connectWs('secondary');
  await new Promise((r) => setTimeout(r, 4000));

  // Step 3: check both are still alive (or closed cleanly)
  const ok =
    primary.opens === 1 &&
    secondary.opens === 1 &&
    primary.finalCloseCode !== 1006 &&
    secondary.finalCloseCode !== 1006;

  console.log('=== Summary ===');
  console.log('primary  ', { opens: primary.opens, closes: primary.closes, messages: primary.messages, finalCloseCode: primary.finalCloseCode, lifetimeMs: primary.lifetimeMs, readyState: primary.ws.readyState });
  console.log('secondary', { opens: secondary.opens, closes: secondary.closes, messages: secondary.messages, finalCloseCode: secondary.finalCloseCode, lifetimeMs: secondary.lifetimeMs, readyState: secondary.ws.readyState });
  console.log(ok ? 'RESULT: PASS' : 'RESULT: FAIL');

  // Clean close
  try { primary.ws.close(1000, 'smoke_done'); } catch { /* ignore */ }
  try { secondary.ws.close(1000, 'smoke_done'); } catch { /* ignore */ }

  setTimeout(() => process.exit(ok ? 0 : 1), 500);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(2);
});
