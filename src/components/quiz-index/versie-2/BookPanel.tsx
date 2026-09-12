'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { QuizIndexBook, QuizIndexQuiz } from '@/lib/quiz-index-data';
import { EmptyState } from '@/components/editorial';
import { QuizRow } from './QuizRow';
import { isPlayed, nextInSeries } from './library';

/**
 * The book taken off the shelf: title, a chapter ruler and the quizzes as a
 * compact list. Clicking a chapter number scrolls to the first quiz over that
 * chapter and marks it with a lapis rule. The parent keys this on the book
 * code, so the highlight starts clean for every book.
 */
export function BookPanel({
  book,
  quizzes,
  isSignedIn,
  initialChapter,
  onClose,
}: {
  book: QuizIndexBook;
  quizzes: QuizIndexQuiz[];
  isSignedIn: boolean;
  /** A "Lucas 15" search lands on this chapter straight away. */
  initialChapter: number | null;
  onClose: () => void;
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const covered = new Set(book.chaptersCovered);
  const played = quizzes.filter(isPlayed).length;

  // The part to pick up next, per series, for a signed-in reader.
  const nextIds = new Set<string>();
  if (isSignedIn) {
    const bySeries = new Map<string, QuizIndexQuiz[]>();
    for (const quiz of quizzes) {
      if (quiz.part === 0) continue;
      bySeries.set(quiz.seriesKey, [...(bySeries.get(quiz.seriesKey) ?? []), quiz]);
    }
    for (const series of bySeries.values()) {
      const next = nextInSeries(series);
      if (next) nextIds.add(next._id);
    }
  }

  const quizForChapter = (chapter: number) =>
    quizzes.find(
      (quiz) =>
        quiz.chapterFrom !== null &&
        quiz.chapterTo !== null &&
        quiz.chapterFrom <= chapter &&
        chapter <= quiz.chapterTo
    ) ?? null;

  const jumpTo = (chapter: number) => {
    const target = quizForChapter(chapter);
    setHighlighted(target?._id ?? null);
    if (!target) return;
    document
      .getElementById(`quiz-${target._id}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  // A search for "Lucas 15" opens the book already pointing at chapter 15.
  const initialTarget = initialChapter !== null ? quizForChapter(initialChapter)?._id ?? null : null;
  const activeId = highlighted ?? initialTarget;

  const highlightedChapter = (() => {
    const quiz = quizzes.find((entry) => entry._id === activeId);
    return quiz ? { from: quiz.chapterFrom, to: quiz.chapterTo } : null;
  })();

  return (
    <div className="w-full rounded-lg border border-lapis/45 bg-paper-raised px-5 py-5 sm:px-7 sm:py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted tabular-nums">
            {book.testament === 'OT' ? 'Oude Testament' : 'Nieuwe Testament'}
            <span className="mx-2 text-rule-strong">/</span>
            {book.chapters} {book.chapters === 1 ? 'hoofdstuk' : 'hoofdstukken'}
          </p>
          <h3 className="mt-2 font-display text-[26px] font-normal leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
            {book.title}
          </h3>
          <p className="mt-1.5 text-sm text-ink-muted tabular-nums">
            {quizzes.length === 0
              ? 'Nog geen quizzen over dit boek.'
              : `${quizzes.length} ${quizzes.length === 1 ? 'quiz' : 'quizzen'} over ${book.chaptersCovered.length} van de ${book.chapters} hoofdstukken`}
            {isSignedIn && played > 0 && (
              <>
                <span className="mx-2 text-rule-strong">/</span>
                <span className="text-positive">{played} gespeeld</span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Boek terugzetten"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-rule text-ink-soft transition-colors hover:border-rule-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chapter ruler: every chapter in the book, the covered ones in ink. */}
      <ol
        aria-label="Hoofdstukken"
        className="mt-5 flex flex-wrap gap-x-1 gap-y-1.5 border-y border-rule py-3"
      >
        {Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => {
          const has = covered.has(chapter);
          const isActive =
            highlightedChapter !== null &&
            highlightedChapter.from !== null &&
            highlightedChapter.to !== null &&
            highlightedChapter.from <= chapter &&
            chapter <= highlightedChapter.to;
          return (
            <li key={chapter}>
              <button
                type="button"
                disabled={!has}
                onClick={() => jumpTo(chapter)}
                aria-label={has ? `Hoofdstuk ${chapter}` : `Hoofdstuk ${chapter}, geen quiz`}
                className={cn(
                  'inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1 text-xs tabular-nums transition-colors',
                  has
                    ? 'font-medium text-ink underline decoration-lapis decoration-1 underline-offset-4 hover:bg-paper-sunken'
                    : 'text-ink-muted/70',
                  isActive && 'text-lapis'
                )}
              >
                {chapter}
              </button>
            </li>
          );
        })}
      </ol>

      {quizzes.length === 0 ? (
        <EmptyState
          className="mt-5 py-10"
          title="Dit boek staat nog leeg op de plank"
          description="Er is nog geen quiz over dit bijbelboek. Kies een boek met een lapis merkteken."
        />
      ) : (
        <ol className="mt-3 max-h-[26rem] overflow-y-auto">
          {quizzes.map((quiz) => (
            <QuizRow
              key={quiz._id}
              quiz={quiz}
              isNext={nextIds.has(quiz._id)}
              isHighlighted={quiz._id === activeId}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
