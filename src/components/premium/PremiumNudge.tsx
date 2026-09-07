'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Crown, X } from 'lucide-react';

import { trackEvent } from '@/components/GoogleAnalytics';
import { yearlyPricePerWeek } from '@/lib/premium-benefits';
import { cn } from '@/lib/utils';

/** Read once: `NEXT_PUBLIC_` values are inlined at build time. */
const perWeek = yearlyPricePerWeek(process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_LABEL || '€39,99');

/**
 * When the card is allowed to appear again.
 *
 * One key for both outcomes: closing it and ignoring it both push the date
 * forward, only by different amounts. An upsell that returns on every page view
 * costs more goodwill than it can possibly earn.
 */
const SILENT_UNTIL_KEY = 'bq:premium-nudge-silent-until';

/** Closed by hand: gone for a month. */
const DISMISS_DAYS = 30;

/** Seen and ignored: gone for a few days. */
const SEEN_DAYS = 3;

/** Once per browser session, whatever the dates say. */
const SESSION_KEY = 'bq:premium-nudge-shown';

/** Held back a moment so it arrives after the page, not on top of it. */
const APPEAR_AFTER_MS = 4000;

const DAY_MS = 24 * 60 * 60 * 1000;

function silenceFor(days: number): void {
  try {
    window.localStorage.setItem(SILENT_UNTIL_KEY, String(Date.now() + days * DAY_MS));
  } catch {
    // Private mode: the session guard below still stops a second showing.
  }
}

/**
 * The standing Premium offer on the dashboard, as a corner card.
 *
 * Rate limited on purpose: at most once per browser session, at most once every
 * three days if it is ignored, and a month of silence once it is closed. It
 * used to be a panel in the page body, where it competed with the reader's own
 * progress for the same column.
 */
export default function PremiumNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let silentUntil = 0;
    let shownThisSession = false;

    try {
      silentUntil = Number(window.localStorage.getItem(SILENT_UNTIL_KEY)) || 0;
      shownThisSession = window.sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // Storage disabled: fall through and show it once for this page.
    }

    if (shownThisSession || silentUntil > Date.now()) return;

    const timer = window.setTimeout(() => {
      setVisible(true);

      // Counted as seen the moment it appears, not when it is closed: walking
      // away from it is the most common answer, and it has to count as one.
      try {
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // Nothing to do.
      }
      silenceFor(SEEN_DAYS);
    }, APPEAR_AFTER_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    silenceFor(DISMISS_DAYS);
    trackEvent('premium_nudge_dismissed', { placement: 'dashboard' });
  };

  if (!visible) return null;

  return (
    <aside
      role="complementary"
      aria-label="Premium"
      className={cn(
        'fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-[19rem]',
        'rounded-lg border border-rule bg-paper-raised p-4 shadow-sm',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2'
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Sluiten"
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <p className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        <span aria-hidden className="h-px w-4 bg-lapis" />
        Premium
      </p>

      <p className="mt-2.5 pr-6 font-display text-base leading-snug text-ink">
        Onbeperkt samen spelen
      </p>

      <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
        Kamers tot 20 spelers en uitleg bij elke vraag
        {perWeek ? `, vanaf ${perWeek} per week.` : '.'}
      </p>

      <Link
        href="/premium"
        onClick={() => trackEvent('multiplayer_premium_cta_clicked', { placement: 'dashboard_nudge' })}
        className="mt-3.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-ink px-3 text-xs font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
      >
        <Crown className="h-3.5 w-3.5" />
        Bekijk Premium
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </aside>
  );
}
