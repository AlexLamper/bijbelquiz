#!/usr/bin/env node
/**
 * Prints a verification sheet for quiz files: per question the marked answer,
 * the explanation and the VERBATIM verse text it cites, taken from the real
 * Bible data file. A reviewer (human or a second, independent pass) reads the
 * sheet and ticks off each question against the text - nothing else needed.
 *
 *   node --import tsx scripts/quiz-verify-sheet.mts --lang=de --bible-dir=<bijbelapi-data/data> docs/quizzes-de/<file>.json ...
 *   (no files given = every quiz in the language folder)
 */
import fs from 'node:fs';
import path from 'node:path';
const refMod: any = await import('@/lib/quiz-ref-intl');
const { parseStrictRef } = refMod.default ?? refMod;

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const LANG = arg('lang') ?? 'en';
const DIR = arg('bible-dir');
const VERSION: Record<string, string> = { en: 'web', es: 'rv1909', de: 'luth1912', fr: 'lsg1910', pt: 'blivre' };
if (!DIR || !VERSION[LANG]) {
  console.error('usage: --lang=en|es|de|fr|pt --bible-dir=<path> [files...]');
  process.exit(2);
}
const books = JSON.parse(fs.readFileSync(path.join(DIR, `${VERSION[LANG]}.json`), 'utf8')).books;
const quizDir = path.resolve(process.cwd(), `docs/quizzes-${LANG}`);
let files = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((a) => path.resolve(a));
if (files.length === 0) {
  files = fs.readdirSync(quizDir).filter((f) => f.endsWith('.json') && f !== 'categories.json').sort().map((f) => path.join(quizDir, f));
}

function verseText(ref: string): string {
  const p = parseStrictRef(LANG, ref.trim());
  if (typeof p === 'string') return `!! ${p}`;
  const verses = books[p.apiBook]?.chapters?.[String(p.chapter)]?.verses ?? {};
  const out: string[] = [];
  for (let v = p.verse; v <= p.endVerse; v += 1) out.push(`${v} ${verses[String(v)] ?? '!! MISSING'}`);
  return out.join(' ');
}

for (const file of files) {
  const quiz = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\n# ${quiz.title}  (${path.basename(file)}, ${VERSION[LANG]})`);
  quiz.questions.forEach((q: any, i: number) => {
    const letters = 'ABCD';
    console.log(`\n${i + 1}. ${q.text}`);
    q.answers.forEach((a: any, j: number) => console.log(`   ${a.isCorrect ? '[x]' : '[ ]'} ${letters[j]}. ${a.text}`));
    console.log(`   Explanation: ${q.explanation}`);
    for (const ref of String(q.bibleReference).split(/[;,]/)) console.log(`   TEXT ${ref.trim()}: ${verseText(ref)}`);
  });
}
