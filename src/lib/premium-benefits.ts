/**
 * What is left of the paid product, and the numbers the pricing copy quotes.
 *
 * Multiplayer used to be the paywall: four players free, twenty paid, five
 * hosted games ever and then one a month. In a year that produced three hosts,
 * four games and no sales, while capping the only surface where BijbelQuiz
 * reaches more than one person at a time. Hosting is now free and uncapped, and
 * what remains for sale is the group licence, which is bought by an
 * organisation rather than by a player who hit a wall.
 */

/**
 * Players in one room. A capacity limit, not a price tier: the service holds a
 * room's state in memory and broadcasts every answer to every participant.
 */
export const MULTIPLAYER_MAX_PLAYERS = 20;

/**
 * Games hosted before an account counts as "kept hosting" in the funnel report.
 *
 * This was the free allowance; it is now only a reporting milestone, so the
 * host funnel keeps comparing against the same number it always did and the
 * historical rows stay meaningful.
 */
export const MULTIPLAYER_FREE_ROOM_QUOTA = 5;

/**
 * What an existing member still has.
 *
 * Only shown to somebody who already pays - there is no offer page any more -
 * so this describes the licence rather than selling it. Everything the old
 * bullets promised (unlimited hosting, explanations, the premium collection) is
 * now free for everyone, which is exactly what this says.
 */
export const PREMIUM_TRIGGER_BULLETS: ReadonlyArray<string> = [
  'Alle quizzen, uitleg en bijbelverwijzingen - inmiddels gratis voor iedereen',
  `Samen spelen met groepen tot ${MULTIPLAYER_MAX_PLAYERS} spelers, zonder limiet op het aantal spellen`,
  'Je licentie loopt gewoon door; opzeggen kan op elk moment via Instellingen',
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
