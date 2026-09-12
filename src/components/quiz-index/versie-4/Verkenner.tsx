'use client';

import { Suspense, useCallback, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { PageMasthead, QuietButton } from '@/components/editorial';
import type { QuizIndexData } from '@/lib/quiz-index-data';
import { BookRail } from './BookRail';
import { BookPane } from './BookPane';
import { FeaturedPane } from './FeaturedPane';
import { SearchResults } from './SearchResults';
import { ThemesPane } from './ThemesPane';
import { FEATURED_KEY, THEMES_KEY, groupByBook, parseQuery, pluralQuizzen, searchQuizzes } from './library';

interface VerkennerProps extends QuizIndexData {
  isSignedIn: boolean;
}

/** The `?boek=` param that selects a rail entry; absent means "Uitgelicht". */
const PARAM = 'boek';

export default function Verkenner(props: VerkennerProps) {
  // useSearchParams needs a Suspense boundary for static rendering; the page
  // is dynamic, but the boundary keeps Next from bailing the whole tree out.
  return (
    <Suspense fallback={<Explorer {...props} selected={FEATURED_KEY} onSelect={() => undefined} />}>
      <ExplorerWithUrl {...props} />
    </Suspense>
  );
}

function ExplorerWithUrl(props: VerkennerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const known = useMemo(() => new Set(props.books.map((book) => book.code)), [props.books]);
  const raw = (params.get(PARAM) ?? '').toUpperCase();
  const selected =
    raw === THEMES_KEY.toUpperCase() ? THEMES_KEY : known.has(raw) ? raw : FEATURED_KEY;

  const onSelect = useCallback(
    (key: string) => {
      const next = new URLSearchParams(params.toString());
      if (key === FEATURED_KEY) next.delete(PARAM);
      else next.set(PARAM, key);
      const search = next.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  return <Explorer {...props} selected={selected} onSelect={onSelect} />;
}

function Explorer({
  quizzes,
  books,
  isSignedIn,
  selected,
  onSelect,
}: VerkennerProps & { selected: string; onSelect: (key: string) => void }) {
  const [query, setQuery] = useState('');

  const byBook = useMemo(() => groupByBook(quizzes), [quizzes]);
  const bookOrder = useMemo(() => new Map(books.map((book, index) => [book.code, index])), [books]);
  const themeQuizzes = byBook.get(null) ?? [];
  const booksWithQuizzes = books.filter((book) => book.quizCount > 0).length;

  const parsed = useMemo(() => parseQuery(query, books), [query, books]);
  const searching = parsed.text.length > 0;
  const results = useMemo(
    () => (searching ? searchQuizzes(quizzes, parsed, bookOrder) : []),
    [searching, quizzes, parsed, bookOrder]
  );

  // The rail narrows to the books the results live in, so a search for
  // "Lucas 15" leaves one book standing on the left.
  const visibleBooks = useMemo(() => {
    if (!searching) return null;
    const codes = new Set<string>();
    results.forEach((quiz) => {
      if (quiz.book) codes.add(quiz.book);
    });
    if (parsed.book) codes.add(parsed.book.code);
    return codes;
  }, [searching, results, parsed.book]);
  const themesVisible = searching && results.some((quiz) => quiz.book === null);

  const selectAndClear = (key: string) => {
    setQuery('');
    onSelect(key);
  };

  const selectedBook = books.find((book) => book.code === selected) ?? null;

  let pane: ReactNode;
  if (searching) {
    pane = (
      <SearchResults
        query={query}
        parsed={parsed}
        results={results}
        onClear={() => setQuery('')}
        onOpenBook={selectAndClear}
      />
    );
  } else if (selected === THEMES_KEY) {
    pane = <ThemesPane quizzes={themeQuizzes} isSignedIn={isSignedIn} />;
  } else if (selectedBook) {
    pane = <BookPane book={selectedBook} quizzes={byBook.get(selectedBook.code) ?? []} isSignedIn={isSignedIn} />;
  } else {
    pane = <FeaturedPane quizzes={quizzes} isSignedIn={isSignedIn} bookCount={booksWithQuizzes} />;
  }

  return (
    <div className="min-h-screen bg-paper pb-24 pt-10 lg:pt-14">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <PageMasthead
          eyebrow="Quizbibliotheek"
          title="Bijbelquizzen, boek voor boek"
          lead="De hele bibliotheek langs de canon: kies een boek, spring naar een hoofdstuk, of zoek direct."
          aside={
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
              {pluralQuizzen(quizzes.length)} · {booksWithQuizzes} boeken
            </p>
          }
          actions={
            isSignedIn ? (
              <QuietButton href="/quizzen/aanmaken" className="h-10">
                Zelf quiz maken
              </QuietButton>
            ) : undefined
          }
        />
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pt-8 sm:px-8 lg:px-10">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-x-12">
          <aside className="lg:sticky lg:top-[calc(4rem+1.5rem)] lg:max-h-[calc(100vh-4rem-3rem)] lg:self-start lg:overflow-y-auto lg:border-r lg:border-rule lg:pr-6 lg:[scrollbar-width:thin]">
            <BookRail
              books={books}
              themeCount={themeQuizzes.length}
              selected={selected}
              onSelect={selectAndClear}
              query={query}
              onQueryChange={setQuery}
              visibleBooks={visibleBooks}
              themesVisible={themesVisible}
            />
          </aside>

          <div className="mt-8 min-w-0 lg:mt-0" key={searching ? 'zoeken' : selected}>
            {pane}
          </div>
        </div>
      </section>
    </div>
  );
}
