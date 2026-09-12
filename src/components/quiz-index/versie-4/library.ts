/**
 * Pure helpers for the explorer: where a quiz sits, what a query means, and
 * which quizzes answer it. Kept out of the components so the search can be
 * reasoned about (and tested) without React in the room.
 */

import type { QuizIndexBook, QuizIndexQuiz } from '@/lib/quiz-index-data';
import { normalizeSearchText } from '@/lib/quiz-series';
import type { Pigment } from '@/components/editorial';

/** Rail entries that are not a Bible book. */
export const FEATURED_KEY = 'uitgelicht';
export const THEMES_KEY = 'themas';

export const DIFFICULTY: Record<string, { label: string; pigment: Pigment }> = {
  easy: { label: 'Makkelijk', pigment: 'verdigris' },
  beginner: { label: 'Makkelijk', pigment: 'verdigris' },
  medium: { label: 'Gemiddeld', pigment: 'neutral' },
  intermediate: { label: 'Gemiddeld', pigment: 'neutral' },
  hard: { label: 'Moeilijk', pigment: 'vermilion' },
  advanced: { label: 'Moeilijk', pigment: 'vermilion' },
};

export function difficultyOf(quiz: QuizIndexQuiz): { label: string; pigment: Pigment } {
  return DIFFICULTY[quiz.difficulty?.toLowerCase()] ?? { label: quiz.difficulty, pigment: 'neutral' };
}

export function isPlayed(quiz: QuizIndexQuiz): boolean {
  return (quiz.progress?.attempts ?? 0) > 0;
}

/** "8/10" from the best attempt, or null when the quiz was never played. */
export function bestScoreLabel(quiz: QuizIndexQuiz): string | null {
  if (!isPlayed(quiz)) return null;
  const total = quiz.progress?.lastTotalQuestions || quiz.questionCount;
  if (!total) return null;
  return `${quiz.progress?.bestCorrectAnswers ?? 0}/${total}`;
}

/** "15" or "15-17"; null for a quiz with no chapter span. */
export function chapterLabel(quiz: QuizIndexQuiz): string | null {
  if (quiz.chapterFrom === null || quiz.chapterTo === null) return null;
  if (quiz.chapterFrom === quiz.chapterTo) return String(quiz.chapterFrom);
  return `${quiz.chapterFrom}-${quiz.chapterTo}`;
}

/** Chapter first, then part, then title - the order of the timeline. */
export function compareByChapter(a: QuizIndexQuiz, b: QuizIndexQuiz): number {
  const fromA = a.chapterFrom ?? Number.MAX_SAFE_INTEGER;
  const fromB = b.chapterFrom ?? Number.MAX_SAFE_INTEGER;
  if (fromA !== fromB) return fromA - fromB;
  const toA = a.chapterTo ?? Number.MAX_SAFE_INTEGER;
  const toB = b.chapterTo ?? Number.MAX_SAFE_INTEGER;
  if (toA !== toB) return toA - toB;
  if (a.part !== b.part) return a.part - b.part;
  return a.title.localeCompare(b.title, 'nl');
}

export function pluralQuizzen(count: number): string {
  return `${count} ${count === 1 ? 'quiz' : 'quizzen'}`;
}

/** Quizzes grouped by book code; thematic quizzes under `null`. Each list is in timeline order. */
export function groupByBook(quizzes: QuizIndexQuiz[]): Map<string | null, QuizIndexQuiz[]> {
  const groups = new Map<string | null, QuizIndexQuiz[]>();
  for (const quiz of quizzes) {
    const bucket = groups.get(quiz.book);
    if (bucket) bucket.push(quiz);
    else groups.set(quiz.book, [quiz]);
  }
  groups.forEach((list) => list.sort(compareByChapter));
  return groups;
}

/* ------------------------------------------------------------------------ */
/* Search                                                                    */
/* ------------------------------------------------------------------------ */

export interface ParsedQuery {
  /** Whole query, folded. */
  text: string;
  /** Book the query names, if the leading words match a title or short form. */
  book: QuizIndexBook | null;
  /** Chapter after the book name: "Lucas 15" gives 15; "Lucas" gives null. */
  chapter: number | null;
  /** Second chapter of a "Lucas 15-17" query. */
  chapterTo: number | null;
}

function foldBookForms(book: QuizIndexBook): string[] {
  const forms = new Set<string>();
  forms.add(normalizeSearchText(book.title));
  forms.add(normalizeSearchText(book.short.replace(/\.$/, '')));
  forms.add(normalizeSearchText(book.code));
  // Common spellings that differ from the title the site uses.
  const alternates: Record<string, string[]> = {
    MATT: ['mattheus', 'matheus', 'mat'],
    MARK: ['markus'],
    LUKE: ['lukas', 'luk'],
    JOHN: ['joh'],
    ACTS: ['hand', 'handelingen der apostelen'],
    PS: ['psalm', 'psalmen'],
    SONG: ['hooglied'],
    ECCL: ['pred'],
    LAM: ['klaagl'],
    REV: ['openb', 'openbaringen'],
    GEN: ['gen'],
    EXOD: ['exod', 'ex'],
    '1COR': ['1 korinthe', '1 korinthiers', '1 kor'],
    '2COR': ['2 korinthe', '2 korinthiers', '2 kor'],
    '1THESS': ['1 thessalonicenzen', '1 tess'],
    '2THESS': ['2 thessalonicenzen', '2 tess'],
    '1TIM': ['1 timotheus'],
    '2TIM': ['2 timotheus'],
    HEB: ['hebreeen', 'hebr'],
    JAS: ['jacobus'],
  };
  (alternates[book.code] ?? []).forEach((form) => forms.add(normalizeSearchText(form)));
  return [...forms].filter(Boolean);
}

/**
 * Read "Lucas 15", "luc 15-17", "1 kor 3" or "Matteus" into a book and a
 * chapter. The book name is matched by whole form or by a prefix of at least
 * three characters, longest match first, so "joh" is Johannes and not Job.
 */
export function parseQuery(raw: string, books: QuizIndexBook[]): ParsedQuery {
  const text = normalizeSearchText(raw);
  const empty: ParsedQuery = { text, book: null, chapter: null, chapterTo: null };
  if (!text) return empty;

  const match = text.match(/^(.+?)\s*(?::|\s)?\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/);
  const namePart = match ? match[1].trim() : text;
  const chapter = match ? Number(match[2]) : null;
  const chapterTo = match && match[3] ? Number(match[3]) : null;

  let best: { book: QuizIndexBook; length: number } | null = null;
  for (const book of books) {
    for (const form of foldBookForms(book)) {
      const hit =
        form === namePart ||
        (namePart.length >= 3 && form.startsWith(namePart)) ||
        (form.length >= 3 && namePart.startsWith(form) && /^\d+ /.test(form));
      if (!hit) continue;
      const length = form === namePart ? form.length + 100 : form.length;
      if (!best || length > best.length) best = { book, length };
    }
  }

  // A number after a word that is not a book ("deel 3") is part of the text.
  if (!best) return { text, book: null, chapter: null, chapterTo: null };

  return {
    text,
    book: best.book,
    chapter: chapter !== null && chapter >= 1 && chapter <= best.book.chapters ? chapter : null,
    chapterTo: chapterTo !== null && chapterTo >= 1 && chapterTo <= best.book.chapters ? chapterTo : null,
  };
}

function haystack(quiz: QuizIndexQuiz): string {
  return normalizeSearchText(
    [quiz.title, quiz.seriesLabel, quiz.bookTitle ?? '', quiz.categoryId?.title ?? ''].join(' ')
  );
}

/**
 * Every quiz a query answers, in canon order. A chapter query only returns
 * quizzes whose span covers that chapter; a bare book name returns the book;
 * anything else is a substring match over title, series, book and category.
 */
export function searchQuizzes(
  quizzes: QuizIndexQuiz[],
  parsed: ParsedQuery,
  bookOrder: Map<string, number>
): QuizIndexQuiz[] {
  if (!parsed.text) return [];

  let hits: QuizIndexQuiz[];

  if (parsed.book && parsed.chapter !== null) {
    const from = parsed.chapter;
    const to = parsed.chapterTo ?? parsed.chapter;
    hits = quizzes.filter(
      (quiz) =>
        quiz.book === parsed.book?.code &&
        quiz.chapterFrom !== null &&
        quiz.chapterTo !== null &&
        quiz.chapterFrom <= to &&
        quiz.chapterTo >= from
    );
  } else if (parsed.book) {
    const code = parsed.book.code;
    const inBook = quizzes.filter((quiz) => quiz.book === code);
    // "Lucas" also finds a thematic quiz that mentions Lucas in its title.
    const byText = quizzes.filter((quiz) => quiz.book !== code && haystack(quiz).includes(parsed.text));
    hits = [...inBook, ...byText];
  } else {
    hits = quizzes.filter((quiz) => haystack(quiz).includes(parsed.text));
  }

  return hits.sort((a, b) => {
    const orderA = a.book ? (bookOrder.get(a.book) ?? 998) : 999;
    const orderB = b.book ? (bookOrder.get(b.book) ?? 998) : 999;
    if (orderA !== orderB) return orderA - orderB;
    return compareByChapter(a, b);
  });
}

/* ------------------------------------------------------------------------ */
/* Featured                                                                  */
/* ------------------------------------------------------------------------ */

const GOSPELS = ['MATT', 'MARK', 'LUKE', 'JOHN'];

/**
 * The next unplayed part of the series the reader touched most recently, or
 * null when nothing was played or the series is finished.
 */
export function nextInLastSeries(quizzes: QuizIndexQuiz[]): { last: QuizIndexQuiz; next: QuizIndexQuiz } | null {
  let last: QuizIndexQuiz | null = null;
  for (const quiz of quizzes) {
    if (!isPlayed(quiz) || !quiz.progress) continue;
    if (!last || quiz.progress.lastCompletedAt > (last.progress?.lastCompletedAt ?? '')) last = quiz;
  }
  if (!last) return null;

  const sameSeries = quizzes
    .filter((quiz) => quiz.seriesKey === last!.seriesKey && quiz._id !== last!._id)
    .sort((a, b) => a.part - b.part || compareByChapter(a, b));
  const after = sameSeries.find((quiz) => !isPlayed(quiz) && quiz.part > last!.part)
    ?? sameSeries.find((quiz) => !isPlayed(quiz));
  if (after) return { last, next: after };

  // Series done: carry on in the same book, next chapter along.
  if (last.book) {
    const inBook = quizzes
      .filter((quiz) => quiz.book === last!.book && !isPlayed(quiz))
      .sort(compareByChapter);
    const later = inBook.find((quiz) => (quiz.chapterFrom ?? 0) > (last!.chapterTo ?? 0)) ?? inBook[0];
    if (later) return { last, next: later };
  }
  return null;
}

/**
 * Four to six tiles for the opening view: one thematic quiz, the first part
 * of each gospel, and the first part of the newest series.
 */
export function pickFeatured(quizzes: QuizIndexQuiz[], exclude: string[] = []): QuizIndexQuiz[] {
  const picked: QuizIndexQuiz[] = [];
  const seen = new Set(exclude);
  const add = (quiz: QuizIndexQuiz | undefined) => {
    if (!quiz || seen.has(quiz._id)) return;
    seen.add(quiz._id);
    picked.push(quiz);
  };

  const firstOf = (list: QuizIndexQuiz[]) =>
    [...list].sort((a, b) => a.part - b.part || compareByChapter(a, b))[0];

  add(quizzes.find((quiz) => quiz.book === null));

  for (const code of GOSPELS) {
    add(firstOf(quizzes.filter((quiz) => quiz.book === code)));
  }

  const newestByCreated = [...quizzes]
    .filter((quiz) => quiz.createdAt)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  for (const candidate of newestByCreated) {
    if (picked.length >= 6) break;
    if (GOSPELS.includes(candidate.book ?? '')) continue;
    add(firstOf(quizzes.filter((quiz) => quiz.seriesKey === candidate.seriesKey)));
    if (picked.length >= 6) break;
  }

  // Thin library: pad with anything so the opening view never looks empty.
  for (const quiz of quizzes) {
    if (picked.length >= 4) break;
    add(quiz);
  }

  return picked.slice(0, 6);
}
