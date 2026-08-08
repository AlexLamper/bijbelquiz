'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageMasthead } from '@/components/editorial';
import { QuizCard } from '@/components/QuizCard';
import { MobileQuizFilter } from '@/components/MobileQuizFilter';

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

export default function QuizzesClient({
  quizzes,
  categories,
  userIsPremium,
  canCreateQuiz,
  initialCategoryId = 'all',
}: QuizzesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

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

      return matchesSearch && matchesCategory && matchesPremium;
    });
  }, [normalizedQuizzes, searchQuery, selectedCategory, showPremiumOnly]);

  const totalCount = normalizedQuizzes.length;
  const resultCount = filteredQuizzes.length;
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
                  href="https://www.bijbel-studie.com"
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
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={userIsPremium} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
