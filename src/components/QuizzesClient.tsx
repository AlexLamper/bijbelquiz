'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  initialCategoryId?: string;
}

export default function QuizzesClient({ quizzes, categories, userIsPremium, initialCategoryId = 'all' }: QuizzesClientProps) {
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
    <div className="-mt-24 min-h-screen pt-24 pb-12">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden border-0 bg-transparent py-0 shadow-none">
          <CardContent className="relative p-0">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[#607597] dark:text-slate-300">Quizbibliotheek</p>
                <h1 className="mt-2 text-3xl font-semibold text-[#1f2f4b] dark:text-slate-100 md:text-4xl">Ontdek en speel Bijbelquizzen</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Gebruik filters en zoekopdrachten om snel quizzen te vinden die passen bij je niveau en interesse.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end xl:pt-1">
                <Badge variant="outline" className="h-9 border-border bg-card px-3 text-xs font-medium text-foreground dark:bg-slate-900/70">
                  {resultCount} zichtbaar
                </Badge>
                <Badge variant="outline" className="h-9 border-border bg-card px-3 text-xs font-medium text-foreground dark:bg-slate-900/70">
                  {totalCount} totaal
                </Badge>
                <Badge variant="outline" className="h-9 border-border bg-card px-3 text-xs font-medium text-foreground dark:bg-slate-900/70">
                  {selectedCategoryTitle}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-6 lg:px-8">
        <div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7b8da8] dark:text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Zoek op titel of beschrijving"
                className="h-10 border-[#d7e1ee] bg-white pl-9 text-sm focus-visible:ring-[#aac0e8] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                  ? 'border-[#9bb6e1] bg-[#dfe9fa] text-[#233a5f] shadow-sm ring-1 ring-[#bfd0ed] dark:border-blue-500/70 dark:bg-blue-500/20 dark:text-blue-100 dark:ring-blue-500/50'
                  : 'border-[#d7e1ee] bg-white text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Premium
            </Button>
          </div>

          <div className="mt-4 hidden flex-wrap gap-2 md:flex">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'border-[#9bb6e1] bg-[#dfe9fa] text-[#233a5f] shadow-sm ring-1 ring-[#bfd0ed] dark:border-blue-500/70 dark:bg-blue-500/20 dark:text-blue-100 dark:ring-blue-500/50'
                  : 'border-transparent text-[#4e5f79] hover:bg-[#f5f8fd] hover:text-[#24395f] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
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
                    ? 'border-[#9bb6e1] bg-[#dfe9fa] text-[#233a5f] shadow-sm ring-1 ring-[#bfd0ed] dark:border-blue-500/70 dark:bg-blue-500/20 dark:text-blue-100 dark:ring-blue-500/50'
                    : 'border-transparent text-[#4e5f79] hover:bg-[#f5f8fd] hover:text-[#24395f] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-6 lg:px-8">
        {resultCount === 0 ? (
          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <CardContent className="p-10 text-center">
              <h2 className="text-2xl font-semibold text-[#1f2f4b] dark:text-slate-100">Geen quizzen gevonden</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pas je filters aan of probeer een andere zoekterm.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md border-[#d7e1ee] bg-white px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setShowPremiumOnly(false);
                  }}
                >
                  Filters wissen
                </Button>
                <Button asChild className="h-10 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc]">
                  <Link href="/dashboard">Naar dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz._id} quiz={quiz} layout="stack" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
