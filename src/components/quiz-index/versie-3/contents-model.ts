/**
 * The pure side of the "Inhoudsopgave" quiz index: how 237 quizzes hang on the
 * 1189 chapters of the canon, how a search query reads ("Lucas 15", "spreuken",
 * "gelijkenissen"), and which four quizzes the page puts forward.
 *
 * Nothing here touches React, so the components stay about layout.
 */

import { BOOK_GROUPS, bookOrder, type BookGroup, type Testament } from '@/lib/bible-books';
import type { QuizIndexBook, QuizIndexQuiz } from '@/lib/quiz-index-data';
import { normalizeSearchText } from '@/lib/quiz-series';

export type Quiz = QuizIndexQuiz;
export type Book = QuizIndexBook;

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Makkelijk',
  beginner: 'Makkelijk',
  medium: 'Gemiddeld',
  intermediate: 'Gemiddeld',
  hard: 'Moeilijk',
  advanced: 'Moeilijk',
};

/** easy -> verdigris, medium -> neutral, hard -> vermilion. */
export const DIFFICULTY_TEXT: Record<string, string> = {
  easy: 'text-positive',
  beginner: 'text-positive',
  medium: 'text-ink-soft',
  intermediate: 'text-ink-soft',
  hard: 'text-vermilion',
  advanced: 'text-vermilion',
};

export function difficultyLabel(quiz: Quiz): string {
  return DIFFICULTY_LABEL[quiz.difficulty?.toLowerCase()] ?? quiz.difficulty;
}

export function difficultyText(quiz: Quiz): string {
  return DIFFICULTY_TEXT[quiz.difficulty?.toLowerCase()] ?? 'text-ink-soft';
}

export function quizHref(quiz: Quiz): string {
  return `/quiz/${quiz.slug || quiz._id}`;
}

export function isPlayed(quiz: Quiz): boolean {
  return (quiz.progress?.attempts ?? 0) > 0;
}

/** "8/10" from the best attempt, or null when the quiz was never played. */
export function bestScore(quiz: Quiz): string | null {
  if (!isPlayed(quiz)) return null;
  const total = quiz.progress?.lastTotalQuestions || quiz.questionCount;
  if (!total) return null;
  return `${quiz.progress?.bestCorrectAnswers ?? 0}/${total}`;
}

/** "Deel 5" inside a series, the full title otherwise. */
export function partLabel(quiz: Quiz): string {
  return quiz.part > 0 ? `Deel ${quiz.part}` : quiz.title;
}

/** Canonical order: book, first chapter, part, title. */
export function compareCanonical(a: Quiz, b: Quiz): number {
  const order = bookOrder(a.book) - bookOrder(b.book);
  if (order !== 0) return order;
  const chapter = (a.chapterFrom ?? 0) - (b.chapterFrom ?? 0);
  if (chapter !== 0) return chapter;
  if (a.part !== b.part) return a.part - b.part;
  return a.title.localeCompare(b.title, 'nl');
}

/* ------------------------------------------------------------------------ */
/* Laying the quizzes on the canon                                           */
/* ------------------------------------------------------------------------ */

export interface BookEntry {
  book: Book;
  /** Quizzes per chapter number, each list in part order. Chapters without a quiz are absent. */
  byChapter: Map<number, Quiz[]>;
  /** Quizzes filed under the book whose chapter span is unknown. */
  unplaced: Quiz[];
}

export interface GroupEntry {
  group: BookGroup;
  books: BookEntry[];
}

export interface TestamentEntry {
  testament: Testament;
  label: string;
  groups: GroupEntry[];
  quizCount: number;
}

export interface Contents {
  testaments: TestamentEntry[];
  /** Quizzes with no book: mixed and thematic. */
  thematic: Quiz[];
  chaptersCovered: number;
}

export function buildContents(quizzes: Quiz[], books: Book[]): Contents {
  const byBook = new Map<string, BookEntry>();
  for (const book of books) {
    byBook.set(book.code, { book, byChapter: new Map(), unplaced: [] });
  }

  const thematic: Quiz[] = [];
  const sorted = [...quizzes].sort(compareCanonical);

  for (const quiz of sorted) {
    const entry = quiz.book ? byBook.get(quiz.book) : undefined;
    if (!entry) {
      thematic.push(quiz);
      continue;
    }
    if (quiz.chapterFrom === null || quiz.chapterTo === null) {
      entry.unplaced.push(quiz);
      continue;
    }
    for (let chapter = quiz.chapterFrom; chapter <= quiz.chapterTo; chapter += 1) {
      const list = entry.byChapter.get(chapter) ?? [];
      list.push(quiz);
      entry.byChapter.set(chapter, list);
    }
  }

  let chaptersCovered = 0;
  byBook.forEach((entry) => {
    chaptersCovered += entry.byChapter.size;
  });

  const testaments: TestamentEntry[] = (['OT', 'NT'] as Testament[]).map((testament) => {
    const groups = BOOK_GROUPS.filter((group) => group.testament === testament).map((group) => ({
      group,
      books: books
        .filter((book) => book.group === group.id)
        .map((book) => byBook.get(book.code))
        .filter((entry): entry is BookEntry => Boolean(entry)),
    }));
    const quizCount = groups.reduce(
      (total, group) => total + group.books.reduce((sum, entry) => sum + entry.book.quizCount, 0),
      0
    );
    return {
      testament,
      label: testament === 'OT' ? 'Oude Testament' : 'Nieuwe Testament',
      groups,
      quizCount,
    };
  });

  return { testaments, thematic, chaptersCovered };
}

export function groupAnchor(groupId: string): string {
  return `groep-${groupId}`;
}

export function testamentAnchor(testament: Testament): string {
  return testament === 'OT' ? 'oude-testament' : 'nieuwe-testament';
}

/* ------------------------------------------------------------------------ */
/* Search                                                                    */
/* ------------------------------------------------------------------------ */

export interface SearchResult {
  /** Quizzes that match, in canonical order. Empty when the query is blank. */
  quizzes: Quiz[];
  /** Books that stay at full strength while everything else dims. */
  bookCodes: Set<string>;
  /** Specific chapters to mark, as "CODE:15", for a "Lucas 15" query. */
  chapterKeys: Set<string>;
  active: boolean;
}

const EMPTY_SEARCH: SearchResult = {
  quizzes: [],
  bookCodes: new Set(),
  chapterKeys: new Set(),
  active: false,
};

function bookNames(book: Book): string[] {
  return [
    normalizeSearchText(book.title),
    normalizeSearchText(book.short.replace(/\./g, '')),
    book.code.toLowerCase(),
  ];
}

/** Whether a typed name ("luc", "1 kor", "matteus") means this book. */
function nameMatchesBook(name: string, book: Book): boolean {
  if (name.length < 2) return false;
  return bookNames(book).some((candidate) => candidate === name || candidate.startsWith(name));
}

/**
 * Read "Lucas 15", "luc 15", "1 Kor 13" or "Psalm 23" as a book plus chapter.
 * A leading digit belongs to the book ("1 Samuel 3"), never to the chapter.
 */
function readChapterQuery(query: string, books: Book[]): { book: Book; chapter: number } | null {
  const match = query.match(/^([1-3]?\s*[a-z][a-z\s]*?)\s+(\d{1,3})$/);
  if (!match) return null;
  const name = match[1].trim();
  const chapter = Number(match[2]);
  const book = books.find((candidate) => nameMatchesBook(name, candidate));
  if (!book || chapter < 1 || chapter > book.chapters) return null;
  return { book, chapter };
}

export function searchContents(rawQuery: string, quizzes: Quiz[], books: Book[]): SearchResult {
  const query = normalizeSearchText(rawQuery);
  if (query.length === 0) return EMPTY_SEARCH;

  const bookCodes = new Set<string>();
  const chapterKeys = new Set<string>();

  const chapterQuery = readChapterQuery(query, books);
  if (chapterQuery) {
    const { book, chapter } = chapterQuery;
    bookCodes.add(book.code);
    chapterKeys.add(`${book.code}:${chapter}`);
    const matched = quizzes
      .filter(
        (quiz) =>
          quiz.book === book.code &&
          quiz.chapterFrom !== null &&
          quiz.chapterTo !== null &&
          chapter >= quiz.chapterFrom &&
          chapter <= quiz.chapterTo
      )
      .sort(compareCanonical);
    return { quizzes: matched, bookCodes, chapterKeys, active: true };
  }

  // A plain word: a book name keeps its whole line lit, even a book without
  // quizzes, so "psalm" answers "no quizzes yet" rather than "nothing found".
  for (const book of books) {
    if (nameMatchesBook(query, book)) bookCodes.add(book.code);
  }

  const matched = quizzes
    .filter((quiz) => {
      if (quiz.book && bookCodes.has(quiz.book)) return true;
      return (
        normalizeSearchText(quiz.title).includes(query) ||
        normalizeSearchText(quiz.seriesLabel).includes(query) ||
        normalizeSearchText(quiz.bookTitle ?? '').includes(query) ||
        normalizeSearchText(quiz.categoryId?.title ?? '').includes(query)
      );
    })
    .sort(compareCanonical);

  for (const quiz of matched) {
    if (quiz.book) bookCodes.add(quiz.book);
  }

  return { quizzes: matched, bookCodes, chapterKeys, active: true };
}

/* ------------------------------------------------------------------------ */
/* Uitgelicht                                                                */
/* ------------------------------------------------------------------------ */

export interface Featured {
  quiz: Quiz;
  /** Small caption above the tile: "Verder gaan", "Thema", "Begin hier". */
  caption: string;
}

const GOSPELS = ['MATT', 'MARK', 'LUKE', 'JOHN'];

function firstPart(quizzes: Quiz[], code: string): Quiz | undefined {
  return quizzes
    .filter((quiz) => quiz.book === code)
    .sort(compareCanonical)
    .find((quiz) => quiz.part <= 1 || quiz.chapterFrom === 1) ??
    quizzes.filter((quiz) => quiz.book === code).sort(compareCanonical)[0];
}

/**
 * Four tiles above the contents. Signed in: the next unplayed part of the
 * series the reader touched most recently, then fill. Signed out: one thematic
 * quiz and an opening part of three gospels.
 */
export function pickFeatured(quizzes: Quiz[], signedIn: boolean): Featured[] {
  const picked: Featured[] = [];
  const taken = new Set<string>();
  const add = (quiz: Quiz | undefined, caption: string) => {
    if (!quiz || taken.has(quiz._id) || picked.length >= 4) return;
    taken.add(quiz._id);
    picked.push({ quiz, caption });
  };

  if (signedIn) {
    const played = quizzes
      .filter(isPlayed)
      .sort((a, b) =>
        (b.progress?.lastCompletedAt ?? '').localeCompare(a.progress?.lastCompletedAt ?? '')
      );
    // The two most recent series, so a reader who alternates between Lucas
    // and Handelingen sees both threads.
    const seriesSeen = new Set<string>();
    for (const recent of played) {
      if (seriesSeen.has(recent.seriesKey)) continue;
      seriesSeen.add(recent.seriesKey);
      const next = quizzes
        .filter((quiz) => quiz.seriesKey === recent.seriesKey && !isPlayed(quiz))
        .sort(compareCanonical)[0];
      add(next, 'Verder gaan');
      if (seriesSeen.size >= 2) break;
    }
  }

  add(
    quizzes.find((quiz) => quiz.book === null && !isPlayed(quiz)) ??
      quizzes.find((quiz) => quiz.book === null),
    'Thema'
  );
  for (const code of GOSPELS) {
    add(firstPart(quizzes, code), 'Begin hier');
  }
  // Whatever is still open, in canonical order, unplayed first.
  const rest = [...quizzes].sort(compareCanonical);
  for (const quiz of rest) if (!isPlayed(quiz)) add(quiz, 'Nog te spelen');
  for (const quiz of rest) add(quiz, 'Uitgelicht');

  return picked;
}
