'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';

import { track } from '@/lib/analytics/client';
import { describeControl, describeElement, findControls } from '@/lib/analytics/controls';
import { normalizePath } from '@/lib/analytics/routes';
import type { DeviceClass } from '@/lib/analytics/events';

/**
 * Automatic usage instrumentation: page views, control impressions, clicks,
 * and the once-per-visit context event.
 *
 * Hand-placing these was tried and abandoned. The questions they answer -
 * "which pages does nobody open", "which buttons has nobody pressed" - are
 * precisely the ones where a missing call site produces the same data as a
 * genuinely unused feature, so partial coverage is worse than none. Sweeping
 * the DOM instead means a control is measured the moment it ships, without
 * anybody having to remember.
 *
 * Two deliberate exclusions:
 *
 *  - `/beheer` fires page views but no control events. The admin pages are
 *    used by one person, constantly, and their clicks would sit at the top of
 *    every "most used button" table and drown out the product itself.
 *  - Impressions are deduplicated per control per visit, not per page. The
 *    navigation appears on every screen; counting it once per visit is what
 *    makes "seen by 400 visits, pressed by 3" a comparable ratio.
 */

const SESSION_FLAG = 'bq_session_started';
const SEEN_KEY = 'bq_seen_controls';

/** A visit cannot report more impressions than this. Guards a runaway page. */
const MAX_SEEN_PER_SESSION = 150;

/** How long to wait after a DOM change before sweeping for new controls. */
const RESCAN_DELAY_MS = 700;

function deviceClass(width: number): DeviceClass {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/** Referrers are kept as a host, never a full URL: the path can be personal. */
function referrerHost(): string | null {
  if (typeof document === 'undefined' || !document.referrer) return null;
  try {
    const url = new URL(document.referrer);
    if (url.host === window.location.host) return null;
    return url.host;
  } catch {
    return null;
  }
}

function readSeen(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(SEEN_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function writeSeen(seen: Set<string>): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // Private mode. Impressions then repeat within the visit, which inflates
    // the denominator a little; not worth failing over.
  }
}

function isAdminPath(path: string): boolean {
  return path === '/beheer' || path.startsWith('/beheer/');
}

export default function AnalyticsTracker() {
  // `useSearchParams` opts its subtree into client rendering, so it is kept
  // behind a boundary rather than dragging every page along with it.
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resolvedTheme, theme } = useTheme();
  const { status } = useSession();

  const signedIn = status === 'authenticated';

  // NextAuth reports 'loading' on the first render of every page. Nothing may
  // be sent before it settles: the events would all claim to be signed out,
  // and anything keyed on `signedIn` would fire a second time when the real
  // answer arrived.
  const authReady = status !== 'loading';

  // Read inside listeners rather than closed over, so a session resolving does
  // not tear down and re-attach the click and impression observers.
  const signedInRef = useRef(signedIn);
  useEffect(() => {
    signedInRef.current = signedIn;
  }, [signedIn]);

  // ── Visit context, once per tab ────────────────────────────────────────
  const sessionSent = useRef(false);

  useEffect(() => {
    // `resolvedTheme` is undefined until next-themes has read storage. Sending
    // before then would file every visit under the default and make the
    // light/dark split meaningless.
    if (sessionSent.current || !resolvedTheme || !authReady) return;

    try {
      if (window.sessionStorage.getItem(SESSION_FLAG)) {
        sessionSent.current = true;
        return;
      }
      window.sessionStorage.setItem(SESSION_FLAG, '1');
    } catch {
      // Storage unavailable: one context event per page load rather than per
      // visit. Over-counting visits is better than losing the theme split.
    }

    sessionSent.current = true;

    track('session_start', {
      theme: resolvedTheme,
      // 'system' means the visitor never chose; the OS did. Worth separating
      // from someone who actively picked the same value.
      themeSetting: theme ?? 'unknown',
      device: deviceClass(window.innerWidth),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      entryPath: normalizePath(window.location.pathname).path,
      referrerHost: referrerHost(),
      utmSource: searchParams.get('utm_source'),
      utmMedium: searchParams.get('utm_medium'),
      utmCampaign: searchParams.get('utm_campaign'),
      language: navigator.language || null,
      signedIn,
    });
  }, [authReady, resolvedTheme, theme, searchParams, signedIn]);

  // ── Page views ─────────────────────────────────────────────────────────
  const viewIndex = useRef(0);
  const reportedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    // One view per arrival. Without this the effect fires again the moment the
    // session resolves and every page is counted twice.
    if (reportedPath.current === pathname) return;
    reportedPath.current = pathname;

    const { path, param } = normalizePath(pathname);
    viewIndex.current += 1;

    track('page_view', {
      path,
      param,
      signedIn,
      // First screen of the visit versus a click-through from inside it. The
      // difference is what makes a landing page's bounce readable.
      isEntry: viewIndex.current === 1,
      index: viewIndex.current,
    });
  }, [pathname, authReady, signedIn]);

  // ── Clicks and impressions ─────────────────────────────────────────────
  useEffect(() => {
    const { path } = normalizePath(pathname);
    if (isAdminPath(path)) return;

    const seen = readSeen();
    const observed = new WeakSet<Element>();

    const markSeen = (id: string) => {
      if (seen.has(id) || seen.size >= MAX_SEEN_PER_SESSION) return false;
      seen.add(id);
      writeSeen(seen);
      return true;
    };

    const onClick = (event: MouseEvent) => {
      const control = describeControl(event.target);
      if (!control) return;

      // A click is proof of an impression. Recording it here keeps the ratio
      // honest for controls pressed before the observer got to them.
      markSeen(control.id);

      track('ui_click', {
        id: control.id,
        label: control.label,
        kind: control.kind,
        href: control.href,
        path,
        signedIn: signedInRef.current,
      });
    };

    document.addEventListener('click', onClick, true);

    // Half visible is the threshold for "was actually offered to this person":
    // a control clipped to a sliver at the bottom of the viewport was not.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);

          const control = describeElement(entry.target);
          if (!control || !markSeen(control.id)) continue;

          track('ui_seen', {
            id: control.id,
            label: control.label,
            kind: control.kind,
            path,
          });
        }
      },
      { threshold: 0.5 }
    );

    const sweep = () => {
      for (const element of findControls()) {
        if (observed.has(element)) continue;
        observed.add(element);
        observer.observe(element);
      }
    };

    sweep();

    // Most of this app's controls arrive after the first paint - a quiz list
    // resolves, a panel unfolds - so a single sweep would miss them.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const mutations = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(sweep, RESCAN_DELAY_MS);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('click', onClick, true);
      observer.disconnect();
      mutations.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
