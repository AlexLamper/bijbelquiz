/**
 * Works out which Bible chapter a quiz is actually about.
 *
 * Quizzes carry no chapter of their own - only the individual questions have a
 * `bibleReference`. That is enough: a quiz called "Daniel - Deel 2" has fifteen
 * questions pointing at Daniël 2, so the chapter is simply the one most of its
 * questions cite. Deriving it beats adding a field somebody has to remember to
 * fill in for every quiz that already exists.
 *
 * Returns null when the references disagree - a mixed quiz spanning six books
 * has no single passage to read first, and offering one would be a lie.
 */

import { parseBibleReference } from '@/lib/bible-reference';

export interface QuizPassage {
  book: string;
  chapter: number;
  /** "Daniël 2" - what the reader is offered. */
  label: string;
  /** Share of parsed references that pointed here, 0-1. */
  confidence: number;
}

interface QuestionLike {
  bibleReference?: string;
}

/** At least this share of the references must agree before a chapter is offered. */
const MIN_CONFIDENCE = 0.6;

/** And at least this many questions must cite it, so one stray reference cannot decide. */
const MIN_REFERENCES = 3;

export function resolveQuizPassage(questions: ReadonlyArray<QuestionLike>): QuizPassage | null {
  const counts = new Map<string, { book: string; chapter: number; count: number }>();
  let parsedTotal = 0;

  for (const question of questions) {
    const parsed = parseBibleReference(question.bibleReference || '');
    if (!parsed) continue;

    parsedTotal += 1;
    const key = `${parsed.book}|${parsed.chapter}`;
    const entry = counts.get(key);

    if (entry) {
      entry.count += 1;
    } else {
      counts.set(key, { book: parsed.book, chapter: parsed.chapter, count: 1 });
    }
  }

  if (parsedTotal === 0) return null;

  let best: { book: string; chapter: number; count: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }

  if (!best || best.count < MIN_REFERENCES) return null;

  const confidence = best.count / parsedTotal;
  if (confidence < MIN_CONFIDENCE) return null;

  return {
    book: best.book,
    chapter: best.chapter,
    label: `${best.book} ${best.chapter}`,
    confidence,
  };
}
