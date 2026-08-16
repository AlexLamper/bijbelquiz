'use client';

import { trackEvent as trackGoogleEvent } from '@/components/GoogleAnalytics';
import type { AnalyticsEventName, AnalyticsEventInput } from './events';

/**
 * Browser-side funnel client.
 *
 * Events go two places: to `/api/events`, which is the copy the reporting
 * queries read, and to GA4, which is already wired and useful for ad-hoc
 * exploration. The first-party copy is the authoritative one - GA4 cannot join
 * an event to a user document, which is what every question in the revenue
 * plan needs.
 *
 * Batched with a short debounce so a burst (paywall shown, then dismissed)
 * costs one request, and flushed on `pagehide` so the last event before a
 * navigation away is not lost.
 */

const ENDPOINT = '/api/events';
const FLUSH_DELAY_MS = 2000;
const ANON_KEY = 'bq_anon_id';

let queue: AnalyticsEventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAttached = false;

/**
 * Stable id per browser, so a funnel that starts before sign-in still connects
 * to the account that appears later. Not a fingerprint: it is random, stored
 * locally, and cleared whenever the user clears site data.
 */
function anonymousId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const existing = window.localStorage.getItem(ANON_KEY);
    if (existing) return existing;

    const created =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(ANON_KEY, created);
    return created;
  } catch {
    // Private mode, or storage disabled. Events still land, just unstitched.
    return null;
  }
}

function send(events: AnalyticsEventInput[]): void {
  if (events.length === 0) return;

  const payload = JSON.stringify({
    events,
    anonymousId: anonymousId(),
    platform: 'web',
  });

  // `sendBeacon` survives the page going away, which is exactly when the most
  // interesting event (a dismissed paywall) fires.
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics is never worth surfacing or retrying.
  });
}

export function flushAnalytics(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const pending = queue;
  queue = [];
  send(pending);
}

function attachListeners(): void {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  // `pagehide` rather than `unload`: it fires on the mobile Safari path where
  // `unload` does not, and it covers back/forward cache.
  window.addEventListener('pagehide', flushAnalytics);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAnalytics();
  });
}

/** Queue one funnel event. Safe to call during render or in an effect. */
export function track(
  name: AnalyticsEventName,
  props?: Record<string, string | number | boolean | null>,
): void {
  if (typeof window === 'undefined') return;

  attachListeners();
  queue.push({ name, props, occurredAt: Date.now() });
  trackGoogleEvent(name, sanitizeForGa(props));

  if (!flushTimer) {
    flushTimer = setTimeout(flushAnalytics, FLUSH_DELAY_MS);
  }
}

/** GA4 rejects nulls, so they are dropped rather than sent as "null". */
function sanitizeForGa(
  props?: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;

  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}
