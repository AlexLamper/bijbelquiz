import { readSeries } from '@/lib/quiz-series';

/**
 * The quiz behind the big "Volgende quiz" button on the result page.
 *
 * A real next step rather than a link to the catalogue, in this order:
 * 1. the next part of the same series ("Handelingen 4" after "Handelingen 3"),
 * 2. a quiz about the same Bible book, the next chapter first,
 * 3. a quiz in the same category,
 * 4. any other quiz,
 * each time preferring quizzes the player has not played yet. Candidates keep
 * the catalogue order they are passed in, so ties go to the first.
 */
export interface NextQuizCandidate {
  id: string;
  slug?: string | null;
  title: string;
  categoryId?: string | null;
  /** Canonical book code the quiz is mostly about ("JOHN"). */
  book?: string | null;
  /** Chapter the quiz is mostly about. */
  chapter?: number | null;
}

export function pickNextQuiz<T extends NextQuizCandidate>(
  current: NextQuizCandidate,
  candidates: T[],
  playedQuizIds: Iterable<string> = [],
): T | null {
  const played = new Set(Array.from(playedQuizIds, String));
  const others = candidates.filter((quiz) => quiz.id !== current.id);
  if (others.length === 0) return null;

  const fresh = others.filter((quiz) => !played.has(quiz.id));
  const pools = fresh.length > 0 ? [fresh, others] : [others];

  const series = readSeries(current.title);

  for (const pool of pools) {
    // 1. The next part of the same series.
    if (series.part > 0) {
      const later = pool
        .map((quiz) => ({ quiz, series: readSeries(quiz.title) }))
        .filter((entry) => entry.series.key === series.key && entry.series.part > series.part)
        .sort((a, b) => a.series.part - b.series.part);
      if (later[0]) return later[0].quiz;
    }

    // 2. The same book: the next chapter on, else the nearest one.
    if (current.book) {
      const sameBook = pool.filter((quiz) => quiz.book && quiz.book === current.book);
      if (sameBook.length > 0) {
        const chapter = current.chapter ?? 0;
        const after = sameBook
          .filter((quiz) => (quiz.chapter ?? 0) > chapter)
          .sort((a, b) => (a.chapter ?? 0) - (b.chapter ?? 0));
        if (after[0]) return after[0];
        const nearest = [...sameBook].sort(
          (a, b) => Math.abs((a.chapter ?? 0) - chapter) - Math.abs((b.chapter ?? 0) - chapter),
        );
        return nearest[0];
      }
    }

    // 3. The same category.
    if (current.categoryId) {
      const sameCategory = pool.find((quiz) => quiz.categoryId && quiz.categoryId === current.categoryId);
      if (sameCategory) return sameCategory;
    }

    // 4. Anything else in the pool.
    if (pool[0]) return pool[0];
  }

  return null;
}

/** The book and chapter most questions of a quiz point at. */
export function dominantBookChapter(
  questions: ReadonlyArray<{ refBook?: string | null; refChapter?: number | null }>,
): { book: string | null; chapter: number | null } {
  const counts = new Map<string, { book: string; chapter: number | null; count: number }>();
  for (const question of questions) {
    if (!question.refBook) continue;
    const chapter = typeof question.refChapter === 'number' && question.refChapter > 0 ? question.refChapter : null;
    const key = `${question.refBook}:${chapter ?? ''}`;
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { book: question.refBook, chapter, count: 1 });
  }
  let best: { book: string; chapter: number | null; count: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return { book: best?.book ?? null, chapter: best?.chapter ?? null };
}
