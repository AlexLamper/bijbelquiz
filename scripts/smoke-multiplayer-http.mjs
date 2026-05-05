#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Smoke test for the polling-only multiplayer architecture.
 *
 * Spins up two virtual players (host + p2) against a live dev server and
 * walks through:
 *   1. Both fetch auth tokens (requires real session cookies — see USAGE).
 *   2. Host creates a room.
 *   3. p2 joins by code from a "different instance" perspective (separate
 *      fetch context). This is the exact case that fails on Vercel today.
 *   4. Both poll the room snapshot in parallel and verify they see each
 *      other.
 *   5. Host starts the game.
 *   6. Both submit answers.
 *   7. Verify the final results.
 *
 * USAGE:
 *   1. Sign in as two different users in two browser tabs.
 *   2. Copy the `next-auth.session-token` cookie value from each tab's
 *      DevTools.
 *   3. Run:
 *        $env:HOST_SESSION_TOKEN="<host_token>"
 *        $env:P2_SESSION_TOKEN="<p2_token>"
 *        $env:QUIZ_ID="<quiz mongo _id>"
 *        node scripts/smoke-multiplayer-http.mjs
 *
 *   Optional: BASE_URL (default http://localhost:3000)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HOST_SESSION_TOKEN = process.env.HOST_SESSION_TOKEN;
const P2_SESSION_TOKEN = process.env.P2_SESSION_TOKEN;
const QUIZ_ID = process.env.QUIZ_ID;

if (!HOST_SESSION_TOKEN || !P2_SESSION_TOKEN || !QUIZ_ID) {
  console.error('Missing env. See file header for usage.');
  process.exit(2);
}

function logStep(label, value = '') {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${label}${value ? ` → ${typeof value === 'string' ? value : JSON.stringify(value)}` : ''}`);
}

async function fetchJson(path, options = {}, sessionToken) {
  const url = new URL(path, BASE_URL).toString();
  const headers = {
    'Content-Type': 'application/json',
    Cookie: `next-auth.session-token=${sessionToken}; __Secure-next-auth.session-token=${sessionToken}`,
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

async function fetchAuthToken(sessionToken) {
  const res = await fetchJson('/api/multiplayer/token', {}, sessionToken);
  if (res.status !== 200 || typeof res.body?.token !== 'string') {
    throw new Error(`Token fetch failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

async function bearerFetch(path, options = {}, mpToken, sessionToken) {
  return fetchJson(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${mpToken}`,
      ...(options.headers || {}),
    },
  }, sessionToken);
}

async function main() {
  logStep('Fetching tokens');
  const [hostToken, p2Token] = await Promise.all([
    fetchAuthToken(HOST_SESSION_TOKEN),
    fetchAuthToken(P2_SESSION_TOKEN),
  ]);
  logStep('Tokens acquired', { hostLen: hostToken.length, p2Len: p2Token.length });

  logStep('Host creating room');
  const create = await bearerFetch('/api/mobile/multiplayer/rooms', {
    method: 'POST',
    body: JSON.stringify({ quizId: QUIZ_ID, maxPlayers: 4 }),
  }, hostToken, HOST_SESSION_TOKEN);
  if (create.status !== 201) {
    throw new Error(`Create room failed: ${create.status} ${JSON.stringify(create.body)}`);
  }
  const roomCode = create.body.room.code;
  logStep('Room created', { code: roomCode, status: create.body.room.status });

  logStep('p2 joining');
  const joined = await bearerFetch(
    `/api/mobile/multiplayer/rooms/${roomCode}/join`,
    { method: 'POST' },
    p2Token,
    P2_SESSION_TOKEN,
  );
  if (joined.status !== 200) {
    throw new Error(`Join failed: ${joined.status} ${JSON.stringify(joined.body)}`);
  }
  logStep('p2 joined', { players: joined.body.room.players.length });

  // Multi-poll concurrent reads from both perspectives — proves cross-
  // instance consistency on Vercel.
  logStep('Polling 5x in parallel from both clients');
  for (let i = 0; i < 5; i += 1) {
    const [hostSnap, p2Snap] = await Promise.all([
      bearerFetch(`/api/mobile/multiplayer/rooms/${roomCode}`, {}, hostToken, HOST_SESSION_TOKEN),
      bearerFetch(`/api/mobile/multiplayer/rooms/${roomCode}`, {}, p2Token, P2_SESSION_TOKEN),
    ]);
    if (hostSnap.status !== 200) throw new Error(`Host poll #${i} failed: ${hostSnap.status}`);
    if (p2Snap.status !== 200) throw new Error(`P2 poll #${i} failed: ${p2Snap.status}`);
    if (hostSnap.body.room.players.length !== 2) {
      throw new Error(`Host poll #${i} sees ${hostSnap.body.room.players.length} players, expected 2`);
    }
    if (p2Snap.body.room.players.length !== 2) {
      throw new Error(`P2 poll #${i} sees ${p2Snap.body.room.players.length} players, expected 2`);
    }
    logStep(`Poll #${i}`, { hostRev: hostSnap.body.room.revision, p2Rev: p2Snap.body.room.revision });
    await new Promise((r) => setTimeout(r, 500));
  }

  logStep('Host starting game');
  const started = await bearerFetch(
    `/api/mobile/multiplayer/rooms/${roomCode}/start`,
    { method: 'POST' },
    hostToken,
    HOST_SESSION_TOKEN,
  );
  if (started.status !== 200) {
    throw new Error(`Start failed: ${started.status} ${JSON.stringify(started.body)}`);
  }
  logStep('Game started', { status: started.body.room.status });

  // Both submit an answer to the first question.
  const q = started.body.room.currentQuestion;
  logStep('Both submitting answers', { questionId: q.id });
  const [hostA, p2A] = await Promise.all([
    bearerFetch(
      `/api/mobile/multiplayer/rooms/${roomCode}/answer`,
      { method: 'POST', body: JSON.stringify({ questionId: q.id, answerId: q.answers[0].id }) },
      hostToken,
      HOST_SESSION_TOKEN,
    ),
    bearerFetch(
      `/api/mobile/multiplayer/rooms/${roomCode}/answer`,
      { method: 'POST', body: JSON.stringify({ questionId: q.id, answerId: q.answers[0].id }) },
      p2Token,
      P2_SESSION_TOKEN,
    ),
  ]);
  if (hostA.status !== 200 || p2A.status !== 200) {
    throw new Error(`Answer submit failed: host=${hostA.status} p2=${p2A.status}`);
  }
  logStep('Answers submitted');

  // Cleanup
  logStep('Both leaving');
  await Promise.all([
    bearerFetch(`/api/mobile/multiplayer/rooms/${roomCode}/leave`, { method: 'POST' }, hostToken, HOST_SESSION_TOKEN),
    bearerFetch(`/api/mobile/multiplayer/rooms/${roomCode}/leave`, { method: 'POST' }, p2Token, P2_SESSION_TOKEN),
  ]);

  console.log('\n✅ Smoke test PASSED — multiplayer works end-to-end via HTTP polling');
}

main().catch((err) => {
  console.error('\n❌ Smoke test FAILED:', err.message || err);
  process.exit(1);
});
