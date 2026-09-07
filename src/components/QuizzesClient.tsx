'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageMasthead } from '@/components/editorial';
import { QuizCard } from '@/components/QuizCard';
import { MobileQuizFilter } from '@/components/MobileQuizFilter';
import { useUserSettings } from '@/lib/user-settings-client';
import { matchesPreferredDifficulty, type PreferredDifficulty } from '@/lib/user-settings';
import {
  buildSeriesEntries,
  countEntryQuizzes,
  groupSeries,
  normalizeSearchText,
  type SeriesEntry,
} from '@/lib/quiz-series';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  difficulty: string;
  isPremium: boolean;
  isLocked?: boolean;
  slug?: string;
  createdAt?: string;
  categoryId?: { _id: string; title: string } | string;
  questions?: { _id: string }[];
  questionCount?: number;
  progress?: {
    attempts: number;
    bestCorrectAnswers: number;
    lastCorrectAnswers: number;
    lastWrongAnswers: number;
    lastTotalQuestions: number;
    lastCompletedAt: string;
  };
}

interface Category {
  _id: string;
  title: string;
  slug?: string;
}

interface QuizzesClientProps {
  quizzes: Quiz[];
  categories: Category[];
  userIsPremium: boolean;
  canCreateQuiz: boolean;
  initialCategoryId?: string;
}

/**
 * How many entries render at once. The library keeps growing past what fits a
 * screen, and mounting every match - image, tile, link - for a filter that
 * returns a hundred results is work nobody scrolls far enough to see. Search
 * and filtering still run over the full set; only rendering is capped.
 */
const PAGE_SIZE = 18;

/** Parts of a collapsed series shown before the reader asks for the rest. */
const SERIES_PREVIEW = 3;

const DIFFICULTY_FILTERS: { value: PreferredDifficulty; label: string }[] = [
  { value: 'all', label: 'Elk niveau' },
  { value: 'easy', label: 'Makkelijk' },
  { value: 'medium', label: 'Gemiddeld' },
  { value: 'hard', label: 'Moeilijk' },
];

type SortOption = 'aanbevolen' | 'nieuwste' | 'titel' | 'categorie';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'aanbevolen', label: 'Aanbevolen' },
  { value: 'nieuwste', label: 'Nieuwste eerst' },
  { value: 'titel', label: 'Titel (A-Z)' },
  { value: 'categorie', label: 'Categorie' },
];

export default function QuizzesClient({
  quizzes,
  categories,
  userIsPremium,
  canCreateQuiz,
  initialCategoryId = 'all',
}: QuizzesClientProps) {
  const { settings } = useUserSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>('nieuwste');
  const [selectedDifficulty, setSelectedDifficulty] = useState<PreferredDifficulty>(
    settings.preferredDifficulty
  );

  // The account's preferred difficulty is a starting point, not a lock. The
  // session resolves after first paint, so the saved value arrives late and has
  // to be adopted then; tracking what was last seeded means a filter the reader
  // picked by hand is left alone, because only a change in the saved preference
  // re-seeds. Adjusting during render (rather than in an effect) keeps this to
  // a single render pass.
  const [seededDifficulty, setSeededDifficulty] = useState<PreferredDifficulty>(
    settings.preferredDifficulty
  );

  if (seededDifficulty !== settings.preferredDifficulty) {
    setSeededDifficulty(settings.preferredDifficulty);
    setSelectedDifficulty(settings.preferredDifficulty);
  }

  const normalizedQuizzes = useMemo(() => {
    return quizzes.map((quiz) => ({
      ...quiz,
      isLocked: quiz.isPremium && !userIsPremium,
    }));
  }, [quizzes, userIsPremium]);

  const filteredQuizzes = useMemo(() => {
    // Readers type "danielsboek" or "Daniel" for the same quiz, and Dutch
    // titles carry accents the keyboard does not - so both sides of the
    // comparison are folded to plain lowercase ASCII first.
    const search = normalizeSearchText(searchQuery);

    return normalizedQuizzes.filter((quiz) => {
      const categoryTitle =
        typeof quiz.categoryId === 'string' ? '' : quiz.categoryId?.title || '';

      const matchesSearch =
        search.length === 0 ||
        normalizeSearchText(quiz.title).includes(search) ||
        normalizeSearchText(quiz.description || '').includes(search) ||
        normalizeSearchText(categoryTitle).includes(search);

      const categoryId =
        typeof quiz.categoryId === 'string' ? quiz.categoryId : quiz.categoryId?._id;

      const matchesCategory =
        selectedCategory === 'all' ||
        (categoryId && categoryId.toString() === selectedCategory);

      const matchesPremium = !showPremiumOnly || quiz.isPremium;

      const matchesDifficulty = matchesPreferredDifficulty(selectedDifficulty, quiz.difficulty);

      return matchesSearch && matchesCategory && matchesPremium && matchesDifficulty;
    });
  }, [normalizedQuizzes, searchQuery, selectedCategory, showPremiumOnly, selectedDifficulty]);

  /**
   * "Aanbevolen" keeps the smart default: quizzes you have not played come
   * first, with series held together inside each half, so a library does not
   * open on the things you already finished. Every other sort is literal - the
   * reader asked for a specific order, so played state and series grouping are
   * left out of it and the grid is exactly what the label says.
   */
  const orderedQuizzes = useMemo(() => {
    if (selectedSort === 'aanbevolen') {
      const unplayed = filteredQuizzes.filter((quiz) => (quiz.progress?.attempts ?? 0) === 0);
      const played = filteredQuizzes.filter((quiz) => (quiz.progress?.attempts ?? 0) > 0);
      return [...groupSeries(unplayed), ...groupSeries(played)];
    }

    const sorted = [...filteredQuizzes];
    const categoryTitle = (quiz: Quiz) =>
      (typeof quiz.categoryId === 'string' ? '' : quiz.categoryId?.title || '').toLowerCase();

    if (selectedSort === 'nieuwste') {
      sorted.sort((a, b) => {
        const at = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
        if (bt !== at) return bt - at;
        return a.title.localeCompare(b.title, 'nl');
      });
    } else if (selectedSort === 'titel') {
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'nl'));
    } else if (selectedSort === 'categorie') {
      sorted.sort(
        (a, b) =>
          categoryTitle(a).localeCompare(categoryTitle(b), 'nl') ||
          a.title.localeCompare(b.title, 'nl')
      );
    }

    return sorted;
  }, [filteredQuizzes, selectedSort]);

  const playedCount = useMemo(
    () => normalizedQuizzes.filter((quiz) => (quiz.progress?.attempts ?? 0) > 0).length,
    [normalizedQuizzes]
  );

  /**
   * A book with twenty quizzes used to be twenty adjacent cards, which pushed
   * everything after it off the bottom of the page: finding "Jakobus" meant
   * scrolling past all of Handelingen. Long runs of one series collapse into a
   * single entry that opens on demand, so the grid stays one screen of
   * subjects rather than one screen of chapters.
   */
  const entries = useMemo(
    () => buildSeriesEntries(orderedQuizzes, (quiz) => quiz._id),
    [orderedQuizzes]
  );

  // Reset to the first page whenever the result set changes shape - otherwise
  // a search that narrows a hundred matches to three would leave the "toon
  // meer" cutoff sitting past the end of the new list. Series the reader had
  // opened are closed again for the same reason.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(() => new Set());

  const filterSignature = [
    searchQuery,
    selectedCategory,
    showPremiumOnly,
    selectedDifficulty,
    selectedSort,
  ].join('|');
  const [seededFilters, setSeededFilters] = useState(filterSignature);

  if (seededFilters !== filterSignature) {
    setSeededFilters(filterSignature);
    setVisibleCount(PAGE_SIZE);
    setExpandedSeries(new Set());
  }

  const toggleSeries = (key: string) => {
    setExpandedSeries((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleEntries = entries.slice(0, visibleCount);
  const hasMore = entries.length > visibleEntries.length;
  const remainingCount = countEntryQuizzes(entries.slice(visibleCount));

  /**
   * Index in `entries` where the already-played half begins. Only the
   * "Aanbevolen" sort splits played from unplayed, so the divider is off for
   * every other sort - there played quizzes sit wherever the sort puts them.
   * An entry counts as finished only when every quiz in it is.
   */
  const firstPlayedIndex = useMemo(() => {
    if (selectedSort !== 'aanbevolen') return -1;
    const isPlayed = (quiz: Quiz) => (quiz.progress?.attempts ?? 0) > 0;
    return entries.findIndex((entry) =>
      entry.kind === 'series' ? entry.quizzes.every(isPlayed) : isPlayed(entry.quiz)
    );
  }, [entries, selectedSort]);

  const totalCount = normalizedQuizzes.length;
  const resultCount = orderedQuizzes.length;
  const selectedCategoryTitle =
    selectedCategory === 'all'
      ? 'Alle categorieen'
      : categories.find((category) => category._id === selectedCategory)?.title || 'Categorie';

  return (
    <div className="min-h-screen bg-paper pb-24 pt-10 lg:pt-14">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <PageMasthead
          eyebrow="Quizbibliotheek"
          title="Ontdek en speel Bijbelquizzen"
          lead="Filter en zoek om snel quizzen te vinden die passen bij je niveau en interesse."
          aside={
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
              {resultCount} van {totalCount} · {selectedCategoryTitle}
            </p>
          }
        />
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pt-8 sm:px-8 lg:px-10">
        <div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Zoek op titel of beschrijving"
                className="h-10 border-rule bg-paper-raised pl-9 text-sm focus-visible:ring-rule-strong"
              />
            </div>

            <MobileQuizFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              showPremiumOnly={showPremiumOnly}
              onPremiumToggle={setShowPremiumOnly}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPremiumOnly((value) => !value)}
              className={`hidden h-10 rounded-md px-4 md:inline-flex ${
                showPremiumOnly
                  ? 'border-transparent bg-ink text-ink-inverted  hover:bg-ink-soft  dark:text-ink-inverted '
                  : 'border-rule bg-paper-raised text-ink hover:bg-paper-sunken    '
              }`}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Premium
            </Button>

            {canCreateQuiz && (
              <Button asChild className="hidden h-10 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft md:inline-flex">
                <Link href="/quizzen/aanmaken">Zelf quiz maken</Link>
              </Button>
            )}
          </div>

          <div className="mt-4 hidden flex-wrap gap-2 md:flex">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'border-transparent bg-ink text-ink-inverted  hover:bg-ink-soft  dark:text-ink-inverted '
                  : 'border-transparent text-ink-soft hover:bg-paper-sunken hover:text-ink   '
              }`}
            >
              Alle categorieen
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() => setSelectedCategory(category._id)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === category._id
                    ? 'border-transparent bg-ink text-ink-inverted  hover:bg-ink-soft  dark:text-ink-inverted '
                    : 'border-transparent text-ink-soft hover:bg-paper-sunken hover:text-ink   '
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Niveau
            </span>
            {DIFFICULTY_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedDifficulty(option.value)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedDifficulty === option.value
                    ? 'border-transparent bg-ink text-ink-inverted hover:bg-ink-soft dark:text-ink-inverted'
                    : 'border-rule text-ink-soft hover:bg-paper-sunken hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}

            <label className="flex items-center gap-2 md:ml-auto">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Sorteer
              </span>
              <select
                value={selectedSort}
                onChange={(event) => setSelectedSort(event.target.value as SortOption)}
                className="h-9 rounded-md border border-rule bg-paper-raised px-3 text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rule-strong"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {canCreateQuiz && (
            <div className="mt-4 md:hidden">
              <Button asChild className="h-10 w-full rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft">
                <Link href="/quizzen/aanmaken">Zelf quiz maken</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pt-8 sm:px-8 lg:px-10">
        {resultCount === 0 ? (
          <Card className="border-rule py-0">
            <CardContent className="p-12 text-center">
              <h2 className="font-display text-xl font-normal tracking-[-0.015em] text-ink">Geen quizzen gevonden</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pas je filters aan of probeer een andere zoekterm.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Of verdiep je eerst in een onderwerp via{' '}
                <a
                  href="https://www.bijbelstudie.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink hover:text-ink"
                >
                  Bijbel Studie
                </a>
                .
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setShowPremiumOnly(false);
                    setSelectedDifficulty('all');
                    setSelectedSort('nieuwste');
                  }}
                >
                  Filters wissen
                </Button>
                <Button asChild className="h-10 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft">
                  <Link href="/dashboard">Naar dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {visibleEntries.map((entry, index) => (
                <Fragment key={entry.key}>
                  {/* A labelled rule where the finished half starts, so it is
                      obvious the grid did not simply run out of new quizzes. */}
                  {index === firstPlayedIndex && firstPlayedIndex > 0 && (
                    <div className="col-span-full flex items-center gap-4 pt-2">
                      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                        Al afgerond ({playedCount})
                      </span>
                      <span aria-hidden className="h-px flex-1 bg-rule" />
                    </div>
                  )}

                  {entry.kind === 'quiz' ? (
                    <QuizCard quiz={entry.quiz} isPremiumUser={userIsPremium} />
                  ) : (
                    <SeriesGroup
                      entry={entry}
                      isExpanded={expandedSeries.has(entry.key)}
                      onToggle={() => toggleSeries(entry.key)}
                      userIsPremium={userIsPremium}
                    />
                  )}
                </Fragment>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="h-10 rounded-md border-rule bg-paper-raised px-6 text-ink hover:bg-paper-sunken"
                >
                  Toon meer ({remainingCount} resterend)
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

interface SeriesGroupProps {
  entry: Extract<SeriesEntry<Quiz>, { kind: 'series' }>;
  isExpanded: boolean;
  onToggle: () => void;
  userIsPremium: boolean;
}

/**
 * One book or series as a single block in the grid: a labelled rule, the first
 * few parts, and a button for the rest. Collapsed, a twenty-part series costs
 * the same vertical space as three ordinary quizzes.
 */
function SeriesGroup({ entry, isExpanded, onToggle, userIsPremium }: SeriesGroupProps) {
  const total = entry.quizzes.length;
  const shown = isExpanded ? entry.quizzes : entry.quizzes.slice(0, SERIES_PREVIEW);
  const hidden = total - shown.length;
  const playedInSeries = entry.quizzes.filter((quiz) => (quiz.progress?.attempts ?? 0) > 0).length;

  return (
    <section className="col-span-full">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="font-display text-lg font-normal tracking-[-0.015em] text-ink">
          {entry.label}
        </h2>
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
          {total} quizzen
          {playedInSeries > 0 && ` · ${playedInSeries} afgerond`}
        </span>
        <span aria-hidden className="h-px min-w-8 flex-1 bg-rule" />
        {hidden > 0 || isExpanded ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-rule bg-paper-raised px-3 text-xs font-medium text-ink transition-colors hover:bg-paper-sunken"
          >
            {isExpanded ? 'Toon minder' : `Toon alle ${total}`}
            <ChevronDown
              aria-hidden
              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((quiz) => (
          <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={userIsPremium} />
        ))}
      </div>
    </section>
  );
}
