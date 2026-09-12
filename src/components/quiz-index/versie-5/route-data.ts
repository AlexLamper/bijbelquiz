/**
 * Pure helpers behind the "Reis door de Bijbel" quiz index: the stations on
 * the route, what a search query means, and which quizzes to put forward.
 * Nothing here touches React or the DOM, so it is easy to read and to test.
 */

import { BOOK_GROUPS } from '@/lib/bible-books';
import type { QuizIndexBook, QuizIndexQuiz } from '@/lib/quiz-index-data';
import { normalizeSearchText } from '@/lib/quiz-series';
import type { Pigment } from '@/components/editorial';

/** Station code for the quizzes that belong to no single book. */
export const THEME_STATION = 'THEMA';

export interface Station {
  code: string;
  title: string;
  short: string;
  groupId: string;
  /** Eyebrow above the segment; null for the closing "Thema's" station. */
  groupLabel: string | null;
  quizCount: number;
  /** Lowest and highest chapter a quiz covers, or null without quizzes. */
  chapterFrom: number | null;
  chapterTo: number | null;
  played: boolean;
}

export const DIFFICULTY: Record<string, { label: string; pigment: Pigment; text: string }> = {
  easy: { label: 'Makkelijk', pigment: 'verdigris', text: 'text-positive' },
  medium: { label: 'Gemiddeld', pigment: 'neutral', text: 'text-ink-soft' },
  hard: { label: 'Moeilijk', pigment: 'vermilion', text: 'text-vermilion' },
};

export function difficultyOf(quiz: QuizIndexQuiz) {
  return DIFFICULTY[quiz.difficulty?.toLowerCase()] ?? DIFFICULTY.medium;
}

export function stationOf(quiz: QuizIndexQuiz): string {
  return quiz.book ?? THEME_STATION;
}

export function isPlayed(quiz: QuizIndexQuiz): boolean {
  return (quiz.progress?.attempts ?? 0) > 0;
}

export function quizHref(quiz: QuizIndexQuiz): string {
  return `/quiz/${quiz.slug ?? quiz._id}`;
}

/** Chapter order first, then part, then title: a long series reads top to bottom. */
export function sortForBook(quizzes: QuizIndexQuiz[]): QuizIndexQuiz[] {
  return [...quizzes].sort((a, b) => {
    const chapterA = a.chapterFrom ?? Number.MAX_SAFE_INTEGER;
    const chapterB = b.chapterFrom ?? Number.MAX_SAFE_INTEGER;
    if (chapterA !== chapterB) return chapterA - chapterB;
    if (a.part !== b.part) return a.part - b.part;
    return a.title.localeCompare(b.title, 'nl');
  });
}

/** All 66 books in canon order, then the thematic station at the end. */
export function buildStations(books: QuizIndexBook[], quizzes: QuizIndexQuiz[]): Station[] {
  const playedStations = new Set<string>();
  let themeCount = 0;
  for (const quiz of quizzes) {
    if (isPlayed(quiz)) playedStations.add(stationOf(quiz));
    if (!quiz.book) themeCount += 1;
  }

  const groupLabel = new Map(BOOK_GROUPS.map((group) => [group.id, group.label]));

  const stations: Station[] = books.map((book) => ({
    code: book.code,
    title: book.title,
    short: book.short,
    groupId: book.group,
    groupLabel: groupLabel.get(book.group) ?? book.group,
    quizCount: book.quizCount,
    chapterFrom: book.chaptersCovered.length ? book.chaptersCovered[0] : null,
    chapterTo: book.chaptersCovered.length
      ? book.chaptersCovered[book.chaptersCovered.length - 1]
      : null,
    played: playedStations.has(book.code),
  }));

  stations.push({
    code: THEME_STATION,
    title: "Thema's",
    short: "Thema's",
    groupId: 'thema',
    groupLabel: null,
    quizCount: themeCount,
    chapterFrom: null,
    chapterTo: null,
    played: playedStations.has(THEME_STATION),
  });

  return stations;
}

export function groupByStation(quizzes: QuizIndexQuiz[]): Map<string, QuizIndexQuiz[]> {
  const map = new Map<string, QuizIndexQuiz[]>();
  for (const quiz of quizzes) {
    const code = stationOf(quiz);
    const bucket = map.get(code);
    if (bucket) bucket.push(quiz);
    else map.set(code, [quiz]);
  }
  for (const [code, bucket] of map) map.set(code, sortForBook(bucket));
  return map;
}

/** "29 quizzen, hoofdstuk 1 tot 21" */
export function coverageLead(station: Station): string {
  const count = station.quizCount;
  if (count === 0) return 'Nog geen quizzen voor dit boek.';
  const quizzes = count === 1 ? '1 quiz' : `${count} quizzen`;
  if (station.chapterFrom === null || station.chapterTo === null) return quizzes;
  if (station.chapterFrom === station.chapterTo) {
    return `${quizzes}, hoofdstuk ${station.chapterFrom}`;
  }
  return `${quizzes}, hoofdstuk ${station.chapterFrom} tot ${station.chapterTo}`;
}

/* ---------------------------------------------------------------- search -- */

export interface SearchResult {
  quizzes: QuizIndexQuiz[];
  /** Stations to keep lit; every other station dims. */
  stations: Set<string>;
}

/**
 * "Lucas 15", "1 kor 3", "joh", "Jesaja": a book name, possibly abbreviated,
 * possibly followed by a chapter. Anything else is a plain text query.
 */
function parseReference(query: string): { name: string; chapter: number | null } | null {
  const match = query.match(/^([1-3]?\s*[a-z][a-z\s.]*?)\.?\s*(\d{1,3})?$/);
  if (!match) return null;
  const name = match[1].replace(/\.+$/, '').trim();
  if (name.length < 2) return null;
  return { name, chapter: match[2] ? Number(match[2]) : null };
}

function bookMatches(book: QuizIndexBook, name: string): boolean {
  const title = normalizeSearchText(book.title);
  const short = normalizeSearchText(book.short.replace(/\./g, ''));
  return (
    title.startsWith(name) ||
    short.startsWith(name) ||
    (name.length >= 4 && name.startsWith(title)) ||
    book.code.toLowerCase() === name
  );
}

export function runSearch(
  rawQuery: string,
  quizzes: QuizIndexQuiz[],
  books: QuizIndexBook[]
): SearchResult | null {
  const query = normalizeSearchText(rawQuery);
  if (query.length < 2) return null;

  const stations = new Set<string>();
  const matched = new Map<string, QuizIndexQuiz>();

  const reference = parseReference(query);
  const namedBooks = reference ? books.filter((book) => bookMatches(book, reference.name)) : [];

  // A reference query is exact: "Lucas 15" means the quizzes that cover
  // chapter 15 of Lucas, not every quiz with "15" in its title.
  if (reference && namedBooks.length > 0) {
    const codes = new Set(namedBooks.map((book) => book.code));
    for (const quiz of quizzes) {
      if (!quiz.book || !codes.has(quiz.book)) continue;
      if (reference.chapter !== null) {
        if (quiz.chapterFrom === null || quiz.chapterTo === null) continue;
        if (reference.chapter < quiz.chapterFrom || reference.chapter > quiz.chapterTo) continue;
      }
      matched.set(quiz._id, quiz);
    }
    // A single, unambiguous book lights up even without quizzes: "ps" should
    // open Psalmen although nothing is there yet. An ambiguous stem such as
    // "jo" (Job, Joël, Jona, Jozua, Johannes) only lights the books that
    // actually have quizzes.
    if (namedBooks.length === 1) stations.add(namedBooks[0].code);
  }

  if (matched.size === 0) {
    for (const quiz of quizzes) {
      const haystack = [
        quiz.title,
        quiz.bookTitle ?? '',
        quiz.seriesLabel,
        quiz.categoryId?.title ?? '',
      ]
        .map(normalizeSearchText)
        .join(' | ');
      if (haystack.includes(query)) matched.set(quiz._id, quiz);
    }
    if ("thema's".startsWith(query) || 'themas'.startsWith(query)) {
      for (const quiz of quizzes) if (!quiz.book) matched.set(quiz._id, quiz);
    }
  }

  const order = new Map(books.map((book, index) => [book.code, index]));
  const results = [...matched.values()].sort((a, b) => {
    const orderA = a.book ? (order.get(a.book) ?? 998) : 999;
    const orderB = b.book ? (order.get(b.book) ?? 998) : 999;
    if (orderA !== orderB) return orderA - orderB;
    const chapterA = a.chapterFrom ?? Number.MAX_SAFE_INTEGER;
    const chapterB = b.chapterFrom ?? Number.MAX_SAFE_INTEGER;
    if (chapterA !== chapterB) return chapterA - chapterB;
    if (a.part !== b.part) return a.part - b.part;
    return a.title.localeCompare(b.title, 'nl');
  });
  for (const quiz of results) stations.add(stationOf(quiz));

  return { quizzes: results, stations };
}

/* ------------------------------------------------------------- featured -- */

export interface FeaturedQuiz {
  caption: string;
  quiz: QuizIndexQuiz;
}

const GOSPELS = ['MATT', 'MARK', 'LUKE'];

function firstPart(quizzes: QuizIndexQuiz[], code: string): QuizIndexQuiz | undefined {
  return sortForBook(quizzes.filter((quiz) => quiz.book === code)).find(
    (quiz) => quiz.part <= 1
  );
}

/**
 * Four tiles above the route. A signed-in reader is put back where they left
 * off: the next unplayed part of the series they touched most recently comes
 * first. A visitor gets one thematic quiz and the opening part of three
 * gospels, which is where most readers start.
 */
export function pickFeatured(quizzes: QuizIndexQuiz[], isSignedIn: boolean): FeaturedQuiz[] {
  const picks: FeaturedQuiz[] = [];
  const taken = new Set<string>();
  const add = (quiz: QuizIndexQuiz | undefined, caption: string) => {
    if (!quiz || taken.has(quiz._id) || picks.length >= 4) return;
    taken.add(quiz._id);
    picks.push({ caption, quiz });
  };

  if (isSignedIn) {
    const recent = quizzes
      .filter(isPlayed)
      .sort((a, b) =>
        (b.progress?.lastCompletedAt ?? '').localeCompare(a.progress?.lastCompletedAt ?? '')
      );
    const seenSeries = new Set<string>();
    for (const played of recent) {
      if (seenSeries.has(played.seriesKey)) continue;
      seenSeries.add(played.seriesKey);
      const siblings = sortForBook(
        quizzes.filter((quiz) => quiz.seriesKey === played.seriesKey && !isPlayed(quiz))
      );
      const next = siblings.find((quiz) => quiz.part > played.part) ?? siblings[0];
      add(next, 'Verder gaan');
    }
  }

  add(
    quizzes.find((quiz) => !quiz.book && !isPlayed(quiz)),
    'Thema'
  );
  for (const code of GOSPELS) {
    const quiz = firstPart(quizzes, code);
    if (quiz && !isPlayed(quiz)) add(quiz, 'Begin van een evangelie');
  }
  for (const quiz of sortForBook(quizzes)) {
    if (picks.length >= 4) break;
    if (!isPlayed(quiz)) add(quiz, 'Uitgelicht');
  }
  for (const quiz of quizzes) {
    if (picks.length >= 4) break;
    add(quiz, 'Nog een keer');
  }

  return picks;
}

/** The station of the quiz the reader finished most recently, if any. */
export function lastPlayedStation(quizzes: QuizIndexQuiz[]): string | null {
  let latest: QuizIndexQuiz | null = null;
  for (const quiz of quizzes) {
    if (!isPlayed(quiz)) continue;
    if (
      !latest ||
      (quiz.progress?.lastCompletedAt ?? '') > (latest.progress?.lastCompletedAt ?? '')
    ) {
      latest = quiz;
    }
  }
  return latest ? stationOf(latest) : null;
}
