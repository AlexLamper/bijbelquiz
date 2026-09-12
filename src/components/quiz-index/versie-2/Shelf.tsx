'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * One compartment of the bookcase: a paper-sunken back wall, a hairline as the
 * shelf board, and the group label as eyebrow text on the shelf edge. On
 * phones the compartment is as wide as the page and its books scroll
 * sideways inside it; from `sm` up compartments sit next to each other and
 * wrap like shelves in a case.
 */
export function Shelf({
  label,
  meta,
  children,
  className,
  shelfRef,
}: {
  label: string;
  meta?: string;
  children: ReactNode;
  className?: string;
  shelfRef?: (element: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={shelfRef} className={cn('w-full min-w-0 sm:w-auto', className)}>
      <div className="w-full overflow-x-auto overscroll-x-contain">
        <div className="flex min-w-max items-end gap-1.5 border-b border-rule-strong bg-paper-sunken px-3 pb-0 pt-3 sm:gap-2 sm:px-3.5 sm:pt-4">
          {children}
        </div>
      </div>
      <p className="mt-2 flex items-baseline gap-2 pl-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        <span>{label}</span>
        {meta && <span className="text-[10px] tracking-[0.14em] tabular-nums">{meta}</span>}
      </p>
    </div>
  );
}
