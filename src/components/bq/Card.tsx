import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * The white content card: 1px line, radius 16. Content sits in white cards on
 * the #ECEAE4 canvas; nothing is tinted on the canvas itself.
 */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Inner padding. `none` for cards that lay out their own rows. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Renders as a Next link with the same look (hover lifts the border). */
  href?: string;
  /** A 4px coloured top edge, used for the answer feedback card. */
  accent?: 'green' | 'coral' | 'lapis' | 'gold';
  as?: 'div' | 'section' | 'article' | 'li';
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-[18px] m:p-5',
  lg: 'p-5 m:p-7',
} as const;

const ACCENT = {
  green: 'border-t-4 border-t-green',
  coral: 'border-t-4 border-t-coral-strong',
  lapis: 'border-t-4 border-t-lapis',
  gold: 'border-t-4 border-t-gold',
} as const;

export function Card({ padding = 'md', href, accent, as = 'div', className, children, ...props }: CardProps) {
  const classes = cn(
    'block min-w-0 bg-card border border-line rounded-[16px] text-ink',
    PADDING[padding],
    accent && ACCENT[accent],
    href && 'no-underline hover:text-ink hover:border-input-line transition-colors',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as Omit<React.ComponentProps<typeof Link>, 'href'>)}>
        {children}
      </Link>
    );
  }

  const Tag = as as 'div';
  return (
    <Tag className={classes} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
      {children}
    </Tag>
  );
}

/**
 * A row inside a `padding="none"` card, separated by the soft hairline:
 * settings rows, leaderboard rows, admin lists.
 */
export function CardRow({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 min-h-[76px] px-5 py-[14px] border-b border-line-soft last:border-b-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Card header with a title on the left and an action on the right. */
export function CardHeader({ title, action, className }: { title: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <h2 className="m-0 text-[20px] leading-[26px]">{title}</h2>
      {action}
    </div>
  );
}
