'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { QuizIndexBook, QuizIndexQuiz } from '@/lib/quiz-index-data';
import { quizHref, spineWidth } from './library';

/**
 * One book on the shelf. Built in CSS: a tall narrow block, the title running
 * down the spine on desktop, lying flat as a short label on phones. Width
 * follows the chapter count. A book with quizzes carries a lapis mark and its
 * count near the top; a book without is drawn quiet, rule border only.
 */
export function BookSpine({
  book,
  isOpen,
  isDimmed,
  onToggle,
}: {
  book: QuizIndexBook;
  isOpen: boolean;
  isDimmed: boolean;
  onToggle: () => void;
}) {
  const hasQuizzes = book.quizCount > 0;
  const { desktop, phone } = spineWidth(book.chapters);
  const style = { '--spine-w': `${desktop}px`, '--spine-w-sm': `${phone}px` } as CSSProperties;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={`${book.title}, ${book.chapters} hoofdstukken, ${book.quizCount} quizzen`}
      style={style}
      className={cn(
        'group relative flex shrink-0 rounded-md border transition-[transform,opacity,border-color] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
        'h-11 w-[var(--spine-w-sm)] flex-row items-center justify-center px-1.5',
        'sm:h-[168px] sm:w-[var(--spine-w)] sm:flex-col sm:items-center sm:justify-start sm:px-0 sm:pt-2.5',
        hasQuizzes
          ? cn('bg-paper-raised text-ink', !isOpen && 'hover:-translate-y-0.5 hover:border-rule-strong')
          : 'bg-paper text-ink-muted',
        isOpen ? 'border-lapis -translate-y-1 sm:-translate-y-1.5' : 'border-rule',
        isDimmed && 'opacity-30'
      )}
    >
      {hasQuizzes && (
        <span
          className={cn(
            'flex items-center gap-1 text-[10px] font-medium tabular-nums',
            'sm:flex-col sm:gap-1 sm:pb-2',
            isOpen ? 'text-lapis' : 'text-ink-soft'
          )}
        >
          <span aria-hidden className="h-px w-2.5 bg-lapis sm:w-3" />
          {book.quizCount}
        </span>
      )}

      <span
        className={cn(
          'truncate text-[11px] font-medium leading-none',
          'sm:hidden',
          hasQuizzes && 'ml-1.5'
        )}
      >
        {book.short}
      </span>

      <span
        className={cn(
          'hidden sm:block sm:min-h-0 sm:flex-1 sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap',
          'sm:[writing-mode:vertical-rl] sm:text-[12px] sm:leading-none sm:tracking-[0.01em]',
          hasQuizzes ? 'font-medium' : 'font-normal'
        )}
      >
        {book.title}
      </span>
    </button>
  );
}

/**
 * A thematic quiz has no book to hide inside, so its spine is the link itself.
 */
export function ThemeSpine({ quiz, isDimmed }: { quiz: QuizIndexQuiz; isDimmed: boolean }) {
  const played = (quiz.progress?.attempts ?? 0) > 0;
  const style = { '--spine-w': '44px', '--spine-w-sm': '150px' } as CSSProperties;

  return (
    <Link
      href={quizHref(quiz)}
      style={style}
      title={quiz.title}
      className={cn(
        'group relative flex shrink-0 rounded-md border border-rule bg-paper-raised text-ink transition-[transform,opacity,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-rule-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
        'h-11 w-[var(--spine-w-sm)] flex-row items-center px-2.5',
        'sm:h-[168px] sm:w-[var(--spine-w)] sm:flex-col sm:items-center sm:px-0 sm:pt-2.5',
        isDimmed && 'opacity-30'
      )}
    >
      <span
        aria-hidden
        className={cn('h-px w-2.5 shrink-0 sm:mb-2 sm:w-3', played ? 'bg-positive' : 'bg-lapis')}
      />
      <span
        className={cn(
          'ml-2 truncate text-[11px] font-medium leading-none sm:ml-0 sm:min-h-0 sm:flex-1 sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap',
          'sm:[writing-mode:vertical-rl] sm:text-[12px] sm:tracking-[0.01em]'
        )}
      >
        {quiz.title}
      </span>
    </Link>
  );
}
