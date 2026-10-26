import * as React from 'react';
import Link from 'next/link';
/* eslint-disable @next/next/no-img-element */

import { cn } from '@/lib/utils';
import { Pill } from './Pill';
import { ProgressRing } from './ProgressBar';
import { QuizScene } from './QuizScene';

/**
 * The quiz tile: cover (8px inset, radius 10, 16:9), a small uppercase
 * reference ("EXODUS 14"), the title in Fredoka and "10 vragen · 5 min".
 */
export interface QuizCardProps {
  href: string;
  title: string;
  /** "Exodus 14" - rendered uppercase. Hidden when empty. */
  reference?: string | null;
  questionCount?: number;
  /** Minutes to play; derived from the question count when omitted. */
  minutes?: number;
  /** Colour of the reference line. The dashboard uses lapis, the index muted. */
  kickerTone?: 'lapis' | 'gold' | 'green' | 'coral' | 'muted';
  /** A real cover image wins over the drawn scene. */
  imageUrl?: string | null;
  /** Seed for the fallback scene (the slug). */
  seed?: string;
  className?: string;
  /** Extra line under the meta, e.g. a best score. Kept small. */
  footer?: React.ReactNode;
}

const KICKER = {
  lapis: 'text-lapis',
  gold: 'text-gold-text',
  green: 'text-green-text',
  coral: 'text-coral-text',
  muted: 'text-ink-muted',
} as const;

export function estimateMinutes(questionCount: number): number {
  return Math.max(1, Math.round(questionCount / 2));
}

export function quizMeta(questionCount?: number, minutes?: number): string | null {
  if (!questionCount) return null;
  const mins = minutes ?? estimateMinutes(questionCount);
  return `${questionCount} ${questionCount === 1 ? 'vraag' : 'vragen'} · ${mins} min`;
}

export function QuizCard({
  href,
  title,
  reference,
  questionCount,
  minutes,
  kickerTone = 'lapis',
  imageUrl,
  seed,
  className,
  footer,
}: QuizCardProps) {
  const meta = quizMeta(questionCount, minutes);
  return (
    <Link
      href={href}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-line bg-card text-ink no-underline',
        'transition-colors hover:border-input-line hover:text-ink',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
        className,
      )}
    >
      <QuizCover title={title} imageUrl={imageUrl} seed={seed} />
      <span className="flex flex-col gap-[3px] px-4 pb-4 pt-3.5">
        {reference && <span className={cn('text-xs font-extrabold uppercase tracking-[0.04em]', KICKER[kickerTone])}>{reference}</span>}
        <span className="font-display text-lg font-semibold leading-[23px]">{title}</span>
        {meta && <span className="text-[13px] font-semibold text-ink-muted">{meta}</span>}
        {footer}
      </span>
    </Link>
  );
}

/** The 16:9 cover block on its own, for hero and detail pages. */
export function QuizCover({
  title,
  imageUrl,
  seed,
  className,
  inset = true,
}: {
  title: string;
  imageUrl?: string | null;
  seed?: string;
  className?: string;
  /** The 8px margin a tile gives its cover. */
  inset?: boolean;
}) {
  return (
    <span className={cn('block overflow-hidden rounded-[10px] aspect-video bg-lapis-tint', inset && 'mx-2 mt-2', className)}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="block size-full object-cover" loading="lazy" />
      ) : (
        <QuizScene title={title} seed={seed} />
      )}
    </span>
  );
}

/**
 * "Verder spelen": a half-played quiz with the book chip, a progress ring and
 * "Hoofdstuk 6 · 4/10".
 */
export interface ContinueCardProps {
  href: string;
  title: string;
  book: string;
  chapter?: number | null;
  answered: number;
  total: number;
  className?: string;
}

export function ContinueCard({ href, title, book, chapter, answered, total, className }: ContinueCardProps) {
  const detail = [chapter ? `Hoofdstuk ${chapter}` : null, `${answered}/${total}`].filter(Boolean).join(' · ');
  return (
    <Link
      href={href}
      className={cn(
        'flex min-w-0 flex-col gap-3.5 rounded-[16px] border border-line bg-card p-4 text-ink no-underline',
        'transition-colors hover:border-input-line hover:text-ink',
        className,
      )}
    >
      <span className="flex items-center justify-between">
        <Pill tone="lapis" size="md">
          {book}
        </Pill>
        <ProgressRing value={total ? answered / total : 0} size={32} label={`${answered} van ${total} vragen`} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="truncate font-display text-lg font-semibold leading-[22px]">{title}</span>
        <span className="text-[13px] font-bold text-lapis-text">{detail}</span>
      </span>
    </Link>
  );
}
