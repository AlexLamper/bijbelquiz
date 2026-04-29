'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowRight, Crown, Lock } from 'lucide-react';

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
  darkPalette?: 'default' | 'neutral';
}

const difficultyLabels: Record<string, string> = {
  easy: 'makkelijk',
  medium: 'gemiddeld',
  hard: 'moeilijk',
  beginner: 'makkelijk',
  intermediate: 'gemiddeld',
  advanced: 'moeilijk',
};

const difficultyBadgeBaseClassName = 'border border-[#d7e1ee] bg-white/90 text-[#4e5f79]';
const QUIZ_IMAGE_POOL = Array.from({ length: 10 }, (_, index) => `/images/quizzes/img${index + 1}.png`);
const QUIZ_IMAGE_WHITELIST = new Set(QUIZ_IMAGE_POOL);

function getDeterministicFallbackImage(seed: string): string {
  if (!seed) {
    return QUIZ_IMAGE_POOL[0];
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return QUIZ_IMAGE_POOL[Math.abs(hash) % QUIZ_IMAGE_POOL.length];
}

function resolveQuizImage(imageUrl: string | undefined, fallbackImage: string): string {
  const normalized = imageUrl?.trim();
  if (!normalized) {
    return fallbackImage;
  }

  if (QUIZ_IMAGE_WHITELIST.has(normalized)) {
    return normalized;
  }

  const lower = normalized.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return normalized;
  }

  if (!lower.startsWith('/images/quizzes/')) {
    return normalized;
  }

  const fileName = lower.split('/').pop() || '';
  if (/^img([1-9]|10)\.png$/.test(fileName)) {
    return `/images/quizzes/${fileName}`;
  }

  return fallbackImage;
}

function getCategoryLabel(category: QuizItem['categoryId']): string {
  if (typeof category === 'object' && category?.title) return category.title;
  return 'Algemeen';
}

function getDifficultyLabel(difficulty: string) {
  const key = difficulty?.toLowerCase();
  return difficultyLabels[key] || difficulty || 'onbekend';
}

export function QuizCard({ quiz, isPremiumUser, layout = 'card', darkPalette = 'neutral' }: QuizCardProps) {
  const difficultyLabel = getDifficultyLabel(quiz.difficulty);
  const categoryLabel = getCategoryLabel(quiz.categoryId);
  const questionCount = quiz.questions?.length || 0;
  const isLocked = typeof quiz.isLocked === 'boolean' ? quiz.isLocked : quiz.isPremium && isPremiumUser === false;
  const isStackLayout = layout === 'stack';
  const useNeutralDarkPalette = darkPalette === 'neutral';
  const fallbackImageUrl = useMemo(
    () => getDeterministicFallbackImage(quiz.slug || quiz._id || quiz.title),
    [quiz.slug, quiz._id, quiz.title]
  );
  const resolvedImageUrl = useMemo(
    () => resolveQuizImage(quiz.imageUrl, fallbackImageUrl),
    [quiz.imageUrl, fallbackImageUrl]
  );
  const [imageFailedFor, setImageFailedFor] = useState<string | null>(null);
  const displayImageUrl = imageFailedFor === resolvedImageUrl ? fallbackImageUrl : resolvedImageUrl;

  const imageContainerDarkClass = useNeutralDarkPalette ? 'dark:bg-zinc-800' : 'dark:bg-zinc-800';
  const badgeDarkClass = useNeutralDarkPalette ? 'dark:bg-zinc-900/90 dark:text-zinc-100' : 'dark:bg-zinc-900/90 dark:text-zinc-100';
  const difficultyBadgeDarkClass = useNeutralDarkPalette
    ? 'dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200'
    : 'dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200';
  const premiumTagDarkClass = useNeutralDarkPalette ? 'dark:bg-[#6f8ed4] dark:text-white' : 'dark:bg-[#6f8ed4] dark:text-white';
  const headingDarkClass = useNeutralDarkPalette ? 'dark:text-zinc-100' : 'dark:text-zinc-100';
  const bodyDarkClass = useNeutralDarkPalette ? 'dark:text-zinc-300' : 'dark:text-zinc-300';
  const startDarkClass = useNeutralDarkPalette ? 'dark:text-zinc-300' : 'dark:text-zinc-300';
  const cardDarkClass = useNeutralDarkPalette
    ? 'dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800'
    : 'dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800';
  const difficultyBadgeClassName = cn(difficultyBadgeBaseClassName, difficultyBadgeDarkClass);

  const href = `/quiz/${quiz.slug || quiz._id}`;

  const imageBlock = (
    <div className={cn('relative h-44 bg-[#dce5f3]', imageContainerDarkClass, isStackLayout && 'rounded-lg overflow-hidden')}>
      <Image
        src={displayImageUrl}
        alt={quiz.title}
        fill
        className="object-cover"
        sizes="(max-width: 1280px) 100vw, 33vw"
        onError={() => setImageFailedFor(resolvedImageUrl)}
      />

      <div className="absolute left-3 top-3 flex gap-2">
        <Badge variant="secondary" className={cn('bg-white/90 text-[#314869]', badgeDarkClass)}>
          {categoryLabel}
        </Badge>
        <Badge className={difficultyBadgeClassName}>{difficultyLabel}</Badge>
      </div>

      {quiz.isPremium && (
        <div className={cn('absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#6f8ed4] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm', premiumTagDarkClass)}>
          <Crown className="h-3.5 w-3.5" />
          Premium
        </div>
      )}

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
          <div className="flex items-center gap-1.5 text-white">
            <Lock className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white">Premium vereist</p>
          </div>
        </div>
      )}
    </div>
  );

  if (isStackLayout) {
    return (
      <Link href={href} className="block">
        <article className="group h-full transition-transform duration-200 hover:-translate-y-1">
          {imageBlock}

          <div className="pb-2 pt-3">
            <h3 className={cn('line-clamp-2 text-lg font-semibold text-[#1f2f4b]', headingDarkClass)}>{quiz.title}</h3>
            <p className={cn('mt-2 line-clamp-2 text-sm text-muted-foreground', bodyDarkClass)}>
              {quiz.description || 'Test je kennis met deze quiz.'}
            </p>

            <div className={cn('mt-4 flex items-center justify-between text-xs text-muted-foreground', bodyDarkClass)}>
              <span>{questionCount} vragen</span>
              <span className={cn('inline-flex items-center gap-1 font-medium text-[#355384]', startDarkClass)}>
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
      <Card className={cn('group h-full gap-0 overflow-hidden border-[#d7e1ee] bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg-[#f9fbff] hover:shadow-md', cardDarkClass, isLocked && 'bg-[#f2f5fb] dark:bg-zinc-900')}>
        {imageBlock}

        <CardContent className="p-4 pb-5">
          <h3 className={cn('line-clamp-2 text-lg font-semibold text-[#1f2f4b]', headingDarkClass)}>{quiz.title}</h3>
          <p className={cn('mt-2 line-clamp-2 text-sm text-muted-foreground', bodyDarkClass)}>
            {quiz.description || 'Test je kennis met deze quiz.'}
          </p>

          <div className={cn('mt-4 flex items-center justify-between text-xs text-muted-foreground', bodyDarkClass)}>
            <span>{questionCount} vragen</span>
            <span className={cn('inline-flex items-center gap-1 font-medium text-[#355384]', startDarkClass)}>
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
