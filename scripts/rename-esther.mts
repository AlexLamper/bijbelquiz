#!/usr/bin/env node
/**
 * Spells the book of Esther with its h, in the database.
 *
 * WHY THIS EXISTS
 *
 * Ten quizzes were written as "Ester bijbelquiz - Deel N", described
 * themselves as "Quiz over Ester 3, ..." and were published under the slug
 * `ester-bijbelquiz-deel-N`. The Dutch name of the book is Esther - it is
 * spelled that way in the questions themselves, in `bible-reference.ts`, and
 * in every one of these descriptions where it refers to the person. Only the
 * book kept the shorter spelling.
 *
 * Everything in the repository is corrected already: the source JSON, the
 * cover manifest, the scene keys and the ten PNGs. This pushes the same
 * correction onto the documents that are actually rendered.
 *
 * WHY NOT `import-quiz-json.mts --all`
 *
 * That would rewrite all 137 quizzes - every question, answer and reference -
 * to whatever the files say, and quietly undo anything edited through the
 * admin form since the last import. This touches three string fields on ten
 * documents and nothing else.
 *
 * ABOUT THE SLUG
 *
 * It changes too, because it is the address the reader sees. The old one keeps
 * working: `next.config.ts` redirects `/quiz/ester-bijbelquiz-deel-:part`
 * permanently to the new address, so shared links and search results still
 * resolve. Nothing else keys on the slug - progress, attempts and multiplayer
 * rooms all reference the quiz by `_id`.
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
const ESTER_WORD = /\bEster\b/g;
const ESTER_SLUG = /^ester-/;

await mongoose.connect(uri);
const db = mongoose.connection.db!;
console.log(`Database: ${db.databaseName}${apply ? '  (writing)' : '  (dry run)'}\n`);

const quizzes = db.collection('quizzes');

const docs = await quizzes
  .find({
    $or: [
      { title: ESTER_WORD },
      { description: ESTER_WORD },
      { slug: ESTER_SLUG },
      { 'questions.text': ESTER_WORD },
      { 'questions.explanation': ESTER_WORD },
    ],
  })
  .project({ _id: 1, slug: 1, title: 1, description: 1, imageUrl: 1, questions: 1 })
  .toArray();

let changed = 0;

for (const doc of docs) {
  const next: Record<string, string> = {};

  if (typeof doc.title === 'string' && ESTER_WORD.test(doc.title)) {
    next.title = doc.title.replace(ESTER_WORD, 'Esther');
  }
  if (typeof doc.description === 'string' && ESTER_WORD.test(doc.description)) {
    next.description = doc.description.replace(ESTER_WORD, 'Esther');
  }
  if (typeof doc.slug === 'string' && ESTER_SLUG.test(doc.slug)) {
    next.slug = doc.slug.replace(ESTER_SLUG, 'esther-');
  }
  // A stored cover path points at a file that has been renamed on disk.
  if (typeof doc.imageUrl === 'string' && doc.imageUrl.includes('/ester-')) {
    next.imageUrl = doc.imageUrl.replace('/ester-', '/esther-');
  }

  // The spelling is in the questions as well - the book is named in the wording
  // of the question itself ("Hoe eindigt Ester 3?") and in some explanations.
  // Addressed per path (`questions.4.text`), never by writing the array back:
  // a whole-array `$set` would take every other field of every question with
  // it, and one stale copy in memory would silently undo an admin edit.
  const questions = Array.isArray(doc.questions) ? doc.questions : [];
  questions.forEach((question, index) => {
    for (const field of ['text', 'explanation'] as const) {
      const value = (question as Record<string, unknown>)[field];
      if (typeof value === 'string' && ESTER_WORD.test(value)) {
        next[`questions.${index}.${field}`] = value.replace(ESTER_WORD, 'Esther');
      }
    }
  });

  if (Object.keys(next).length === 0) continue;

  console.log(doc.slug);
  for (const [field, value] of Object.entries(next)) {
    console.log(`  ${field.padEnd(24)} ${value.slice(0, 90)}`);
  }

  if (apply) {
    // `$set` on the named paths only. Replacing the document would drop the
    // questions along with it.
    await quizzes.updateOne({ _id: doc._id }, { $set: next });
  }
  changed += 1;
}

console.log(
  changed === 0
    ? '\nNothing to rename.'
    : apply
      ? `\nRenamed ${changed} quiz(zes).`
      : `\n${changed} quiz(zes) would be renamed. Re-run with --apply.`,
);

await mongoose.disconnect();
