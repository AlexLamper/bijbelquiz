'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Guarantees a newly opened page starts at the top.
 *
 * The router already tries to do this, but two things defeat it: the browser
 * restores the previous scroll offset on a reload, and a page whose content
 * streams in can grow under a scroll position that was set before the content
 * existed. Both leave the reader looking at the middle of a page they just
 * opened.
 *
 * Back and forward are deliberately left alone - returning to a long quiz list
 * and losing your place in it is worse than the problem this fixes - so a
 * `popstate` marks the next path change as history navigation and skips it.
 * An in-page anchor (`/hulp#betalingen`) is skipped for the same reason.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const isHistoryNavigation = useRef(false);

  useEffect(() => {
    const markHistoryNavigation = () => {
      isHistoryNavigation.current = true;
    };

    window.addEventListener('popstate', markHistoryNavigation);
    return () => window.removeEventListener('popstate', markHistoryNavigation);
  }, []);

  useEffect(() => {
    if (isHistoryNavigation.current) {
      isHistoryNavigation.current = false;
      return;
    }

    if (window.location.hash) return;

    // `instant` rather than `auto`: a page-level `scroll-behavior: smooth` must
    // not turn this into a visible animation.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
