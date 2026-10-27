import { Avatar, RankBadge } from '@/components/bq';
import { cn } from '@/lib/utils';
import { formatXp, type BoardRow } from './types';

/**
 * The top three on a podium: 2 - 1 - 3 from left to right, the winner raised
 * and crowned. A place with nobody on it yet keeps its column empty so the
 * podium does not shift.
 */

const PLACES = [
  {
    rank: 2,
    tone: 'silver' as const,
    size: 66,
    xpClass: 'text-silver-text',
    blockClass: 'h-16 bg-silver-tint text-silver-text pt-2',
  },
  {
    rank: 1,
    tone: 'gold' as const,
    size: 82,
    xpClass: 'text-gold-text',
    blockClass: 'h-24 bg-gold-wash text-gold-text pt-2',
  },
  {
    rank: 3,
    tone: 'bronze' as const,
    size: 66,
    xpClass: 'text-bronze-text',
    blockClass: 'h-11 bg-bronze-tint text-bronze-text pt-1.5',
  },
];

export function Podium({ rows, label }: { rows: BoardRow[]; label: string }) {
  return (
    <ol
      aria-label={label}
      className="mx-auto grid w-full max-w-[560px] list-none grid-cols-3 items-end gap-4 p-0 m-0"
    >
      {PLACES.map((place) => {
        const row = rows[place.rank - 1];
        if (!row) return <li key={place.rank} aria-hidden="true" />;
        return (
          <li key={place.rank} className="flex min-w-0 flex-col items-center gap-1.5">
            <span className="sr-only">Plek {place.rank}: </span>
            {place.rank === 1 && (
              <svg width="36" height="26" viewBox="0 0 30 22" fill="none" aria-hidden="true" className="-mb-1">
                <path
                  d="M3 18L5 5l6 6 4-9 4 9 6-6 2 13z"
                  className="fill-gold stroke-gold-edge"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <Avatar
              name={row.name}
              size={place.size}
              ring={place.tone}
              badge={<RankBadge rank={place.rank} tone={place.tone} />}
            />
            <span className="mt-2 max-w-full truncate text-base font-extrabold text-ink">{row.name}</span>
            <span className={cn('text-[15px] font-bold', place.xpClass)}>{formatXp(row.xp)}</span>
            <span
              aria-hidden="true"
              className={cn(
                'mt-1 flex w-full justify-center rounded-t-[14px] font-display text-[28px] font-semibold leading-8',
                place.blockClass,
              )}
            >
              {place.rank}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
