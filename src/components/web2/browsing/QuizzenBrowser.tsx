'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, CircleHelp, Crown, Search, Shield, Sparkle, Users } from 'lucide-react';

import { Button, EmptyState, QuizCard, SearchInput, Tabs, type TabItem } from '@/components/bq';
import { BOOK_GROUPS, bookBySlug } from '@/lib/bible-books';
import { MULTIPLAYER_MAX_PLAYERS } from '@/lib/premium-benefits';
import { cn } from '@/lib/utils';
import {
  bookGroups,
  countLabel,
  pickPerTestament,
  pickPopular,
  quizHref,
  quizzesInCategory,
  searchBooks,
  searchQuizzes,
  sortByChapter,
  themeGroups,
  type BookGroup,
  type BrowseQuiz,
  type ThemeGroup,
} from '@/lib/quiz-browse-shape';
import { BookIcon } from './illustrations';
import { quizzenHref, readQuizzenState, type QuizzenChip, type QuizzenState, type QuizzenView } from './quizzen-view';

const CHIPS: TabItem<QuizzenChip>[] = [
  { value: 'alles', label: 'Alles' },
  { value: 'oude-testament', label: 'Oude Testament' },
  { value: 'nieuwe-testament', label: 'Nieuwe Testament' },
  { value: 'themas', label: "Thema's" },
];

const TESTAMENT_TITLE = { OT: 'Oude Testament', NT: 'Nieuwe Testament' } as const;

function chipOf(view: QuizzenView, books: BookGroup[]): QuizzenChip {
  switch (view.kind) {
    case 'testament':
      return view.testament === 'OT' ? 'oude-testament' : 'nieuwe-testament';
    case 'themes':
    case 'theme':
      return 'themas';
    case 'book': {
      const testament = books.find((group) => group.book.slug === view.slug)?.book.testament ?? bookBySlug(view.slug)?.testament;
      return testament === 'NT' ? 'nieuwe-testament' : testament === 'OT' ? 'oude-testament' : 'alles';
    }
    default:
      return 'alles';
  }
}

function viewOfChip(chip: QuizzenChip): QuizzenView {
  switch (chip) {
    case 'oude-testament':
      return { kind: 'testament', testament: 'OT' };
    case 'nieuwe-testament':
      return { kind: 'testament', testament: 'NT' };
    case 'themas':
      return { kind: 'themes' };
    default:
      return { kind: 'overview' };
  }
}

function isPlainClick(event: React.MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * The quiz library. The catalogue arrives once (cards only, no questions);
 * chips, search and the book or theme views are worked out here and written
 * to the address bar with `history.pushState`, which Next keeps in step with
 * `useSearchParams`, so back/forward and shared links work without a server
 * round trip per click.
 */
export function QuizzenBrowser({ quizzes }: { quizzes: BrowseQuiz[] }) {
  const searchParams = useSearchParams();
  const state = readQuizzenState(searchParams);
  const [draft, setDraft] = React.useState(state.query);
  const lastWritten = React.useRef(state.query);

  // Keep the field in step when the query changes from outside (back button).
  React.useEffect(() => {
    if (state.query !== lastWritten.current) {
      lastWritten.current = state.query;
      setDraft(state.query);
    }
  }, [state.query]);

  const books = React.useMemo(() => bookGroups(quizzes), [quizzes]);
  const themes = React.useMemo(() => themeGroups(quizzes), [quizzes]);

  const go = React.useCallback((next: QuizzenState, mode: 'push' | 'replace' = 'push') => {
    const href = quizzenHref(next.view, next.query);
    if (mode === 'push') {
      window.history.pushState(null, '', href);
      window.scrollTo({ top: 0 });
    } else {
      window.history.replaceState(null, '', href);
    }
  }, []);

  const goView = React.useCallback(
    (view: QuizzenView) => (event: React.MouseEvent) => {
      if (!isPlainClick(event)) return;
      event.preventDefault();
      setDraft('');
      lastWritten.current = '';
      go({ view, query: '' });
    },
    [go],
  );

  // Search writes to the address bar after a short pause, as a replace.
  React.useEffect(() => {
    if (draft === state.query) return;
    const timer = window.setTimeout(() => {
      lastWritten.current = draft;
      go({ view: state.query || draft ? scopeOfSearch(state.view) : state.view, query: draft }, 'replace');
    }, 200);
    return () => window.clearTimeout(timer);
  }, [draft, go, state.query, state.view]);

  const chip = chipOf(state.view, books);
  const query = draft.trim();

  return (
    <div className="mx-auto box-border flex w-full max-w-[1200px] flex-col gap-10 px-4 pb-[72px] pt-6 m:px-8 m:pt-10">
      <div className="flex flex-col gap-[22px]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">Quizzen</h1>
          <p className="m-0 max-w-[70ch] text-[17px] font-semibold leading-[26px] text-ink-muted">
            Kies een bijbelboek of thema. Bij elk antwoord krijg je uitleg en de bijbeltekst.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-4 m:flex-row m:items-center">
          <SearchInput
            className="min-w-0 m:flex-1"
            aria-label="Zoek een quiz"
            placeholder="Zoek een bijbelboek of onderwerp"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            enterKeyHint="search"
          />
          <Tabs
            variant="pills"
            semantics="tabs"
            aria-label="Filter"
            items={CHIPS}
            value={chip}
            onChange={(value) => go({ view: viewOfChip(value), query })}
            className="shrink-0"
          />
        </div>
      </div>

      {query ? (
        <SearchResults quizzes={quizzes} books={books} query={query} chip={chip} onClear={() => setDraft('')} goView={goView} />
      ) : (
        <ViewBody view={state.view} quizzes={quizzes} books={books} themes={themes} goView={goView} />
      )}
    </div>
  );
}

/** A search keeps the chip's scope but leaves a book or theme page. */
function scopeOfSearch(view: QuizzenView): QuizzenView {
  if (view.kind === 'book' || view.kind === 'theme' || view.kind === 'popular') return { kind: 'overview' };
  return view;
}

type GoView = (view: QuizzenView) => (event: React.MouseEvent) => void;

function ViewBody({
  view,
  quizzes,
  books,
  themes,
  goView,
}: {
  view: QuizzenView;
  quizzes: BrowseQuiz[];
  books: BookGroup[];
  themes: ThemeGroup[];
  goView: GoView;
}) {
  switch (view.kind) {
    case 'testament':
      return <TestamentView testament={view.testament} books={books} goView={goView} />;
    case 'themes':
      return (
        <Section title="Thema's">
          <ThemeRows themes={themes} goView={goView} />
        </Section>
      );
    case 'popular':
      return (
        <Section title="Populaire quizzen" action={<ViewLink view={{ kind: 'overview' }} goView={goView} label="Alle quizzen" />}>
          <QuizGrid quizzes={pickPopular(quizzes, 24)} />
        </Section>
      );
    case 'book': {
      const group = books.find((entry) => entry.book.slug === view.slug);
      if (!group) return <NotFound goView={goView} />;
      const testament = group.book.testament;
      return (
        <Section
          title={group.book.title}
          subtitle={countLabel(group.quizzes.length)}
          action={<ViewLink view={{ kind: 'testament', testament }} goView={goView} label={`Alle boeken van het ${TESTAMENT_TITLE[testament]}`} short="Alle boeken" />}
        >
          <QuizGrid quizzes={group.quizzes} />
        </Section>
      );
    }
    case 'theme': {
      const theme = themes.find((entry) => entry.key === view.key);
      const inCategory = theme ? theme.quizzes : sortByChapter(quizzesInCategory(quizzes, view.key));
      if (inCategory.length === 0) return <NotFound goView={goView} />;
      const title = theme?.title ?? inCategory[0].category?.title ?? "Thema's";
      return (
        <Section title={title} subtitle={countLabel(inCategory.length)} action={<ViewLink view={{ kind: 'themes' }} goView={goView} label="Alle thema's" />}>
          <QuizGrid quizzes={inCategory} />
        </Section>
      );
    }
    default:
      return <Overview quizzes={quizzes} books={books} themes={themes} goView={goView} />;
  }
}

function Overview({ quizzes, books, themes, goView }: { quizzes: BrowseQuiz[]; books: BookGroup[]; themes: ThemeGroup[]; goView: GoView }) {
  const popular = pickPopular(quizzes, 4);
  const shown = new Set(popular.map((quiz) => quiz.id));
  const ot = pickPerTestament(quizzes, 'OT', 4, shown);
  const nt = pickPerTestament(quizzes, 'NT', 4, shown);
  const otBooks = books.filter((group) => group.book.testament === 'OT').length;
  const ntBooks = books.filter((group) => group.book.testament === 'NT').length;

  return (
    <>
      {popular.length > 0 && (
        <Section title="Populaire quizzen" action={<ViewLink view={{ kind: 'popular' }} goView={goView} label="Alles" />}>
          <QuizGrid quizzes={popular} />
        </Section>
      )}
      <SamenSpelenBanner />
      {ot.length > 0 && (
        <Section
          title="Oude Testament"
          action={<ViewLink view={{ kind: 'testament', testament: 'OT' }} goView={goView} label={`Alle ${otBooks} ${otBooks === 1 ? 'boek' : 'boeken'}`} />}
        >
          <QuizGrid quizzes={ot} />
        </Section>
      )}
      {nt.length > 0 && (
        <Section
          title="Nieuwe Testament"
          action={<ViewLink view={{ kind: 'testament', testament: 'NT' }} goView={goView} label={`Alle ${ntBooks} ${ntBooks === 1 ? 'boek' : 'boeken'}`} />}
        >
          <QuizGrid quizzes={nt} />
        </Section>
      )}
      {themes.length > 0 && (
        <Section title="Thema's">
          <ThemeRows themes={themes} goView={goView} />
        </Section>
      )}
      {quizzes.length === 0 && <EmptyState title="Nog geen quizzen" description="Zodra er quizzen klaarstaan, vind je ze hier." />}
    </>
  );
}

function TestamentView({ testament, books, goView }: { testament: 'OT' | 'NT'; books: BookGroup[]; goView: GoView }) {
  const inTestament = books.filter((group) => group.book.testament === testament);
  const groups = BOOK_GROUPS.filter((group) => group.testament === testament)
    .map((group) => ({ group, books: inTestament.filter((entry) => bookBySlug(entry.book.slug)?.group === group.id) }))
    .filter((entry) => entry.books.length > 0);

  if (inTestament.length === 0) {
    return <EmptyState title={`Nog geen quizzen uit het ${TESTAMENT_TITLE[testament]}`} description="Kies een ander filter of zoek op een onderwerp." />;
  }

  return (
    <Section title={TESTAMENT_TITLE[testament]} subtitle={`${inTestament.length} ${inTestament.length === 1 ? 'boek' : 'boeken'}`}>
      <div className="flex flex-col gap-6">
        {groups.map(({ group, books: entries }) => (
          <div key={group.id} className="flex flex-col gap-3">
            <h3 className="m-0 font-sans text-xs font-extrabold uppercase tracking-[0.04em] text-ink-muted">{group.label}</h3>
            <div className="grid grid-cols-1 gap-3 m:grid-cols-3">
              {entries.map((entry) => (
                <RowLink
                  key={entry.book.code}
                  href={quizzenHref({ kind: 'book', slug: entry.book.slug })}
                  onClick={goView({ kind: 'book', slug: entry.book.slug })}
                  icon={<BookIcon size={22} />}
                  tone={testament === 'OT' ? 'green' : 'lapis'}
                  title={entry.book.title}
                  detail={countLabel(entry.quizzes.length)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SearchResults({
  quizzes,
  books,
  query,
  chip,
  onClear,
  goView,
}: {
  quizzes: BrowseQuiz[];
  books: BookGroup[];
  query: string;
  chip: QuizzenChip;
  onClear: () => void;
  goView: GoView;
}) {
  const inScope = (quiz: BrowseQuiz) =>
    chip === 'alles' ||
    (chip === 'themas' ? !quiz.book : quiz.book?.testament === (chip === 'oude-testament' ? 'OT' : 'NT'));
  const matches = searchQuizzes(quizzes.filter(inScope), query);
  const bookMatches = chip === 'themas' ? [] : searchBooks(books, query).filter((group) => group.quizzes.some(inScope));

  if (matches.length === 0 && bookMatches.length === 0) {
    return (
      <EmptyState
        icon={<Search />}
        title="Geen quiz gevonden"
        description={`Niets gevonden voor "${query}". Probeer een bijbelboek, een persoon of een ander woord.`}
        action={
          <Button variant="secondary" onClick={onClear}>
            Wis zoekopdracht
          </Button>
        }
      />
    );
  }

  return (
    <>
      {bookMatches.length > 0 && (
        <Section title="Bijbelboeken">
          <div className="grid grid-cols-1 gap-3 m:grid-cols-3">
            {bookMatches.map((entry) => (
              <RowLink
                key={entry.book.code}
                href={quizzenHref({ kind: 'book', slug: entry.book.slug })}
                onClick={goView({ kind: 'book', slug: entry.book.slug })}
                icon={<BookIcon size={22} />}
                tone={entry.book.testament === 'OT' ? 'green' : 'lapis'}
                title={entry.book.title}
                detail={countLabel(entry.quizzes.length)}
              />
            ))}
          </div>
        </Section>
      )}
      {matches.length > 0 && (
        <Section title="Quizzen" subtitle={countLabel(matches.length)}>
          <QuizGrid quizzes={matches} />
        </Section>
      )}
    </>
  );
}

function NotFound({ goView }: { goView: GoView }) {
  return (
    <EmptyState
      icon={<Search />}
      title="Hier staan (nog) geen quizzen"
      description="Kies een bijbelboek of thema uit het overzicht."
      action={
        <Button variant="secondary" href="/quizzen" onClick={goView({ kind: 'overview' })}>
          Naar alle quizzen
        </Button>
      }
    />
  );
}

/* ── Building blocks ─────────────────────────────────────────────────────── */

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="m-0 text-[26px] leading-8">{title}</h2>
          {subtitle && <span className="whitespace-nowrap text-[15px] font-bold text-ink-muted">{subtitle}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewLink({ view, goView, label, short }: { view: QuizzenView; goView: GoView; label: string; short?: string }) {
  return (
    <a
      href={quizzenHref(view)}
      onClick={goView(view)}
      className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[15px] font-extrabold no-underline"
    >
      {short ? (
        <>
          <span className="max-m:hidden">{label}</span>
          <span className="m:hidden">{short}</span>
        </>
      ) : (
        label
      )}
      <ChevronRight className="size-4" strokeWidth={2.6} aria-hidden="true" />
    </a>
  );
}

function QuizGrid({ quizzes }: { quizzes: BrowseQuiz[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 m:grid-cols-4 m:gap-4">
      {quizzes.map((quiz) => (
        <QuizCard
          key={quiz.id}
          href={quizHref(quiz)}
          title={quiz.title}
          reference={quiz.reference}
          questionCount={quiz.questionCount}
          kickerTone="muted"
          imageUrl={quiz.cover}
          seed={quiz.slug}
        />
      ))}
    </div>
  );
}

const ROW_TONES = {
  gold: 'bg-gold-tint text-gold-text',
  lapis: 'bg-lapis-tint text-lapis',
  coral: 'bg-coral-tint text-coral-text',
  green: 'bg-green-tint text-green',
} as const;

type RowTone = keyof typeof ROW_TONES;

function RowLink({
  href,
  onClick,
  icon,
  tone,
  title,
  detail,
}: {
  href: string;
  onClick?: (event: React.MouseEvent) => void;
  icon: React.ReactNode;
  tone: RowTone;
  title: string;
  detail: string;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex min-w-0 items-center gap-3.5 rounded-[16px] border border-line bg-card px-4 py-3.5 text-ink no-underline transition-colors hover:border-input-line hover:text-ink"
    >
      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-[12px] [&_svg]:size-[22px]', ROW_TONES[tone])} aria-hidden="true">
        {icon}
      </span>
      <span className="flex min-w-0 flex-grow flex-col gap-px">
        <span className="text-base font-extrabold">{title}</span>
        <span className="text-[13px] font-semibold text-ink-muted">{detail}</span>
      </span>
      <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
    </a>
  );
}

/** An icon and colour for a theme, from its name; a book for anything unrecognised. */
function themeLook(theme: ThemeGroup, index: number): { icon: React.ReactNode; tone: RowTone } {
  const name = `${theme.key} ${theme.title}`.toLowerCase();
  if (/algemeen|kennis|wie zei/.test(name)) return { icon: <CircleHelp strokeWidth={2.2} />, tone: 'gold' };
  if (/wonder|gebeurtenis/.test(name)) return { icon: <Sparkle strokeWidth={2.2} />, tone: 'lapis' };
  if (/held|martel|vrouw/.test(name)) return { icon: <Shield strokeWidth={2.2} />, tone: 'coral' };
  if (/koning|profeet|profeten|apostel/.test(name)) return { icon: <Crown strokeWidth={2.2} />, tone: 'gold' };
  if (/studie|verdieping/.test(name)) return { icon: <Search strokeWidth={2.2} />, tone: 'green' };
  const tones: RowTone[] = ['green', 'lapis', 'coral', 'gold'];
  return { icon: <BookIcon size={22} />, tone: tones[index % tones.length] };
}

function ThemeRows({ themes, goView }: { themes: ThemeGroup[]; goView: GoView }) {
  if (themes.length === 0) {
    return <EmptyState title="Nog geen thema's" description="Zodra er een themaquiz klaarstaat, vind je die hier." />;
  }
  return (
    <div className="grid grid-cols-1 gap-3 m:grid-cols-3">
      {themes.map((theme, index) => {
        const look = themeLook(theme, index);
        return (
          <RowLink
            key={theme.key}
            href={quizzenHref({ kind: 'theme', key: theme.key })}
            onClick={goView({ kind: 'theme', key: theme.key })}
            icon={look.icon}
            tone={look.tone}
            title={theme.title}
            detail={countLabel(theme.quizzes.length)}
          />
        );
      })}
    </div>
  );
}

function SamenSpelenBanner() {
  return (
    <Link
      href="/samen-spelen"
      className="flex items-center gap-4 rounded-[16px] border border-line bg-card px-5 py-4 text-ink no-underline transition-colors hover:border-input-line hover:text-ink"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-green-tint text-green" aria-hidden="true">
        <Users className="size-6" strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-grow flex-col gap-0.5">
        <span className="text-[17px] font-extrabold">Samen spelen</span>
        <span className="text-[15px] font-semibold text-ink-muted">
          Speel live met je groep of klas. Deel de kamercode, tot {MULTIPLAYER_MAX_PLAYERS} spelers doen mee.
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
}
