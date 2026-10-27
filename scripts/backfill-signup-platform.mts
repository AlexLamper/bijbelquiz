#!/usr/bin/env node
/**
 * Writes the derived sign-up platform and method onto older accounts.
 *
 * WHY THIS EXISTS
 *
 * New accounts record where they were made (`signupPlatform`: web-desktop,
 * web-mobile, ios, android) and how (`signupMethod`: email, google, apple).
 * Accounts from before that have neither; the admin pages derive them on
 * every read (src/lib/admin/platform.ts) from the account's earliest
 * analytics event, the device of its first website visit, or an App Store /
 * Play payment. Storing that result makes the reads cheaper and keeps the
 * value once the analytics events expire (they are kept 400 days).
 *
 * Only exact results are written: a platform of `web` (website, device not
 * known), `app` or `onbekend` is left unset, so the admin keeps showing it as
 * derived. Never overwrites a stored value. Running it twice is a no-op.
 *
 * USAGE
 *   node --import tsx scripts/backfill-signup-platform.mts            # dry run
 *   node --import tsx scripts/backfill-signup-platform.mts --apply    # write
 *
 * The written ids are printed; to undo, `$unset` `signupPlatform` and
 * `signupMethod` on them.
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
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

const { connectDB, User } = await import('@/database');
const { SIGNUP_PLATFORMS, deriveSignupMethod, deriveSignupPlatform, isSignupPlatform, loadPlatformEvidence } = await import(
  '@/lib/admin/platform'
);

const host = (() => {
  try {
    return new URL(MONGODB_URI.replace(/^mongodb(\+srv)?:/, 'http:')).host;
  } catch {
    return 'onbekend';
  }
})();
console.log(`${APPLY ? 'APPLY' : 'Dry run'} against ${host}`);

await connectDB();

const legacy = await User.find({ $or: [{ signupPlatform: { $nin: [...SIGNUP_PLATFORMS] } }, { signupMethod: { $exists: false } }] })
  .select('_id email signupPlatform signupMethod password googleId appleId')
  .lean<Array<{ _id: mongoose.Types.ObjectId; email?: string; signupPlatform?: string; signupMethod?: string; password?: string; googleId?: string; appleId?: string }>>();

console.log(`${legacy.length} accounts without a stored platform or method.`);

const evidence = await loadPlatformEvidence(legacy.map((user) => user._id));
const counts: Record<string, number> = {};
let writes = 0;

for (const user of legacy) {
  const set: Record<string, string> = {};
  if (!isSignupPlatform(user.signupPlatform)) {
    const { platform } = deriveSignupPlatform(null, evidence.get(String(user._id)));
    counts[platform] = (counts[platform] ?? 0) + 1;
    if (isSignupPlatform(platform)) set.signupPlatform = platform;
  }
  if (!user.signupMethod) {
    const method = deriveSignupMethod(user);
    if (method !== 'onbekend') set.signupMethod = method;
  }
  if (Object.keys(set).length === 0) continue;
  writes += 1;
  console.log(`${String(user._id)}  ${user.email ?? ''}  ${JSON.stringify(set)}`);
  // `timestamps: false`: a backfill is not an edit of the account.
  if (APPLY) await User.updateOne({ _id: user._id }, { $set: set }, { timestamps: false });
}

console.log('Derived platforms:', counts);
console.log(`${writes} accounts ${APPLY ? 'updated' : 'would be updated (run with --apply to write)'}.`);

await mongoose.disconnect();
