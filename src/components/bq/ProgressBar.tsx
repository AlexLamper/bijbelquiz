import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Progress in three shapes from the designs:
 *
 * - `ProgressBar`      the 8-10px rounded bar (gold for XP to the next level,
 *                      lapis for a room's progress).
 * - `ProgressSegments` one segment per question, as above the quiz player.
 * - `ProgressRing`     the small conic ring on a "verder spelen" card and the
 *                      countdown timer.
 */
export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: 'gold' | 'lapis' | 'green' | 'coral';
  height?: 8 | 10;
  label?: string;
  className?: string;
}

const FILL = {
  gold: 'bg-gold',
  lapis: 'bg-lapis',
  green: 'bg-green',
  coral: 'bg-coral',
} as const;

function clamp(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function ProgressBar({ value, tone = 'gold', height = 8, label, className }: ProgressBarProps) {
  const pct = Math.round(clamp(value) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('w-full overflow-hidden rounded-full bg-line-soft', className)}
      style={{ height }}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-300', FILL[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export interface ProgressSegmentsProps {
  current: number;
  total: number;
  label?: string;
  height?: 6 | 8;
  className?: string;
}

/** One 8px segment per question; the first `current` are filled. */
export function ProgressSegments({ current, total, label, height = 8, className }: ProgressSegmentsProps) {
  const count = Math.max(1, total);
  return (
    <div
      role="progressbar"
      aria-label={label ?? `Vraag ${current} van ${total}`}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className={cn('grid min-w-0 flex-1', className)}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, gap: height === 8 ? 5 : 4 }}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn('rounded-full', index < current ? 'bg-lapis' : 'bg-track')}
          style={{ height, borderRadius: height / 2 }}
        />
      ))}
    </div>
  );
}

export interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  tone?: 'lapis' | 'gold' | 'green' | 'coral';
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Conic ring; `children` sit in the white centre (a number, a timer). */
export function ProgressRing({ value, size = 32, thickness = 4, tone = 'lapis', label, children, className }: ProgressRingProps) {
  const pct = clamp(value) * 100;
  const colour = { lapis: 'var(--lapis)', gold: 'var(--gold)', green: 'var(--green)', coral: 'var(--coral)' }[tone];
  return (
    <span
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? Math.round(pct) : undefined}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', className)}
      style={{ width: size, height: size, background: `conic-gradient(${colour} 0 ${pct}%, var(--track-soft) ${pct}% 100%)` }}
    >
      <span
        className="flex items-center justify-center rounded-full bg-card text-ink font-extrabold"
        style={{ width: size - thickness * 2, height: size - thickness * 2, fontSize: Math.max(12, Math.round(size * 0.32)) }}
      >
        {children}
      </span>
    </span>
  );
}
