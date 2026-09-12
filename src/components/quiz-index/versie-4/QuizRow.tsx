'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PIGMENT_TEXT } from '@/components/editorial';
import type { QuizIndexQuiz } from '@/lib/quiz-index-data';
import { bestScoreLabel, chapterLabel, difficultyOf, isPlayed } from './library';

interface QuizRowProps {
  quiz: QuizIndexQuiz;
  /** What stands in the left column: the chapter (book view) or the reference (search). */
  mark: 'chapter' | 'reference';
  id?: string;
  className?: string;
}

/**
 * One line of the chapter timeline: number, title, facts, arrow. Rows are
 * separated by hairlines and never boxed - a book of thirty quizzes should
 * read like a table of contents, not thirty cards.
 */
export function QuizRow({ quiz, mark, id, className }: QuizRowProps) {
  const difficulty = difficultyOf(quiz);
  const played = isPlayed(quiz);
  const score = bestScoreLabel(quiz);
  const chapter = chapterLabel(quiz);

  const reference =
    quiz.bookTitle && chapter
      ? `${quiz.bookTitle} ${chapter}`
      : quiz.bookTitle ?? (quiz.categoryId?.title || 'Thema');

  return (
    <li id={id} className={cn('scroll-mt-24 border-b border-rule', className)}>
      <Link
        href={`/quiz/${quiz.slug ?? quiz._id}`}
        className="group grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-x-3 py-3.5 transition-colors sm:gap-x-5 sm:py-4"
      >
        {mark === 'chapter' ? (
          <span
            aria-label={chapter ? `Hoofdstuk ${chapter}` : undefined}
            className={cn(
              'font-display text-[26px] leading-none tracking-[-0.02em] tabular-nums sm:text-[30px]',
              chapter ? 'text-ink' : 'text-ink-muted'
            )}
          >
            {chapter ?? '·'}
          </span>
        ) : (
          <span className="text-[11px] font-medium uppercase leading-tight tracking-[0.14em] text-ink-muted tabular-nums">
            {reference}
          </span>
        )}

        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-ink transition-colors group-hover:text-lapis-strong">
            {quiz.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
            <span className={cn('font-medium', PIGMENT_TEXT[difficulty.pigment])}>{difficulty.label}</span>
            <span aria-hidden className="text-rule-strong">/</span>
            <span className="tabular-nums">
              {quiz.questionCount} {quiz.questionCount === 1 ? 'vraag' : 'vragen'}
            </span>
            {played && (
              <>
                <span aria-hidden className="text-rule-strong">/</span>
                <span className="inline-flex items-center gap-1 text-positive tabular-nums">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  {score ? `beste ${score}` : 'gespeeld'}
                </span>
              </>
            )}
          </span>
        </span>

        <ArrowRight className="h-4 w-4 text-ink-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ink" />
      </Link>
    </li>
  );
}
