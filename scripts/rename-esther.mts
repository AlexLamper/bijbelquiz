#!/usr/bin/env node
/**
 * Spells the book of Esther with its h, in the database.
 *
 * WHY THIS EXISTS
 *
 * Ten quizzes were written as "Ester bijbelquiz - Deel N" and describe
 * themselves as "Quiz over Ester 3, ...". The Dutch name of the book is
 * Esther - it is spelled that way in the questions themselves, in
 * `bible-reference.ts`, and in the description of every one of these quizzes
 * where it refers to the person. Only the book got the shorter spelling.
 *
 * The JSON files in `docs/quizzes/ester/` are already corrected; this pushes
 * the same correction onto the documents that are actually rendered.
 *
 * WHY NOT `import-quiz-json.mts --all`
 *
 * That would rewrite all 137 quizzes - every question, answer and reference -
 * to whatever the files say, and quietly undo anything edited through the
 * admin form since the last import. This touches two string fields on ten
 * documents and nothing else.
 *
 * WHAT IT LEAVES ALONE
 *
 * The slug. `ester-bijbelquiz-deel-N` is a live URL, the key of a cover in
 * `docs/quiz-image-prompts/manifest.json`, and the name of ten PNGs on disk.
 * Renaming it is a redirect exercise, not a spelling fix, and it would break
 * every existing link to these quizzes.
 *
 * USAGE
 *   node --import tsx scripts/rename-esther.mts            # dry run
 *   node --import tsx scripts/rename-esther.mts --apply
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

const apply = process.argv.includes('--apply');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

/** Whole word only, so "Ester" inside another word is never touched. */
const ESTER = /\bEster\b/g;

await mongoose.connect(uri);
const quizzes = mongoose.connection.db!.collection('quizzes');

const docs = await quizzes
  .find({ $or: [{ title: ESTER }, { description: ESTER }] })
  .project({ _id: 1, slug: 1, title: 1, description: 1 })
  .toArray();

let changed = 0;

for (const doc of docs) {
  const title = typeof doc.title === 'string' ? doc.title.replace(ESTER, 'Esther') : doc.title;
  const description =
    typeof doc.description === 'string' ? doc.description.replace(ESTER, 'Esther') : doc.description;

  if (title === doc.title && description === doc.description) continue;

  console.log(`${doc.slug}`);
  if (title !== doc.title) console.log(`  title:       ${doc.title}  ->  ${title}`);
  if (description !== doc.description) console.log(`  description: ${description}`);

  if (apply) {
    // `$set` on the two named paths only. Replacing the document would drop
    // the questions.
    await quizzes.updateOne({ _id: doc._id }, { $set: { title, description } });
  }
  changed += 1;
}

console.log(
  changed === 0
    ? 'Nothing to rename.'
    : apply
      ? `Renamed ${changed} quiz(zes).`
      : `${changed} quiz(zes) would be renamed. Re-run with --apply.`,
);

await mongoose.disconnect();
