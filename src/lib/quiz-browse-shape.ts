/**
 * The quiz browsing surfaces of website 2.0 - `/dashboard`, `/quizzen` and the
 * quiz landing `/bijbelquiz/[slug]` - all show the same small card for a quiz:
 * cover, "JOHANNES 6", title, "10 vragen · 5 min". This file turns a row of
 * `loadQuizIndex()` into that card's data and holds the pure choices the pages
 * make on top of it (popular, one per book, themes, "verder spelen", search).
 *
 * Pure and DB-free so it can be tested on its own (`tests/quiz-browse.test.ts`)
 * and imported by client components.
 */

import { bookByCode, bookOrder, type Testament } from '@/lib/bible-books';
import { sortQuizzes } from '@/lib/quiz-order';
import { normalizeSearchText } from '@/lib/quiz-series';

export interface BrowseBook {
  code: string;
  title: string;
  slug: string;
  testament: Testament;
}

export interface BrowseProgress {
  attempts: number;
  bestCorrect: number;
  total: number;
  lastPlayedAt: string;
}

export interface BrowseQuiz {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  /** "Johannes 6", "Spreuken", or the category title for a quiz without a book. */
  reference: string | null;
  questionCount: number;
  rewardXp: number;
  /** A real cover of this quiz (thumbnail when there is one); null draws the scene. */
  cover: string | null;
  book: BrowseBook | null;
  chapterFrom: number | null;
  chapterTo: number | null;
  category: { slug: string | null; title: string } | null;
  isPremium: boolean;
  /** Distinct players; 0 without data. Only used for ordering. */
  players: number;
  progress: BrowseProgress | null;
}

/** The best result of a quiz the reader finished, for the card's played state; null when not played. */
export function playedOf(quiz: Pick<BrowseQuiz, 'progress'>): { correct: number; total: number } | null {
  const progress = quiz.progress;
  if (!progress || progress.attempts < 1) return null;
  return { correct: progress.bestCorrect, total: progress.total };
}

/** Landing page of a quiz. */
export function quizHref(quiz: Pick<BrowseQuiz, 'slug' | 'id'>): string {
  return `/bijbelquiz/${quiz.slug || quiz.id}`;
}

/** The player. */
export function playHref(quiz: Pick<BrowseQuiz, 'slug' | 'id'>): string {
  return `/quiz/${quiz.slug || quiz.id}`;
}

/** Spans of more than this many chapters read as the whole book ("Spreuken"). */
const MAX_SPAN_FOR_CHAPTER = 3;

/**
 * "Johannes 6" for a quiz about one chapter (or a short run that starts
 * there), the bare book for a quiz that walks through a whole book.
 */
export function referenceFor(bookTitle: string | null, chapterFrom: number | null, chapterTo: number | null): string | null {
  if (!bookTitle) return null;
  if (chapterFrom === null) return bookTitle;
  const to = chapterTo ?? chapterFrom;
  if (to - chapterFrom > MAX_SPAN_FOR_CHAPTER) return bookTitle;
  return `${bookTitle} ${chapterFrom}`;
}

export function browseBook(code: string | null): BrowseBook | null {
  const book = bookByCode(code);
  return book ? { code: book.code, title: book.title, slug: book.slug, testament: book.testament } : null;
}

function byPopularity(a: BrowseQuiz, b: BrowseQuiz): number {
  return b.players - a.players;
}

/**
 * The most played quizzes. Stable: ties keep the catalogue order, so a
 * library nobody has played yet still shows the same tiles every time.
 */
export function pickPopular(quizzes: BrowseQuiz[], count: number, exclude: ReadonlySet<string> = new Set()): BrowseQuiz[] {
  return quizzes
    .filter((quiz) => !exclude.has(quiz.id))
    .map((quiz, index) => ({ quiz, index }))
    .sort((a, b) => byPopularity(a.quiz, b.quiz) || a.index - b.index)
    .slice(0, count)
    .map(({ quiz }) => quiz);
}

/**
 * A handful of quizzes from one testament, at most one per book: the most
 * played quiz of each book, the books ordered by that quiz's popularity and
 * then by the canon. Quizzes in `exclude` (already shown above) are skipped.
 */
export function pickPerTestament(
  quizzes: BrowseQuiz[],
  testament: Testament,
  count: number,
  exclude: ReadonlySet<string> = new Set(),
): BrowseQuiz[] {
  const best = new Map<string, BrowseQuiz>();
  for (const quiz of quizzes) {
    if (!quiz.book || quiz.book.testament !== testament || exclude.has(quiz.id)) continue;
    const current = best.get(quiz.book.code);
    if (
      !current ||
      quiz.players > current.players ||
      (quiz.players === current.players && (quiz.chapterFrom ?? 999) < (current.chapterFrom ?? 999))
    ) {
      best.set(quiz.book.code, quiz);
    }
  }
  return [...best.values()]
    .sort((a, b) => byPopularity(a, b) || bookOrder(a.book?.code) - bookOrder(b.book?.code))
    .slice(0, count);
}

export interface BookGroup {
  book: BrowseBook;
  quizzes: BrowseQuiz[];
}

/** Books that have quizzes, in canonical order, each with its quizzes by chapter. */
export function bookGroups(quizzes: BrowseQuiz[], testament?: Testament): BookGroup[] {
  const groups = new Map<string, BookGroup>();
  for (const quiz of quizzes) {
    if (!quiz.book) continue;
    if (testament && quiz.book.testament !== testament) continue;
    const group = groups.get(quiz.book.code) ?? { book: quiz.book, quizzes: [] };
    group.quizzes.push(quiz);
    groups.set(quiz.book.code, group);
  }
  return [...groups.values()]
    .sort((a, b) => bookOrder(a.book.code) - bookOrder(b.book.code))
    .map((group) => ({ ...group, quizzes: sortByChapter(group.quizzes) }));
}

/**
 * Bible order (`compareQuizOrder`): the book, then Hoofdstuk 1, 2, 3 ... by the
 * number in the title, a quiz about the whole book first.
 */
export function sortByChapter(quizzes: BrowseQuiz[]): BrowseQuiz[] {
  return sortQuizzes(quizzes, (quiz) => ({
    title: quiz.title,
    slug: quiz.slug,
    book: quiz.book?.code ?? null,
    chapter: chapterOfStory(quiz.chapterFrom, quiz.chapterTo),
  }));
}

/**
 * Where a quiz without a chapter in its title sits in its book: the first
 * chapter its questions cite, as long as they stay within a short run. A quiz
 * that walks through the whole book has none and goes first.
 */
export function chapterOfStory(chapterFrom: number | null, chapterTo: number | null): number | null {
  if (chapterFrom === null) return null;
  return (chapterTo ?? chapterFrom) - chapterFrom > MAX_SPAN_FOR_CHAPTER ? null : chapterFrom;
}

export interface ThemeGroup {
  /** The category slug, or a slug of its title when the category has none. */
  key: string;
  title: string;
  quizzes: BrowseQuiz[];
}

function slugOf(text: string): string {
  return normalizeSearchText(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Quizzes that are not about one book ("Wie zei het?", "Vrouwen in de
 * Bijbel"), grouped by their category - the themes of the library.
 */
export function themeGroups(quizzes: BrowseQuiz[]): ThemeGroup[] {
  const groups = new Map<string, ThemeGroup>();
  for (const quiz of quizzes) {
    if (quiz.book) continue;
    const title = quiz.category?.title?.trim() || 'Overig';
    const key = quiz.category?.slug || slugOf(title) || 'overig';
    const group = groups.get(key) ?? { key, title, quizzes: [] };
    group.quizzes.push(quiz);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title, 'nl'));
}

/** Every quiz filed under a category, books or not (season packs, old links). */
export function quizzesInCategory(quizzes: BrowseQuiz[], key: string): BrowseQuiz[] {
  return quizzes.filter((quiz) => {
    const title = quiz.category?.title?.trim() || 'Overig';
    return (quiz.category?.slug || slugOf(title)) === key;
  });
}

export interface ContinueInBook {
  /** The next quiz to play in that book. */
  next: BrowseQuiz;
  book: BrowseBook;
  played: number;
  total: number;
}

/**
 * "Verder spelen": the next unplayed quiz in the book the player was last
 * busy with. Walks the books in the order they were last played, so a book
 * that is finished hands over to the one before it. Null when nothing has
 * been played or every played book is done.
 */
export function continueInBook(quizzes: BrowseQuiz[]): ContinueInBook | null {
  const played = quizzes
    .filter((quiz) => quiz.book && quiz.progress && quiz.progress.attempts > 0)
    .sort((a, b) => (b.progress!.lastPlayedAt > a.progress!.lastPlayedAt ? 1 : b.progress!.lastPlayedAt < a.progress!.lastPlayedAt ? -1 : 0));

  const seen = new Set<string>();
  for (const last of played) {
    const book = last.book!;
    if (seen.has(book.code)) continue;
    seen.add(book.code);

    const inBook = sortByChapter(quizzes.filter((quiz) => quiz.book?.code === book.code));
    const isPlayed = (quiz: BrowseQuiz) => Boolean(quiz.progress && quiz.progress.attempts > 0);
    const after = inBook.find((quiz) => !isPlayed(quiz) && (quiz.chapterFrom ?? 0) > (last.chapterFrom ?? 0));
    const next = after ?? inBook.find((quiz) => !isPlayed(quiz));
    if (!next) continue;

    return { next, book, played: inBook.filter(isPlayed).length, total: inBook.length };
  }
  return null;
}

/** Search on title, book, reference, category and description; diacritics ignored. */
export function searchQuizzes(quizzes: BrowseQuiz[], query: string): BrowseQuiz[] {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);
  if (terms.length === 0) return [];
  return quizzes.filter((quiz) => {
    const haystack = normalizeSearchText(
      [quiz.title, quiz.book?.title, quiz.reference, quiz.category?.title, quiz.description].filter(Boolean).join(' '),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

/** Books whose name matches the query (for "Johannes" typed in the search). */
export function searchBooks(groups: BookGroup[], query: string): BookGroup[] {
  const needle = normalizeSearchText(query);
  if (!needle) return [];
  return groups.filter((group) => normalizeSearchText(group.book.title).includes(needle));
}

export function countLabel(count: number): string {
  return `${count} ${count === 1 ? 'quiz' : 'quizzen'}`;
}
