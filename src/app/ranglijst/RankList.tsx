'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Avatar, initialOf } from '@/components/bq';
import type { NextPlaceGap } from '@/lib/leaderboard-standing';
import { cn } from '@/lib/utils';
import { formatXp, type BoardRow } from './types';

/** Rows shown before "Toon meer spelers": places 4 to 10. */
const COLLAPSED_UNTIL = 10;

interface RankListProps {
  rows: BoardRow[];
  /** Index of the first row in this list (the podium holds the ones before). */
  startAt: number;
  currentUserId: string | null;
  gap: NextPlaceGap | null;
}

export function RankList({ rows, startAt, currentUserId, gap }: RankListProps) {
  const [expanded, setExpanded] = useState(false);
  const rest = rows.slice(startAt);
  const hasMore = rows.length > COLLAPSED_UNTIL;

  if (rest.length === 0) return null;

  const visible = expanded ? rest : rest.slice(0, COLLAPSED_UNTIL - startAt);
  const ownIndex = currentUserId ? rows.findIndex((row) => row.id === currentUserId) : -1;
  // Further down than place 10: still show your own row under the top 10.
  const ownBelow = !expanded && ownIndex >= COLLAPSED_UNTIL ? rows[ownIndex] : null;

  const renderRow = (row: BoardRow, index: number, extraClass?: string) => {
    const mine = row.id === currentUserId;
    return (
      <li
        key={row.id}
        aria-current={mine ? 'true' : undefined}
        className={cn(
          'flex items-center gap-3.5 border-b border-line-soft px-5 py-3 last:border-b-0',
          mine && 'bg-lapis-tint',
          extraClass,
        )}
      >
        <span
          className={cn(
            'w-7 shrink-0 text-center text-[15px] font-extrabold',
            mine ? 'text-lapis-edge' : 'text-ink-soft',
          )}
        >
          {index + 1}
        </span>
        {mine ? (
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card font-display text-[17px] font-semibold text-lapis"
          >
            {initialOf(row.name)}
          </span>
        ) : (
          <Avatar name={row.name} size={40} />
        )}
        <span className="flex min-w-0 grow flex-col">
          <span className="truncate text-base font-bold text-ink">{row.name}</span>
          {mine && gap && (
            <span className="text-sm font-bold text-lapis">
              Nog {new Intl.NumberFormat('nl-NL').format(gap.xp)} XP tot plek {gap.place}
            </span>
          )}
        </span>
        <span className={cn('whitespace-nowrap text-[15px] font-extrabold', mine ? 'text-lapis-edge' : 'text-ink-soft')}>
          {formatXp(row.xp)}
        </span>
      </li>
    );
  };

  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-card">
      <ol start={startAt + 1} aria-label={`Plek ${startAt + 1} en verder`} className="m-0 flex list-none flex-col p-0">
        {visible.map((row, offset) => renderRow(row, startAt + offset))}
        {ownBelow && renderRow(ownBelow, ownIndex, 'border-t-2 border-t-line')}
      </ol>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex h-[52px] w-full items-center justify-center gap-1.5 border-0 border-t border-line-soft bg-card text-[15px] font-bold text-lapis hover:text-lapis-edge"
        >
          {expanded ? 'Toon minder spelers' : 'Toon meer spelers'}
          <ChevronDown
            className={cn('size-4 transition-transform', expanded && 'rotate-180')}
            strokeWidth={2.4}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
