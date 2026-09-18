#!/usr/bin/env node
/**
 * Renames quiz titles from the old "Deel <n>" format to "Hoofdstuk <n>" -
 * but only for quizzes that actually cover exactly one Bible chapter.
 *
 * WHY THIS EXISTS
 *
 * QUIZ-GENERATION-PLAN.md rule 3 fixed the title format going forward
 * (`<Boek> bijbelquiz - Hoofdstuk <n>`), but a lot of quizzes made before
 * that rule still carry "Deel <n>" in the live database. Some of those
 * really do cover a single chapter and should read "Hoofdstuk"; others
 * (Jesaja, Hooglied, Ester 10, Klaagliederen 4, ...) deliberately pair or
 * split chapters and must keep "Deel" because no single chapter number
 * would be true.
 *
 * The chapter a quiz is "about" isn't a stored field - only each question's
 * bibleReference is. So this reuses parseBibleReference on every question
 * and only renames a quiz when every parseable reference agrees on one
 * single (book, chapter) pair. Any quiz whose references span more than
 * one chapter is left untouched and printed for manual review.
 *
 * The resolved chapter number (from the data) is what goes into the new
 * title, not whatever number happened to follow "Deel" - so a mislabeled
 * quiz gets corrected rather than propagated.
 *
 * Some chapters are long enough that they were split across two quizzes
 * (Matteus, Lucas, Johannes are full of this) - each half is genuinely
 * "about one chapter", but renaming both would give two different quizzes
 * the identical title "Hoofdstuk N". That is skipped as a collision, not a
 * multi-chapter quiz, and left for manual review (e.g. a real "deel 1/2"
 * suffix), same as the plan's stated exceptions.
 *
 * USAGE
 *   node --import tsx scripts/fix-deel-titles.mts            # dry run
 *   node --import tsx scripts/fix-deel-titles.mts --apply    # write
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

const APPLY = process.argv.includes('--apply');
const DEEL_TITLE = /^(.*)-\s*Deel\s+(\d+)\s*$/i;

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is niet gezet (gecontroleerd: .env en .env.local).');
    process.exit(2);
  }

  const { connectDB, Quiz } = await import('@/database');
  const { parseBibleReference } = await import('@/lib/bible-reference');
  await connectDB();

  const candidates = await Quiz.find({ title: { $regex: /-\s*Deel\s+\d+\s*$/i } });
  const allTitles = new Set(
    (await Quiz.find({}, { title: 1 }).lean()).map((doc) => String(doc.title)),
  );

  interface Resolution {
    quiz: (typeof candidates)[number];
    oldNum: string;
    newTitle: string;
    chapter: string;
  }

  const resolved: Resolution[] = [];
  let skippedMultiChapter = 0;
  let skippedNoRefs = 0;

  for (const quiz of candidates) {
    const match = quiz.title.match(DEEL_TITLE);
    if (!match) continue;
    const [, prefix, oldNum] = match;

    const chapters = new Set<string>();
    for (const question of quiz.questions ?? []) {
      const parsed = parseBibleReference(question.bibleReference || '');
      if (!parsed) continue;
      chapters.add(`${parsed.book}|${parsed.chapter}`);
    }

    if (chapters.size === 0) {
      console.log(`GEEN REF   ${quiz.slug}  "${quiz.title}"  (geen enkele leesbare bibleReference)`);
      skippedNoRefs += 1;
      continue;
    }

    if (chapters.size > 1) {
      console.log(
        `MEERDERE   ${quiz.slug}  "${quiz.title}"  (${chapters.size} hoofdstukken: ${[...chapters].join(', ')})`,
      );
      skippedMultiChapter += 1;
      continue;
    }

    const [, chapter] = [...chapters][0].split('|');
    resolved.push({ quiz, oldNum, chapter, newTitle: `${prefix}- Hoofdstuk ${chapter}` });
  }

  // A target title is safe only if exactly one candidate wants it, and no
  // *other* quiz already carries it (renaming quiz A must not collide with
  // quiz B's current, unrelated title either).
  const targetCounts = new Map<string, number>();
  for (const { newTitle } of resolved) {
    targetCounts.set(newTitle, (targetCounts.get(newTitle) ?? 0) + 1);
  }

  let renamed = 0;
  let skippedCollision = 0;

  for (const { quiz, oldNum, chapter, newTitle } of resolved) {
    const wantedByOthers = (targetCounts.get(newTitle) ?? 0) > 1;
    const clashesWithExisting = allTitles.has(newTitle) && newTitle !== quiz.title;

    if (wantedByOthers || clashesWithExisting) {
      console.log(
        `BOTST      ${quiz.slug}  "${quiz.title}" -> "${newTitle}"` +
          (wantedByOthers ? '  (nog een quiz wil dezelfde titel, waarschijnlijk hoofdstuk gesplitst over 2 quizzes)' : '  (titel bestaat al bij een andere quiz)'),
      );
      skippedCollision += 1;
      continue;
    }

    const numberNote = oldNum !== chapter ? `  (Deel ${oldNum} -> hoofdstuk ${chapter}, LET OP: nummer klopte niet)` : '';
    console.log(`${APPLY ? 'HERNOEMD' : 'ZOU HERNOEMEN'}  ${quiz.slug}  "${quiz.title}" -> "${newTitle}"${numberNote}`);

    if (APPLY) {
      quiz.title = newTitle;
      await quiz.save();
    }
    renamed += 1;
  }

  console.log(
    `\n${candidates.length} quiz(zen) met "Deel" in de titel: ${renamed} ${APPLY ? 'hernoemd' : 'te hernoemen'}, ` +
      `${skippedMultiChapter} overgeslagen (meerdere hoofdstukken), ${skippedCollision} overgeslagen (titelbotsing), ` +
      `${skippedNoRefs} overgeslagen (geen referenties).` +
      (APPLY ? '' : '\nDry run, niets geschreven. Voeg --apply toe om te schrijven.'),
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
