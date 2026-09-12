/**
 * The quiz library laid out on the canon.
 *
 * A "shelf" is one tile in the overview: a Bible book (all 66, with or without
 * quizzes) or, at the end, one thematic series for the quizzes that cite no
 * single book. Everything the page shows - tiles, panels, search results, the
 * featured strip - is derived here from the loader's output, so the components
 * only render.
 */

import { BOOK_GROUPS, type BookGroupId, type Testament } from '@/lib/bible-books';
import type { QuizIndexBook, QuizIndexQuiz } from '@/lib/quiz-index-data';
import { normalizeSearchText } from '@/lib/quiz-series';

export type Quiz = QuizIndexQuiz;

export interface Shelf {
  key: string;
  title: string;
  short: string;
  /** Chapters in the book; 0 for a thematic shelf, where coverage means nothing. */
  chapters: number;
  chaptersCovered: number;
  quizzes: Quiz[];
  playedCount: number;
}

export interface ShelfGroup {
  id: BookGroupId | 'themas';
  label: string;
  shelves: Shelf[];
}

export interface TestamentSection {
  id: Testament | 'themas';
  title: string;
  groups: ShelfGroup[];
}

export const THEMES_KEY = 'themas';

export const DIFFICULTY: Record<string, { label: string; className: string }> = {
  easy: { label: 'Makkelijk', className: 'text-positive' },
  beginner: { label: 'Makkelijk', className: 'text-positive' },
  medium: { label: 'Gemiddeld', className: 'text-ink-soft' },
  intermediate: { label: 'Gemiddeld', className: 'text-ink-soft' },
  hard: { label: 'Moeilijk', className: 'text-vermilion' },
  advanced: { label: 'Moeilijk', className: 'text-vermilion' },
};

export function difficultyOf(quiz: Quiz) {
  return DIFFICULTY[quiz.difficulty?.toLowerCase()] ?? { label: quiz.difficulty, className: 'text-ink-soft' };
}

export function isPlayed(quiz: Quiz): boolean {
  return (quiz.progress?.attempts ?? 0) > 0;
}

/** "7/10" from the best attempt, or null when the quiz was never played. */
export function bestScoreLabel(quiz: Quiz): string | null {
  if (!isPlayed(quiz)) return null;
  const total = quiz.progress?.lastTotalQuestions || quiz.questionCount;
  if (!total) return null;
  return `${quiz.progress?.bestCorrectAnswers ?? 0}/${total}`;
}

export function quizHref(quiz: Quiz): string {
  return `/quiz/${quiz.slug ?? quiz._id}`;
}

/** Chapter first, then part, then title: the order a reader expects inside a book. */
export function compareQuizzes(a: Quiz, b: Quiz): number {
  const chapterA = a.chapterFrom ?? Number.MAX_SAFE_INTEGER;
  const chapterB = b.chapterFrom ?? Number.MAX_SAFE_INTEGER;
  if (chapterA !== chapterB) return chapterA - chapterB;
  if (a.part !== b.part) return a.part - b.part;
  return a.title.localeCompare(b.title, 'nl');
}

export function buildSections(books: QuizIndexBook[], quizzes: Quiz[]): TestamentSection[] {
  const byBook = new Map<string, Quiz[]>();
  const thematic = new Map<string, Quiz[]>();

  for (const quiz of quizzes) {
    if (quiz.book) {
      const bucket = byBook.get(quiz.book) ?? [];
      bucket.push(quiz);
      byBook.set(quiz.book, bucket);
    } else {
      const bucket = thematic.get(quiz.seriesKey) ?? [];
      bucket.push(quiz);
      thematic.set(quiz.seriesKey, bucket);
    }
  }

  const shelfFor = (book: QuizIndexBook): Shelf => {
    const list = [...(byBook.get(book.code) ?? [])].sort(compareQuizzes);
    return {
      key: book.code,
      title: book.title,
      short: book.short,
      chapters: book.chapters,
      chaptersCovered: book.chaptersCovered.length,
      quizzes: list,
      playedCount: list.filter(isPlayed).length,
    };
  };

  const testament = (id: Testament, title: string): TestamentSection => ({
    id,
    title,
    groups: BOOK_GROUPS.filter((group) => group.testament === id).map((group) => ({
      id: group.id,
      label: group.label,
      shelves: books.filter((book) => book.group === group.id).map(shelfFor),
    })),
  });

  const themeShelves: Shelf[] = [...thematic.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort(compareQuizzes);
      return {
        key: `${THEMES_KEY}:${key}`,
        title: sorted[0]?.seriesLabel || sorted[0]?.title || 'Thema',
        short: sorted[0]?.seriesLabel || '',
        chapters: 0,
        chaptersCovered: 0,
        quizzes: sorted,
        playedCount: sorted.filter(isPlayed).length,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'nl'));

  const sections: TestamentSection[] = [
    testament('OT', 'Oude Testament'),
    testament('NT', 'Nieuwe Testament'),
  ];

  if (themeShelves.length > 0) {
    sections.push({
      id: 'themas',
      title: "Thema's en overzicht",
      groups: [{ id: 'themas', label: 'Over meerdere boeken', shelves: themeShelves }],
    });
  }

  return sections;
}

/* ------------------------------------------------------------------------ */
/* Featured                                                                  */
/* ------------------------------------------------------------------------ */

export interface Featured {
  eyebrow: string;
  quiz: Quiz;
}

/**
 * Four quizzes above the grid. A signed-in reader with history gets "verder
 * gaan": the next unplayed part of whatever they played last. Everyone else
 * gets the general-knowledge quiz and the openings of three Gospels.
 */
export function pickFeatured(quizzes: Quiz[], shelves: Shelf[]): Featured[] {
  const picked: Featured[] = [];
  const used = new Set<string>();
  const add = (eyebrow: string, quiz: Quiz | undefined) => {
    if (!quiz || used.has(quiz._id) || picked.length >= 4) return;
    used.add(quiz._id);
    picked.push({ eyebrow, quiz });
  };

  // Continue: most recently played first, then the first unplayed part on
  // that shelf. Up to two of these, so the strip still shows something new.
  const played = quizzes
    .filter(isPlayed)
    .sort((a, b) => (b.progress?.lastCompletedAt ?? '').localeCompare(a.progress?.lastCompletedAt ?? ''));
  const shelfOf = (quiz: Quiz) => shelves.find((shelf) => shelf.quizzes.some((entry) => entry._id === quiz._id));
  for (const last of played) {
    if (picked.length >= 2) break;
    const shelf = shelfOf(last);
    const next = shelf?.quizzes.find((entry) => !isPlayed(entry));
    add('Verder gaan', next);
  }

  const general = quizzes.find(
    (quiz) => !quiz.book && normalizeSearchText(quiz.title).includes('algemene bijbelkennis')
  );
  add('Overzicht', general);

  for (const code of ['MATT', 'LUKE', 'JOHN', 'MARK', 'GEN', 'ACTS']) {
    const shelf = shelves.find((entry) => entry.key === code);
    add('Begin bij het begin', shelf?.quizzes.find((quiz) => !isPlayed(quiz)) ?? shelf?.quizzes[0]);
  }

  for (const quiz of quizzes) add('Ook leuk', quiz);

  return picked;
}

/* ------------------------------------------------------------------------ */
/* Search                                                                    */
/* ------------------------------------------------------------------------ */

export interface SearchResult {
  /** Quizzes that match, in canon order. */
  quizzes: Quiz[];
  /** Shelf keys that stay lit; every other tile dims. */
  shelfKeys: Set<string>;
  /** A "Lucas 15" query that named a real book and chapter. */
  chapter: { shelf: Shelf; chapter: number; covered: boolean } | null;
}

function shelfMatchesName(shelf: Shelf, query: string): boolean {
  const title = normalizeSearchText(shelf.title);
  const short = normalizeSearchText(shelf.short.replace(/\./g, ''));
  return title.startsWith(query) || (short.length > 0 && short.startsWith(query)) || title.includes(` ${query}`);
}

/**
 * "Lucas 15", "luc 15", "1 kor 3": a book name followed by a chapter. The
 * leading digit of "1 Korintiers" stays with the name because the name must
 * end in a letter before the chapter number.
 */
function parseChapterQuery(query: string, shelves: Shelf[]): { shelf: Shelf; chapter: number } | null {
  const match = query.match(/^(.*?[a-z])\s*(\d{1,3})$/);
  if (!match) return null;
  const name = match[1].trim();
  const chapter = Number(match[2]);
  const shelf = shelves.find((entry) => entry.chapters > 0 && shelfMatchesName(entry, name));
  if (!shelf || chapter < 1 || chapter > shelf.chapters) return null;
  return { shelf, chapter };
}

export function searchLibrary(rawQuery: string, shelves: Shelf[]): SearchResult | null {
  const query = normalizeSearchText(rawQuery);
  if (query.length === 0) return null;

  const shelfKeys = new Set<string>();
  const quizzes: Quiz[] = [];

  const chapterQuery = parseChapterQuery(query, shelves);
  if (chapterQuery) {
    const { shelf, chapter } = chapterQuery;
    const covering = shelf.quizzes.filter(
      (quiz) => quiz.chapterFrom !== null && quiz.chapterTo !== null && quiz.chapterFrom <= chapter && chapter <= quiz.chapterTo
    );
    shelfKeys.add(shelf.key);
    return {
      quizzes: covering.length > 0 ? covering : shelf.quizzes,
      shelfKeys,
      chapter: { shelf, chapter, covered: covering.length > 0 },
    };
  }

  for (const shelf of shelves) {
    const nameHit = shelfMatchesName(shelf, query);
    const hits = nameHit
      ? shelf.quizzes
      : shelf.quizzes.filter(
          (quiz) =>
            normalizeSearchText(quiz.title).includes(query) ||
            normalizeSearchText(quiz.seriesLabel).includes(query) ||
            normalizeSearchText(quiz.categoryId?.title ?? '').includes(query)
        );
    if (nameHit || hits.length > 0) shelfKeys.add(shelf.key);
    quizzes.push(...hits);
  }

  return { quizzes, shelfKeys, chapter: null };
}
