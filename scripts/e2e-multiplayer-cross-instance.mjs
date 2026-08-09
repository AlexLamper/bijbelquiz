#!/usr/bin/env node
/**
 * Cross-instance multiplayer test.
 *
 * On Vercel every request may be served by a different serverless instance.
 * The historical "Room niet gevonden" bug came from room state living in one
 * instance's memory. This test proves that is gone by pointing each virtual
 * player at a *different server process* backed by the same MongoDB, and
 * deliberately alternating instances between steps of a single game.
 *
 * USAGE
 *   Start two servers against the same database, then:
 *     INSTANCE_A=http://localhost:3010 INSTANCE_B=http://localhost:3011 \
 *       node scripts/e2e-multiplayer-cross-instance.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

for (const file of ['.env', '.env.local']) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    process.env[line.slice(0, eq).trim()] = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
}

const INSTANCE_A = process.env.INSTANCE_A || 'http://localhost:3010';
const INSTANCE_B = process.env.INSTANCE_B || 'http://localhost:3011';
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set.');
  process.exit(2);
}

const checks = [];
function check(label, condition, detail) {
  checks.push({ ok: Boolean(condition), label, detail });
  const mark = condition ? '[32m✓[0m' : '[31m✗[0m';
  console.log(`  ${mark} ${label}${detail ? ` [90m${detail}[0m` : ''}`);
  return Boolean(condition);
}

async function api(baseUrl, pathname, { method = 'GET', token, body } = {}) {
  const response = await fetch(new URL(pathname, baseUrl).toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log(`[1mCross-instance multiplayer[0m  A=${INSTANCE_A}  B=${INSTANCE_B}`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const userIds = [];
  const roomCodes = [];

  const makeUser = async (label) => {
    const result = await db.collection('users').insertOne({
      name: `Cross ${label}`,
      email: `e2e-cross-${label}-${Date.now()}@bijbelquiz.test`,
      isPremium: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userIds.push(result.insertedId);
    const id = String(result.insertedId);
    return { id, token: jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '2h' }) };
  };

  try {
    const quiz = await db
      .collection('quizzes')
      .findOne({ status: 'approved', 'questions.1': { $exists: true } }, { projection: { title: 1 } });
    if (!check('found an approved quiz', Boolean(quiz), quiz?.title)) return;

    const alice = await makeUser('alice');
    const bob = await makeUser('bob');

    // Alice lives on instance A, Bob on instance B, for the whole game.
    const created = await api(INSTANCE_A, '/api/multiplayer/rooms', {
      method: 'POST',
      token: alice.token,
      body: { quizId: String(quiz._id), maxPlayers: 4 },
    });
    if (!check('A: create room → 201', created.status === 201, `got ${created.status}`)) return;
    const code = created.body.room.code;
    roomCodes.push(code);

    const joined = await api(INSTANCE_B, `/api/multiplayer/rooms/${code}/join`, {
      method: 'POST',
      token: bob.token,
    });
    check('B: join a room created on A → 200', joined.status === 200, `got ${joined.status}`);
    check('B sees both players', joined.body?.room?.players?.length === 2, String(joined.body?.room?.players?.length));

    const aliceSees = await api(INSTANCE_A, `/api/multiplayer/rooms/${code}`, { token: alice.token });
    check('A sees the player who joined on B', aliceSees.body?.room?.players?.length === 2, String(aliceSees.body?.room?.players?.length));

    const started = await api(INSTANCE_A, `/api/multiplayer/rooms/${code}/start`, {
      method: 'POST',
      token: alice.token,
    });
    check('A: host starts → in_progress', started.body?.room?.status === 'in_progress', String(started.status));

    const bobSeesStart = await api(INSTANCE_B, `/api/multiplayer/rooms/${code}`, { token: bob.token });
    check('B immediately sees the game started on A', bobSeesStart.body?.room?.status === 'in_progress', bobSeesStart.body?.room?.status);
    check('B receives the current question', Boolean(bobSeesStart.body?.room?.currentQuestion?.id));

    // Play the whole quiz with the two players permanently split across
    // instances, answering simultaneously every round.
    const totalQuestions = started.body.room.totalQuestions;
    let rounds = 0;
    let errors = 0;
    let finished = false;
    const deadline = Date.now() + 120_000;

    while (!finished && Date.now() < deadline) {
      const snapshot = await api(INSTANCE_B, `/api/multiplayer/rooms/${code}`, { token: bob.token });
      const room = snapshot.body?.room;
      if (!room) {
        errors += 1;
        break;
      }

      if (room.status === 'finished') {
        finished = true;
        break;
      }

      if (room.status === 'in_progress' && room.currentQuestion) {
        const question = room.currentQuestion;
        const [fromA, fromB] = await Promise.all([
          api(INSTANCE_A, `/api/multiplayer/rooms/${code}/answer`, {
            method: 'POST',
            token: alice.token,
            body: { questionId: question.id, answerId: question.answers[0].id },
          }),
          api(INSTANCE_B, `/api/multiplayer/rooms/${code}/answer`, {
            method: 'POST',
            token: bob.token,
            body: { questionId: question.id, answerId: question.answers[1 % question.answers.length].id },
          }),
        ]);

        for (const response of [fromA, fromB]) {
          const code_ = response.body?.error?.code;
          const tolerated =
            response.status === 200 ||
            code_ === 'ANSWER_ALREADY_SUBMITTED' ||
            code_ === 'GAME_NOT_IN_PROGRESS' ||
            code_ === 'QUESTION_MISMATCH';
          if (!tolerated) {
            errors += 1;
            console.log(`      unexpected: ${response.status} ${JSON.stringify(response.body?.error ?? '')}`);
          }
        }

        rounds += 1;
      }

      await sleep(200);
    }

    check(`played all ${totalQuestions} questions across two instances`, rounds >= totalQuestions, `rounds=${rounds}`);
    check('no errors while writing from two instances at once', errors === 0, `${errors} errors`);
    check('game finished', finished);

    const resultsA = await api(INSTANCE_A, `/api/multiplayer/rooms/${code}/results`, { token: alice.token });
    const resultsB = await api(INSTANCE_B, `/api/multiplayer/rooms/${code}/results`, { token: bob.token });
    check('both instances report identical results', JSON.stringify(resultsA.body) === JSON.stringify(resultsB.body));
    check('scores were recorded', (resultsA.body?.results ?? []).some((entry) => entry.score > 0));
  } finally {
    if (roomCodes.length) await db.collection('multiplayerrooms').deleteMany({ code: { $in: roomCodes } });
    if (userIds.length) await db.collection('users').deleteMany({ _id: { $in: userIds } });
    await mongoose.disconnect();
  }

  const failed = checks.filter((entry) => !entry.ok);
  console.log(`\n[1m${checks.length - failed.length}/${checks.length} checks passed[0m`);
  if (failed.length > 0) process.exit(1);
  console.log('[32mCross-instance multiplayer works.[0m');
}

main().catch((error) => {
  console.error('Cross-instance harness crashed:', error);
  process.exit(1);
});
