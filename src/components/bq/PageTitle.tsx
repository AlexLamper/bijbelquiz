import * as React from 'react';
import { ArrowLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { IconButton } from './Button';

/**
 * Page heading: Fredoka 40/48 (30/36 on phones) with an optional subtitle,
 * a round back button on the left and actions on the right.
 */
export interface PageTitleProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** A round "terug" button linking here. */
  backHref?: string;
  backLabel?: string;
  /** Buttons rendered to the right (they stack under the title on phones). */
  actions?: React.ReactNode;
  /** Smaller heading for sub pages (32/40). */
  size?: 'lg' | 'md';
  className?: string;
  id?: string;
}

export function PageTitle({ title, subtitle, backHref, backLabel = 'Terug', actions, size = 'lg', className, id }: PageTitleProps) {
  return (
    <div className={cn('flex flex-col m:flex-row m:items-end m:justify-between gap-4 m:gap-6', className)}>
      <div className="flex items-start gap-4 min-w-0">
        {backHref && (
          <IconButton href={backHref} aria-label={backLabel} size="lg" className="mt-0.5">
            <ArrowLeft className="size-5" strokeWidth={2.2} />
          </IconButton>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <h1
            id={id}
            className={cn(
              'm-0',
              size === 'lg' ? 'text-[30px] leading-9 m:text-[40px] m:leading-[48px]' : 'text-[26px] leading-8 m:text-[32px] m:leading-10',
            )}
          >
            {title}
          </h1>
          {subtitle && <p className="m-0 max-w-[70ch] text-[17px] leading-[26px] font-semibold text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

/** Section heading (Fredoka 26/32) with an optional link on the right. */
export function SectionTitle({
  title,
  action,
  as: Tag = 'h2',
  size = 'lg',
  className,
  id,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  as?: 'h2' | 'h3';
  size?: 'lg' | 'md';
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <Tag id={id} className={cn('m-0', size === 'lg' ? 'text-[26px] leading-8' : 'text-[20px] leading-[26px]')}>
        {title}
      </Tag>
      {action && <span className="text-[15px] font-extrabold [&_a]:no-underline whitespace-nowrap">{action}</span>}
    </div>
  );
}
