'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import ScrollToTop from '@/components/ScrollToTop';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

/**
 * Decides which chrome a route gets, from its pathname:
 *
 * - `full`      header + footer (every content page)
 * - `header`    header only: the quiz player, which ends in its own buttons
 * - `none`      nothing: play screens draw their own `PlayHeader`, and the
 *               beheer area has its own `AdminShell` layout.
 *
 * A new play route goes in `CHROMELESS`; everything else is `full` by
 * default, so a page cannot accidentally end up without navigation.
 */
export type ChromeMode = 'full' | 'header' | 'none';

const CHROMELESS: RegExp[] = [
  /^\/beheer(\/|$)/,
  /^\/dev(\/|$)/,
  /^\/duel\/[^/]+/, // invite landing
  /^\/duels\/[^/]+/, // playing a duel
  /^\/samen-spelen\/[^/]+\/spel(\/|$)/,
];

const HEADER_ONLY: RegExp[] = [
  /^\/quiz\/[^/]+\/?$/, // the player
];

export function chromeFor(pathname: string | null): ChromeMode {
  if (!pathname) return 'full';
  if (CHROMELESS.some((rule) => rule.test(pathname))) return 'none';
  if (HEADER_ONLY.some((rule) => rule.test(pathname))) return 'header';
  return 'full';
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = chromeFor(pathname);

  if (mode === 'none') {
    return (
      <>
        <ScrollToTop />
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <SiteHeader />
      <main id="inhoud" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
      {mode === 'full' && <SiteFooter />}
    </div>
  );
}
