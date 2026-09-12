'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PageMasthead, QuietButton, SectionHead } from '@/components/editorial';
import QuizCard from '@/components/QuizCard';
import { BOOK_GROUPS, type BookGroup, type Testament } from '@/lib/bible-books';
import type { QuizIndexBook, QuizIndexData, QuizIndexQuiz } from '@/lib/quiz-index-data';

import { BookPanel } from './BookPanel';
import { QuizRow } from './QuizRow';
import { Shelf } from './Shelf';
import { BookSpine, ThemeSpine } from './Spine';
import { groupByBook, pickFeatured, searchLibrary } from './library';

interface BookshelfClientProps extends QuizIndexData {
  isSignedIn: boolean;
}

/** Rows shown under the search box before "en N meer". */
const SEARCH_ROWS = 10;

/** Horizontal gap between compartments from `md` up; must match `md:gap-x-6`. */
const SHELF_GAP = 24;

const TESTAMENTS: { id: Testament; eyebrow: string; title: string }[] = [
  { id: 'OT', eyebrow: 'Oude Testament', title: 'Wet, geschiedenis, poëzie en profeten' },
  { id: 'NT', eyebrow: 'Nieuwe Testament', title: 'Evangeliën, Handelingen, brieven en Openbaring' },
];

/**
 * The quiz index as a bookcase. Every one of the 66 books stands on a shelf
 * in canonical order, grouped the way a Bible's table of contents groups
 * them; a book with quizzes carries a lapis mark. Clicking a spine takes the
 * book off the shelf and opens it under its row. Search dims the spines that
 * do not answer the query and lists the quizzes that do.
 */
export default function BookshelfClient({ quizzes, books, isSignedIn }: BookshelfClientProps) {
  const [query, setQuery] = useState('');
  const [openBook, setOpenBook] = useState<string | null>(null);
  /** Id of the compartment the open panel renders after: the last one on the open book's row. */
  const [panelAfter, setPanelAfter] = useState<string | null>(null);
  const shelfRefs = useRef(new Map<string, HTMLDivElement>());
  const caseRefs = useRef(new Map<Testament, HTMLDivElement>());
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollToPanel = useRef(false);

  const byBook = useMemo(() => groupByBook(quizzes), [quizzes]);
  const bookByCode = useMemo(() => new Map(books.map((book) => [book.code, book])), [books]);
  const themed = useMemo(() => quizzes.filter((quiz) => quiz.book === null), [quizzes]);
  const featured = useMemo(() => pickFeatured(quizzes, isSignedIn), [quizzes, isSignedIn]);
  const search = useMemo(() => searchLibrary(query, quizzes, books), [query, quizzes, books]);
  const booksWithQuizzes = useMemo(() => books.filter((book) => book.quizCount > 0).length, [books]);

  /**
   * Which compartment closes the row the given book stands on. Compartments
   * wrap like flex items, so the row is re-derived from their widths rather
   * than measured from positions, which the open panel itself would shift.
   */
  const placePanel = useCallback(
    (book: QuizIndexBook) => {
      const groups = BOOK_GROUPS.filter((group) => group.testament === book.testament);
      const container = caseRefs.current.get(book.testament);
      const available = container?.clientWidth ?? 0;
      let rowStart = 0;
      let used = 0;
      let rowOf = new Map<string, number>();
      groups.forEach((group, index) => {
        const width = shelfRefs.current.get(group.id)?.offsetWidth ?? 0;
        const needed = used === 0 ? width : used + SHELF_GAP + width;
        if (used > 0 && needed > available + 1) {
          rowStart = index;
          used = width;
        } else {
          used = needed;
        }
        rowOf = rowOf.set(group.id, rowStart);
      });
      const row = rowOf.get(book.group) ?? 0;
      const last = [...groups].reverse().find((group) => rowOf.get(group.id) === row);
      setPanelAfter(last?.id ?? book.group);
    },
    []
  );

  const open = useCallback(
    (code: string, viaSpine: boolean) => {
      const book = bookByCode.get(code);
      if (!book) return;
      scrollToPanel.current = viaSpine;
      setOpenBook(code);
      placePanel(book);
    },
    [bookByCode, placePanel]
  );

  const close = useCallback(() => {
    setOpenBook(null);
    setPanelAfter(null);
  }, []);

  const toggle = (code: string) => {
    if (openBook === code) close();
    else open(code, true);
  };

  const onSearch = (value: string) => {
    setQuery(value);
    const result = searchLibrary(value, quizzes, books);
    if (result.book) open(result.book.code, false);
  };

  // A resized window re-flows the shelves; the panel follows its row.
  useEffect(() => {
    const onResize = () => {
      const book = openBook ? bookByCode.get(openBook) : null;
      if (book) placePanel(book);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [openBook, bookByCode, placePanel]);

  // Taking a book off the shelf by hand brings its panel into view; opening
  // one from the search box does not, the reader is still typing up there.
  useEffect(() => {
    if (!openBook || !scrollToPanel.current) return;
    scrollToPanel.current = false;
    panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [openBook, panelAfter]);

  const openBookEntry = openBook ? bookByCode.get(openBook) ?? null : null;
  const initialChapter = search.active && search.book?.code === openBook ? search.chapter : null;
  const isDimmed = (key: string) => search.active && !search.books.has(key);
  const shownResults = search.quizzes.slice(0, SEARCH_ROWS);
  const moreResults = search.quizzes.length - shownResults.length;

  const renderPanel = () =>
    openBookEntry ? (
      <div ref={panelRef} className="w-full scroll-mt-24">
        <BookPanel
          key={openBookEntry.code}
          book={openBookEntry}
          quizzes={byBook.get(openBookEntry.code) ?? []}
          isSignedIn={isSignedIn}
          initialChapter={initialChapter}
          onClose={close}
        />
      </div>
    ) : null;

  const renderCase = (testament: Testament) => {
    const groups = BOOK_GROUPS.filter((group) => group.testament === testament);
    return (
      <div
        ref={(element) => {
          if (element) caseRefs.current.set(testament, element);
          else caseRefs.current.delete(testament);
        }}
        className="mt-8 flex flex-col gap-y-8 md:flex-row md:flex-wrap md:items-end md:gap-x-6 md:gap-y-10"
      >
        {groups.map((group) => (
          <Fragment key={group.id}>
            <Shelf
              label={group.label}
              meta={groupMeta(group, books)}
              shelfRef={(element) => {
                if (element) shelfRefs.current.set(group.id, element);
                else shelfRefs.current.delete(group.id);
              }}
              className="md:min-w-0 md:max-w-full"
            >
              {books
                .filter((book) => book.group === group.id)
                .map((book) => (
                  <BookSpine
                    key={book.code}
                    book={book}
                    isOpen={openBook === book.code}
                    isDimmed={isDimmed(book.code)}
                    onToggle={() => toggle(book.code)}
                  />
                ))}
            </Shelf>
            {openBookEntry?.testament === testament && panelAfter === group.id && renderPanel()}
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-paper pb-24 pt-10 lg:pt-14">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <PageMasthead
          eyebrow="Quizbibliotheek"
          title="De boekenplank"
          lead="Alle quizzen staan op de plank in de volgorde van de Bijbel. Neem een boek van de plank om zijn hoofdstukken en quizzen te zien, of zoek op titel of hoofdstuk, zoals Lucas 15."
          aside={
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
              {quizzes.length} quizzen · {booksWithQuizzes} van de {books.length} boeken
            </p>
          }
          actions={isSignedIn ? <QuietButton href="/quizzen/aanmaken">Zelf quiz maken</QuietButton> : undefined}
        />
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pt-8 sm:px-8 lg:px-10">
        <label htmlFor="boekenplank-zoeken" className="sr-only">
          Zoek een quiz
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input
            id="boekenplank-zoeken"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Zoek op titel, boek of hoofdstuk, bijvoorbeeld Lucas 15"
            className="h-12 border-rule bg-paper-raised pl-10 pr-4 text-[15px] focus-visible:border-lapis md:text-[15px]"
          />
        </div>

        {search.active && (
          <div className="mt-4" aria-live="polite">
            {search.quizzes.length > 0 ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted tabular-nums">
                  {search.quizzes.length} {search.quizzes.length === 1 ? 'quiz' : 'quizzen'}
                  {search.book && (
                    <>
                      <span className="mx-2 text-rule-strong">/</span>
                      {search.book.title}
                      {search.chapter !== null && ` ${search.chapter}`}
                      <span className="ml-2 normal-case tracking-normal">staat open op de plank</span>
                    </>
                  )}
                </p>
                <ol className="mt-2 rounded-lg border border-rule bg-paper-raised">
                  {shownResults.map((quiz) => (
                    <QuizRow key={quiz._id} quiz={quiz} showBook />
                  ))}
                </ol>
                {moreResults > 0 && (
                  <p className="mt-2 text-xs text-ink-muted tabular-nums">
                    En nog {moreResults} {moreResults === 1 ? 'quiz' : 'quizzen'}. Verfijn je zoekopdracht of neem het boek van de plank.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-muted">
                {search.book && search.chapter !== null
                  ? search.book.chaptersCovered.length > 0
                    ? `Geen quiz over ${search.book.title} ${search.chapter}. Wel over hoofdstuk ${search.book.chaptersCovered.join(', ')}.`
                    : `Nog geen quiz over ${search.book.title}.`
                  : search.book
                    ? `Nog geen quiz over ${search.book.title}.`
                    : `Niets gevonden voor "${query.trim()}".`}
              </p>
            )}
          </div>
        )}
      </section>

      {featured.length > 0 && !search.active && (
        <section className="mx-auto w-full max-w-[1180px] px-5 pt-12 sm:px-8 lg:px-10">
          <SectionHead
            eyebrow="Uitgelicht"
            title={isSignedIn ? 'Verder waar je gebleven was' : 'Om mee te beginnen'}
          />
          <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map(({ quiz, caption }) => (
              <div key={quiz._id} className="flex flex-col">
                {caption && (
                  <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-lapis">
                    <span aria-hidden className="h-px w-4 bg-lapis" />
                    {caption}
                  </p>
                )}
                <QuizCard quiz={quiz} />
              </div>
            ))}
          </div>
        </section>
      )}

      {TESTAMENTS.map((testament) => (
        <section
          key={testament.id}
          className="mx-auto w-full max-w-[1180px] px-5 pt-14 sm:px-8 lg:px-10"
        >
          <SectionHead
            eyebrow={testament.eyebrow}
            title={testament.title}
            action={
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
                {countQuizzes(quizzes, books, testament.id)} quizzen
              </p>
            }
          />
          {renderCase(testament.id)}
        </section>
      ))}

      {themed.length > 0 && (
        <section className="mx-auto w-full max-w-[1180px] px-5 pt-14 sm:px-8 lg:px-10">
          <SectionHead
            eyebrow="Thema's"
            title="Dwars door de Bijbel"
            lead="Quizzen die niet bij een boek horen, maar bij een onderwerp."
            action={
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
                {themed.length} quizzen
              </p>
            }
          />
          <div className="mt-8">
            <Shelf label="Thema's" meta="Klik om te spelen">
              {themed.map((quiz) => (
                <ThemeSpine key={quiz._id} quiz={quiz} isDimmed={isDimmed(quiz._id)} />
              ))}
            </Shelf>
          </div>
        </section>
      )}
    </div>
  );
}

function groupMeta(group: BookGroup, books: QuizIndexBook[]): string | undefined {
  const count = books
    .filter((book) => book.group === group.id)
    .reduce((sum, book) => sum + book.quizCount, 0);
  return count > 0 ? `${count} ${count === 1 ? 'quiz' : 'quizzen'}` : undefined;
}

function countQuizzes(quizzes: QuizIndexQuiz[], books: QuizIndexBook[], testament: Testament): number {
  const codes = new Set(books.filter((book) => book.testament === testament).map((book) => book.code));
  return quizzes.filter((quiz) => quiz.book !== null && codes.has(quiz.book)).length;
}
