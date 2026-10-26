import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { BoltIcon, BoltSolidIcon, FlameIcon } from './icons';

/**
 * Small rounded labels: the book chip on a quiz card ("Johannes"), the
 * uppercase kicker on a question ("JOHANNES 6"), "+15 XP", "3 op rij", the
 * streak and XP counters in the header. Accent colours only as small touches.
 */
export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'lapis' | 'gold' | 'coral' | 'green' | 'grey' | 'outline' | 'gold-solid';
  size?: 'sm' | 'md' | 'lg';
  /** Uppercase with letter spacing, like the question kicker. */
  kicker?: boolean;
  icon?: React.ReactNode;
  href?: string;
}

const TONE = {
  lapis: 'bg-lapis-tint text-lapis',
  gold: 'bg-gold-tint text-gold-text',
  coral: 'bg-coral-tint text-coral-text',
  green: 'bg-green-tint text-green-text',
  grey: 'bg-chip text-ink-soft',
  outline: 'bg-card border border-line text-ink',
  'gold-solid': 'bg-gold text-gold-ink',
} as const;

const SIZE = {
  sm: 'h-[22px] px-2 text-xs',
  md: 'h-7 px-2.5 text-xs',
  lg: 'h-8 px-3 text-[13px]',
} as const;

export function Pill({ tone = 'lapis', size = 'md', kicker, icon, href, className, children, ...props }: PillProps) {
  const classes = cn(
    'inline-flex items-center gap-1.5 rounded-full font-extrabold whitespace-nowrap no-underline',
    TONE[tone],
    SIZE[size],
    kicker && 'uppercase tracking-[0.04em]',
    href && 'hover:brightness-95',
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <span className={classes} {...props}>
      {icon}
      {children}
    </span>
  );
}

/** "+15 XP" in a gold pill. */
export function XpPill({ xp, size = 'md', className }: { xp: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <Pill tone={size === 'lg' ? 'gold-solid' : 'gold'} size={size} icon={<BoltSolidIcon size={14} />} className={className}>
      +{xp} XP
    </Pill>
  );
}

/** "3 op rij" in a coral pill. */
export function StreakPill({ count, className }: { count: number; className?: string }) {
  return (
    <Pill tone="coral" icon={<FlameIcon size={14} />} className={className}>
      {count} op rij
    </Pill>
  );
}

/**
 * The header counters: a 36px white pill with a flame (streak) or bolt (XP).
 * Formats numbers the Dutch way (1.240).
 */
export function StatPill({ kind, value, className, href }: { kind: 'streak' | 'xp'; value: number; className?: string; href?: string }) {
  const formatted = new Intl.NumberFormat('nl-NL').format(value);
  const label = kind === 'streak' ? `Reeks van ${formatted} dagen` : `${formatted} XP`;
  const classes = cn(
    'inline-flex h-9 items-center gap-[5px] rounded-full bg-card border border-line px-3 text-[15px] font-extrabold text-ink no-underline hover:text-ink hover:bg-chip',
    className,
  );
  const content = (
    <>
      {kind === 'streak' ? <FlameIcon size={16} className="text-coral" /> : <BoltIcon size={16} />}
      {formatted}
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <span aria-label={label} className={classes}>
      {content}
    </span>
  );
}
