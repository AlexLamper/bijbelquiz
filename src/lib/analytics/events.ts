/**
 * The funnel event contract.
 *
 * One list, shared by the website, the Flutter app, and the reporting queries,
 * so a rename cannot quietly orphan half the data. The Dart port lives in
 * `lib/core/analytics/analytics_events.dart`; keep the names identical.
 *
 * Only events that answer a question worth acting on belong here. Page views
 * and taps are noise: what the funnel needs to know is who finishes a quiz,
 * who hosts, who sees a paywall, and who pays.
 */

export const ANALYTICS_EVENTS = [
  /** A quiz attempt was finished. `isFirst` separates activation from habit. */
  'quiz_completed',
  /** A host actually started a game. This is what spends a free credit. */
  'room_started',
  /** Somebody joined a room, and whether they arrived through a shared link. */
  'room_joined',
  /**
   * A host shared an invite. Paired with `room_joined`'s `viaInvite`, this is
   * how the only free acquisition channel this product has gets measured.
   */
  'room_invite_shared',
  /** A paywall became visible, with the trigger that produced it. */
  'paywall_shown',
  /** A paywall was closed without a purchase. */
  'paywall_dismissed',
  /** A purchase completed, with the plan and the trigger that led to it. */
  'purchase_completed',
  /** A free trial began. */
  'trial_started',
  /** A trial turned into a paid period. */
  'trial_converted',
  /** A streak ended, with how long it was and whether the user paid. */
  'streak_broken',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/**
 * Where a paywall was raised. Reporting slices conversion by this, so it is a
 * closed set rather than free text - "which of the six journey stages actually
 * carries the revenue" is unanswerable if every surface invents its own label.
 */
export const PAYWALL_TRIGGERS = [
  /** Host has no free games left and pressed start. */
  'host_quota_exhausted',
  /** Host is being warned before the wall, with games still left. */
  'host_quota_warning',
  /** Host hit the free player cap on a room. */
  'host_player_cap',
  /** A locked explanation was tapped after answering. */
  'explanation_locked',
  /** A premium-only quiz was opened. */
  'premium_quiz_locked',
  /** The user opened the premium page directly. */
  'direct',
] as const;

export type PaywallTrigger = (typeof PAYWALL_TRIGGERS)[number];

const TRIGGERS = new Set<string>(PAYWALL_TRIGGERS);

/** Coerce a query parameter into a known trigger, defaulting to a direct visit. */
export function readPaywallTrigger(value: unknown): PaywallTrigger {
  return typeof value === 'string' && TRIGGERS.has(value)
    ? (value as PaywallTrigger)
    : 'direct';
}

export const PURCHASE_PLANS = ['monthly', 'yearly', 'lifetime'] as const;
export type PurchasePlan = (typeof PURCHASE_PLANS)[number];

export type AnalyticsPlatform = 'web' | 'ios' | 'android';

export interface AnalyticsEventInput {
  name: AnalyticsEventName;
  /** Flat, primitive-only. Nested objects make the aggregation queries ugly. */
  props?: Record<string, string | number | boolean | null>;
  /** Client clock, ms since epoch. The server records its own time too. */
  occurredAt?: number;
}

const EVENT_NAMES = new Set<string>(ANALYTICS_EVENTS);

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === 'string' && EVENT_NAMES.has(value);
}

/** Property caps, applied server-side. A client bug must not fill the collection. */
export const MAX_EVENTS_PER_REQUEST = 25;
export const MAX_PROPS_PER_EVENT = 12;
export const MAX_PROP_VALUE_LENGTH = 120;

/**
 * Drop anything that is not a flat primitive, truncate long strings, and cap
 * the number of keys.
 */
export function sanitizeProps(raw: unknown): Record<string, string | number | boolean> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const out: Record<string, string | number | boolean> = {};
  let count = 0;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (count >= MAX_PROPS_PER_EVENT) break;
    if (value === null || value === undefined) continue;

    if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
    } else if (typeof value === 'boolean') {
      out[key] = value;
    } else if (typeof value === 'string') {
      out[key] = value.slice(0, MAX_PROP_VALUE_LENGTH);
    } else {
      continue;
    }

    count += 1;
  }

  return out;
}
