'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { QuizCard } from '@/components/QuizCard';
import { OVERVIEW_GENRES, type OverviewGenreId } from '@/lib/bible-books';
import type { OverviewBook } from '@/lib/quiz-overview-data';
import type { QuizIndexQuiz } from '@/lib/quiz-index-data';
import { buildSeriesEntries, countEntryQuizzes } from '@/lib/quiz-series';
import { SegmentedControl } from './SegmentedControl';
import { GenreIndex } from './GenreIndex';
import { GenreChips } from './GenreChips';
import { GenreSection } from './GenreSection';
import { BookSearch } from './BookSearch';

type Tab = 'boeken' | 'themas';

const HEADER_OFFSET = 24;

export function QuizOverviewPage({
  books,
  themeQuizzes,
  totalAvailableChapters,
  totalChapters,
  showProgress,
  userIsPremium,
}: {
  books: OverviewBook[];
  themeQuizzes: QuizIndexQuiz[];
  totalAvailableChapters: number;
  totalChapters: number;
  showProgress: boolean;
  userIsPremium: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>('boeken');
  const selectedSlug = searchParams.get('boek');

  const [activeGenre, setActiveGenre] = useState<OverviewGenreId>(OVERVIEW_GENRES[0].id);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const booksByGenre = useMemo(() => {
    const map = new Map<OverviewGenreId, OverviewBook[]>();
    for (const genre of OVERVIEW_GENRES) map.set(genre.id, []);
    for (const book of books) map.get(book.genre)?.push(book);
    return map;
  }, [books]);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const book of books) counts[book.genre] = (counts[book.genre] ?? 0) + book.avail;
    return counts as Record<OverviewGenreId, number>;
  }, [books]);

  const setSelectedSlug = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) params.set('boek', slug);
      else params.delete('boek');
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  }, []);

  const scrollToGenre = useCallback((id: OverviewGenreId, smooth = true) => {
    const el = sectionRefs.current.get(id);
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: prefersReduced || !smooth ? 'auto' : 'smooth' });
  }, []);

  const handleJump = useCallback(
    (id: OverviewGenreId) => {
      setActiveGenre(id);
      scrollToGenre(id);
    },
    [scrollToGenre]
  );

  const handleSelectBookFromSearch = useCallback(
    (slug: string) => {
      const book = books.find((b) => b.slug === slug);
      setSelectedSlug(slug);
      if (book) {
        setActiveGenre(book.genre);
        // Wait for the panel to mount before scrolling to it.
        requestAnimationFrame(() => scrollToGenre(book.genre));
      }
    },
    [books, scrollToGenre, setSelectedSlug]
  );

  // Highlight the genre nearest the top of the viewport as the reader scrolls.
  useEffect(() => {
    if (tab !== 'boeken') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.getAttribute('id')?.replace('genre-', '');
          if (id) setActiveGenre(id as OverviewGenreId);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tab, books]);

  // A book opened via a deep link (`?boek=...`) starts scrolled to the top of
  // the page; jump straight to its panel instead of making the reader hunt.
  useEffect(() => {
    if (!selectedSlug) return;
    const book = books.find((b) => b.slug === selectedSlug);
    if (!book) return;
    setActiveGenre(book.genre);
    requestAnimationFrame(() => scrollToGenre(book.genre, false));
    // Only ever needed for the URL this component mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape closes the open chapter panel.
  useEffect(() => {
    if (!selectedSlug) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedSlug(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedSlug, setSelectedSlug]);

  const themeEntries = useMemo(
    () => buildSeriesEntries(themeQuizzes, (quiz) => quiz._id),
    [themeQuizzes]
  );

  return (
    <div className="min-h-screen bg-paper pb-16 pt-10 lg:pb-24 lg:pt-12">
      <section className="mx-auto w-full max-w-[1168px] px-5 sm:px-8 lg:px-14">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="block h-[2px] w-[18px] bg-lapis sm:w-6" />
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Quizbibliotheek
            </span>
          </div>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted sm:inline">
            {totalAvailableChapters.toLocaleString('nl-NL')} quizzen · 66 boeken ·{' '}
            {totalChapters.toLocaleString('nl-NL')} hoofdstukken
          </span>
        </div>

        <h1 className="mt-3.5 font-display text-[30px] leading-[1.15] tracking-[-0.01em] text-ink sm:mt-[22px] sm:text-[40px]">
          Ontdek en speel Bijbelquizzen
        </h1>
        <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-ink-soft sm:mt-3 sm:text-[15px]">
          Alle 66 boeken op één pagina, van Genesis tot Openbaring. Spring via de index naar een
          genre.
        </p>
        <p className="mt-2 text-[13px] text-ink-muted sm:hidden">
          {totalAvailableChapters.toLocaleString('nl-NL')} quizzen · 66 boeken ·{' '}
          {totalChapters.toLocaleString('nl-NL')} hoofdstukken
        </p>

        <div className="mt-6 hidden h-px bg-rule sm:mt-8 sm:block" />

        <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
          {tab === 'boeken' && (
            <BookSearch
              books={books}
              placeholder="Zoek een boek of hoofdstuk, bijv. Johannes 3"
              className="sm:flex-1"
              onSelectBook={handleSelectBookFromSearch}
            />
          )}
          <SegmentedControl
            value={tab}
            onChange={setTab}
            className="w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-initial"
            options={[
              { value: 'boeken', label: 'Bijbelboeken' },
              { value: 'themas', label: "Thema's" },
            ]}
          />
        </div>

        {tab === 'boeken' ? (
          <>
            <GenreChips genres={OVERVIEW_GENRES} activeGenre={activeGenre} onJump={handleJump} />

            <div className="mt-6 grid gap-10 sm:mt-9 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-12">
              <GenreIndex
                genres={OVERVIEW_GENRES}
                counts={genreCounts}
                activeGenre={activeGenre}
                showProgress={showProgress}
                onJump={handleJump}
              />

              <div>
                {OVERVIEW_GENRES.map((genre) => (
                  <GenreSection
                    key={genre.id}
                    genre={genre}
                    books={booksByGenre.get(genre.id) ?? []}
                    selectedSlug={selectedSlug}
                    showProgress={showProgress}
                    onSelectBook={setSelectedSlug}
                    registerRef={registerRef}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8">
            {themeEntries.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink-muted">
                Er zijn nog geen themaquizzen beschikbaar.
              </p>
            ) : (
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {themeEntries.map((entry) =>
                  entry.kind === 'quiz' ? (
                    <QuizCard key={entry.key} quiz={entry.quiz} isPremiumUser={userIsPremium} />
                  ) : (
                    <section key={entry.key} className="col-span-full">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <h2 className="font-display text-lg font-normal tracking-[-0.015em] text-ink">
                          {entry.label}
                        </h2>
                        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
                          {countEntryQuizzes([entry])} quizzen
                        </span>
                        <span aria-hidden className="h-px min-w-8 flex-1 bg-rule" />
                      </div>
                      <div className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                        {entry.quizzes.map((quiz) => (
                          <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={userIsPremium} />
                        ))}
                      </div>
                    </section>
                  )
                )}
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <Button asChild variant="outline" className="h-10 rounded-md border-rule bg-paper-raised px-6 text-ink hover:bg-paper-sunken">
                <Link href="/quizzen/aanmaken">Zelf een quiz maken</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export type { Tab };
