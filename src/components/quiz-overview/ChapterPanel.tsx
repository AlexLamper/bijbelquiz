'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { OverviewBook } from '@/lib/quiz-overview-data';

export function ChapterPanel({
  book,
  showProgress,
  onClose,
}: {
  book: OverviewBook;
  showProgress: boolean;
  onClose: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-ink bg-paper-raised p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h3 className="font-display text-[22px] leading-none text-ink sm:text-[26px]">
          {book.title}
        </h3>
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
          {book.chapters} hoofdstukken · {book.avail} quizzen
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-[13px] text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
        >
          Sluiten ×
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-[18px] sm:gap-[5px]">
        {book.cells.map((cell) => {
          const isNext = showProgress && cell.chapter === book.nextChapter && cell.available;
          const played = showProgress && cell.played;

          if (!cell.available) {
            return (
              <span
                key={cell.chapter}
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-md border border-dashed border-rule-strong text-sm font-medium text-ink-muted/50 sm:h-9 sm:w-9 sm:rounded-[5px] sm:text-[13px]"
              >
                {cell.chapter}
              </span>
            );
          }

          return (
            <Link
              key={cell.chapter}
              href={`/quiz/${cell.quizSlug}`}
              aria-label={`${book.title} ${cell.chapter}${played ? ' - gespeeld' : ''}`}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis sm:h-9 sm:w-9 sm:rounded-[5px] sm:text-[13px]',
                played
                  ? 'border-ink bg-ink text-ink-inverted'
                  : 'border-rule-strong bg-paper-raised text-ink hover:border-ink',
                isNext && 'ring-2 ring-lapis'
              )}
            >
              {cell.chapter}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
