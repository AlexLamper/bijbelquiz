#!/usr/bin/env node
/**
 * Prints one chapter, verse by verse, from the language's own Bible data file,
 * with the canonical book title the quiz must use. Quiz writers work ONLY from this.
 *
 *   node --import tsx scripts/print-chapter.mts --lang=en --book=Genesis --chapter=5 --bible-dir=../bijbelapi-data/data
 *   (--book is the English book name as in docs/quiz-manifest.json)
 */
import fs from 'node:fs';
import path from 'node:path';
const namesMod: any = await import('@/lib/book-names-intl');
const { INTL_BOOK_TABLES } = namesMod.default ?? namesMod;

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const LANG = arg('lang') ?? 'en';
const VERSION: Record<string, string> = { en: 'web', es: 'rv1909', pt: 'blivre', de: 'luth1912', fr: 'lsg1910' };
const book = arg('book');
const chapter = arg('chapter');
const dir = arg('bible-dir') ?? '../bijbelapi-data/data';
if (!book || !chapter || !VERSION[LANG]) {
  console.error('usage: --lang=en|es|pt|de|fr --book=<English name> --chapter=<n> [--bible-dir=...]');
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(path.resolve('docs/quiz-manifest.json'), 'utf8'));
const entry = manifest.find((m: any) => m.en === book);
const title = LANG === 'en' ? book : INTL_BOOK_TABLES[LANG].titles[entry?.book ?? -1];
const data = JSON.parse(fs.readFileSync(path.join(dir, `${VERSION[LANG]}.json`), 'utf8')).books;
const verses = data[book]?.chapters?.[chapter]?.verses;
if (!verses || !title) { console.error(`not found: ${book} ${chapter}`); process.exit(1); }
console.log(`# ${title} ${chapter}  (${VERSION[LANG]}; use "${title}" in every bibleReference)\n`);
for (const v of Object.keys(verses).sort((a, b) => Number(a) - Number(b))) console.log(`${v} ${verses[v]}`);
