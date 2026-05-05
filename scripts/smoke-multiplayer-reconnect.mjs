// Reconnect stress test: opens N successive WS connections to the multiplayer
// endpoint, validates each one stays alive for HOLD_MS without spontaneous
// close, and reports any failures. Run after `npm run dev`.

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
    /* ignore */
  }
}

loadEnv();

const HOST = process.env.SMOKE_HOST || 'localhost';
const PORT = process.env.PORT || '3000';
const ROOM = (process.argv[2] || 'STRESS01').toUpperCase();
const CYCLES = Number(process.env.SMOKE_CYCLES || 5);
const HOLD_MS = Number(process.env.SMOKE_HOLD_MS || 1500);
const SECRET =
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';

const userId = 'stress-' + Math.random().toString(36).slice(2, 10);

const results = [];

async function runCycle(idx) {
  const token = jwt.sign({ userId }, SECRET, { expiresIn: '5m' });
  const url = `ws://${HOST}:${PORT}/api/mobile/multiplayer/ws?roomCode=${encodeURIComponent(ROOM)}&token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);
  const startedAt = Date.now();

  const cycleResult = {
    idx,
    opened: false,
    abnormalClose: null,
    cleanClose: null,
    lifetimeMs: null,
  };

  await new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      cycleResult.lifetimeMs = Date.now() - startedAt;
      resolve();
    };

    ws.on('open', () => {
      cycleResult.opened = true;
    });

    ws.on('close', (code, reason) => {
      if (code !== 1000) {
        cycleResult.abnormalClose = { code, reason: reason.toString('utf8') };
      } else {
        cycleResult.cleanClose = { code, reason: reason.toString('utf8') };
      }
      finish();
    });

    ws.on('error', () => {
      // close event will follow
    });

    setTimeout(() => {
      try {
        ws.close(1000, `cycle_${idx}_done`);
      } catch {
        /* ignore */
      }
      // Give the close event a moment.
      setTimeout(finish, 100);
    }, HOLD_MS);
  });

  return cycleResult;
}

(async () => {
  for (let i = 0; i < CYCLES; i++) {
    const result = await runCycle(i);
    results.push(result);
    console.log('[stress] cycle', result);
  }

  const failures = results.filter((r) => !r.opened || r.abnormalClose);
  console.log('[stress] summary', {
    cycles: results.length,
    failures: failures.length,
  });

  if (failures.length > 0) {
    console.error('[stress] FAIL: abnormal closes or unopened sockets detected');
    process.exit(3);
  }

  console.log('[stress] PASS: all cycles opened cleanly with no spontaneous abnormal close');
  process.exit(0);
})();
