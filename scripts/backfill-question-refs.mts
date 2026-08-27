#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-time backfill: derive refBook/refChapter/refVerse/refVerseEnd on every
 * existing quiz question from its free-text `bibleReference`.
 *
 * Why: bijbelstudie's guided study flow asks this app for "questions about
 * Johannes 20:1-18". Matching that against unparsed free text means regex-ing
 * every question of every quiz on each request - O(all quizzes), no index. The
 * Quiz model now stores the parsed reference and indexes it, and a pre('save')
 * hook keeps it current, but that hook only fires on documents that are saved.
 * Everything already in the database needs this pass once.
 *
 * A question whose reference cannot be parsed gets refBook: null and simply
 * never matches. That is the correct failure: guessing would put questions
 * about one passage into a lesson about another.
 *
 * USAGE:
 *   $env:MONGODB_URI="<your mongodb uri>"
 *   node --import tsx scripts/backfill-question-refs.mts           # dry run
 *   node --import tsx scripts/backfill-question-refs.mts --apply   # write
 */
import mongoose from 'mongoose';
import bibleReferenceModule from '../src/lib/bible-reference';
import bookCanonModule from '../src/lib/book-canon';

const { parseBibleReference } = bibleReferenceModule;
const { toBookCode } = bookCanonModule;

const APPLY = process.argv.includes('--apply');

interface RawAnswer {
  text?: string;
}

interface RawQuestion {
  _id?: unknown;
  text?: string;
  answers?: RawAnswer[];
  bibleReference?: string;
  refBook?: string | null;
  refChapter?: number | null;
  refVerse?: number | null;
  refVerseEnd?: number | null;
}

interface RawQuiz {
  _id: unknown;
  title?: string;
  slug?: string;
  questions?: RawQuestion[];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  // The raw collection, so this never depends on the Quiz model's hooks or
  // validation - the point is to repair documents, some of which may predate
  // fields the current schema requires.
  const quizzes = mongoose.connection.collection('quizzes');

  const all = (await quizzes.find({}).toArray()) as unknown as RawQuiz[];

  let quizzesTouched = 0;
  let questionsParsed = 0;
  let questionsUnparseable = 0;
  let questionsWithoutReference = 0;
  const unparseable: string[] = [];

  for (const quiz of all) {
    const questions = quiz.questions ?? [];
    if (questions.length === 0) continue;

    let changed = false;

    for (const question of questions) {
      const reference = question.bibleReference?.trim();

      if (!reference) {
        questionsWithoutReference++;
        if (question.refBook !== null && question.refBook !== undefined) {
          question.refBook = null;
          question.refChapter = null;
          question.refVerse = null;
          question.refVerseEnd = null;
          changed = true;
        }
        continue;
      }

      const parsed = parseBibleReference(reference);
      const code = parsed ? toBookCode(parsed.book) : null;

      if (!code) {
        questionsUnparseable++;
        if (unparseable.length < 25) unparseable.push(`${quiz.slug ?? quiz._id}: ${reference}`);
      } else {
        questionsParsed++;
      }

      const next = {
        refBook: code,
        refChapter: parsed?.chapter ?? null,
        refVerse: parsed?.verse ?? null,
        refVerseEnd: parsed?.endVerse ?? null,
      };

      if (
        question.refBook !== next.refBook ||
        question.refChapter !== next.refChapter ||
        question.refVerse !== next.refVerse ||
        question.refVerseEnd !== next.refVerseEnd
      ) {
        Object.assign(question, next);
        changed = true;
      }
    }

    if (changed) {
      quizzesTouched++;
      if (APPLY) {
        await quizzes.updateOne({ _id: quiz._id as never }, { $set: { questions } });
      }
    }
  }

  console.log('');
  console.log(`Quizzes scanned          : ${all.length}`);
  console.log(`Quizzes needing an update: ${quizzesTouched}`);
  console.log(`Questions parsed         : ${questionsParsed}`);
  console.log(`Questions unparseable    : ${questionsUnparseable}`);
  console.log(`Questions with no ref    : ${questionsWithoutReference}`);

  if (unparseable.length > 0) {
    console.log('');
    console.log('Unparseable references (these will never match a passage):');
    for (const line of unparseable) console.log(`  ${line}`);
    if (questionsUnparseable > unparseable.length) {
      console.log(`  ... and ${questionsUnparseable - unparseable.length} more`);
    }
  }

  console.log('');
  console.log(APPLY ? 'Applied.' : 'Dry run. Re-run with --apply to write.');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
