/**
 * Turns `loadQuizIndex()`'s flat quiz list into the per-book, per-chapter shape
 * the `/quizzen` "Doorlopend" overview needs: which chapters of a book have a
 * quiz, which of those the reader has played, and where they should go next.
 *
 * Pure and DB-free - it only reorganises data `loadQuizIndex` already fetched,
 * so the overview page can be built on top of the existing loader without a
 * second query.
 */

import { BIBLE_BOOKS, overviewGenreForGroup, type OverviewGenreId } from '@/lib/bible-books';
import type { QuizIndexQuiz } from '@/lib/quiz-index-data';

export interface ChapterCell {
  chapter: number;
  quizId: string | null;
  quizSlug: string | null;
  available: boolean;
  played: boolean;
}

export interface OverviewBook {
  slug: string;
  code: string;
  title: string;
  chapters: number;
  testament: 'OT' | 'NT';
  genre: OverviewGenreId;
  cells: ChapterCell[];
  avail: number;
  played: number;
  /** First available, not-yet-played chapter; chapter 1 when nothing is played. */
  nextChapter: number;
}

export interface OverviewGenreCount {
  genre: OverviewGenreId;
  avail: number;
}

export function buildOverviewBooks(quizzes: QuizIndexQuiz[]): OverviewBook[] {
  const byBook = new Map<string, QuizIndexQuiz[]>();
  for (const quiz of quizzes) {
    if (!quiz.book) continue;
    const bucket = byBook.get(quiz.book);
    if (bucket) bucket.push(quiz);
    else byBook.set(quiz.book, [quiz]);
  }

  return BIBLE_BOOKS.map((book) => {
    const cells: ChapterCell[] = Array.from({ length: book.chapters }, (_, index) => ({
      chapter: index + 1,
      quizId: null,
      quizSlug: null,
      available: false,
      played: false,
    }));

    for (const quiz of byBook.get(book.code) ?? []) {
      if (quiz.chapterFrom === null || quiz.chapterTo === null) continue;
      const played = (quiz.progress?.attempts ?? 0) > 0;
      for (let chapter = quiz.chapterFrom; chapter <= quiz.chapterTo; chapter += 1) {
        const cell = cells[chapter - 1];
        if (!cell) continue;
        cell.available = true;
        cell.quizId = quiz._id;
        cell.quizSlug = quiz.slug ?? quiz._id;
        if (played) cell.played = true;
      }
    }

    const avail = cells.filter((cell) => cell.available).length;
    const played = cells.filter((cell) => cell.played).length;

    const lastPlayed = cells.reduce(
      (max, cell) => (cell.played && cell.chapter > max ? cell.chapter : max),
      0
    );
    const nextChapter =
      cells.find((cell) => cell.chapter > lastPlayed && cell.available && !cell.played)?.chapter ??
      cells.find((cell) => cell.available && !cell.played)?.chapter ??
      1;

    return {
      slug: book.slug,
      code: book.code,
      title: book.title,
      chapters: book.chapters,
      testament: book.testament,
      genre: overviewGenreForGroup(book.group),
      cells,
      avail,
      played,
      nextChapter,
    };
  });
}

export function countAvailableByGenre(books: OverviewBook[]): Record<OverviewGenreId, number> {
  const counts: Record<string, number> = {};
  for (const book of books) {
    counts[book.genre] = (counts[book.genre] ?? 0) + book.avail;
  }
  return counts as Record<OverviewGenreId, number>;
}
