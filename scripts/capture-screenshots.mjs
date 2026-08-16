#!/usr/bin/env node
/**
 * Captures the marketing screenshots straight from the running app.
 *
 * The landing page used to ship hand-composed PNGs that quietly went stale
 * every time the design changed. This script re-shoots them from the real UI,
 * so "update the screenshots" is a command rather than a design chore.
 *
 * It provisions a throwaway Premium user in MongoDB with believable stats,
 * mints the same NextAuth session cookie the browser would get, and shoots the
 * pages at both a desktop and a phone viewport. The user and its progress rows
 * are deleted on the way out, including on failure.
 *
 * USAGE
 *   npm run dev                       # in another terminal
 *   node scripts/capture-screenshots.mjs
 *   BASE_URL=http://localhost:3010 node scripts/capture-screenshots.mjs
 *   node scripts/capture-screenshots.mjs --keep-user   # leave the user behind
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import mongoose from 'mongoose';
import { encode } from 'next-auth/jwt';
import { chromium, devices } from 'playwright';

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
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const KEEP_USER = process.argv.includes('--keep-user');

const OUT_DIR = path.resolve(process.cwd(), 'public/images/screenshots');
// Shown in the navbar, so it has to read like a real address — but it stays a
// throwaway account, and cleanup matches on exactly this string.
const SCREENSHOT_EMAIL = 'anna@bijbelquiz-demo.nl';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set (checked .env and .env.local).');
  process.exit(2);
}
if (!NEXTAUTH_SECRET) {
  console.error('NEXTAUTH_SECRET is not set (checked .env and .env.local).');
  process.exit(2);
}

/**
 * Every shot we take. `wait` is an optional selector that must be visible
 * before the shutter fires, so a screenshot never catches a loading skeleton.
 */
const SHOTS = [
  {
    name: 'dashboard-desktop',
    path: '/dashboard',
    viewport: 'desktop',
    wait: 'h1',
  },
  {
    name: 'samen-spelen-desktop',
    path: '/samen-spelen',
    viewport: 'desktop',
    wait: 'h1',
  },
  {
    name: 'quizzen-desktop',
    path: '/quizzen',
    viewport: 'desktop',
    wait: 'h1',
  },
  {
    name: 'dashboard-phone',
    path: '/dashboard',
    viewport: 'phone',
    wait: 'h1',
  },
  {
    name: 'samen-spelen-phone',
    path: '/samen-spelen',
    viewport: 'phone',
    wait: 'h1',
  },
  {
    name: 'quizzen-phone',
    path: '/quizzen',
    viewport: 'phone',
    wait: 'h1',
  },
];

function log(message) {
  console.log(`  ${message}`);
}

async function assertServerIsUp() {
  try {
    const response = await fetch(`${BASE_URL}/api/quizzes`, { method: 'GET' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.error(
      `\nCannot reach ${BASE_URL} — start the app first (npm run dev).\n` +
        `  ${error.message}`
    );
    process.exit(2);
  }
}

/**
 * A believable Premium account. Premium matters: a free account renders upsell
 * panels, and those do not belong in a product screenshot.
 */
async function provisionUser() {
  await mongoose.connect(MONGODB_URI);

  const users = mongoose.connection.collection('users');
  const quizzes = mongoose.connection.collection('quizzes');
  const progress = mongoose.connection.collection('userprogresses');

  const now = new Date();

  await users.updateOne(
    { email: SCREENSHOT_EMAIL },
    {
      $set: {
        name: 'Anna',
        email: SCREENSHOT_EMAIL,
        image: null,
        isPremium: true,
        premiumStripe: true,
        hasLifetimePremium: true,
        xp: 2140,
        level: 3,
        levelTitle: 'Leerling',
        streak: 6,
        bestStreak: 11,
        badges: ['first_steps', 'perfect_score', 'streak_3'],
        quizzesPlayed: 24,
        averageScore: 82,
        lastPlayedAt: now,
        role: 'user',
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  const user = await users.findOne({ email: SCREENSHOT_EMAIL });
  const userId = user._id;

  // A short play history, so "Recent gespeeld" is not an empty state.
  const sample = await quizzes
    .find({ status: 'approved', isActive: { $ne: false } })
    .limit(4)
    .toArray();

  await progress.deleteMany({ userId });

  if (sample.length > 0) {
    const scores = [9, 8, 10, 7];
    await progress.insertMany(
      sample.map((quiz, index) => {
        const total = quiz.questions?.length || 10;
        const score = Math.min(scores[index % scores.length], total);
        return {
          userId,
          quizId: quiz._id,
          score,
          totalQuestions: total,
          xpEarned: Math.round((quiz.rewardXp || 50) * (score / total)),
          answers: [],
          correctAnswers: score,
          wrongAnswers: total - score,
          completedAt: new Date(now.getTime() - index * 86_400_000),
        };
      })
    );
  } else {
    log('No approved quizzes found — history panels will render empty.');
  }

  return userId.toString();
}

async function cleanupUser() {
  const users = mongoose.connection.collection('users');
  const progress = mongoose.connection.collection('userprogresses');

  const user = await users.findOne({ email: SCREENSHOT_EMAIL });
  if (!user) return;

  await progress.deleteMany({ userId: user._id });
  await users.deleteOne({ _id: user._id });
}

/**
 * Mint the session cookie NextAuth would have set after a successful login.
 * Cheaper and far less brittle than driving the login form.
 */
async function buildSessionCookie(userId) {
  const token = await encode({
    token: {
      id: userId,
      sub: userId,
      name: 'Anna',
      email: SCREENSHOT_EMAIL,
      isPremium: true,
      xp: 2140,
      role: 'user',
    },
    secret: NEXTAUTH_SECRET,
  });

  const url = new URL(BASE_URL);
  const secure = url.protocol === 'https:';

  return {
    name: secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
    value: token,
    domain: url.hostname,
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'Lax',
  };
}

async function capture(context, shot) {
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}${shot.path}`, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    if (shot.wait) {
      await page.waitForSelector(shot.wait, { state: 'visible', timeout: 30_000 });
    }

    // The dev server paints its own overlay badge over the page corner.
    await page.addStyleTag({
      content: `
        nextjs-portal,
        [data-nextjs-toast],
        #__next-build-watcher,
        [data-nextjs-dev-tools-button] { display: none !important; }
      `,
    });

    // Let entrance animations and web fonts settle before the shutter fires.
    await page.waitForTimeout(1200);

    const file = path.join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: file, scale: 'device' });
    log(`${shot.name.padEnd(24)} -> ${path.relative(process.cwd(), file)}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log(`\nCapturing BijbelQuiz screenshots from ${BASE_URL}\n`);

  await assertServerIsUp();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const userId = await provisionUser();
  log(`Provisioned ${SCREENSHOT_EMAIL}`);

  const cookie = await buildSessionCookie(userId);
  const browser = await chromium.launch();

  const viewports = {
    desktop: {
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    },
    phone: {
      ...devices['iPhone 13 Pro'],
    },
  };

  try {
    for (const [name, options] of Object.entries(viewports)) {
      const shots = SHOTS.filter((shot) => shot.viewport === name);
      if (shots.length === 0) continue;

      const context = await browser.newContext({
        ...options,
        colorScheme: 'light',
        locale: 'nl-NL',
        timezoneId: 'Europe/Amsterdam',
        reducedMotion: 'reduce',
      });
      await context.addCookies([cookie]);

      console.log(`\n${name}:`);
      for (const shot of shots) {
        await capture(context, shot);
      }

      await context.close();
    }
  } finally {
    await browser.close();

    if (KEEP_USER) {
      log(`\nKept ${SCREENSHOT_EMAIL} (--keep-user).`);
    } else {
      await cleanupUser();
      log(`\nRemoved ${SCREENSHOT_EMAIL}.`);
    }

    await mongoose.disconnect();
  }

  console.log('\nDone.\n');
}

main().catch(async (error) => {
  console.error('\nScreenshot capture failed:', error);
  try {
    if (!KEEP_USER && mongoose.connection.readyState === 1) await cleanupUser();
    await mongoose.disconnect();
  } catch {
    // Already tearing down; nothing useful left to do.
  }
  process.exit(1);
});
