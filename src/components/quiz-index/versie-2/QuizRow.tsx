'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { QuizIndexQuiz } from '@/lib/quiz-index-data';
import { bestScore, chapterLabel, difficultyOf, isPlayed, quizHref, rowTitle } from './library';

/**
 * One quiz as a single line: what it is, where it sits, how hard, how long,
 * how the reader did. Used both in an open book and under the search box.
 */
export function QuizRow({
  quiz,
  showBook = false,
  isNext = false,
  isHighlighted = false,
  onClick,
}: {
  quiz: QuizIndexQuiz;
  /** Under the search box the row also names its book; inside a book that is redundant. */
  showBook?: boolean;
  /** "Verder gaan": the part a signed-in reader should pick up next. */
  isNext?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}) {
  const difficulty = difficultyOf(quiz);
  const played = isPlayed(quiz);
  const score = bestScore(quiz);
  const chapters = chapterLabel(quiz);
  const title = showBook && quiz.bookTitle ? quiz.title : rowTitle(quiz);

  return (
    <li
      id={`quiz-${quiz._id}`}
      className={cn(
        'border-b border-rule transition-colors last:border-b-0',
        isHighlighted && 'border-l-2 border-l-lapis'
      )}
    >
      <Link
        href={quizHref(quiz)}
        onClick={onClick}
        className={cn(
          'group flex min-w-0 items-center gap-x-3 py-2.5 text-sm transition-colors hover:bg-paper-sunken sm:gap-x-4',
          isHighlighted ? 'pl-3 pr-2' : 'px-2'
        )}
      >
        <span
          className={cn(
            'w-[4.5rem] shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] tabular-nums sm:w-24',
            isHighlighted ? 'text-lapis' : 'text-ink-muted'
          )}
        >
          {showBook && quiz.bookTitle ? quiz.bookTitle : chapters || (quiz.part > 0 ? '' : 'Thema')}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-ink transition-colors group-hover:text-lapis-strong">
            {title}
            {showBook && chapters && (
              <span className="ml-2 text-xs text-ink-muted">{chapters}</span>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-ink-muted">
            <span className={difficulty.text}>{difficulty.label}</span>
            <span className="mx-1.5 text-rule-strong">/</span>
            <span className="tabular-nums">
              {quiz.questionCount} {quiz.questionCount === 1 ? 'vraag' : 'vragen'}
            </span>
            {isNext && (
              <>
                <span className="mx-1.5 text-rule-strong">/</span>
                <span className="font-medium text-lapis">Verder gaan</span>
              </>
            )}
          </span>
        </span>

        {played && (
          <span className="hidden shrink-0 items-center gap-1.5 text-xs text-positive tabular-nums sm:inline-flex">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            {score ?? 'Gespeeld'}
          </span>
        )}
        {played && (
          <span className="inline-flex shrink-0 text-positive sm:hidden" aria-label="Gespeeld">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        )}

        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-ink" />
      </Link>
    </li>
  );
}
