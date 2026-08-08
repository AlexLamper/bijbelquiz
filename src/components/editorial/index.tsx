import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * "Ink & Paper" primitives - the editorial design language of the platform.
 *
 * The rules of the system:
 *   - structure comes from hairlines and whitespace, never from shadows;
 *   - one display serif for anything editorial, Inter for anything functional;
 *   - lapis is an accent, not a fill: a tick, a rule, a single word;
 *   - every surface is paper, every mark is ink.
 *
 * Colour follows the illuminated-manuscript pigments: lapis is the system accent,
 * and lapis / vermilion / verdigris / neutral classify. A pigment always means
 * something - a category, a difficulty, a result - and is never decoration.
 */

export type Pigment = 'lapis' | 'vermilion' | 'verdigris' | 'neutral';

export const PIGMENT_TEXT: Record<Pigment, string> = {
  lapis: 'text-lapis',
  vermilion: 'text-vermilion',
  verdigris: 'text-positive',
  neutral: 'text-ink-muted',
};

const PIGMENT_TICK: Record<Pigment, string> = {
  lapis: 'bg-lapis',
  vermilion: 'bg-vermilion',
  verdigris: 'bg-positive',
  neutral: 'bg-rule-strong',
};

export const PIGMENT_BORDER: Record<Pigment, string> = {
  lapis: 'border-lapis/35',
  vermilion: 'border-vermilion/35',
  verdigris: 'border-positive/35',
  neutral: 'border-rule',
};

export const PIGMENT_TINT: Record<Pigment, string> = {
  lapis: 'bg-lapis-tint',
  vermilion: 'bg-vermilion-tint',
  verdigris: 'bg-positive-tint',
  neutral: 'bg-paper-sunken',
};

/** Uppercase label preceded by a pigment tick - the signature mark of the system. */
export function Eyebrow({
  children,
  pigment = 'lapis',
  className,
}: {
  children: React.ReactNode;
  pigment?: Pigment;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted',
        className
      )}
    >
      <span aria-hidden className={cn('h-px w-6', PIGMENT_TICK[pigment])} />
      {children}
    </span>
  );
}

/** Section opener: eyebrow, serif title, optional right-aligned action, closing rule. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  action,
  pigment = 'lapis',
  className,
}: {
  eyebrow: string;
  title: string;
  lead?: React.ReactNode;
  action?: React.ReactNode;
  pigment?: Pigment;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-rule pb-3.5',
        className
      )}
    >
      <div className="min-w-0">
        <Eyebrow pigment={pigment}>{eyebrow}</Eyebrow>
        <h2 className="mt-2.5 font-display text-xl font-normal tracking-[-0.015em] text-ink sm:text-2xl">
          {title}
        </h2>
        {lead && (
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{lead}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Quiet text link with a nudging arrow. */
export function ArrowLink({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink',
        className
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}

const buttonBase =
  'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis disabled:pointer-events-none disabled:opacity-50';

/** Class strings, for when the control must be a <button> rather than a link. */
export const inkButtonClass = cn(buttonBase, 'bg-ink text-ink-inverted hover:bg-ink-soft');
export const quietButtonClass = cn(
  buttonBase,
  'border border-rule-strong bg-paper-raised text-ink hover:border-ink hover:bg-paper-sunken'
);

/** Primary action: solid ink. There is exactly one of these per screen region. */
export function InkButton({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(buttonBase, 'bg-ink text-ink-inverted hover:bg-ink-soft', className)}
    >
      {children}
    </Link>
  );
}

/** Secondary action: hairline outline on paper. */
export function QuietButton({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        buttonBase,
        'border border-rule-strong bg-paper-raised text-ink hover:border-ink hover:bg-paper-sunken',
        className
      )}
    >
      {children}
    </Link>
  );
}

/**
 * A single figure in the statistics rail. Deliberately understated: the quizzes are
 * the subject of this page, the numbers are supporting metadata.
 */
export function Figure({
  label,
  value,
  meta,
  progress,
  pigment = 'lapis',
}: {
  label: string;
  value: string | number;
  meta?: string;
  progress?: number;
  pigment?: Pigment;
}) {
  return (
    <div className="md:px-6 md:first:pl-0 md:last:pr-0">
      <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
        <span aria-hidden className={cn('h-px w-3.5', PIGMENT_TICK[pigment])} />
        {label}
      </span>

      <p className="mt-1.5 font-display text-[22px] font-normal leading-none tracking-[-0.015em] text-ink tabular-nums">
        {value}
      </p>

      {typeof progress === 'number' && (
        <div className="mt-2.5 h-px w-full max-w-32 bg-rule-strong">
          <div
            className={cn('h-px transition-[width] duration-700', PIGMENT_TICK[pigment])}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}

      {meta && <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">{meta}</p>}
    </div>
  );
}

/**
 * Page ground + measure. Every screen opens with this so the paper, the width and
 * the vertical rhythm are identical everywhere.
 *
 * `width`: `text` for reading pages (terms, help), `default` for most screens,
 * `wide` for dense grids and tables.
 */
export function PageShell({
  width = 'default',
  className,
  children,
}: {
  width?: 'text' | 'default' | 'wide';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <div
        className={cn(
          'mx-auto w-full px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-10',
          width === 'text' && 'max-w-[760px]',
          width === 'default' && 'max-w-[1180px]',
          width === 'wide' && 'max-w-[1420px]',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** The masthead that opens a page: eyebrow, serif title, lead, optional actions. */
export function PageMasthead({
  eyebrow,
  title,
  lead,
  actions,
  aside,
  pigment = 'lapis',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  pigment?: Pigment;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-rule pb-7', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        {eyebrow ? <Eyebrow pigment={pigment}>{eyebrow}</Eyebrow> : <span />}
        {aside}
      </div>

      <div className="mt-6 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <h1 className="font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
            {title}
          </h1>
          {lead && (
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">{lead}</p>
          )}
        </div>

        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/** Small uppercase pigment tag used for categories, states and difficulties. */
export function Tag({
  children,
  pigment,
  className,
}: {
  children: React.ReactNode;
  pigment?: Pigment;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em]',
        pigment
          ? `${PIGMENT_TEXT[pigment]} ${PIGMENT_BORDER[pigment]} ${PIGMENT_TINT[pigment]}`
          : 'border-rule bg-paper-sunken text-ink-muted',
        className
      )}
    >
      {children}
    </span>
  );
}

/** Dashed-rule empty state. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-rule-strong px-6 py-14 text-center',
        className
      )}
    >
      <p className="font-display text-lg text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

const PANEL_TONES = {
  /** Neutral paper panel. */
  plain: 'border-rule bg-paper-raised hover:border-rule-strong',
  /** Accent panel: a lapis hairline and a lapis word, never a coloured fill. */
  lapis: 'border-lapis/45 bg-paper-raised',
  /** Lapis-tinted panel - for the social / multiplayer surface. */
  tinted: 'border-lapis/30 bg-lapis-tint',
} as const;

/** Bordered paper panel used for the secondary content blocks. */
export function Panel({
  tone = 'plain',
  children,
  className,
}: {
  tone?: keyof typeof PANEL_TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg border p-5 transition-colors sm:p-6',
        PANEL_TONES[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
