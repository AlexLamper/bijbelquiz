#!/usr/bin/env node
/**
 * Imports approved quiz JSON files from `docs/quizzes/` into MongoDB.
 *
 * WHY THIS EXISTS
 *
 * QUIZ-GENERATION-PLAN.md deliberately stops at "a JSON file in
 * docs/quizzes/ with status draft - nothing is written to the database".
 * Approval is a human step that happens afterwards, and until now the only
 * way to act on it was the admin form: retyping ten questions, forty answers
 * and ten references by hand, per quiz. That is exactly the kind of
 * transcription the validator exists to catch errors in, so it should not be
 * happening at all.
 *
 * This reads the file that was already validated and approved and writes it
 * verbatim. The file stays the record of what a quiz is; the database holds a
 * copy. Matching is on `slug`, so re-running after an edit updates the same
 * document instead of creating a second one.
 *
 * WHAT IT REFUSES
 *
 * Files still marked `status: "draft"` are skipped. Draft means nobody has
 * approved it, and the status field means nothing if the importer ignores it.
 * Flip the status in the file first, then import.
 *
 * `_id` is never read from the file, and `createdAt` on an existing document
 * is never touched - `/api/quizzes` sorts on it, so an edit must not shuffle
 * the quiz back to the top of the list.
 *
 * USAGE
 *   node --import tsx scripts/import-quiz-json.mts <file...>           # dry run
 *   node --import tsx scripts/import-quiz-json.mts <file...> --apply   # write
 *   node --import tsx scripts/import-quiz-json.mts --all --apply
 *
 * Run scripts/validate-quiz-json.ts on the same files first. This script
 * checks that a quiz can be stored, not that it is correct.
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

const QUIZ_DIR = path.resolve(process.cwd(), 'docs/quizzes');
const APPLY = process.argv.includes('--apply');

interface QuizFile {
  title: string;
  description?: string;
  slug: string;
  categoryId: string;
  rewardXp: number;
  difficulty: string;
  isPremium: boolean;
  status: string;
  imageUrl?: string;
  questions: Array<{
    text: string;
    explanation?: string;
    bibleReference?: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
  }>;
}

function listFiles(): string[] {
  if (process.argv.includes('--all')) {
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.json')) out.push(full);
      }
    };
    walk(QUIZ_DIR);
    return out.sort();
  }
  return process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith('--'))
    .map((arg) => path.resolve(arg));
}

/** Everything that has to hold before a document can be written at all. */
function storageErrors(quiz: QuizFile): string[] {
  const errors: string[] = [];

  if (!quiz.title) errors.push('title ontbreekt');
  if (!quiz.slug) errors.push('slug ontbreekt');
  if (!mongoose.Types.ObjectId.isValid(String(quiz.categoryId))) {
    errors.push(`categoryId is geen ObjectId: ${String(quiz.categoryId)}`);
  }
  if (!['easy', 'medium', 'hard'].includes(String(quiz.difficulty))) {
    errors.push(`difficulty ongeldig: ${String(quiz.difficulty)}`);
  }
  if (!['draft', 'pending', 'approved', 'rejected'].includes(String(quiz.status))) {
    errors.push(`status ongeldig: ${String(quiz.status)}`);
  }
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    errors.push('geen vragen');
  }

  (quiz.questions ?? []).forEach((question, i) => {
    if (!question.text) errors.push(`vraag ${i + 1}: tekst ontbreekt`);
    const correct = (question.answers ?? []).filter((answer) => answer.isCorrect === true).length;
    if (correct !== 1) {
      errors.push(`vraag ${i + 1}: ${correct} juiste antwoorden, moet er precies 1 zijn`);
    }
  });

  return errors;
}

/** The document body, minus everything the database owns (`_id`, timestamps). */
function toDocument(quiz: QuizFile) {
  return {
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description,
    categoryId: new mongoose.Types.ObjectId(quiz.categoryId),
    rewardXp: quiz.rewardXp,
    difficulty: quiz.difficulty,
    isPremium: quiz.isPremium,
    status: quiz.status,
    ...(quiz.imageUrl ? { imageUrl: quiz.imageUrl } : {}),
    questions: quiz.questions.map((question) => ({
      text: question.text,
      explanation: question.explanation,
      bibleReference: question.bibleReference,
      answers: question.answers.map((answer) => ({
        text: answer.text,
        isCorrect: Boolean(answer.isCorrect),
      })),
    })),
  };
}

async function main() {
  const files = listFiles();
  if (files.length === 0) {
    console.error('geen bestanden opgegeven. Gebruik --all of geef paden mee.');
    process.exit(2);
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is niet gezet (gecontroleerd: .env en .env.local).');
    process.exit(2);
  }

  const { connectDB, Quiz, Category } = await import('@/database');
  await connectDB();

  // Categories are read up front so a bad categoryId is reported as a missing
  // category rather than surfacing later as a quiz nothing can list.
  const categoryLabels = new Map<string, string>();
  for (const category of await Category.find({}, { title: 1, slug: 1 }).lean()) {
    categoryLabels.set(String(category._id), String(category.slug ?? category.title));
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const label = path.relative(process.cwd(), file);

    let quiz: QuizFile;
    try {
      quiz = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      console.log(`FOUT   ${label}`);
      console.log(`         x geen geldige JSON: ${(error as Error).message}`);
      failed += 1;
      continue;
    }

    if (quiz.status === 'draft') {
      console.log(`OVER   ${label}  (status draft, nog niet goedgekeurd)`);
      skipped += 1;
      continue;
    }

    const errors = storageErrors(quiz);
    if (errors.length > 0) {
      console.log(`FOUT   ${label}`);
      for (const message of errors) console.log(`         x ${message}`);
      failed += 1;
      continue;
    }

    if (!categoryLabels.has(String(quiz.categoryId))) {
      console.log(`FOUT   ${label}`);
      console.log(`         x categorie ${String(quiz.categoryId)} bestaat niet in de database`);
      failed += 1;
      continue;
    }

    const existing = await Quiz.findOne({ slug: quiz.slug });
    const summary =
      `${quiz.questions.length} vragen, ${quiz.difficulty}, ` +
      `${categoryLabels.get(String(quiz.categoryId))}, status ${quiz.status}` +
      `${quiz.isPremium ? ', premium' : ''}`;

    if (!APPLY) {
      console.log(`${existing ? 'UPDATE' : 'NIEUW '} ${label}  ${quiz.slug}  [${summary}]`);
      if (existing) updated += 1;
      else inserted += 1;
      continue;
    }

    const document = toDocument(quiz);
    if (existing) {
      existing.set(document);
      await existing.save();
      console.log(`UPDATE ${label}  ${quiz.slug}  [${summary}]  _id=${existing._id}`);
      updated += 1;
    } else {
      const created = await Quiz.create(document);
      console.log(`NIEUW  ${label}  ${quiz.slug}  [${summary}]  _id=${created._id}`);
      inserted += 1;
    }
  }

  console.log(
    `\n${files.length} bestand(en): ${inserted} nieuw, ${updated} bijgewerkt, ` +
      `${skipped} overgeslagen, ${failed} met fouten.` +
      (APPLY ? '' : '\nDry run, niets geschreven. Voeg --apply toe om te schrijven.'),
  );

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
