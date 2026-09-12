'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { ArrowLink, PageMasthead, SectionHead } from '@/components/editorial';
import QuizCard from '@/components/QuizCard';
import type { QuizIndexData } from '@/lib/quiz-index-data';
import { cn } from '@/lib/utils';

import { BookPanel } from './BookPanel';
import { BookTile } from './BookTile';
import { QuizRow } from './QuizRow';
import { buildSections, pickFeatured, searchLibrary, type Shelf } from './shelves';

/**
 * Tile columns per breakpoint. The grid classes and the media queries must
 * agree, because the panel is inserted after the last tile of the open tile's
 * row and that row is only known from the column count.
 */
const GRID_CLASS = 'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6';
const COLUMN_QUERIES: Array<[string, number]> = [
  ['(min-width: 1280px)', 6],
  ['(min-width: 768px)', 4],
  ['(min-width: 640px)', 3],
];

function useColumns(): number {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const lists = COLUMN_QUERIES.map(([query, count]) => [window.matchMedia(query), count] as const);
    const update = () => {
      const hit = lists.find(([list]) => list.matches);
      setColumns(hit ? hit[1] : 2);
    };
    update();
    lists.forEach(([list]) => list.addEventListener('change', update));
    return () => lists.forEach(([list]) => list.removeEventListener('change', update));
  }, []);

  return columns;
}

/** Search results listed under the box before the reader asks for the rest. */
const RESULT_PREVIEW = 10;

export default function BibleOverviewClient({
  quizzes,
  books,
  isSignedIn,
}: Pick<QuizIndexData, 'quizzes' | 'books'> & { isSignedIn: boolean }) {
  const sections = useMemo(() => buildSections(books, quizzes), [books, quizzes]);
  const shelves = useMemo(
    () => sections.flatMap((section) => section.groups.flatMap((group) => group.shelves)),
    [sections]
  );
  const featured = useMemo(() => pickFeatured(quizzes, shelves), [quizzes, shelves]);

  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const columns = useColumns();

  const result = useMemo(() => searchLibrary(query, shelves), [query, shelves]);

  // A search that lands on exactly one book opens that book; clearing the
  // search closes whatever the search opened. Adjusted during render, keyed
  // on the query, so it never fights a tile the reader clicked afterwards.
  const [seededQuery, setSeededQuery] = useState(query);
  if (seededQuery !== query) {
    setSeededQuery(query);
    setShowAllResults(false);
    if (!result) {
      setOpenKey(null);
    } else if (result.shelfKeys.size === 1) {
      const [only] = result.shelfKeys;
      const shelf = shelves.find((entry) => entry.key === only);
      setOpenKey(shelf && shelf.quizzes.length > 0 ? only : null);
    } else {
      setOpenKey(null);
    }
  }

  const toggle = (key: string) => setOpenKey((current) => (current === key ? null : key));

  const totalCount = quizzes.length;
  const bookCount = shelves.filter((shelf) => shelf.chapters > 0 && shelf.quizzes.length > 0).length;
  const playedTotal = isSignedIn ? quizzes.filter((quiz) => (quiz.progress?.attempts ?? 0) > 0).length : 0;

  const visibleResults = result
    ? showAllResults
      ? result.quizzes
      : result.quizzes.slice(0, RESULT_PREVIEW)
    : [];
  const hiddenResults = result ? result.quizzes.length - visibleResults.length : 0;

  return (
    <div className="min-h-screen bg-paper pb-24 pt-10 lg:pt-14">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <PageMasthead
          eyebrow="Quizbibliotheek"
          title="De Bijbel in een oogopslag"
          lead={`${totalCount} quizzen over ${bookCount} Bijbelboeken, gelegd op de volgorde van de Bijbel. Kies een boek om zijn quizzen te zien, of zoek op titel of hoofdstuk.`}
          aside={
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
              {isSignedIn && playedTotal > 0 ? `${playedTotal} van ${totalCount} afgerond` : `${totalCount} quizzen`}
            </p>
          }
          actions={
            isSignedIn ? <ArrowLink href="/quizzen/aanmaken">Zelf een quiz maken</ArrowLink> : undefined
          }
        />
      </section>

      {/* Search */}
      <section className="mx-auto w-full max-w-[1180px] px-5 pt-8 sm:px-8 lg:px-10">
        <label className="relative block">
          <span className="sr-only">Zoek een quiz</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek een boek, titel of hoofdstuk, bijvoorbeeld Lucas 15"
            autoComplete="off"
            className="h-11 w-full rounded-md border border-rule bg-paper-raised pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted focus-visible:border-lapis focus-visible:outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Zoekopdracht wissen"
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        {result && (
          <div className="mt-4 rounded-md border border-rule bg-paper-raised px-4 sm:px-5">
            <p className="border-b border-rule py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
              {result.chapter ? (
                result.chapter.covered ? (
                  <>
                    <span className="text-lapis">{result.chapter.shelf.title} {result.chapter.chapter}</span>
                    <span className="mx-2 text-rule-strong">/</span>
                    {result.quizzes.length === 1 ? '1 quiz' : `${result.quizzes.length} quizzen`}
                  </>
                ) : (
                  <>
                    Nog geen quiz over {result.chapter.shelf.title} {result.chapter.chapter}
                    <span className="mx-2 text-rule-strong">/</span>
                    wel {result.quizzes.length} over {result.chapter.shelf.title}
                  </>
                )
              ) : result.quizzes.length === 0 ? (
                'Geen quiz gevonden'
              ) : (
                <>
                  {result.quizzes.length === 1 ? '1 quiz' : `${result.quizzes.length} quizzen`}
                  <span className="mx-2 text-rule-strong">/</span>
                  {result.shelfKeys.size === 1 ? '1 boek' : `${result.shelfKeys.size} boeken`}
                </>
              )}
            </p>

            {result.quizzes.length === 0 ? (
              <p className="py-6 text-sm leading-relaxed text-ink-muted">
                Probeer de naam van een Bijbelboek, een hoofdstuk zoals &ldquo;Johannes 3&rdquo; of een woord uit de titel.
              </p>
            ) : (
              <div className="grid lg:grid-cols-2 lg:gap-x-8">
                {visibleResults.map((quiz) => (
                  <QuizRow key={quiz._id} quiz={quiz} showBook className="last:border-b-0" />
                ))}
              </div>
            )}

            {hiddenResults > 0 && (
              <button
                type="button"
                onClick={() => setShowAllResults(true)}
                className="block w-full border-t border-rule py-3 text-left text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Toon alle {result.quizzes.length}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Featured */}
      {!result && featured.length > 0 && (
        <section className="mx-auto w-full max-w-[1180px] px-5 pt-12 sm:px-8 lg:px-10">
          <SectionHead
            eyebrow="Uitgelicht"
            title={featured[0]?.eyebrow === 'Verder gaan' ? 'Ga verder waar je was' : 'Begin hier'}
          />
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map(({ eyebrow, quiz }) => (
              <div key={quiz._id} className="flex flex-col">
                <span className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                  <span className={cn(eyebrow === 'Verder gaan' && 'text-lapis')}>{eyebrow}</span>
                </span>
                <QuizCard quiz={quiz} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The canon */}
      {sections.map((section) => (
        <section
          key={section.id}
          className="mx-auto w-full max-w-[1180px] px-5 pt-12 sm:px-8 lg:px-10"
          aria-labelledby={`sectie-${section.id}`}
        >
          <h2
            id={`sectie-${section.id}`}
            className="border-b border-rule pb-3 font-display text-2xl font-normal tracking-[-0.02em] text-ink"
          >
            {section.title}
          </h2>

          <div className={cn(GRID_CLASS, 'mt-5')}>
            {section.groups.map((group) => (
              <Fragment key={group.id}>
                <p className="col-span-full mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted first:mt-0">
                  {group.label}
                </p>

                {group.shelves.map((shelf, index) => {
                  const rowEnd = Math.min(
                    Math.floor(index / columns) * columns + columns - 1,
                    group.shelves.length - 1
                  );
                  const openIndex = group.shelves.findIndex((entry) => entry.key === openKey);
                  const openShelf: Shelf | null =
                    openIndex !== -1 && index === rowEnd && Math.floor(openIndex / columns) === Math.floor(index / columns)
                      ? group.shelves[openIndex]
                      : null;
                  const panelId = `paneel-${shelf.key.replace(/[^a-z0-9]/gi, '-')}`;

                  return (
                    <Fragment key={shelf.key}>
                      <BookTile
                        shelf={shelf}
                        isOpen={openKey === shelf.key}
                        isDimmed={result !== null && !result.shelfKeys.has(shelf.key)}
                        panelId={panelId}
                        onToggle={() => toggle(shelf.key)}
                      />
                      {openShelf && (
                        <BookPanel
                          shelf={openShelf}
                          panelId={`paneel-${openShelf.key.replace(/[^a-z0-9]/gi, '-')}`}
                          notchPercent={((openIndex % columns) + 0.5) * (100 / columns)}
                          isSignedIn={isSignedIn}
                          onClose={() => setOpenKey(null)}
                        />
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
