import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Wordmark } from './Logo';
import { AdminNav } from './AdminNav';

/**
 * The beheer layout from P-Beheer: a 248px white sidebar (logo with a
 * "Beheer" chip, the section links, "Naar de website") and a main column
 * with 32/40px padding. Below 700px the sidebar becomes a top bar whose
 * links scroll sideways.
 *
 * Server component; only the nav (active state) is a client island.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink m:flex-row m:items-stretch">
      <aside className="shrink-0 border-b border-line bg-card m:w-[248px] m:border-b-0 m:border-r">
        <div className="flex flex-col gap-2.5 px-4 pt-3.5 m:sticky m:top-0 m:gap-[22px] m:px-4 m:pb-6 m:pt-5">
          <Link href="/beheer" aria-label="BijbelQuiz beheer" className="flex items-center gap-[7px] px-1 text-ink no-underline hover:text-ink">
            <Wordmark size={30} />
            <span className="ml-1 inline-flex h-[22px] items-center rounded-full bg-chip px-2 text-xs font-extrabold text-ink-soft">Beheer</span>
          </Link>
          <AdminNav />
          <div className="hidden border-t border-line-soft pt-3.5 m:block">
            <Link
              href="/dashboard"
              className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-bold text-ink-muted no-underline hover:bg-chip hover:text-ink"
            >
              <ArrowUpRight className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
              Naar de website
            </Link>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-10 pt-5 m:px-10 m:pb-16 m:pt-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5">{children}</div>
      </main>
    </div>
  );
}

/** Page header inside beheer: title 32/40, one-line description, actions right. */
export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}>
      <div className="min-w-0 flex-[1_1_420px]">
        <h1 className="m-0 text-[26px] leading-8 m:text-[32px] m:leading-10">{title}</h1>
        {description && <p className="mb-0 mt-1.5 max-w-[70ch] text-[15px] leading-[22px] font-semibold text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}
