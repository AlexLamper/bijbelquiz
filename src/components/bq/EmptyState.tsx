import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * A quiet "nothing here yet" block inside a card: an icon in a tinted square,
 * a short title, one line of explanation and at most one action. No invented
 * numbers; when there is no data the element says so or is left out.
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'lapis' | 'gold' | 'coral' | 'green' | 'grey';
  /** Without the surrounding card, for use inside one. */
  bare?: boolean;
  className?: string;
}

const TONE = {
  lapis: 'bg-lapis-tint text-lapis',
  gold: 'bg-gold-tint text-gold-text',
  coral: 'bg-coral-tint text-coral-text',
  green: 'bg-green-tint text-green-text',
  grey: 'bg-chip text-ink-soft',
} as const;

export function EmptyState({ icon, title, description, action, tone = 'lapis', bare, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 px-6 py-10 text-center',
        !bare && 'rounded-[16px] border border-line bg-card',
        className,
      )}
    >
      {icon && (
        <span className={cn('flex size-12 items-center justify-center rounded-[12px] [&_svg]:size-6', TONE[tone])} aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="m-0 font-display text-xl font-semibold text-ink">{title}</p>
      {description && <p className="m-0 max-w-[44ch] text-[15px] leading-[22px] font-semibold text-ink-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
