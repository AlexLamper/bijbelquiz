#!/usr/bin/env node
/**
 * Marks accounts that have already played a quiz as having seen the setup panel.
 *
 * WHY THIS EXISTS
 *
 * The quiz start screen folds its setup panel away once `settings.quizSetupSeen`
 * is true, and that flag is written the first time somebody goes past the panel.
 * The flag was added after the app had been live for a while, so every account
 * that played before it shipped still reads as "never seen" - and gets the panel
 * opened in full on every single quiz, forever, which is exactly the noise the
 * fold was meant to remove.
 *
 * Playing a quiz is proof of having been past the screen, so those accounts get
 * the flag they would have been given had it existed at the time. New accounts
 * need nothing from this script: they earn the flag on their first quiz.
 *
 * Only ever sets the flag, never clears it, and only for accounts with at least
 * one recorded attempt. Running it twice is a no-op.
 *
 * USAGE
 *   node --import tsx scripts/backfill-quiz-setup-seen.mts            # dry run
 *   node --import tsx scripts/backfill-quiz-setup-seen.mts --apply    # write
 *
 * To undo, feed the ids it prints back through a $unset of the same field.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import mongoose from 'mongoose';

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

const MONGODB_URI = process.env.MONGODB_URI;
const APPLY = process.argv.includes('--apply');

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set (checked .env and .env.local).');
  process.exit(2);
}

const FILTER = {
  quizzesPlayed: { $gte: 1 },
  'settings.quizSetupSeen': { $ne: true },
} as const;

async function main() {
  await mongoose.connect(MONGODB_URI as string);
  const users = mongoose.connection.collection('users');

  const affected = await users
    .find(FILTER)
    .project({ _id: 1, email: 1, quizzesPlayed: 1 })
    .toArray();

  console.log(`\nAccounts that have played but are not flagged: ${affected.length}`);

  if (affected.length === 0) {
    console.log('Nothing to do.\n');
    await mongoose.disconnect();
    return;
  }

  for (const user of affected) {
    console.log(`  ${String(user._id)}  ${user.email}  (${user.quizzesPlayed} gespeeld)`);
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write.\n');
    await mongoose.disconnect();
    return;
  }

  const result = await users.updateMany(FILTER, {
    $set: { 'settings.quizSetupSeen': true },
  });

  console.log(`\nUpdated ${result.modifiedCount} of ${result.matchedCount} matched accounts.\n`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
