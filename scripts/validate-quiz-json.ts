#!/usr/bin/env node
/**
 * Validates quiz JSON files against QUIZ-GENERATION-PLAN.md.
 *
 * WHY THIS EXISTS
 *
 * The rules that matter most are exactly the ones that do not survive being
 * checked by eye. The generation prompt has said "spread the correct answer
 * across A/B/C/D" from the beginning, and across the 124 questions written
 * under it the distribution came out A=15%, B=42%, C=31%, D=12% - one file
 * never uses C or D at all. A reference pointing at a verse that does not
 * exist looks exactly like one that does. So both are checked mechanically.
 *
 * The parser and the passage resolver are imported from the app rather than
 * reimplemented, so this cannot drift from what the site actually does.
 *
 * USAGE
 *   node --import tsx scripts/validate-quiz-json.ts <file...>
 *   node --import tsx scripts/validate-quiz-json.ts --all
 *   node --import tsx scripts/validate-quiz-json.ts --all --no-fetch
 *
 * Exits 1 if any file has an error. Warnings do not fail the run.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { parseBibleReference } from '@/lib/bible-reference';
import { resolveQuizPassage } from '@/lib/quiz-passage';

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
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith(String.fromCharCode(39)) && value.endsWith(String.fromCharCode(39)));
    if (quoted) value = value.slice(1, -1);
    process.env[line.slice(0, eq).trim()] = value;
  }
}

const QUIZ_DIR = path.resolve(process.cwd(), 'docs/quizzes');
const NO_FETCH = process.argv.includes('--no-fetch');

/** Live category ObjectIds. A quiz pointing anywhere else cannot be imported. */
const CATEGORY_IDS = new Set([
  '6964d025c2e06add6b9a53f4', // oude-testament
  '6964d025c2e06add6b9a53f5', // nieuwe-testament
  '6964d025c2e06add6b9a53f6', // algemeen
  '6965304d2ea0665316092d05', // leven-van-jezus
  '6965304d2ea0665316092d08', // vrouwen-in-de-bijbel
  '6965304d2ea0665316092d0b', // wonderen-en-tekenen
  '6965304d2ea0665316092d0e', // personen-in-de-bijbel
]);

const QUIZ_KEYS = [
  'title', 'description', 'slug', 'categoryId',
  'rewardXp', 'difficulty', 'isPremium', 'status', 'questions',
];
const QUESTION_KEYS = ['text', 'explanation', 'bibleReference', 'answers'];
const ANSWER_KEYS = ['text', 'isCorrect'];

interface Report {
  file: string;
  errors: string[];
  warnings: string[];
  positions: number[];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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
  return process.argv.slice(2).filter((a) => !a.startsWith('--')).map((a) => path.resolve(a));
}

/**
 * Confirms the reference resolves to actual Statenvertaling text.
 *
 * Parsed locally first and then requested by book/chapter/verse, which is what
 * the upstream API actually accepts - `?ref=` is a convenience the app's own
 * route adds on top (see `src/app/api/bible/verse/route.ts`), not something
 * bijbelapi.com understands.
 */
async function referenceResolves(ref: string): Promise<boolean> {
  const parsed = parseBibleReference(ref);
  if (!parsed) return false;

  const key = process.env.BIJBEL_API_KEY;
  const url =
    `https://www.bijbelapi.com/api/verse?book=${encodeURIComponent(parsed.book)}` +
    `&chapter=${parsed.chapter}&verse=${parsed.verse}&version=sv`;

  try {
    const response = await fetch(url, { headers: key ? { 'x-api-key': key } : {} });
    if (!response.ok) return false;
    const body = (await response.json()) as { text?: string };
    return typeof body.text === 'string' && body.text.trim().length > 0;
  } catch {
    return false;
  }
}

async function validate(file: string, slugsSeen: Map<string, string>): Promise<Report> {
  const report: Report = { file, errors: [], warnings: [], positions: [] };
  const err = (message: string) => report.errors.push(message);
  const warn = (message: string) => report.warnings.push(message);

  let quiz: Record<string, unknown>;
  try {
    quiz = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    err(`geen geldige JSON: ${(error as Error).message}`);
    return report;
  }

  // ── structure ────────────────────────────────────────────────────────────
  for (const key of QUIZ_KEYS) {
    if (!(key in quiz)) err(`veld ontbreekt: ${key}`);
  }
  for (const key of Object.keys(quiz)) {
    if (!QUIZ_KEYS.includes(key)) warn(`onbekend veld: ${key}`);
  }
  if (!['easy', 'medium', 'hard'].includes(String(quiz.difficulty))) {
    err(`difficulty ongeldig: ${String(quiz.difficulty)}`);
  }
  if (!['draft', 'pending', 'approved', 'rejected'].includes(String(quiz.status))) {
    err(`status ongeldig: ${String(quiz.status)}`);
  }
  if (typeof quiz.isPremium !== 'boolean') err('isPremium moet een boolean zijn');
  if (typeof quiz.description !== 'string' || quiz.description.length < 10) {
    err('description moet minstens 10 tekens zijn (eis van het zod-schema in QuizForm)');
  }
  if (!CATEGORY_IDS.has(String(quiz.categoryId))) {
    err(`categoryId is geen bekende live ObjectId: ${String(quiz.categoryId)}`);
  }

  const slug = String(quiz.slug ?? '');
  const previous = slugsSeen.get(slug);
  if (previous) err(`slug "${slug}" botst met ${path.basename(previous)}`);
  else slugsSeen.set(slug, file);

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];

  // ── rule 2: question count ───────────────────────────────────────────────
  if (questions.length !== 10 && questions.length !== 15) {
    err(`regel 2: ${questions.length} vragen, moet 10 of 15 zijn`);
  }
  if (quiz.rewardXp !== questions.length * 10) {
    err(`rewardXp is ${String(quiz.rewardXp)}, verwacht ${questions.length * 10}`);
  }

  // ── per question ─────────────────────────────────────────────────────────
  let dashRefs = 0;
  const refsToCheck: Array<{ index: number; ref: string }> = [];

  questions.forEach((raw, i) => {
    const q = raw as Record<string, unknown>;
    const label = `vraag ${i + 1}`;

    for (const key of QUESTION_KEYS) {
      if (!(key in q)) err(`${label}: veld ontbreekt: ${key}`);
    }
    for (const key of Object.keys(q)) {
      if (!QUESTION_KEYS.includes(key)) warn(`${label}: onbekend veld: ${key}`);
    }
    if (typeof q.text !== 'string' || q.text.length < 5) err(`${label}: vraagtekst te kort`);
    if (
      typeof q.explanation !== 'string' ||
      q.explanation.trim() === '' ||
      q.explanation.trim() === '-'
    ) {
      err(`${label}: regel 7: uitleg ontbreekt of is een streepje`);
    }

    const answers = Array.isArray(q.answers) ? (q.answers as Array<Record<string, unknown>>) : [];

    // ── rule 5: answers ────────────────────────────────────────────────────
    if (answers.length !== 4) {
      err(`${label}: regel 5: ${answers.length} antwoorden, moeten er 4 zijn`);
    }
    for (const answer of answers) {
      for (const key of Object.keys(answer)) {
        if (!ANSWER_KEYS.includes(key)) warn(`${label}: antwoord heeft onbekend veld: ${key}`);
      }
    }

    const correctIndexes = answers
      .map((a, idx) => (a.isCorrect === true ? idx : -1))
      .filter((idx) => idx !== -1);

    if (correctIndexes.length !== 1) {
      err(`${label}: regel 5: ${correctIndexes.length} juiste antwoorden, moet er precies 1 zijn`);
    } else {
      report.positions.push(correctIndexes[0]);
    }

    const texts = answers.map((a) => String(a.text ?? '').trim().toLowerCase());
    if (new Set(texts).size !== texts.length) err(`${label}: dubbele antwoordtekst`);
    if (texts.some((t) => t === '')) err(`${label}: leeg antwoord`);

    // Length tell: a correct answer that is always the most elaborate gives
    // itself away regardless of which position it sits in.
    if (correctIndexes.length === 1 && answers.length === 4) {
      const correctLength = String(answers[correctIndexes[0]].text ?? '').length;
      const others = answers
        .filter((_, idx) => idx !== correctIndexes[0])
        .map((a) => String(a.text ?? '').length);
      const ratio = correctLength / Math.max(1, median(others));
      if (ratio > 1.6) {
        warn(`${label}: juiste antwoord is ${ratio.toFixed(2)}x de mediaanlengte van de afleiders`);
      }
    }

    // ── rule 8: reference ──────────────────────────────────────────────────
    const ref = typeof q.bibleReference === 'string' ? q.bibleReference.trim() : '';
    if (ref === '' || ref === '-') {
      dashRefs += 1;
    } else if (!parseBibleReference(ref)) {
      err(`${label}: regel 8: bibleReference onparsebaar: "${ref}"`);
    } else {
      // Every reference in the field is checked, not only the first.
      // `parseBibleReference` keeps just the leading one because that is all
      // the app needs to pick a chapter - but a wrong verse further down the
      // line is still a wrong verse printed under a question. `Openb. 22:22`
      // sat in third position in hooglied-deel-2 for exactly that reason.
      const segments = ref.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
      segments.forEach((segment, position) => {
        if (parseBibleReference(segment)) {
          refsToCheck.push({ index: i + 1, ref: segment });
        } else if (position > 0) {
          warn(`${label}: deel van de referentie is onparsebaar: "${segment}"`);
        }
      });
    }
  });

  if (dashRefs > 1) {
    err(`regel 8: ${dashRefs} vragen zonder bijbelreferentie, hoogstens 1 toegestaan`);
  }

  // ── rule 6: answer position spread ───────────────────────────────────────
  if (report.positions.length === questions.length && questions.length > 0) {
    const counts = [0, 0, 0, 0];
    for (const p of report.positions) counts[p] += 1;
    const minimum = questions.length >= 15 ? 3 : 2;
    counts.forEach((count, idx) => {
      if (count < minimum) {
        err(
          `regel 6: positie ${'ABCD'[idx]} is ${count}x het juiste antwoord, minimaal ${minimum} verwacht ` +
            `(verdeling A=${counts[0]} B=${counts[1]} C=${counts[2]} D=${counts[3]})`,
        );
      }
    });
    let run = 1;
    for (let i = 1; i < report.positions.length; i += 1) {
      run = report.positions[i] === report.positions[i - 1] ? run + 1 : 1;
      if (run > 3) {
        err(
          `regel 6: meer dan 3 vragen op rij met het juiste antwoord op positie ${'ABCD'[report.positions[i]]}`,
        );
        break;
      }
    }
  }

  // ── reading screen ───────────────────────────────────────────────────────
  const passage = resolveQuizPassage(
    questions.map((raw) => ({
      bibleReference: (raw as Record<string, unknown>).bibleReference as string | undefined,
    })),
  );
  if (!passage) {
    warn(
      'geen leesscherm: resolveQuizPassage vindt geen hoofdstuk (min. 3 vragen op hetzelfde hoofdstuk en 60% overeenstemming)',
    );
  }

  // ── every reference must resolve to real Statenvertaling text ────────────
  if (!NO_FETCH) {
    for (const { index, ref } of refsToCheck) {
      if (!(await referenceResolves(ref))) {
        err(`vraag ${index}: referentie "${ref}" levert geen tekst op in de Statenvertaling`);
      }
    }
  }

  return report;
}

// Wrapped rather than run at the top level: this file is `.ts`, which the
// repo resolves as CommonJS (no `"type": "module"` in package.json), so a
// top-level await would not compile. `.mts` would allow it but then the
// imports above become ESM and cannot pick up the named exports from the
// app's CommonJS `.ts` modules.
async function main() {
  const files = listFiles();
  if (files.length === 0) {
    console.error('geen bestanden opgegeven. Gebruik --all of geef paden mee.');
    process.exit(2);
  }

  const slugsSeen = new Map<string, string>();
  let failed = 0;

  for (const file of files) {
    const report = await validate(file, slugsSeen);
    const counts = [0, 0, 0, 0];
    for (const p of report.positions) counts[p] += 1;
    const spread = `A=${counts[0]} B=${counts[1]} C=${counts[2]} D=${counts[3]}`;

    if (report.errors.length === 0 && report.warnings.length === 0) {
      console.log(`OK     ${path.relative(process.cwd(), file)}  [${spread}]`);
    } else {
      const mark = report.errors.length > 0 ? 'FOUT  ' : 'LET OP';
      console.log(`${mark} ${path.relative(process.cwd(), file)}  [${spread}]`);
      for (const message of report.errors) console.log(`         x ${message}`);
      for (const message of report.warnings) console.log(`         ! ${message}`);
    }
    if (report.errors.length > 0) failed += 1;
  }

  console.log(`\n${files.length} bestand(en) gecontroleerd, ${failed} met fouten.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
