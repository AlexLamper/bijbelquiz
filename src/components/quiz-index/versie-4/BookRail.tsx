'use client';

import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { BOOK_GROUPS, type Testament } from '@/lib/bible-books';
import type { QuizIndexBook } from '@/lib/quiz-index-data';
import { FEATURED_KEY, THEMES_KEY } from './library';

interface BookRailProps {
  books: QuizIndexBook[];
  themeCount: number;
  selected: string;
  onSelect: (key: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  /** While searching: only these books (and Thema's when it holds) are shown. */
  visibleBooks: Set<string> | null;
  themesVisible: boolean;
}

const TESTAMENTS: { id: Testament; label: string }[] = [
  { id: 'OT', label: 'Oude Testament' },
  { id: 'NT', label: 'Nieuwe Testament' },
];

/**
 * The left rail: search on top, then every book of the canon in order. A book
 * without quizzes is listed but greyed - the shape of the whole Bible is part
 * of the map, and a reader should see at a glance where the library is thin.
 */
export function BookRail({
  books,
  themeCount,
  selected,
  onSelect,
  query,
  onQueryChange,
  visibleBooks,
  themesVisible,
}: BookRailProps) {
  const searching = visibleBooks !== null;
  const isShown = (book: QuizIndexBook) => !visibleBooks || visibleBooks.has(book.code);

  return (
    <div className="flex flex-col">
      <label className="relative block">
        <span className="sr-only">Zoek een quiz</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Zoek: Lucas 15, Ruth, Kerst"
          autoComplete="off"
          className="h-10 pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Zoekopdracht wissen"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-muted transition-colors hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>

      {/* Phones: one scrollable chip row. Books without quizzes are left out
          here; the full canon is a list to scan, not a row to swipe past. */}
      <nav aria-label="Bijbelboeken" className="-mx-5 mt-4 lg:hidden sm:-mx-8">
        <div className="flex gap-2 overflow-x-auto px-5 pb-1 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!searching && (
            <Chip active={selected === FEATURED_KEY} onClick={() => onSelect(FEATURED_KEY)}>
              Uitgelicht
            </Chip>
          )}
          {books
            .filter((book) => book.quizCount > 0 && isShown(book))
            .map((book) => (
              <Chip
                key={book.code}
                active={selected === book.code}
                onClick={() => onSelect(book.code)}
                count={book.quizCount}
              >
                {book.title}
              </Chip>
            ))}
          {themeCount > 0 && (!searching || themesVisible) && (
            <Chip active={selected === THEMES_KEY} onClick={() => onSelect(THEMES_KEY)} count={themeCount}>
              Thema&apos;s
            </Chip>
          )}
        </div>
      </nav>

      {/* Desktop: the canon as a list. */}
      <nav aria-label="Bijbelboeken" className="mt-5 hidden lg:block">
        {!searching && (
          <RailRow active={selected === FEATURED_KEY} onClick={() => onSelect(FEATURED_KEY)}>
            <span className="font-display text-[15px] tracking-[-0.01em]">Uitgelicht</span>
          </RailRow>
        )}

        {TESTAMENTS.map((testament) => {
          const groups = BOOK_GROUPS.filter((group) => group.testament === testament.id);
          const shownInTestament = books.filter(
            (book) => book.testament === testament.id && isShown(book)
          );
          if (shownInTestament.length === 0) return null;

          return (
            <div key={testament.id} className="mt-6">
              <p className="border-b border-rule pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink">
                {testament.label}
              </p>

              {groups.map((group) => {
                const inGroup = shownInTestament.filter((book) => book.group === group.id);
                if (inGroup.length === 0) return null;

                return (
                  <div key={group.id} className="mt-3">
                    <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                      {group.label}
                    </p>
                    <ul>
                      {inGroup.map((book) => {
                        const empty = book.quizCount === 0;
                        return (
                          <li key={book.code}>
                            <RailRow
                              active={selected === book.code}
                              muted={empty}
                              onClick={() => onSelect(book.code)}
                              count={book.quizCount}
                            >
                              {book.title}
                            </RailRow>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}

        {themeCount > 0 && (!searching || themesVisible) && (
          <div className="mt-6">
            <p className="border-b border-rule pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink">
              Overig
            </p>
            <div className="mt-3">
              <RailRow
                active={selected === THEMES_KEY}
                onClick={() => onSelect(THEMES_KEY)}
                count={themeCount}
              >
                Thema&apos;s
              </RailRow>
            </div>
          </div>
        )}

        {searching && visibleBooks.size === 0 && !themesVisible && (
          <p className="mt-6 text-sm leading-relaxed text-ink-muted">Geen boek past bij deze zoekopdracht.</p>
        )}
      </nav>
    </div>
  );
}

function RailRow({
  active,
  muted = false,
  count,
  onClick,
  children,
}: {
  active: boolean;
  muted?: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'relative flex w-full items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left text-sm transition-colors',
        active
          ? 'bg-paper-sunken text-ink before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-lapis'
          : muted
            ? 'text-ink-muted hover:bg-paper-sunken'
            : 'text-ink-soft hover:bg-paper-sunken hover:text-ink'
      )}
    >
      <span className="truncate">{children}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'shrink-0 text-xs tabular-nums',
            count === 0 ? 'text-rule-strong' : active ? 'text-ink' : 'text-ink-muted'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Chip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-md border px-3 text-sm transition-colors',
        active
          ? 'border-ink bg-paper-sunken text-ink'
          : 'border-rule bg-paper-raised text-ink-soft hover:border-rule-strong hover:text-ink'
      )}
    >
      {children}
      {typeof count === 'number' && (
        <span className={cn('text-xs tabular-nums', active ? 'text-lapis' : 'text-ink-muted')}>{count}</span>
      )}
    </button>
  );
}
