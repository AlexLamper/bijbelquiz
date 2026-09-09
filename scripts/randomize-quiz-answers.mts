#!/usr/bin/env node
/**
 * Mechanically applies QUIZ-GENERATION-PLAN.md §5.8.
 *
 * Input: a quiz JSON where every question's correct answer is written at
 * index 0 (the natural order to write them in). This script builds a
 * balanced list of target indices (0-3), shuffles it under the "no more
 * than 3 consecutive share an index" constraint, and swaps index 0 with
 * the assigned index per question. Idempotency guard: refuses to run twice
 * on the same file (checks isCorrect is at index 0 for every question first).
 *
 * USAGE
 *   node --import tsx scripts/randomize-quiz-answers.mts <file...>
 */

import fs from 'node:fs';
import process from 'node:process';

function balancedIndices(n: number): number[] {
  const per = Math.floor(n / 4);
  const rem = n % 4;
  const counts = [per, per, per, per];
  for (let i = 0; i < rem; i++) counts[i]++;
  const list: number[] = [];
  counts.forEach((c, idx) => {
    for (let i = 0; i < c; i++) list.push(idx);
  });
  return list;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function noMoreThan3Consecutive(list: number[]): boolean {
  let run = 1;
  for (let i = 1; i < list.length; i++) {
    if (list[i] === list[i - 1]) {
      run++;
      if (run > 3) return false;
    } else {
      run = 1;
    }
  }
  return true;
}

function assignTargets(n: number): number[] {
  const base = balancedIndices(n);
  for (let attempt = 0; attempt < 500; attempt++) {
    const candidate = shuffle(base);
    if (noMoreThan3Consecutive(candidate)) return candidate;
  }
  throw new Error('could not find a valid shuffle after 500 attempts');
}

for (const file of process.argv.slice(2)) {
  const raw = fs.readFileSync(file, 'utf8');
  const quiz = JSON.parse(raw);
  const questions = quiz.questions as { answers: { text: string; isCorrect: boolean }[] }[];

  for (const [i, q] of questions.entries()) {
    if (!q.answers[0]?.isCorrect) {
      console.error(`${file}: question ${i + 1} does not have the correct answer at index 0 - refusing (already randomized, or malformed).`);
      process.exit(1);
    }
  }

  const targets = assignTargets(questions.length);
  questions.forEach((q, i) => {
    const t = targets[i];
    if (t !== 0) {
      const tmp = q.answers[0];
      q.answers[0] = q.answers[t];
      q.answers[t] = tmp;
    }
  });

  fs.writeFileSync(file, JSON.stringify(quiz, null, 2) + '\n');
  const dist = [0, 0, 0, 0];
  questions.forEach((q) => {
    const idx = q.answers.findIndex((a) => a.isCorrect);
    dist[idx]++;
  });
  console.log(`${file}: distribution A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]}`);
}
