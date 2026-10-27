/**
 * Choices for "Premium geven" and the Premium source labels. No server
 * imports, so the beheer forms can use them. See `premium-grants.ts`.
 */

export const GRANT_DURATIONS = ['7d', '1m', '3m', '1y', 'lifetime', 'custom'] as const;
export type GrantDuration = (typeof GRANT_DURATIONS)[number];

export const GRANT_DURATION_LABELS: Record<GrantDuration, string> = {
  '7d': '7 dagen',
  '1m': '1 maand',
  '3m': '3 maanden',
  '1y': '1 jaar',
  lifetime: 'Levenslang',
  custom: 'Tot een datum',
};

export const GRANT_NOTE_MAX = 300;
export const GRANT_MAX_YEARS_AHEAD = 10;

export function isGrantDuration(value: unknown): value is GrantDuration {
  return typeof value === 'string' && (GRANT_DURATIONS as readonly string[]).includes(value);
}

export type PremiumSource = 'lifetime' | 'stripe' | 'store' | 'group' | 'manual';
export const PREMIUM_SOURCES: readonly PremiumSource[] = ['lifetime', 'stripe', 'store', 'group', 'manual'];

export const PREMIUM_SOURCE_LABELS: Record<PremiumSource, string> = {
  lifetime: 'Levenslang',
  stripe: 'Website (Stripe)',
  store: 'App Store / Play',
  group: 'Groepslicentie',
  manual: 'Gegeven door beheer',
};
