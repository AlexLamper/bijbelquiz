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
  /**
   * The reader has finished this quiz: the card turns green, the cover dims
   * under a check, and the meta line says "Gespeeld" with the best score.
   * Pass the best result (`{ correct, total }`), or `true` when it is unknown.
   */
  played?: QuizCardPlayed | boolean | null;
}

export interface QuizCardPlayed {
  correct: number;
  total: number;
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

function CheckGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
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
  played,
}: QuizCardProps) {
  const meta = quizMeta(questionCount, minutes);
  const done = Boolean(played);
  const score = played && typeof played === 'object' && played.total > 0 ? `${played.correct}/${played.total} goed` : null;
  return (
    <Link
      href={href}
      aria-label={done ? `${title}, gespeeld${score ? `, ${score}` : ''}` : undefined}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-[16px] border text-ink no-underline',
        'transition-colors hover:text-ink',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
        done ? 'border-green/35 bg-green-tint hover:border-green/60' : 'border-line bg-card hover:border-input-line',
        className,
      )}
    >
      <span className="relative mx-2 mt-2 block">
        <QuizCover title={title} imageUrl={imageUrl} seed={seed} inset={false} className={cn(done && 'opacity-55 saturate-[0.35]')} />
        {done && (
          // Played: the cover steps back under a green wash with a check, so a
          // finished chapter reads as finished from across the grid.
          <span className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-green/20">
            <span className="flex size-11 items-center justify-center rounded-full bg-green text-white shadow-[0_2px_0_var(--green-edge)] max-m:size-9">
              <CheckGlyph size={22} />
            </span>
            <span className="absolute left-2 top-2 rounded-full bg-card px-2 py-[3px] text-[11px] font-extrabold uppercase tracking-[0.04em] text-green-text">
              Gespeeld
            </span>
          </span>
        )}
      </span>
      <span className="flex flex-col gap-[3px] px-4 pb-4 pt-3.5">
        {reference && <span className={cn('text-xs font-extrabold uppercase tracking-[0.04em]', done ? 'text-green-text' : KICKER[kickerTone])}>{reference}</span>}
        <span className={cn('font-display text-lg font-semibold leading-[23px]', done && 'text-ink-soft')}>{title}</span>
        {done ? (
          <span className="flex items-center gap-1 text-[13px] font-extrabold text-green-text">
            <CheckGlyph size={14} />
            {score ? `Gespeeld · ${score}` : 'Gespeeld'}
          </span>
        ) : (
          meta && <span className="text-[13px] font-semibold text-ink-muted">{meta}</span>
        )}
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
