'use client';

import { cn } from '@/lib/utils';
import type { OverviewBook } from '@/lib/quiz-overview-data';

function availabilityLabel(book: OverviewBook, showProgress: boolean): string {
  let base: string;
  if (book.avail === 0) {
    base = 'Nog geen quizzen';
  } else if (book.avail === book.chapters) {
    base = book.chapters === 1 ? '1 quiz' : `${book.avail} quizzen`;
  } else {
    base = `${book.avail} van ${book.chapters} quizzen`;
  }
  if (showProgress && book.played > 0) {
    base += ` · ${book.played} gespeeld`;
  }
  return base;
}

export function BookTile({
  book,
  selected,
  showProgress,
  onSelect,
}: {
  book: OverviewBook;
  selected: boolean;
  showProgress: boolean;
  onSelect: () => void;
}) {
  const disabled = book.avail === 0;
  const pctAvail = book.chapters > 0 ? Math.round((book.avail / book.chapters) * 100) : 0;
  const pctDone = book.chapters > 0 ? Math.round((book.played / book.chapters) * 100) : 0;

  return (
    <button
      type="button"
      id={`boek-tegel-${book.slug}`}
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex min-h-[88px] flex-col gap-2 rounded-lg border bg-paper-raised p-3.5 pb-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis sm:min-h-24',
        disabled ? 'cursor-default opacity-50' : 'cursor-pointer hover:border-ink',
        selected ? 'border-ink' : 'border-rule'
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-[17px] leading-tight text-ink">{book.title}</span>
        <span className="shrink-0 text-xs text-ink-muted/80 tabular-nums">{book.chapters}</span>
      </div>
      <p className="mt-auto text-xs leading-snug text-ink-muted">
        {availabilityLabel(book, showProgress)}
      </p>
      <div className="relative h-[3px] overflow-hidden rounded-full bg-paper-sunken">
        <span
          className="absolute inset-y-0 left-0 bg-lapis-tint"
          style={{ width: `${pctAvail}%` }}
          aria-hidden
        />
        {showProgress && (
          <span
            className="absolute inset-y-0 left-0 bg-ink"
            style={{ width: `${pctDone}%` }}
            aria-hidden
          />
        )}
      </div>
    </button>
  );
}
