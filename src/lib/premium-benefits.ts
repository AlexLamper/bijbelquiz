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

/**
 * Free users may host this many games in total, ever. The point of the quota
 * is discovery, not a teaser: a host needs a few real games before they know
 * whether "samen spelen" is worth paying for. A credit is only spent when a
 * game actually starts, so creating a room and walking away costs nothing.
 */
export const MULTIPLAYER_FREE_ROOM_QUOTA = 5;

/**
 * After the discovery pack above is spent, a free host gets this many games
 * back at the start of every calendar month.
 *
 * A permanent dead end loses the account: a host who cannot host stops opening
 * the app at all. A monthly refill instead produces a recurring decision point
 * - one evening a month where they either upgrade or wait - which over a year
 * is worth considerably more than one hard stop.
 */
export const MULTIPLAYER_MONTHLY_FREE_ROOMS = 1;

/** "3 van de 5 gratis spellen over" - the counter shown on every host surface. */
export function formatFreeGamesRemaining(remaining: number): string {
  const safe = Math.max(0, remaining);
  return `${safe} van de ${MULTIPLAYER_FREE_ROOM_QUOTA} gratis spellen over`;
}

/**
 * Counter for a host who is past the discovery pack and now on the monthly
 * allowance. Says something different on purpose: "1 van de 5 over" would
 * misdescribe an allowance that comes back next month.
 */
export function formatMonthlyFreeGames(remaining: number): string {
  const safe = Math.max(0, remaining);
  if (safe === 0) return 'Je maandspel is gebruikt';
  return safe === 1
    ? 'Nog 1 gratis spel deze maand'
    : `Nog ${safe} gratis spellen deze maand`;
}

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
 * Read a price out of a label like "€5,99" or "EUR 39,99".
 * Returns null when the label is not a plain number (localized store text).
 */
export function parsePriceLabel(label: string): number | null {
  const match = label.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * What a yearly plan saves against paying monthly for twelve months, as a
 * whole percentage. Null when either label cannot be parsed, so the UI can
 * simply omit the claim rather than print a wrong one.
 */
export function yearlySavingsPercent(
  monthlyLabel: string,
  yearlyLabel: string,
): number | null {
  const monthly = parsePriceLabel(monthlyLabel);
  const yearly = parsePriceLabel(yearlyLabel);
  if (monthly === null || yearly === null) return null;

  const twelveMonths = monthly * 12;
  if (yearly >= twelveMonths) return null;

  return Math.round(((twelveMonths - yearly) / twelveMonths) * 100);
}

/** Monthly equivalent of a yearly price, e.g. "€3,33". */
export function monthlyEquivalentOfYearly(yearlyLabel: string): string | null {
  const yearly = parsePriceLabel(yearlyLabel);
  if (yearly === null) return null;

  const perMonth = yearly / 12;
  return `€${perMonth.toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
