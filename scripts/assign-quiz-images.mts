#!/usr/bin/env node
/**
 * Points every quiz at its own cover image.
 *
 * WHY THIS EXISTS
 *
 * `resolveQuizImageUrl` falls back to the *category* image before it falls
 * back to the id-derived img1..img12 rotation, and almost no quiz created
 * after the seed has an explicit `imageUrl`. The result is that a whole
 * category renders one identical cover - 45 quizzes on img2.png, 42 on
 * img1.png. The fix is not in the resolver: a quiz that genuinely has its own
 * artwork should say so in its own document.
 *
 * This writes `imageUrl` per quiz from
 * `docs/quiz-image-prompts/manifest.json`, matching on `slug` the same way
 * import-quiz-json.mts does.
 *
 * WHAT IT REFUSES
 *
 * A quiz whose image file is not on disk is skipped, not written - pointing
 * the database at a missing PNG is worse than the duplicate cover it replaces,
 * because the category fallback at least resolves to a real file. Pass
 * --allow-missing to write anyway once the files are known to be on their way.
 *
 * USAGE
 *   node --import tsx scripts/assign-quiz-images.mts              # dry run
 *   node --import tsx scripts/assign-quiz-images.mts --apply
 *   node --import tsx scripts/assign-quiz-images.mts --apply --allow-missing
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
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[line.slice(0, eq).trim()] = value;
  }
}

type ManifestQuiz = { slug: string; title: string; file: string; imageUrl: string; scene: string };
type Manifest = { template: string; targetDir: string; quizzes: ManifestQuiz[] };

const root = process.cwd();
const apply = process.argv.includes('--apply');
const allowMissing = process.argv.includes('--allow-missing');

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/quiz-image-prompts/manifest.json'), 'utf8'),
) as Manifest;

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

await mongoose.connect(uri);
const quizzes = mongoose.connection.db!.collection('quizzes');

let written = 0;
let unchanged = 0;
let missingFile = 0;
let missingQuiz = 0;

for (const entry of manifest.quizzes) {
  const onDisk = fs.existsSync(path.join(root, manifest.targetDir, entry.file));
  if (!onDisk && !allowMissing) {
    console.log(`SKIP  ${entry.slug}  (${manifest.targetDir}/${entry.file} not on disk)`);
    missingFile += 1;
    continue;
  }

  const doc = await quizzes.findOne({ slug: entry.slug }, { projection: { imageUrl: 1 } });
  if (!doc) {
    console.log(`MISS  ${entry.slug}  (no quiz with this slug)`);
    missingQuiz += 1;
    continue;
  }

  if (doc.imageUrl === entry.imageUrl) {
    unchanged += 1;
    continue;
  }

  console.log(`SET   ${entry.slug}  ${doc.imageUrl ?? '(none)'} -> ${entry.imageUrl}`);
  if (apply) await quizzes.updateOne({ _id: doc._id }, { $set: { imageUrl: entry.imageUrl } });
  written += 1;
}

await mongoose.disconnect();

console.log(
  `\n${apply ? 'Applied' : 'Dry run'}: ${written} to set, ${unchanged} already correct, ` +
    `${missingFile} image file missing, ${missingQuiz} slug not in database.`,
);
if (!apply && written > 0) console.log('Re-run with --apply to write.');
