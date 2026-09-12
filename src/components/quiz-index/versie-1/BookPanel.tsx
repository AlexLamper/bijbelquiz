'use client';

import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { QuizRow } from './QuizRow';
import type { Shelf } from './shelves';

/**
 * The inline panel that opens under a row of tiles. A lapis top rule and a
 * notch under the tile it belongs to say which book is open; the quizzes are
 * a dense list, two columns when there is room, so 36 parts fit on a screen.
 */
export function BookPanel({
  shelf,
  panelId,
  notchPercent,
  isSignedIn,
  onClose,
}: {
  shelf: Shelf;
  panelId: string;
  /** Horizontal centre of the owning tile, as a percentage of the row width. */
  notchPercent: number;
  isSignedIn: boolean;
  onClose: () => void;
}) {
  const count = shelf.quizzes.length;
  const meta: string[] = [count === 1 ? '1 quiz' : `${count} quizzen`];
  if (shelf.chapters > 0) meta.push(`${shelf.chaptersCovered} van ${shelf.chapters} hoofdstukken`);
  if (isSignedIn && shelf.playedCount > 0) meta.push(`${shelf.playedCount} afgerond`);

  const twoColumns = count > 8;

  return (
    <div id={panelId} className="relative col-span-full mt-1">
      <span
        aria-hidden
        className="absolute -top-[6px] h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-lapis bg-paper-raised"
        style={{ left: `${notchPercent}%` }}
      />

      <div className="rounded-md border border-rule border-t-lapis bg-paper-raised px-4 pb-3 pt-4 sm:px-5">
        <div className="flex items-start justify-between gap-4 border-b border-rule pb-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-normal leading-tight tracking-[-0.02em] text-ink">
              {shelf.title}
            </h3>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
              {meta.map((part, index) => (
                <span key={part}>
                  {index > 0 && <span className="mx-2 text-rule-strong">/</span>}
                  {part}
                </span>
              ))}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cn('grid', twoColumns && 'lg:grid-cols-2 lg:gap-x-8')}>
          {shelf.quizzes.map((quiz) => (
            <QuizRow key={quiz._id} quiz={quiz} className="last:border-b-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
