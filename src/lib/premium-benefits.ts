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

function formatEuro(amount: number): string {
  return `€${amount.toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Average weeks in a month; the store convention for a per-week equivalent. */
const WEEKS_PER_MONTH = 4.345;

/**
 * Per-week equivalent of a price that covers `months` months.
 *
 * The week is the unit every plan is quoted in on top of its own billing
 * period, because it is the smallest honest comparison between three plans that
 * bill on three different rhythms - and the number a reader can weigh against
 * something they already buy weekly. Null when the label is not a plain number
 * (a localized store string), so the UI omits the claim rather than print a
 * wrong one.
 */
export function pricePerWeek(label: string, months: number): string | null {
  const amount = parsePriceLabel(label);
  if (amount === null || months <= 0) return null;
  return formatEuro(amount / (months * WEEKS_PER_MONTH));
}

/**
 * Format a per-week equivalent for a monthly price label like "€5,99".
 * Falls back to null when it cannot be parsed (e.g. localized text).
 */
export function formatPricePerWeek(monthlyLabel: string): string | null {
  return pricePerWeek(monthlyLabel, 1);
}

/** Per-week equivalent of a yearly price label, e.g. "€0,77". */
export function yearlyPricePerWeek(yearlyLabel: string): string | null {
  return pricePerWeek(yearlyLabel, 12);
}

/**
 * Per-week equivalent of a one-off lifetime price, amortised over the horizon a
 * buyer can reasonably be told about. Three years is deliberately conservative:
 * it undersells "levenslang" rather than making a promise about how long the
 * product will exist.
 */
export const LIFETIME_HORIZON_YEARS = 3;

export function lifetimePricePerWeek(lifetimeLabel: string): string | null {
  return pricePerWeek(lifetimeLabel, LIFETIME_HORIZON_YEARS * 12);
}

/**
 * Free trial length, in days, read from `STRIPE_TRIAL_DAYS`.
 *
 * Zero or unset means no trial, and every trial claim in the UI disappears with
 * it: promising a trial the checkout will not create is the fastest way to a
 * chargeback and a support thread.
 */
export function readTrialDays(raw: string | undefined | null): number {
  const parsed = Number.parseInt((raw || '').trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  // Stripe's own ceiling for a checkout trial.
  return Math.min(parsed, 730);
}

/** "14 dagen gratis" / "1 dag gratis". */
export function formatTrialLabel(days: number): string {
  return `${days} ${days === 1 ? 'dag' : 'dagen'} gratis`;
}

/**
 * Link to the paywall that carries both the trigger and the way back.
 *
 * Every wall in the product uses this, so a reader who upgrades always returns
 * to the thing they were stopped from doing instead of being dropped on a
 * generic confirmation page and left to navigate back by hand.
 */
export function premiumPaywallHref(trigger: string, next?: string | null): string {
  const params = new URLSearchParams({ reden: trigger });

  if (next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) {
    params.set('next', next);
  }

  return `/premium?${params.toString()}`;
}
