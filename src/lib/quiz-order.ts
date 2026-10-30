/**
 * One order for every list of quizzes - the library, its search, the themes,
 * the Samen spelen picker and the catalogue the app downloads:
 *
 *   1. the books in the order of the canon (Genesis ... Openbaring),
 *   2. inside a book, the chapters as numbers: Hoofdstuk 1, 2, 3 ... 10, 11
 *      (never 1, 10, 100, 101, 2 - which is what sorting on the title gave);
 *      a story quiz without a chapter in its title ("De ark van Noach") at the
 *      chapter its questions cite, and a quiz about the book as a whole
 *      ("Genesis") first,
 *   3. everything that is not about one book after the books, by title -
 *      again with numbers compared as numbers.
 *
 * The chapter comes from the title ("Genesis bijbelquiz - Hoofdstuk 12"),
 * not from the references on the questions: a chapter quiz may cite the
 * chapter before it, and the title is what the player reads on the card.
 * The book comes from the caller when it knows it (the library reads it off
 * the questions) and otherwise from the slug (`1-samuel-bijbelquiz-deel-3`).
 *
 * Pure, so the app's server routes and the client components share it.
 */

import { bookBySlug, bookOrder } from '@/lib/bible-books';
import { readSeries } from '@/lib/quiz-series';

const SERIES_SLUG = /^(.+?)-bijbelquiz-deel-\d+$/;

/**
 * Series slugs that were published before the book titles moved to the NBV21
 * spelling ("Korintiërs", "Efeziërs", "Tessalonicenzen", "Timoteüs"); their
 * slugs no longer match the book's own slug.
 */
const SLUG_BOOK_CODES: Record<string, string> = {
  '1-korinthe': '1COR',
  '2-korinthe': '2COR',
  efeze: 'EPH',
  '1-thessalonicenzen': '1THESS',
  '2-thessalonicenzen': '2THESS',
  '1-timotheus': '1TIM',
  '2-timotheus': '2TIM',
};

/** The canonical book code of a series slug, or null for a standalone quiz. */
export function bookCodeFromSlug(slug: string | null | undefined): string | null {
  const match = String(slug ?? '').trim().toLowerCase().match(SERIES_SLUG);
  if (!match) return null;
  return SLUG_BOOK_CODES[match[1]] ?? bookBySlug(match[1])?.code ?? null;
}

/** 12 for "Genesis bijbelquiz - Hoofdstuk 12" (or "Deel 12"); 0 when the title names no part. */
export function titlePart(title: string | null | undefined): number {
  return readSeries(String(title ?? '')).part;
}

export interface QuizOrderFields {
  title?: string | null;
  slug?: string | null;
  /** Canonical book code when the caller already knows it ('GEN'). */
  book?: string | null;
  /**
   * The chapter the quiz's questions are about, for a quiz whose title names
   * none ("De ark van Noach" -> 6). Null for a quiz about the whole book.
   * A chapter in the title always wins.
   */
  chapter?: number | null;
}

const collator = new Intl.Collator('nl', { numeric: true, sensitivity: 'base' });

function bookPosition(quiz: QuizOrderFields): number {
  return bookOrder(quiz.book ?? bookCodeFromSlug(quiz.slug));
}

function chapterPosition(quiz: QuizOrderFields): number {
  return titlePart(quiz.title) || quiz.chapter || 0;
}

export function compareQuizOrder(a: QuizOrderFields, b: QuizOrderFields): number {
  return (
    bookPosition(a) - bookPosition(b) ||
    chapterPosition(a) - chapterPosition(b) ||
    collator.compare(String(a.title ?? ''), String(b.title ?? '')) ||
    collator.compare(String(a.slug ?? ''), String(b.slug ?? ''))
  );
}

/** A sorted copy; `fields` picks the order fields off each item. */
export function sortQuizzes<T>(items: readonly T[], fields: (item: T) => QuizOrderFields): T[] {
  return items
    .map((item) => ({ item, key: fields(item) }))
    .sort((a, b) => compareQuizOrder(a.key, b.key))
    .map(({ item }) => item);
}
