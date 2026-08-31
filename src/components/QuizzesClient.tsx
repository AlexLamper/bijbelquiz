'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageMasthead } from '@/components/editorial';
import { QuizCard } from '@/components/QuizCard';
import { MobileQuizFilter } from '@/components/MobileQuizFilter';
import { useUserSettings } from '@/lib/user-settings-client';
import { matchesPreferredDifficulty, type PreferredDifficulty } from '@/lib/user-settings';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  difficulty: string;
  isPremium: boolean;
  isLocked?: boolean;
  slug?: string;
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

const ROMAN_PARTS: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6 };

/**
 * How many cards render at once. The library keeps growing past what fits a
 * screen, and mounting every match - image, tile, link - for a filter that
 * returns a hundred results is work nobody scrolls far enough to see. Search
 * and filtering still run over the full set; only rendering is capped.
 */
const PAGE_SIZE = 24;

const DIFFICULTY_FILTERS: { value: PreferredDifficulty; label: string }[] = [
  { value: 'all', label: 'Elk niveau' },
  { value: 'easy', label: 'Makkelijk' },
  { value: 'medium', label: 'Gemiddeld' },
  { value: 'hard', label: 'Moeilijk' },
];

/**
 * Split a quiz title into the series it belongs to and its part number, so
 * "Daniel Deel 1" and "Daniel Deel 2" are recognised as one series. Quizzes are
 * sorted server-side with premium last, which would otherwise scatter the parts
 * of a series across the grid.
 */
function readSeries(title: string): { base: string; part: number } {
  const trimmed = (title || '').trim();
  const match = trimmed.match(/^(.*?)[\s\-:]*\b(?:deel|dl\.?|part)\s*([0-9]+|[ivx]+)\s*$/i)
    || trimmed.match(/^(.*?)\s*\(\s*([0-9]+)\s*\)\s*$/)
    || trimmed.match(/^(.*?)\s+-\s+([0-9]+)\s*$/);

  if (!match || !match[1].trim()) {
    return { base: trimmed.toLowerCase(), part: 0 };
  }

  const raw = match[2].toLowerCase();
  const part = /^[0-9]+$/.test(raw) ? Number(raw) : ROMAN_PARTS[raw] ?? 0;

  return { base: match[1].trim().toLowerCase(), part };
}

/** Keep the incoming order, but pull every part of a series together, in order. */
function groupSeries<T extends { title: string }>(items: T[]): T[] {
  const firstSeen = new Map<string, number>();

  const decorated = items.map((item, index) => {
    const { base, part } = readSeries(item.title);
    if (!firstSeen.has(base)) {
      firstSeen.set(base, index);
    }
    return { item, base, part, index };
  });

  return decorated
    .sort((a, b) => {
      const groupA = firstSeen.get(a.base) ?? a.index;
      const groupB = firstSeen.get(b.base) ?? b.index;
      if (groupA !== groupB) return groupA - groupB;
      if (a.part !== b.part) return a.part - b.part;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

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
    const search = searchQuery.trim().toLowerCase();

    return normalizedQuizzes.filter((quiz) => {
      const matchesSearch =
        search.length === 0 ||
        quiz.title.toLowerCase().includes(search) ||
        (quiz.description || '').toLowerCase().includes(search);

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
   * Quizzes you have not played come first.
   *
   * A library that opens on the things you already finished makes the same few
   * quizzes get replayed while the rest is never found. Series stay together -
   * the grouping runs inside each half - so "Daniel Deel 1" and "Deel 2" are
   * still adjacent, they just move down together once both are done.
   */
  const orderedQuizzes = useMemo(() => {
    const unplayed = filteredQuizzes.filter((quiz) => (quiz.progress?.attempts ?? 0) === 0);
    const played = filteredQuizzes.filter((quiz) => (quiz.progress?.attempts ?? 0) > 0);

    return [...groupSeries(unplayed), ...groupSeries(played)];
  }, [filteredQuizzes]);

  const playedCount = useMemo(
    () => normalizedQuizzes.filter((quiz) => (quiz.progress?.attempts ?? 0) > 0).length,
    [normalizedQuizzes]
  );

  // Reset to the first page whenever the result set changes shape - otherwise
  // a search that narrows a hundred matches to three would leave the "toon
  // meer" cutoff sitting past the end of the new list.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedCategory, showPremiumOnly, selectedDifficulty]);

  const visibleQuizzes = orderedQuizzes.slice(0, visibleCount);
  const hasMore = orderedQuizzes.length > visibleQuizzes.length;

  /** Index in `orderedQuizzes` where the already-played half begins. */
  const firstPlayedIndex = useMemo(
    () => orderedQuizzes.findIndex((quiz) => (quiz.progress?.attempts ?? 0) > 0),
    [orderedQuizzes]
  );

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
              {visibleQuizzes.map((quiz, index) => (
                <Fragment key={quiz._id}>
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
                  <QuizCard quiz={quiz} isPremiumUser={userIsPremium} />
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
                  Toon meer ({orderedQuizzes.length - visibleQuizzes.length} resterend)
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
