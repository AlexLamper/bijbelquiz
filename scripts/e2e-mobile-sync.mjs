#!/usr/bin/env node
/**
 * End-to-end check that mobile and web share one source of gamification truth.
 *
 * Mobile used to POST to a route that did not exist, so solo quizzes played in
 * the app awarded nothing. This script provisions a throwaway user, mints the
 * same token `/api/mobile/login` hands out, submits an attempt through the
 * mobile route, and asserts that XP, streak, badges and lifetime totals all
 * moved — and that the web-facing endpoints report the same numbers.
 *
 * USAGE
 *   npm run dev                       # in another terminal
 *   node scripts/e2e-mobile-sync.mjs
 *   BASE_URL=http://localhost:3010 node scripts/e2e-mobile-sync.mjs
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

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';
const TEST_EMAIL = 'e2e-mobile-sync@bijbelquiz.test';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set (checked .env and .env.local).');
  process.exit(2);
}

const checks = [];

function check(ok, label, detail) {
  checks.push({ ok, label });
  const mark = ok ? '[32m✓[0m' : '[31m✗[0m';
  console.log(`  ${mark} ${label}${detail ? ` [90m${detail}[0m` : ''}`);
}

function section(name) {
  console.log(`\n[1m── ${name}[0m`);
}

async function api(pathname, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Some routes answer with a bare string body on error.
  }

  return { status: response.status, json, text };
}

let userId = null;

async function provision() {
  await mongoose.connect(MONGODB_URI);

  const users = mongoose.connection.collection('users');
  const quizzes = mongoose.connection.collection('quizzes');

  await users.deleteOne({ email: TEST_EMAIL });

  const now = new Date();
  const inserted = await users.insertOne({
    name: 'E2E Mobile',
    email: TEST_EMAIL,
    isPremium: false,
    xp: 0,
    level: 1,
    levelTitle: 'Zoeker',
    streak: 0,
    bestStreak: 0,
    badges: [],
    quizzesPlayed: 0,
    averageScore: 0,
    role: 'user',
    createdAt: now,
    updatedAt: now,
  });

  userId = inserted.insertedId;

  const quiz = await quizzes.findOne({
    status: 'approved',
    isActive: { $ne: false },
    'questions.0': { $exists: true },
  });

  if (!quiz) {
    console.error('No approved quiz with questions found — cannot run.');
    process.exit(2);
  }

  return quiz;
}

async function cleanup() {
  if (mongoose.connection.readyState !== 1) return;
  const users = mongoose.connection.collection('users');
  const progress = mongoose.connection.collection('userprogresses');
  if (userId) {
    await progress.deleteMany({ userId });
    await users.deleteOne({ _id: userId });
  }
}

/**
 * Answer every question correctly by index, which is what the app sends.
 * The server re-grades from the stored quiz, so a wrong index would score zero.
 */
function buildAnswers(quiz) {
  return quiz.questions.map((question) => {
    const index = (question.answers || []).findIndex((answer) => answer.isCorrect);
    return { selectedAnswerIndex: index >= 0 ? index : 0 };
  });
}

async function main() {
  console.log(`\nMobile ↔ web sync check against ${BASE_URL}\n`);

  const quiz = await provision();
  const token = jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: '30d' });
  const totalQuestions = quiz.questions.length;
  const expectedXp = Math.round(quiz.rewardXp ?? 50);

  section('mobile token is accepted by shared routes');

  const profileBefore = await api('/api/mobile/profile', { token });
  check(profileBefore.status === 200, 'GET /api/mobile/profile', `HTTP ${profileBefore.status}`);
  check(profileBefore.json?.xp === 0, 'starts at 0 XP', `xp=${profileBefore.json?.xp}`);
  check(
    typeof profileBefore.json?.levelProgress === 'number',
    'profile carries levelProgress',
    `levelProgress=${profileBefore.json?.levelProgress}`
  );
  check(
    typeof profileBefore.json?.quizzesPlayed === 'number',
    'profile carries lifetime quizzesPlayed',
    `quizzesPlayed=${profileBefore.json?.quizzesPlayed}`
  );

  const badges = await api('/api/mobile/badges');
  const badgeIds = (badges.json?.badges || []).map((badge) => badge.id);
  check(badges.status === 200, 'GET /api/mobile/badges', `HTTP ${badges.status}`);
  check(
    badgeIds.includes('first_steps') && badgeIds.includes('all_rounder'),
    'badge catalogue is served',
    `${badgeIds.length} badges`
  );

  section('a mobile attempt writes through the shared logic');

  const submit = await api('/api/mobile/progress', {
    token,
    method: 'POST',
    body: {
      quizId: quiz._id.toString(),
      correctAnswers: totalQuestions,
      totalQuestions,
      answers: buildAnswers(quiz),
    },
  });

  check(submit.status === 200, 'POST /api/mobile/progress', `HTTP ${submit.status}`);
  check(
    submit.json?.score === totalQuestions,
    'server re-graded a perfect run',
    `score=${submit.json?.score}/${totalQuestions}`
  );
  check(
    submit.json?.xpEarned === expectedXp,
    'awarded the full quiz reward',
    `xpEarned=${submit.json?.xpEarned}, expected=${expectedXp}`
  );
  check(submit.json?.streak === 1, 'streak started', `streak=${submit.json?.streak}`);
  check(
    (submit.json?.newBadges || []).includes('first_steps') &&
      (submit.json?.newBadges || []).includes('perfect_score'),
    'unlocked first_steps and perfect_score',
    (submit.json?.newBadges || []).join(', ')
  );

  section('replaying the same quiz earns nothing extra');

  const replay = await api('/api/mobile/progress', {
    token,
    method: 'POST',
    body: {
      quizId: quiz._id.toString(),
      correctAnswers: totalQuestions,
      totalQuestions,
      answers: buildAnswers(quiz),
    },
  });

  check(replay.status === 200, 'POST /api/mobile/progress (replay)', `HTTP ${replay.status}`);
  check(replay.json?.xpEarned === 0, 'anti-farm held', `xpEarned=${replay.json?.xpEarned}`);
  check(replay.json?.farmPrevented === true, 'farmPrevented flagged');
  check(
    replay.json?.xp === expectedXp,
    'total XP unchanged by the replay',
    `xp=${replay.json?.xp}`
  );

  section('mobile and web report the same player');

  const profileAfter = await api('/api/mobile/profile', { token });
  const stats = await api('/api/user/stats', { token });
  const progress = await api('/api/user/progress', { token });

  check(stats.status === 200, 'GET /api/user/stats accepts the mobile token', `HTTP ${stats.status}`);
  check(
    profileAfter.json?.xp === stats.json?.xp,
    'XP matches across mobile profile and web stats',
    `${profileAfter.json?.xp} vs ${stats.json?.xp}`
  );
  check(
    profileAfter.json?.level === stats.json?.level,
    'level matches',
    `${profileAfter.json?.level} vs ${stats.json?.level}`
  );
  check(
    profileAfter.json?.levelProgress === stats.json?.levelProgress,
    'level progress matches',
    `${profileAfter.json?.levelProgress}% vs ${stats.json?.levelProgress}%`
  );
  check(
    profileAfter.json?.nextLevelXp === stats.json?.nextLevelXp,
    'next-level threshold matches',
    `${profileAfter.json?.nextLevelXp} vs ${stats.json?.nextLevelXp}`
  );
  check(
    profileAfter.json?.quizzesPlayed === stats.json?.totalQuizzes,
    'lifetime quiz count matches',
    `${profileAfter.json?.quizzesPlayed} vs ${stats.json?.totalQuizzes}`
  );
  check(
    JSON.stringify(profileAfter.json?.badges) === JSON.stringify(stats.json?.badges),
    'badge lists match',
    (profileAfter.json?.badges || []).join(', ')
  );
  check(
    progress.status === 200 && Array.isArray(progress.json) && progress.json.length === 2,
    'GET /api/user/progress lists both attempts',
    `HTTP ${progress.status}, ${progress.json?.length} rows`
  );

  section('the leaderboard knows who is asking');

  const leaderboard = await api('/api/mobile/leaderboard?period=all-time', { token });
  check(leaderboard.status === 200, 'GET /api/mobile/leaderboard', `HTTP ${leaderboard.status}`);
  check(
    leaderboard.json?.currentUserRank != null,
    'currentUserRank is resolved for a mobile token',
    `rank=${leaderboard.json?.currentUserRank}`
  );

  const failed = checks.filter((entry) => !entry.ok);
  console.log(
    `\n${checks.length - failed.length}/${checks.length} checks passed.\n`
  );
  return failed.length === 0;
}

let ok = false;
try {
  ok = await main();
} catch (error) {
  console.error('\nRun failed:', error);
} finally {
  await cleanup();
  await mongoose.disconnect();
}

process.exit(ok ? 0 : 1);
