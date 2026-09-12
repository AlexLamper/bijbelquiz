'use client';

import { cn } from '@/lib/utils';
import type { Shelf } from './shelves';

/**
 * One book in the overview. A book with quizzes is ink on raised paper with a
 * hairline; a book without is present but quiet, so the shape of the whole
 * Bible stays visible and the gaps read as gaps rather than as missing tiles.
 */
export function BookTile({
  shelf,
  isOpen,
  isDimmed,
  panelId,
  onToggle,
}: {
  shelf: Shelf;
  isOpen: boolean;
  isDimmed: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  const count = shelf.quizzes.length;
  const hasQuizzes = count > 0;
  const coverage = shelf.chapters > 0 ? Math.min(100, (shelf.chaptersCovered / shelf.chapters) * 100) : 0;

  const coverageLabel =
    shelf.chapters > 0 && hasQuizzes
      ? `${shelf.chaptersCovered} van ${shelf.chapters} hoofdstukken`
      : undefined;

  const body = (
    <>
      <span className="flex min-w-0 items-baseline justify-between gap-2">
        <span
          className={cn(
            'truncate font-display text-[15px] font-normal leading-tight tracking-[-0.02em]',
            hasQuizzes ? 'text-ink' : 'text-ink-muted'
          )}
        >
          {shelf.title}
        </span>
        {hasQuizzes && (
          <span className="shrink-0 text-[11px] text-ink-muted tabular-nums">{count}</span>
        )}
      </span>

      <span className="mt-2 flex items-center gap-2 text-[11px] leading-none text-ink-muted">
        {hasQuizzes ? (
          <>
            <span className="tabular-nums">{count === 1 ? '1 quiz' : `${count} quizzen`}</span>
            {shelf.playedCount > 0 && (
              <>
                <span className="text-rule-strong">/</span>
                <span className="text-positive tabular-nums">{shelf.playedCount} afgerond</span>
              </>
            )}
          </>
        ) : (
          <span className="text-ink-muted/70">nog geen quiz</span>
        )}
      </span>

      {/* Coverage: how much of the book the quizzes touch, as a lapis segment
          on a hairline. A thematic shelf has no chapters and no bar. */}
      {shelf.chapters > 0 && (
        <span aria-hidden className="mt-2.5 block h-px w-full bg-rule-strong">
          {hasQuizzes && (
            <span className="block h-px bg-lapis" style={{ width: `${Math.max(coverage, 3)}%` }} />
          )}
        </span>
      )}
    </>
  );

  if (!hasQuizzes) {
    return (
      <div
        className={cn(
          'flex flex-col rounded-md border border-transparent px-3 py-2.5 transition-opacity',
          isDimmed && 'opacity-30'
        )}
      >
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      title={coverageLabel}
      className={cn(
        'flex flex-col rounded-md border bg-paper-raised px-3 py-2.5 text-left transition-[opacity,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
        isOpen ? 'border-lapis' : 'border-rule hover:border-rule-strong',
        isDimmed && 'opacity-30 hover:opacity-60'
      )}
    >
      {body}
    </button>
  );
}
