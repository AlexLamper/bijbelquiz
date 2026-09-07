'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowRight, Check, Lock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PIGMENT_TEXT, type Pigment } from './index';
import { DEFAULT_QUIZ_IMAGE, normalizeQuizImagePath } from '@/lib/quiz-image';

export interface DashboardQuiz {
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
  /** Preferred over `questions?.length` when present - lets a list page send
   *  the count without shipping every question, answer and explanation. */
  questionCount?: number;
  progress?: {
    attempts: number;
    bestCorrectAnswers: number;
    lastCorrectAnswers: number;
    lastTotalQuestions: number;
  };
}

/** Difficulty carries a pigment: verdigris rises to lapis rises to vermilion. */
const DIFFICULTY: Record<string, { label: string; pigment: Pigment }> = {
  easy: { label: 'Makkelijk', pigment: 'verdigris' },
  beginner: { label: 'Makkelijk', pigment: 'verdigris' },
  medium: { label: 'Gemiddeld', pigment: 'neutral' },
  intermediate: { label: 'Gemiddeld', pigment: 'neutral' },
  hard: { label: 'Moeilijk', pigment: 'vermilion' },
  advanced: { label: 'Moeilijk', pigment: 'vermilion' },
};

const IMAGE_POOL = Array.from({ length: 10 }, (_, index) => `/images/quizzes/img${index + 1}.png`);

function fallbackImage(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return IMAGE_POOL[Math.abs(hash) % IMAGE_POOL.length];
}

/**
 * The tile used to accept only `img1..img10` and drop anything else back to the
 * hash-picked pool - which threw away the per-quiz covers. It now trusts any
 * name the shared sanitiser accepts, and keeps the pool only for a quiz that
 * still has no image at all.
 */
function resolveImage(imageUrl: string | undefined, fallback: string): string {
  const normalized = imageUrl?.trim();
  if (!normalized) return fallback;

  const resolved = normalizeQuizImagePath(normalized);
  const rejected =
    resolved === DEFAULT_QUIZ_IMAGE && normalized.toLowerCase() !== DEFAULT_QUIZ_IMAGE;
  return rejected ? fallback : resolved;
}

function categoryLabel(category: DashboardQuiz['categoryId']): string {
  return typeof category === 'object' && category?.title ? category.title : 'Algemeen';
}

/**
 * Editorial quiz plate: image above, caption below - a magazine figure rather than
 * a boxed card. No shadow, no overlay; the hairline and the type carry the weight.
 */
export function QuizTile({
  quiz,
  isPremiumUser,
  className,
}: {
  quiz: DashboardQuiz;
  isPremiumUser?: boolean;
  className?: string;
}) {
  const seed = quiz.slug || quiz._id || quiz.title;
  const fallback = useMemo(() => fallbackImage(seed), [seed]);
  const resolved = useMemo(() => resolveImage(quiz.imageUrl, fallback), [quiz.imageUrl, fallback]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = failedSrc === resolved ? fallback : resolved;

  const isLocked =
    typeof quiz.isLocked === 'boolean' ? quiz.isLocked : quiz.isPremium && isPremiumUser === false;
  const questionCount = quiz.questionCount ?? quiz.questions?.length ?? 0;
  const played = (quiz.progress?.attempts ?? 0) > 0;

  // "12/15" from the best attempt. Falls back to nothing rather than to a
  // half-known figure: an older progress row can lack the question total.
  const bestTotal = quiz.progress?.lastTotalQuestions || questionCount;
  const bestScoreLabel =
    played && bestTotal > 0 ? `${quiz.progress?.bestCorrectAnswers ?? 0}/${bestTotal}` : null;
  const difficulty = DIFFICULTY[quiz.difficulty?.toLowerCase()] ?? {
    label: quiz.difficulty,
    pigment: 'neutral' as Pigment,
  };

  return (
    <Link href={`/quiz/${quiz.slug || quiz._id}`} className={cn('group flex h-full flex-col', className)}>
      <div className="relative aspect-16/9 w-full overflow-hidden rounded-md bg-paper-sunken ring-1 ring-rule ring-inset">
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className={cn(
            'object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]',
            isLocked && 'opacity-60 saturate-50',
            // A quiz you finished recedes a little - enough to read as "done"
            // at a glance, nowhere near as far as a locked one, which must
            // still read as unavailable rather than merely completed.
            played && !isLocked && 'opacity-80 saturate-[0.7]'
          )}
          onError={() => setFailedSrc(resolved)}
        />

        {quiz.isPremium && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-sm bg-paper-raised/95 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-lapis backdrop-blur-sm">
            Premium
          </span>
        )}

        {/* A finished quiz says so at full strength, with the score. Somebody
            scanning a grid should never have to open a quiz to find out they
            already did it. */}
        {played && !isLocked && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-sm bg-positive px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-inverted">
            <Check className="h-3 w-3" strokeWidth={3} />
            {bestScoreLabel ?? 'Afgerond'}
          </span>
        )}

        {isLocked && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-sm bg-ink/85 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-inverted">
            <Lock className="h-3 w-3" />
            Vergrendeld
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
          {categoryLabel(quiz.categoryId)}
          <span className="mx-2 text-rule-strong">/</span>
          <span className={PIGMENT_TEXT[difficulty.pigment]}>{difficulty.label}</span>
        </p>

        <h3 className="mt-2 font-display text-lg font-normal leading-snug text-ink transition-colors group-hover:text-lapis-strong">
          {quiz.title}
        </h3>

        <p className="mt-2 line-clamp-2 pb-4 text-sm leading-relaxed text-ink-muted">
          {quiz.description || 'Test je kennis met deze quiz.'}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-rule pt-3.5 text-xs text-ink-muted">
          <span className="tabular-nums">
            {questionCount} {questionCount === 1 ? 'vraag' : 'vragen'}
            {played && bestScoreLabel ? (
              <>
                <span className="mx-2 text-rule-strong">/</span>
                <span className="text-positive">beste {bestScoreLabel}</span>
              </>
            ) : null}
          </span>

          <span className="inline-flex items-center gap-1.5 font-medium text-ink-soft transition-colors group-hover:text-ink">
            {isLocked ? 'Bekijk' : played ? 'Opnieuw spelen' : 'Start'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
