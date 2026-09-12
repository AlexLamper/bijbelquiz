/**
 * Pure helpers behind the bookshelf: how wide a spine is, how a query is read,
 * which quizzes belong to a book and which tiles the "Uitgelicht" strip shows.
 * Nothing here touches React, so every rule is easy to read on its own.
 */

import type { QuizIndexBook, QuizIndexQuiz } from '@/lib/quiz-index-data';
import { normalizeSearchText } from '@/lib/quiz-series';
import type { Pigment } from '@/components/editorial';

/** Difficulty carries a pigment: verdigris, neutral, vermilion. Never a fill. */
export const DIFFICULTY: Record<string, { label: string; pigment: Pigment; text: string }> = {
  easy: { label: 'Makkelijk', pigment: 'verdigris', text: 'text-positive' },
  beginner: { label: 'Makkelijk', pigment: 'verdigris', text: 'text-positive' },
  medium: { label: 'Gemiddeld', pigment: 'neutral', text: 'text-ink-soft' },
  intermediate: { label: 'Gemiddeld', pigment: 'neutral', text: 'text-ink-soft' },
  hard: { label: 'Moeilijk', pigment: 'vermilion', text: 'text-vermilion' },
  advanced: { label: 'Moeilijk', pigment: 'vermilion', text: 'text-vermilion' },
};

export function difficultyOf(quiz: Pick<QuizIndexQuiz, 'difficulty'>) {
  return (
    DIFFICULTY[quiz.difficulty?.toLowerCase()] ?? {
      label: quiz.difficulty,
      pigment: 'neutral' as Pigment,
      text: 'text-ink-soft',
    }
  );
}

export function quizHref(quiz: Pick<QuizIndexQuiz, 'slug' | '_id'>): string {
  return `/quiz/${quiz.slug ?? quiz._id}`;
}

export function isPlayed(quiz: Pick<QuizIndexQuiz, 'progress'>): boolean {
  return (quiz.progress?.attempts ?? 0) > 0;
}

/** "8/10" from the best attempt, or null when the quiz was never played. */
export function bestScore(quiz: Pick<QuizIndexQuiz, 'progress' | 'questionCount'>): string | null {
  if (!isPlayed(quiz)) return null;
  const total = quiz.progress?.lastTotalQuestions || quiz.questionCount;
  if (!total) return null;
  return `${quiz.progress?.bestCorrectAnswers ?? 0}/${total}`;
}

/**
 * Spine width in pixels, proportional to the chapter count but clamped: Psalmen
 * (150) must not swallow the shelf and Obadja (1) must still be a target.
 * Desktop spines stand upright and carry vertical text; phone spines lie flat
 * with a short horizontal label, so they need more room.
 */
export function spineWidth(chapters: number): { desktop: number; phone: number } {
  const desktop = Math.round(Math.min(64, Math.max(30, 24 + chapters * 0.8)));
  const phone = Math.round(Math.min(112, Math.max(60, 48 + chapters * 1.2)));
  return { desktop, phone };
}

/** "Hfdst. 15" or "Hfdst. 15-16"; empty when the quiz has no chapter span. */
export function chapterLabel(quiz: Pick<QuizIndexQuiz, 'chapterFrom' | 'chapterTo'>): string {
  if (quiz.chapterFrom === null || quiz.chapterTo === null) return '';
  if (quiz.chapterFrom === quiz.chapterTo) return `Hfdst. ${quiz.chapterFrom}`;
  return `Hfdst. ${quiz.chapterFrom}-${quiz.chapterTo}`;
}

/** Short row title: "Deel 3" inside a series, the full title otherwise. */
export function rowTitle(quiz: Pick<QuizIndexQuiz, 'part' | 'title'>): string {
  return quiz.part > 0 ? `Deel ${quiz.part}` : quiz.title;
}

/** Quizzes of one book, in reading order: chapter first, then part, then title. */
export function sortBookQuizzes(quizzes: QuizIndexQuiz[]): QuizIndexQuiz[] {
  return [...quizzes].sort((a, b) => {
    const chapterA = a.chapterFrom ?? Number.MAX_SAFE_INTEGER;
    const chapterB = b.chapterFrom ?? Number.MAX_SAFE_INTEGER;
    if (chapterA !== chapterB) return chapterA - chapterB;
    if (a.part !== b.part) return a.part - b.part;
    return a.title.localeCompare(b.title, 'nl');
  });
}

export function groupByBook(quizzes: QuizIndexQuiz[]): Map<string, QuizIndexQuiz[]> {
  const byBook = new Map<string, QuizIndexQuiz[]>();
  for (const quiz of quizzes) {
    if (!quiz.book) continue;
    const list = byBook.get(quiz.book) ?? [];
    list.push(quiz);
    byBook.set(quiz.book, list);
  }
  for (const [code, list] of byBook) byBook.set(code, sortBookQuizzes(list));
  return byBook;
}

/**
 * The quiz to pick up next inside a series a reader has started: the first
 * unplayed part after the highest played one, else the first unplayed part at
 * all. Null when every part is done or nothing was played yet.
 */
export function nextInSeries(series: QuizIndexQuiz[]): QuizIndexQuiz | null {
  const ordered = [...series].sort((a, b) => a.part - b.part);
  const played = ordered.filter(isPlayed);
  if (played.length === 0) return null;
  const highest = Math.max(...played.map((quiz) => quiz.part));
  return (
    ordered.find((quiz) => quiz.part > highest && !isPlayed(quiz)) ??
    ordered.find((quiz) => !isPlayed(quiz)) ??
    null
  );
}

export interface FeaturedPick {
  quiz: QuizIndexQuiz;
  /** Small caption above the tile, e.g. "Verder gaan". */
  caption?: string;
}

const GOSPELS = ['MATT', 'MARK', 'LUKE', 'JOHN'];

/**
 * Four tiles above the shelves. A signed-in reader gets the next part of the
 * series they touched most recently; everyone gets a thematic quiz and the
 * first part of three gospels, skipping anything already played.
 */
export function pickFeatured(quizzes: QuizIndexQuiz[], isSignedIn: boolean): FeaturedPick[] {
  const picks: FeaturedPick[] = [];
  const taken = new Set<string>();
  const add = (quiz: QuizIndexQuiz | null | undefined, caption?: string) => {
    if (!quiz || taken.has(quiz._id) || picks.length >= 4) return;
    taken.add(quiz._id);
    picks.push({ quiz, caption });
  };

  if (isSignedIn) {
    const recent = quizzes
      .filter((quiz) => quiz.part > 0 && isPlayed(quiz) && quiz.progress?.lastCompletedAt)
      .sort((a, b) =>
        String(b.progress?.lastCompletedAt).localeCompare(String(a.progress?.lastCompletedAt))
      );
    for (const played of recent) {
      const series = quizzes.filter((quiz) => quiz.seriesKey === played.seriesKey);
      const next = nextInSeries(series);
      if (next) {
        add(next, 'Verder gaan');
        break;
      }
    }
  }

  const unplayed = (quiz: QuizIndexQuiz) => !isSignedIn || !isPlayed(quiz);
  add(quizzes.find((quiz) => quiz.book === null && unplayed(quiz)));
  for (const code of GOSPELS) {
    add(quizzes.find((quiz) => quiz.book === code && quiz.part === 1 && unplayed(quiz)));
  }
  // Still short (everything above was played): fill with anything unplayed, then anything.
  for (const quiz of quizzes) add(unplayed(quiz) ? quiz : null);
  for (const quiz of quizzes) add(quiz);
  return picks;
}

export interface SearchResult {
  /** Empty query: nothing filtered. */
  active: boolean;
  quizzes: QuizIndexQuiz[];
  /** Codes of books that stay at full strength; also thematic quiz ids. */
  books: Set<string>;
  /** Book the query names outright ("Lucas 15", "Jona"), if exactly one. */
  book: QuizIndexBook | null;
  /** Chapter number from a "Lucas 15" style query. */
  chapter: number | null;
}

const EMPTY: SearchResult = { active: false, quizzes: [], books: new Set(), book: null, chapter: null };

function bookMatches(book: QuizIndexBook, term: string): boolean {
  if (!term) return false;
  const title = normalizeSearchText(book.title);
  const short = normalizeSearchText(book.short.replace(/\./g, ''));
  return (
    title.startsWith(term) ||
    short.startsWith(term) ||
    book.code.toLowerCase() === term ||
    // "1 kor" against "1 korintiers", written as "1kor"
    title.replace(/\s+/g, '').startsWith(term.replace(/\s+/g, ''))
  );
}

/**
 * Reads a query the way a reader writes it: "Lucas 15" is a book and a
 * chapter, "Jona" is a book, "gelijkenissen" is a title. A book name may be
 * partial ("luc 15", "1 kor 13"). Matching is diacritic-insensitive.
 */
export function searchLibrary(
  query: string,
  quizzes: QuizIndexQuiz[],
  books: QuizIndexBook[]
): SearchResult {
  const term = normalizeSearchText(query);
  if (!term) return EMPTY;

  const chapterMatch = term.match(/^(.+?)\s+(\d{1,3})$/);
  const nameTerm = chapterMatch ? chapterMatch[1] : term;
  const chapter = chapterMatch ? Number(chapterMatch[2]) : null;

  const namedBooks = books.filter((book) => bookMatches(book, nameTerm));
  // "1 joh" names 1 Johannes only, but "joh" also names Johannes: prefer an exact title.
  const exact = namedBooks.filter((book) => normalizeSearchText(book.title) === nameTerm);
  const candidates = exact.length === 1 ? exact : namedBooks;

  let matched: QuizIndexQuiz[];
  if (chapter !== null && candidates.length > 0) {
    const codes = new Set(candidates.map((book) => book.code));
    matched = quizzes.filter(
      (quiz) =>
        quiz.book !== null &&
        codes.has(quiz.book) &&
        quiz.chapterFrom !== null &&
        quiz.chapterTo !== null &&
        quiz.chapterFrom <= chapter &&
        chapter <= quiz.chapterTo
    );
  } else {
    const codes = new Set(candidates.map((book) => book.code));
    matched = quizzes.filter((quiz) => {
      if (quiz.book && codes.has(quiz.book)) return true;
      const haystack = normalizeSearchText(
        [quiz.title, quiz.seriesLabel, quiz.bookTitle ?? '', quiz.categoryId?.title ?? ''].join(' ')
      );
      return haystack.includes(term);
    });
  }

  const full = new Set<string>();
  for (const book of candidates) full.add(book.code);
  for (const quiz of matched) full.add(quiz.book ?? quiz._id);

  const quizBooks = new Set(matched.map((quiz) => quiz.book).filter((code): code is string => !!code));
  let book: QuizIndexBook | null = null;
  if (candidates.length === 1) book = candidates[0];
  else if (quizBooks.size === 1) book = books.find((entry) => quizBooks.has(entry.code)) ?? null;

  return { active: true, quizzes: matched, books: full, book, chapter };
}
