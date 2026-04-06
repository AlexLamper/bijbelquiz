'use client';

import { useState, useMemo } from 'react';
import QuizCard, { QuizItem } from './QuizCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ICategory } from '@bijbelquiz/database';

interface QuizzesClientProps {
  quizzes: QuizItem[];
  categories: ICategory[];
  currentCategory: string;
  isPremiumUser: boolean;
}

export default function QuizzesClient({ quizzes, categories, currentCategory, isPremiumUser }: QuizzesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);

  // Filter quizzes based on search and category
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(quiz => {
      const matchesSearch = searchQuery === '' || 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
const matchesCategory = selectedCategory === 'all' || 
          (typeof quiz.categoryId === 'object' && quiz.categoryId !== null ? quiz.categoryId.slug : null) === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [quizzes, searchQuery, selectedCategory]);

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Zoek quizzen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedCategory === 'all'
                ? "bg-[#5b7dd9] text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            )}
          >
            Alle Categorieën
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat._id.toString()}
              onClick={() => setSelectedCategory(cat.slug)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                selectedCategory === cat.slug
                  ? "bg-[#5b7dd9] text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              )}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredQuizzes.length} {filteredQuizzes.length === 1 ? 'quiz' : 'quizzen'} gevonden
        </p>
      </div>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => (
          <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremiumUser} />
        ))}
      </div>

      {/* No Results */}
      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Geen quizzen gevonden</p>
          <p className="text-sm text-muted-foreground mt-2">
            Probeer een andere zoekterm of categorie
          </p>
        </div>
      )}
    </>
  );
}
