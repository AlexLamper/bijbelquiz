'use client';

import { cn } from '@/lib/utils';
import type { OverviewGenre, OverviewGenreId } from '@/lib/bible-books';

export function GenreIndex({
  genres,
  counts,
  activeGenre,
  showProgress,
  onJump,
}: {
  genres: OverviewGenre[];
  counts: Record<OverviewGenreId, number>;
  activeGenre: OverviewGenreId;
  showProgress: boolean;
  onJump: (id: OverviewGenreId) => void;
}) {
  const ot = genres.filter((genre) => genre.testament === 'OT');
  const nt = genres.filter((genre) => genre.testament === 'NT');

  const item = (genre: OverviewGenre) => {
    const active = activeGenre === genre.id;
    const count = counts[genre.id] ?? 0;
    return (
      <a
        key={genre.id}
        href={`#genre-${genre.id}`}
        onClick={(event) => {
          event.preventDefault();
          onJump(genre.id);
        }}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex h-[34px] items-center justify-between gap-2 border-l-2 py-0 pl-3 pr-1.5 text-[13.5px] no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
          active ? 'border-ink font-medium text-ink' : 'border-rule text-ink-muted hover:text-ink'
        )}
      >
        <span>{genre.label}</span>
        <small className="text-[11.5px] font-normal text-ink-muted/80 tabular-nums">
          {count > 0 ? count : '–'}
        </small>
      </a>
    );
  };

  return (
    <nav aria-label="Genres" className="sticky top-6 hidden flex-col gap-0.5 lg:flex">
      <p className="pb-2.5 pl-3.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        Oude Testament
      </p>
      {ot.map(item)}
      <p className="pb-2.5 pl-3.5 pt-[22px] text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        Nieuwe Testament
      </p>
      {nt.map(item)}

      <div className="mt-6 flex flex-col gap-2 border-t border-rule pt-4 pl-3.5 text-xs text-ink-muted">
        {showProgress && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="block h-2.5 w-2.5 rounded-[2px] bg-ink" />
            Gespeeld
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="block h-2.5 w-2.5 rounded-[2px] bg-lapis-tint" />
          Quiz beschikbaar
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="block h-2.5 w-2.5 rounded-[2px] bg-paper-sunken" />
          Nog niet beschikbaar
        </span>
      </div>
    </nav>
  );
}
