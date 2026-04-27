'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Lock, Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface QuizItem {
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

interface QuizCardProps {
  quiz: QuizItem;
  isPremiumUser?: boolean;
  layout?: 'card' | 'stack';
}

const difficultyLabels: Record<string, string> = {
  easy: 'makkelijk',
  medium: 'gemiddeld',
  hard: 'moeilijk',
  beginner: 'makkelijk',
  intermediate: 'gemiddeld',
  advanced: 'moeilijk',
};

const difficultyBadgeClassName =
  'border border-[#d7e1ee] bg-white/90 text-[#4e5f79] dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200';

function getCategoryLabel(category: QuizItem['categoryId']): string {
  if (typeof category === 'object' && category?.title) return category.title;
  return 'Algemeen';
}

function getDifficultyLabel(difficulty: string) {
  const key = difficulty?.toLowerCase();
  return difficultyLabels[key] || difficulty || 'onbekend';
}

export function QuizCard({ quiz, isPremiumUser, layout = 'card' }: QuizCardProps) {
  const difficultyLabel = getDifficultyLabel(quiz.difficulty);
  const categoryLabel = getCategoryLabel(quiz.categoryId);
  const questionCount = quiz.questions?.length || 0;
  const isLocked = typeof quiz.isLocked === 'boolean' ? quiz.isLocked : quiz.isPremium && isPremiumUser === false;
  const isStackLayout = layout === 'stack';

  const href = `/quiz/${quiz.slug || quiz._id}`;

  const imageBlock = (
    <div className={cn('relative h-44 bg-[#dce5f3] dark:bg-slate-800', isStackLayout && 'rounded-lg overflow-hidden')}>
      {quiz.imageUrl ? (
        <Image
          src={quiz.imageUrl}
          alt={quiz.title}
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#d9e4f5,#eef3fb)] dark:bg-[linear-gradient(135deg,#243247,#1c2a3d)]" />
      )}

      <div className="absolute left-3 top-3 flex gap-2">
        <Badge variant="secondary" className="bg-white/90 text-[#314869] dark:bg-slate-900/90 dark:text-slate-100">
          {categoryLabel}
        </Badge>
        <Badge className={difficultyBadgeClassName}>{difficultyLabel}</Badge>
      </div>

      {quiz.isPremium && (
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 bg-[#1f2f4b] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#dce8ff] dark:bg-slate-900 dark:text-slate-100">
          <Star className="h-3 w-3 fill-current" />
          Premium
        </div>
      )}

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white p-2 dark:bg-slate-900">
            <Lock className="h-5 w-5 text-[#1f2f4b] dark:text-slate-100" />
          </div>
        </div>
      )}
    </div>
  );

  if (isStackLayout) {
    return (
      <Link href={href} className="block">
        <article className="group h-full">
          {imageBlock}

          <div className="pb-2 pt-3">
            <h3 className="line-clamp-2 text-lg font-semibold text-[#1f2f4b] dark:text-slate-100">{quiz.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground dark:text-slate-300">
              {quiz.description || 'Test je kennis met deze quiz.'}
            </p>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground dark:text-slate-300">
              <span>{questionCount} vragen</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#355384] dark:text-blue-300">
                Start
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="block">
      <Card className="group h-full gap-0 overflow-hidden border-[#d7e1ee] bg-white py-0 shadow-sm transition-colors hover:bg-[#f9fbff] dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
        {imageBlock}

        <CardContent className="p-4 pb-5">
          <h3 className="line-clamp-2 text-lg font-semibold text-[#1f2f4b] dark:text-slate-100">{quiz.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground dark:text-slate-300">
            {quiz.description || 'Test je kennis met deze quiz.'}
          </p>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground dark:text-slate-300">
            <span>{questionCount} vragen</span>
            <span className="inline-flex items-center gap-1 font-medium text-[#355384] dark:text-blue-300">
              Start
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default QuizCard;
