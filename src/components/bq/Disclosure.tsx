import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Native `<details>` rows, as the FAQ on the landing page and the answer list
 * on the result page: no JavaScript, keyboard accessible, and the chevron
 * flips through `group-open:`.
 *
 * Wrap several in `<DisclosureList>` for the white card with hairlines.
 */
export interface DisclosureProps extends Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> {
  /** The row content left of the chevron. */
  summary: React.ReactNode;
  /** Something before the summary, like the green/coral check disc. */
  leading?: React.ReactNode;
  /** Something right before the chevron, hidden on phones. */
  trailing?: React.ReactNode;
  children: React.ReactNode;
  /** Indent of the body to line up with the summary text. */
  bodyClassName?: string;
}

export function Disclosure({ summary, leading, trailing, children, className, bodyClassName, ...props }: DisclosureProps) {
  return (
    <details className={cn('group border-b border-line-soft last:border-b-0', className)} {...props}>
      <summary className="flex cursor-pointer items-center gap-3.5 px-5 py-3.5 text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lapis">
        {leading}
        <span className="min-w-0 flex-1 text-base font-bold">{summary}</span>
        {trailing && <span className="hidden m:inline text-sm font-extrabold whitespace-nowrap">{trailing}</span>}
        <ChevronDown
          className="size-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </summary>
      <div className={cn('flex flex-col items-start gap-2.5 px-5 pb-[18px] text-[15px] leading-[22px] font-semibold text-ink-soft', bodyClassName)}>
        {children}
      </div>
    </details>
  );
}

export function DisclosureList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('overflow-hidden rounded-[16px] border border-line bg-card', className)} {...props}>
      {children}
    </div>
  );
}

/** The 28px green/coral disc with a check or cross, used before an answer. */
export function ResultDisc({ correct, size = 28 }: { correct: boolean; size?: 24 | 28 | 36 }) {
  return (
    <span
      aria-label={correct ? 'Goed' : 'Fout'}
      role="img"
      className={cn('flex shrink-0 items-center justify-center rounded-full text-white', correct ? 'bg-green' : 'bg-coral-strong')}
      style={{ width: size, height: size }}
    >
      {correct ? (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l5 5L19 7" />
        </svg>
      ) : (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )}
    </span>
  );
}
