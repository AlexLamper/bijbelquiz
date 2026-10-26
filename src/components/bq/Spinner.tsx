import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/** A lapis spinner with an accessible label; `block` centres it in a page. */
export function Spinner({ label = 'Laden', size = 24, block, className }: { label?: string; size?: number; block?: boolean; className?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center justify-center text-lapis', block && 'w-full py-16', className)}>
      <Loader2 className="animate-spin" style={{ width: size, height: size }} strokeWidth={2.4} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Grey placeholder block while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('block animate-pulse rounded-[10px] bg-chip', className)} />;
}
