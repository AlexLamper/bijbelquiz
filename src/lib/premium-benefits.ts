/**
 * Single source of truth for Premium messaging and multiplayer free/premium
 * limits. The copy reflects the trigger-matrix in `premium_revenue_strategy`:
 * multiplayer-led outcomes first, learning depth second, "no ads" only when
 * we actually ship ads (we currently don't, so it's omitted).
 */

/** Maximum players a free user may host in a single multiplayer room. */
export const MULTIPLAYER_FREE_MAX_PLAYERS = 4;

/** Maximum players a Premium host may invite. Mirrors the service-level cap. */
export const MULTIPLAYER_PREMIUM_MAX_PLAYERS = 20;

/** Free users may host one room ever; afterwards Premium is required. */
export const MULTIPLAYER_FREE_ROOM_QUOTA = 1;

/** Single-sentence outcome promise used at the top of every paywall surface. */
export const PREMIUM_HERO_OUTCOME =
  'Speel onbeperkt samen met familie en vrienden, en leer dieper bij elke vraag.';

/**
 * Three trigger-aligned bullets used on Premium cards, paywalls, and
 * marketing copy. Order matters: multiplayer first because that is where
 * the strongest paying intent lives.
 */
export const PREMIUM_TRIGGER_BULLETS: ReadonlyArray<string> = [
  `Onbeperkt rooms hosten en tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers samen spelen`,
  'Uitleg en bijbelverwijzing bij elke vraag, ook na de game',
  'Voortgangsinzichten per boek, streakbescherming en alle premium quizzen',
];

/** Compact list used where space is tight (sidebar, small banners). */
export const PREMIUM_COMPACT_BULLETS: ReadonlyArray<string> = [
  'Onbeperkt samen spelen',
  'Diepere uitleg bij elke vraag',
  'Alle premium quizzen en inzichten',
];

/**
 * Format a per-week equivalent for a monthly price label like "€5,99".
 * Falls back to the raw label when it cannot be parsed (e.g. localized text).
 */
export function formatPricePerWeek(monthlyLabel: string): string | null {
  const match = monthlyLabel.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const monthly = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(monthly) || monthly <= 0) return null;
  const perWeek = monthly / 4.33;
  const formatted = perWeek.toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `€${formatted}`;
}
