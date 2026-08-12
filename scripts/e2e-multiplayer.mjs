#!/usr/bin/env node
/**
 * Fully automated end-to-end test for the multiplayer stack.
 *
 * Unlike `smoke-multiplayer-http.mjs` this script does not need browser
 * session cookies: it talks to MongoDB directly to provision throwaway test
 * users, then mints the same short-lived JWTs that `/api/multiplayer/token`
 * hands out. Everything after that goes through the real HTTP API, so the
 * Mongo repository, optimistic locking and lazy timers are all exercised.
 *
 * USAGE
 *   node scripts/e2e-multiplayer.mjs                # against http://localhost:3000
 *   BASE_URL=http://localhost:3010 node scripts/e2e-multiplayer.mjs
 *
 * The test provisions users named `e2e-mp-*@bijbelquiz.test` and deletes both
 * them and every room it created on the way out (including on failure).
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// ── env bootstrap ──────────────────────────────────────────────────────────
// Mirrors Next.js precedence: .env.local overrides .env.
for (const file of ['.env', '.env.local']) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';
const TEST_EMAIL_DOMAIN = 'bijbelquiz.test';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set (checked .env and .env.local).');
  process.exit(2);
}

// ── tiny assertion + reporting helpers ─────────────────────────────────────
const checks = [];
let currentSection = 'general';

function section(name) {
  currentSection = name;
  console.log(`\n[1m── ${name}[0m`);
}

function pass(label, detail) {
  checks.push({ ok: true, section: currentSection, label });
  console.log(`  [32m✓[0m ${label}${detail ? ` [90m${detail}[0m` : ''}`);
}

function fail(label, detail) {
  checks.push({ ok: false, section: currentSection, label, detail });
  console.log(`  [31m✗[0m ${label}${detail ? ` [31m${detail}[0m` : ''}`);
}

function check(label, condition, detail) {
  if (condition) pass(label, detail);
  else fail(label, detail);
  return Boolean(condition);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── HTTP layer ─────────────────────────────────────────────────────────────
async function api(pathname, { method = 'GET', token, body } = {}) {
  const url = new URL(pathname, BASE_URL).toString();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  return { status: response.status, body: parsed };
}

function mintToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '2h' });
}

// ── Mongo fixtures ─────────────────────────────────────────────────────────
const createdRoomCodes = new Set();
const createdUserIds = [];

async function provisionUser(db, label, { premium }) {
  const email = `e2e-mp-${label}-${Date.now()}@${TEST_EMAIL_DOMAIN}`;
  const doc = {
    name: `E2E ${label}`,
    email,
    password: 'not-a-real-login',
    isPremium: premium,
    hasLifetimePremium: false,
    freeMultiplayerRoomCreated: false,
    multiplayerGamesHosted: 0,
    xp: 0,
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection('users').insertOne(doc);
  const id = String(result.insertedId);
  createdUserIds.push(result.insertedId);
  return { id, email, name: doc.name, token: mintToken(id) };
}

async function pickQuiz(db) {
  const quiz = await db
    .collection('quizzes')
    .findOne({ status: 'approved', 'questions.1': { $exists: true } }, { projection: { title: 1, questions: 1 } });
  if (!quiz) return null;
  return { id: String(quiz._id), title: quiz.title, questionCount: quiz.questions?.length ?? 0 };
}

async function cleanup(db) {
  if (!db) return;
  try {
    if (createdRoomCodes.size > 0) {
      await db
        .collection('multiplayerrooms')
        .deleteMany({ code: { $in: [...createdRoomCodes] } });
    }
    if (createdUserIds.length > 0) {
      await db.collection('users').deleteMany({ _id: { $in: createdUserIds } });
    }
  } catch (error) {
    console.error('  cleanup warning:', error.message);
  }
}

const API = '/api/multiplayer';
const LEGACY_API = '/api/mobile/multiplayer';

/** Mirrors MULTIPLAYER_FREE_ROOM_QUOTA in src/lib/premium-benefits.ts. */
const FREE_GAME_QUOTA = 5;

/** Force an account's hosted-game counter, to test the edges of the quota. */
async function setGamesHosted(db, userId, count) {
  await db
    .collection('users')
    .updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { multiplayerGamesHosted: count } },
    );
}

// ── the actual scenarios ───────────────────────────────────────────────────
async function run(db) {
  section('Fixtures');
  const quiz = await pickQuiz(db);
  if (!check('found an approved quiz with >= 2 questions', Boolean(quiz), quiz?.title)) {
    throw new Error('no usable quiz in the database');
  }
  console.log(`    quiz: ${quiz.title} (${quiz.questionCount} questions, id ${quiz.id})`);

  const host = await provisionUser(db, 'host', { premium: true });
  const p2 = await provisionUser(db, 'p2', { premium: false });
  const p3 = await provisionUser(db, 'p3', { premium: false });
  const freeHost = await provisionUser(db, 'freehost', { premium: false });
  pass('provisioned 4 test users');

  // ── unauthenticated access ───────────────────────────────────────────────
  section('Auth guards');
  const noAuth = await api(`${API}/rooms`, {
    method: 'POST',
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  check('create without token → 401', noAuth.status === 401, `got ${noAuth.status}`);

  const badAuth = await api(`${API}/rooms`, {
    method: 'POST',
    token: 'not-a-jwt',
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  check('create with malformed token → 401', badAuth.status === 401, `got ${badAuth.status}`);

  // ── capability probe ─────────────────────────────────────────────────────
  section('Capability probe (GET /rooms)');
  const capability = await api(`${API}/rooms`, { token: host.token });
  check('premium host capability → 200', capability.status === 200, `got ${capability.status}`);
  check('premium host may create a room', capability.body?.canCreateRoom === true);
  check('premium host max players is 20', capability.body?.maxPlayersForUser === 20, String(capability.body?.maxPlayersForUser));

  const freeCapability = await api(`${API}/rooms`, { token: freeHost.token });
  check('free host max players is 4', freeCapability.body?.maxPlayersForUser === 4, String(freeCapability.body?.maxPlayersForUser));
  check('free host has 5 free games left', freeCapability.body?.freeRoomsRemaining === FREE_GAME_QUOTA, String(freeCapability.body?.freeRoomsRemaining));
  check('capability reports the quota itself', freeCapability.body?.freeRoomsQuota === FREE_GAME_QUOTA, String(freeCapability.body?.freeRoomsQuota));
  check('premium host has unlimited games', capability.body?.freeRoomsRemaining === null, String(capability.body?.freeRoomsRemaining));

  // ── validation ───────────────────────────────────────────────────────────
  section('Create validation');
  const badQuiz = await api(`${API}/rooms`, {
    method: 'POST',
    token: host.token,
    body: { quizId: '000000000000000000000000', maxPlayers: 4 },
  });
  check('unknown quizId → 404 QUIZ_NOT_FOUND', badQuiz.status === 404 && badQuiz.body?.error?.code === 'QUIZ_NOT_FOUND', `got ${badQuiz.status} ${badQuiz.body?.error?.code}`);

  const tooManyFree = await api(`${API}/rooms`, {
    method: 'POST',
    token: freeHost.token,
    body: { quizId: quiz.id, maxPlayers: 10 },
  });
  check('free host over player cap → 403 PREMIUM_REQUIRED', tooManyFree.status === 403 && tooManyFree.body?.error?.code === 'PREMIUM_REQUIRED', `got ${tooManyFree.status} ${tooManyFree.body?.error?.code}`);

  const badPlayers = await api(`${API}/rooms`, {
    method: 'POST',
    token: host.token,
    body: { quizId: quiz.id, maxPlayers: 1 },
  });
  check('maxPlayers below 2 → 400', badPlayers.status === 400, `got ${badPlayers.status}`);

  // These two used to blow up as CastErrors and surface as 500s.
  const malformedQuiz = await api(`${API}/rooms`, {
    method: 'POST',
    token: host.token,
    body: { quizId: 'not-an-objectid', maxPlayers: 4 },
  });
  check('non-ObjectId quizId → 404, not 500', malformedQuiz.status === 404, `got ${malformedQuiz.status}`);

  const orphanToken = mintToken('google-oauth-sub-not-a-mongo-id');
  const orphanCreate = await api(`${API}/rooms`, {
    method: 'POST',
    token: orphanToken,
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  check('token with non-ObjectId userId → 401, not 500', orphanCreate.status === 401, `got ${orphanCreate.status}`);

  const expiredToken = jwt.sign({ userId: host.id }, JWT_SECRET, { expiresIn: '-1s' });
  const expiredCreate = await api(`${API}/rooms`, {
    method: 'POST',
    token: expiredToken,
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  check('expired token → 401 UNAUTHORIZED', expiredCreate.status === 401 && expiredCreate.body?.error?.code === 'UNAUTHORIZED', `got ${expiredCreate.status}`);

  // ── runtime config ───────────────────────────────────────────────────────
  section('Runtime config');
  const config = await api(`${API}/config`);
  check('config → 200 without auth', config.status === 200, `got ${config.status}`);
  check('config exposes the question timer', typeof config.body?.questionTimerSeconds === 'number', String(config.body?.questionTimerSeconds));
  check('config exposes minPlayersToStart', config.body?.minPlayersToStart === 2, String(config.body?.minPlayersToStart));
  check(
    'config exposes a poll interval per status',
    ['lobby', 'in_progress', 'question_result', 'finished'].every(
      (status) => typeof config.body?.pollIntervalsMs?.[status] === 'number',
    ),
  );

  // ── happy path: create ───────────────────────────────────────────────────
  section('Create room');
  const created = await api(`${API}/rooms`, {
    method: 'POST',
    token: host.token,
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  if (!check('host creates room → 201', created.status === 201, `got ${created.status} ${JSON.stringify(created.body?.error ?? '')}`)) {
    throw new Error('cannot continue without a room');
  }
  const room = created.body.room;
  createdRoomCodes.add(room.code);
  check('room code is 6 chars A-Z2-9', /^[A-HJ-NP-Z2-9]{6}$/.test(room.code), room.code);
  check('room starts in lobby', room.status === 'lobby', room.status);
  check('host is player #1 and flagged as host', room.players.length === 1 && room.players[0].isHost === true);
  check('room carries the quiz title', room.quizTitle === quiz.title, room.quizTitle);
  check('totalQuestions matches quiz', room.totalQuestions > 0, String(room.totalQuestions));
  check('serverTimeMs present', typeof room.serverTimeMs === 'number');

  // ── free game quota ──────────────────────────────────────────────────────
  // A free account gets FREE_GAME_QUOTA games, and a game is only paid for
  // when it actually starts. Creating (and abandoning) rooms must stay free.
  section('Free-tier game quota');
  const freeRoom = await api(`${API}/rooms`, {
    method: 'POST',
    token: freeHost.token,
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  check('free host first room → 201', freeRoom.status === 201, `got ${freeRoom.status}`);
  if (freeRoom.body?.room?.code) createdRoomCodes.add(freeRoom.body.room.code);

  const freeRoomAgain = await api(`${API}/rooms`, {
    method: 'POST',
    token: freeHost.token,
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  check('creating a second room is still free → 201', freeRoomAgain.status === 201, `got ${freeRoomAgain.status}`);
  if (freeRoomAgain.body?.room?.code) createdRoomCodes.add(freeRoomAgain.body.room.code);

  const afterCreates = await api(`${API}/rooms`, { token: freeHost.token });
  check('creating rooms spends no credits', afterCreates.body?.freeRoomsRemaining === FREE_GAME_QUOTA, String(afterCreates.body?.freeRoomsRemaining));

  // A start that the service rejects must hand the credit straight back.
  const lonelyStart = await api(`${API}/rooms/${freeRoom.body.room.code}/start`, {
    method: 'POST',
    token: freeHost.token,
  });
  check('start with 1 player → 409 MIN_PLAYERS_REQUIRED', lonelyStart.status === 409 && lonelyStart.body?.error?.code === 'MIN_PLAYERS_REQUIRED', `got ${lonelyStart.status} ${lonelyStart.body?.error?.code}`);

  const afterFailedStart = await api(`${API}/rooms`, { token: freeHost.token });
  check('a refused start refunds the credit', afterFailedStart.body?.freeRoomsRemaining === FREE_GAME_QUOTA, String(afterFailedStart.body?.freeRoomsRemaining));

  await setGamesHosted(db, freeHost.id, FREE_GAME_QUOTA);

  const exhausted = await api(`${API}/rooms`, { token: freeHost.token });
  check('exhausted quota → 0 games left', exhausted.body?.freeRoomsRemaining === 0, String(exhausted.body?.freeRoomsRemaining));
  check('exhausted quota → canCreateRoom false', exhausted.body?.canCreateRoom === false, String(exhausted.body?.canCreateRoom));
  check('exhausted quota → legacy hasUsedFreeRoom true', exhausted.body?.hasUsedFreeRoom === true, String(exhausted.body?.hasUsedFreeRoom));

  const blockedCreate = await api(`${API}/rooms`, {
    method: 'POST',
    token: freeHost.token,
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  check('create on empty quota → 403 PREMIUM_REQUIRED', blockedCreate.status === 403 && blockedCreate.body?.error?.code === 'PREMIUM_REQUIRED', `got ${blockedCreate.status} ${blockedCreate.body?.error?.code}`);

  // The quota is checked before the room state is, so this beats the
  // "not enough players" error rather than hiding behind it.
  const blockedStart = await api(`${API}/rooms/${freeRoom.body.room.code}/start`, {
    method: 'POST',
    token: freeHost.token,
  });
  check('start on empty quota → 403 PREMIUM_REQUIRED', blockedStart.status === 403 && blockedStart.body?.error?.code === 'PREMIUM_REQUIRED', `got ${blockedStart.status} ${blockedStart.body?.error?.code}`);

  // A legacy account carries the old boolean and no counter: that must read
  // as exactly one game used, not as a fresh quota.
  const legacyHost = await provisionUser(db, 'legacy', { premium: false });
  await db.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(legacyHost.id) },
    { $set: { freeMultiplayerRoomCreated: true }, $unset: { multiplayerGamesHosted: '' } },
  );
  const legacyQuota = await api(`${API}/rooms`, { token: legacyHost.token });
  check('legacy one-room account keeps 4 games', legacyQuota.body?.freeRoomsRemaining === FREE_GAME_QUOTA - 1, String(legacyQuota.body?.freeRoomsRemaining));

  await setGamesHosted(db, freeHost.id, 0);

  // ── join ─────────────────────────────────────────────────────────────────
  section('Join room');
  const unknownJoin = await api(`${API}/rooms/ZZZZZZ/join`, {
    method: 'POST',
    token: p2.token,
  });
  check('join unknown code → 404 ROOM_NOT_FOUND', unknownJoin.status === 404 && unknownJoin.body?.error?.code === 'ROOM_NOT_FOUND', `got ${unknownJoin.status} ${unknownJoin.body?.error?.code}`);

  const join2 = await api(`${API}/rooms/${room.code}/join`, {
    method: 'POST',
    token: p2.token,
  });
  check('p2 joins → 200', join2.status === 200, `got ${join2.status} ${JSON.stringify(join2.body?.error ?? '')}`);
  check('p2 sees 2 players', join2.body?.room?.players?.length === 2, String(join2.body?.room?.players?.length));

  const joinLower = await api(`${API}/rooms/${room.code.toLowerCase()}/join`, {
    method: 'POST',
    token: p3.token,
  });
  check('lowercase room code is accepted', joinLower.status === 200, `got ${joinLower.status}`);
  check('p3 joined → 3 players', joinLower.body?.room?.players?.length === 3, String(joinLower.body?.room?.players?.length));

  const rejoin = await api(`${API}/rooms/${room.code}/join`, {
    method: 'POST',
    token: p2.token,
  });
  check('re-join is idempotent (no duplicate player)', rejoin.status === 200 && rejoin.body?.room?.players?.length === 3, `players=${rejoin.body?.room?.players?.length}`);

  // ── active-room resume ───────────────────────────────────────────────────
  section('Active-room resume');
  const activeForP2 = await api(`${API}/rooms/active`, { token: p2.token });
  check('active room → 200', activeForP2.status === 200, `got ${activeForP2.status}`);
  check('active room is the one p2 joined', activeForP2.body?.room?.code === room.code, activeForP2.body?.room?.code);

  const strangerToken = mintToken(String(new mongoose.Types.ObjectId()));
  const activeForStranger = await api(`${API}/rooms/active`, { token: strangerToken });
  check('no active room → 200 with null', activeForStranger.status === 200 && activeForStranger.body?.room === null, `got ${activeForStranger.status} ${JSON.stringify(activeForStranger.body)}`);

  // ── legacy mobile aliases still work ─────────────────────────────────────
  section('Legacy /api/mobile aliases');
  const legacySnapshot = await api(`${LEGACY_API}/rooms/${room.code}`, { token: host.token });
  check('legacy GET room → 200', legacySnapshot.status === 200, `got ${legacySnapshot.status}`);
  check('legacy and canonical return the same room', legacySnapshot.body?.room?.code === room.code);

  const legacyCapability = await api(`${LEGACY_API}/rooms`, { token: host.token });
  check('legacy capability probe → 200', legacyCapability.status === 200, `got ${legacyCapability.status}`);

  const legacyRejoin = await api(`${LEGACY_API}/rooms/${room.code}/join`, {
    method: 'POST',
    token: p3.token,
  });
  check('legacy join → 200', legacyRejoin.status === 200, `got ${legacyRejoin.status}`);

  // ── cross-client visibility (the Vercel bug class) ───────────────────────
  section('Cross-client snapshot consistency');
  let consistent = true;
  for (let i = 0; i < 4; i += 1) {
    const [a, b, c] = await Promise.all([
      api(`${API}/rooms/${room.code}`, { token: host.token }),
      api(`${API}/rooms/${room.code}`, { token: p2.token }),
      api(`${API}/rooms/${room.code}`, { token: p3.token }),
    ]);
    const counts = [a, b, c].map((r) => r.body?.room?.players?.length);
    if (a.status !== 200 || b.status !== 200 || c.status !== 200 || counts.some((n) => n !== 3)) {
      consistent = false;
      fail(`parallel poll #${i}`, `statuses=${[a.status, b.status, c.status]} players=${counts}`);
      break;
    }
    await sleep(150);
  }
  if (consistent) pass('4 rounds of 3-way parallel polling stay consistent');

  // ── start guards ─────────────────────────────────────────────────────────
  section('Start guards');
  const nonHostStart = await api(`${API}/rooms/${room.code}/start`, {
    method: 'POST',
    token: p2.token,
  });
  check('non-host start → 403 NOT_HOST', nonHostStart.status === 403 && nonHostStart.body?.error?.code === 'NOT_HOST', `got ${nonHostStart.status} ${nonHostStart.body?.error?.code}`);

  const soloRoom = await api(`${API}/rooms`, {
    method: 'POST',
    token: host.token,
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  if (soloRoom.body?.room?.code) {
    createdRoomCodes.add(soloRoom.body.room.code);
    const soloStart = await api(`${API}/rooms/${soloRoom.body.room.code}/start`, {
      method: 'POST',
      token: host.token,
    });
    check('start with 1 player → 409 MIN_PLAYERS_REQUIRED', soloStart.status === 409 && soloStart.body?.error?.code === 'MIN_PLAYERS_REQUIRED', `got ${soloStart.status} ${soloStart.body?.error?.code}`);
  }

  // ── play a full game ─────────────────────────────────────────────────────
  section('Full game');
  const started = await api(`${API}/rooms/${room.code}/start`, {
    method: 'POST',
    token: host.token,
  });
  if (!check('host starts → 200 in_progress', started.status === 200 && started.body?.room?.status === 'in_progress', `got ${started.status} ${started.body?.room?.status}`)) {
    throw new Error('cannot continue without a started game');
  }
  check('first question is delivered', Boolean(started.body.room.currentQuestion?.id));
  check('correctAnswerId is hidden while answering', started.body.room.currentQuestion?.correctAnswerId === null);
  check('deadlineAtMs is set', typeof started.body.room.currentQuestion?.deadlineAtMs === 'number');

  const midJoin = await api(`${API}/rooms/${room.code}/join`, {
    method: 'POST',
    token: freeHost.token,
  });
  check('mid-game join → 409 ROOM_ALREADY_STARTED', midJoin.status === 409 && midJoin.body?.error?.code === 'ROOM_ALREADY_STARTED', `got ${midJoin.status} ${midJoin.body?.error?.code}`);

  // The web client falls back to a plain read when a join is refused, so that
  // read has to keep working for a non-member.
  const midRead = await api(`${API}/rooms/${room.code}`, { token: freeHost.token });
  check('non-member can still read a started room', midRead.status === 200, `got ${midRead.status}`);

  const firstQuestion = started.body.room.currentQuestion;
  const firstAnswer = await api(`${API}/rooms/${room.code}/answer`, {
    method: 'POST',
    token: host.token,
    body: { questionId: firstQuestion.id, answerId: firstQuestion.answers[0].id },
  });
  check('answer response carries ok + the updated room', firstAnswer.status === 200 && firstAnswer.body?.ok === true && Boolean(firstAnswer.body?.room), `got ${firstAnswer.status}`);
  check('answer response echoes the caller choice', firstAnswer.body?.room?.currentQuestion?.yourAnswerId === firstQuestion.answers[0].id, String(firstAnswer.body?.room?.currentQuestion?.yourAnswerId));

  const duplicateAnswer = await api(`${API}/rooms/${room.code}/answer`, {
    method: 'POST',
    token: host.token,
    body: { questionId: firstQuestion.id, answerId: firstQuestion.answers[0].id },
  });
  check('second answer for the same question → 409', duplicateAnswer.status === 409, `got ${duplicateAnswer.status} ${duplicateAnswer.body?.error?.code}`);

  const totalQuestions = started.body.room.totalQuestions;
  const players = [host, p2, p3];
  let finished = started.body.room.status === 'finished';
  let answeredQuestions = 0;
  let concurrentAnswerFailures = 0;
  const deadline = Date.now() + 120_000;

  while (!finished && Date.now() < deadline) {
    const snapshot = await api(`${API}/rooms/${room.code}`, { token: host.token });
    if (snapshot.status !== 200) {
      fail('poll during game', `status ${snapshot.status}`);
      break;
    }
    const current = snapshot.body.room;

    if (current.status === 'finished') {
      finished = true;
      break;
    }

    if (current.status === 'question_result') {
      // Correct answer must be revealed exactly in this phase.
      if (current.currentQuestion && current.currentQuestion.correctAnswerId == null) {
        fail('correct answer revealed during question_result');
      }
      // Exercise the host skip endpoint instead of waiting out the full
      // questionResultDelayMs on every question - both keeps this loop inside
      // its timeout budget and gives /advance permanent regression coverage.
      const skip = await api(`${API}/rooms/${room.code}/advance`, { method: 'POST', token: host.token });
      if (skip.status !== 200) {
        fail('host advance during question_result', `${skip.status} ${JSON.stringify(skip.body?.error ?? '')}`);
      }
      await sleep(150);
      continue;
    }

    if (current.status === 'in_progress' && current.currentQuestion) {
      const question = current.currentQuestion;
      // All three answer simultaneously - this is the optimistic-locking test.
      const responses = await Promise.all(
        players.map((player, index) =>
          api(`${API}/rooms/${room.code}/answer`, {
            method: 'POST',
            token: player.token,
            body: {
              questionId: question.id,
              answerId: question.answers[index % question.answers.length].id,
            },
          }),
        ),
      );
      for (const response of responses) {
        // 409 ANSWER_ALREADY_SUBMITTED is legitimate if the phase flipped.
        if (response.status !== 200 && response.body?.error?.code !== 'ANSWER_ALREADY_SUBMITTED' && response.body?.error?.code !== 'GAME_NOT_IN_PROGRESS' && response.body?.error?.code !== 'QUESTION_MISMATCH') {
          concurrentAnswerFailures += 1;
          fail('concurrent answer submit', `${response.status} ${JSON.stringify(response.body?.error ?? '')}`);
        }
      }
      answeredQuestions += 1;
      await sleep(200);
      continue;
    }

    await sleep(250);
  }

  check(`played all ${totalQuestions} questions`, answeredQuestions >= totalQuestions, `answered ${answeredQuestions}`);
  check('no failures under 3-way concurrent answering', concurrentAnswerFailures === 0, `${concurrentAnswerFailures} failures`);
  check('game reached finished state', finished);

  // ── results ──────────────────────────────────────────────────────────────
  section('Results');
  const results = await api(`${API}/rooms/${room.code}/results`, { token: host.token });
  check('results → 200', results.status === 200, `got ${results.status}`);
  const entries = results.body?.results ?? [];
  check('results list has 3 players', entries.length === 3, String(entries.length));
  check('results are rank-ordered', entries.every((entry, index) => entry.rank === index + 1));
  check('scores are descending', entries.every((entry, index) => index === 0 || entries[index - 1].score >= entry.score));

  const p2Results = await api(`${API}/rooms/${room.code}/results`, { token: p2.token });
  check('every player sees the same results', JSON.stringify(p2Results.body?.results) === JSON.stringify(entries));

  // ── leave ────────────────────────────────────────────────────────────────
  section('Leave');
  const leave = await api(`${API}/rooms/${room.code}/leave`, {
    method: 'POST',
    token: p3.token,
  });
  check('leave → 200 ok', leave.status === 200 && leave.body?.ok === true, `got ${leave.status}`);

  const leaveTwice = await api(`${API}/rooms/${room.code}/leave`, {
    method: 'POST',
    token: p3.token,
  });
  check('leave is idempotent', leaveTwice.status === 200, `got ${leaveTwice.status}`);

  const leaveUnknown = await api(`${API}/rooms/ZZZZZZ/leave`, {
    method: 'POST',
    token: p3.token,
  });
  check('leave unknown room does not 500', leaveUnknown.status === 200 || leaveUnknown.status === 404, `got ${leaveUnknown.status}`);

  // ── lobby teardown ───────────────────────────────────────────────────────
  section('Lobby teardown');
  const teardown = await api(`${API}/rooms`, {
    method: 'POST',
    token: host.token,
    body: { quizId: quiz.id, maxPlayers: 4 },
  });
  if (teardown.body?.room?.code) {
    const code = teardown.body.room.code;
    createdRoomCodes.add(code);
    await api(`${API}/rooms/${code}/leave`, { method: 'POST', token: host.token });
    const gone = await api(`${API}/rooms/${code}`, { token: host.token });
    check('last player leaving the lobby deletes the room', gone.status === 404, `got ${gone.status}`);

    const hostTransferRoom = await api(`${API}/rooms`, {
      method: 'POST',
      token: host.token,
      body: { quizId: quiz.id, maxPlayers: 4 },
    });
    if (hostTransferRoom.body?.room?.code) {
      const transferCode = hostTransferRoom.body.room.code;
      createdRoomCodes.add(transferCode);
      await api(`${API}/rooms/${transferCode}/join`, { method: 'POST', token: p2.token });
      await api(`${API}/rooms/${transferCode}/leave`, { method: 'POST', token: host.token });
      const afterTransfer = await api(`${API}/rooms/${transferCode}`, { token: p2.token });
      const newHost = afterTransfer.body?.room?.players?.find((p) => p.isHost);
      check('host leaving the lobby transfers host to the next player', newHost?.id === p2.id, `host is ${newHost?.id}`);
    }
  }
}

// ── entrypoint ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`[1mMultiplayer E2E[0m  base=${BASE_URL}`);

  const health = await fetch(new URL('/api/categories', BASE_URL).toString()).catch(() => null);
  if (!health) {
    console.error(`\nCannot reach ${BASE_URL}. Start the dev server first.`);
    process.exit(2);
  }

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  try {
    await run(db);
  } catch (error) {
    fail('fatal', error.message);
  } finally {
    await cleanup(db);
    await mongoose.disconnect();
  }

  const failed = checks.filter((entry) => !entry.ok);
  console.log(
    `\n[1m${checks.length - failed.length}/${checks.length} checks passed[0m`,
  );
  if (failed.length > 0) {
    console.log('\nFailures:');
    for (const entry of failed) {
      console.log(`  [31m✗[0m [${entry.section}] ${entry.label}${entry.detail ? ` - ${entry.detail}` : ''}`);
    }
    process.exit(1);
  }
  console.log('[32mAll multiplayer E2E checks passed.[0m');
}

main().catch((error) => {
  console.error('E2E harness crashed:', error);
  process.exit(1);
});
