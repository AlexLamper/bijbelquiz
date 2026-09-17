'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeSearchText } from '@/lib/quiz-series';
import type { OverviewBook } from '@/lib/quiz-overview-data';

interface Match {
  book: OverviewBook;
  chapter: number | null;
}

function parseQuery(raw: string, books: OverviewBook[]): Match[] {
  const query = normalizeSearchText(raw);
  if (!query) return [];

  const numberMatch = query.match(/^(.*?)\s*(\d+)$/);
  const namePart = numberMatch ? numberMatch[1].trim() : query;
  const chapter = numberMatch ? Number(numberMatch[2]) : null;

  const matches = books.filter((book) => {
    const title = normalizeSearchText(book.title);
    const short = normalizeSearchText(book.slug.replace(/-/g, ' '));
    return title.startsWith(namePart) || title.includes(namePart) || short.startsWith(namePart);
  });

  return matches.slice(0, 8).map((book) => ({
    book,
    chapter: chapter && chapter >= 1 && chapter <= book.chapters ? chapter : null,
  }));
}

export function BookSearch({
  books,
  placeholder,
  className,
  onSelectBook,
}: {
  books: OverviewBook[];
  placeholder: string;
  className?: string;
  onSelectBook: (slug: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => parseQuery(query, books), [query, books]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && results[0]) {
            onSelectBook(results[0].book.slug);
            setOpen(false);
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setOpen(false);
            event.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        aria-label="Zoek een boek of hoofdstuk"
        className="h-[42px] w-full rounded-md border border-rule-strong bg-paper-raised pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted focus-visible:border-lapis focus-visible:outline-none sm:h-11"
      />

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto rounded-md border border-rule-strong bg-paper-raised py-1.5 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3.5 py-2.5 text-sm text-ink-muted">Geen boek gevonden.</p>
          ) : (
            results.map(({ book, chapter }) => (
              <button
                key={book.slug}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelectBook(book.slug);
                  setQuery('');
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-ink transition-colors hover:bg-paper-sunken"
              >
                <span>
                  {book.title}
                  {chapter ? ` ${chapter}` : ''}
                </span>
                <span className="text-xs text-ink-muted tabular-nums">{book.avail} quizzen</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
