'use client';

import type { OverviewGenre } from '@/lib/bible-books';
import type { OverviewBook } from '@/lib/quiz-overview-data';
import { BookTile } from './BookTile';
import { ChapterPanel } from './ChapterPanel';

export function GenreSection({
  genre,
  books,
  selectedSlug,
  showProgress,
  onSelectBook,
  registerRef,
}: {
  genre: OverviewGenre;
  books: OverviewBook[];
  selectedSlug: string | null;
  showProgress: boolean;
  onSelectBook: (slug: string | null) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  const selectedBook = selectedSlug ? books.find((book) => book.slug === selectedSlug) : undefined;

  return (
    <div
      id={`genre-${genre.id}`}
      ref={(el) => registerRef(genre.id, el)}
      className="mb-8 scroll-mt-6 sm:mb-10"
    >
      <div className="flex items-center gap-3.5">
        <h2 className="font-display text-[19px] leading-tight text-ink sm:text-[22px]">
          {genre.label}
        </h2>
        <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
          {genre.testament === 'OT' ? 'Oude' : 'Nieuwe'} Testament · {books.length} boeken
        </span>
        <span aria-hidden className="h-px flex-1 bg-rule" />
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {books.map((book) => (
          <BookTile
            key={book.slug}
            book={book}
            selected={selectedSlug === book.slug}
            showProgress={showProgress}
            onSelect={() => onSelectBook(selectedSlug === book.slug ? null : book.slug)}
          />
        ))}
      </div>

      {selectedBook && (
        <ChapterPanel
          book={selectedBook}
          showProgress={showProgress}
          onClose={() => onSelectBook(null)}
        />
      )}
    </div>
  );
}
