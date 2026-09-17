'use client';

import { cn } from '@/lib/utils';
import type { OverviewGenre, OverviewGenreId } from '@/lib/bible-books';

export function GenreChips({
  genres,
  activeGenre,
  onJump,
}: {
  genres: OverviewGenre[];
  activeGenre: OverviewGenreId;
  onJump: (id: OverviewGenreId) => void;
}) {
  return (
    <div className="relative mt-5 lg:hidden">
      <div
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {genres.map((genre) => {
          const active = activeGenre === genre.id;
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => onJump(genre.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
                active
                  ? 'border-ink bg-ink text-ink-inverted'
                  : 'border-rule-strong bg-paper-raised text-ink'
              )}
            >
              {genre.label}
            </button>
          );
        })}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-9 w-12 bg-gradient-to-r from-transparent to-paper"
      />
    </div>
  );
}
