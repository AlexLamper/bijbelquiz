import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/** "Quizzen > Johannes > Brood voor 5000 > Resultaat". The last item is the page. */
export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Kruimelpad" className={cn('flex flex-wrap items-center gap-1.5 text-sm font-bold', className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {item.href && !last ? (
              <Link href={item.href} className="no-underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current={last ? 'page' : undefined} className="text-ink-muted">
                {item.label}
              </span>
            )}
            {!last && <ChevronRight className="size-4 text-ink-faint" strokeWidth={2.2} aria-hidden="true" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
