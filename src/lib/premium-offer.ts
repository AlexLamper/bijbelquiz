/**
 * What the web Premium page offers, and the copy that depends on it.
 *
 * Pure and client-safe: the server page resolves prices and the trial length
 * and hands them to the plan picker, which only formats. The numbers mirror the
 * app (`bijbelquiz_mobile/lib/features/premium/...`): the same fallback prices,
 * the same "= x per maand" note, the same trial wording, so a player who sees
 * both never reads two different offers for the same account.
 */

import { readReturnPath } from './stripe-plans';

/** The three personal plans, in the order the page shows them. */
export const PREMIUM_PLAN_IDS = ['yearly', 'monthly', 'lifetime'] as const;

export type PremiumPlanId = (typeof PREMIUM_PLAN_IDS)[number];

const PLAN_SET = new Set<string>(PREMIUM_PLAN_IDS);

/** Coerce `?plan=` into a personal plan, defaulting to the yearly one. */
export function readPremiumPlan(value: unknown): PremiumPlanId {
  return typeof value === 'string' && PLAN_SET.has(value) ? (value as PremiumPlanId) : 'yearly';
}

/**
 * Prices quoted when neither the environment nor Stripe gives one. These are
 * the list prices `scripts/setup-stripe-products.mts` creates and the app's own
 * fallbacks (`premium_screen.dart`), so all three places agree.
 */
export const PREMIUM_PRICE_FALLBACKS: Readonly<Record<PremiumPlanId, string>> = {
  monthly: '€5,99',
  yearly: '€39,99',
  lifetime: '€74,99',
};

/** Environment variables that override the shown price (payments-health checks them). */
export const PREMIUM_PRICE_LABEL_ENV: Readonly<Record<PremiumPlanId, string>> = {
  monthly: 'NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL',
  yearly: 'NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_LABEL',
  lifetime: 'NEXT_PUBLIC_PREMIUM_LIFETIME_PRICE_LABEL',
};

export type PremiumPriceLabels = Record<PremiumPlanId, string>;

/**
 * Format a Stripe amount (in cents) the way the pricing copy writes euros:
 * "€39,99". Null for other currencies or a missing amount, so the caller falls
 * back instead of printing a number in the wrong currency.
 */
export function formatStripeAmount(unitAmount: number | null | undefined, currency: string | null | undefined): string | null {
  if (typeof unitAmount !== 'number' || !Number.isFinite(unitAmount) || unitAmount <= 0) return null;
  if ((currency || '').toLowerCase() !== 'eur') return null;

  return `€${(unitAmount / 100).toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Explicit configuration wins, then the live Stripe price, then the list price. */
export function pickPriceLabel(envLabel: string | null | undefined, stripeLabel: string | null | undefined, fallback: string): string {
  const configured = (envLabel || '').trim();
  if (configured) return configured;
  if (stripeLabel) return stripeLabel;
  return fallback;
}

/**
 * Day of the trial on which the player is reminded, counting the first day as
 * day 1: "Herinnering op dag 5" for a 7-day trial. Same rule as the app
 * (`trialReminderDay`): two days before the end, never on day 0.
 */
export const TRIAL_REMINDER_DAYS_BEFORE_END = 2;

export function trialReminderDay(trialDays: number): number | null {
  const day = trialDays - TRIAL_REMINDER_DAYS_BEFORE_END;
  return trialDays > 0 && day >= 1 ? day : null;
}

/** The date of `trialReminderDay`, given when the trial started. */
export function trialReminderDate(trialStart: Date, trialDays: number): Date | null {
  const day = trialReminderDay(trialDays);
  if (day === null) return null;
  return new Date(trialStart.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
}

/** "7 DAGEN GRATIS" badge text / "7 dagen gratis" in copy. */
export function trialDaysLabel(days: number): string {
  return `${days} ${days === 1 ? 'dag' : 'dagen'} gratis`;
}

/** Label of the main button for the chosen plan. */
export function premiumCtaLabel(plan: PremiumPlanId, trialDays: number): string {
  if (plan === 'yearly' && trialDays > 0) return `Probeer ${trialDaysLabel(trialDays)}`;
  if (plan === 'lifetime') return 'Koop levenslang Premium';
  return 'Start Premium';
}

/** The reassurance line under the button (with the shield). */
export function premiumReassurance(plan: PremiumPlanId, trialDays: number): string {
  if (plan === 'yearly' && trialDays > 0) {
    const day = trialReminderDay(trialDays);
    return day === null ? 'Vandaag betaal je niets.' : `Vandaag betaal je niets. Herinnering op dag ${day}.`;
  }
  if (plan === 'lifetime') return 'Eenmalig betalen, geen abonnement.';
  return 'Zeg op wanneer je wilt.';
}

/**
 * The query of `/premium`, read once on the server.
 *
 * `?vergrendeld=1&terug=<pad>` is the locked paywall a player hits on their
 * fourth new quiz (contract with the quiz player). `?next=` is the older name
 * for the way back, still sent by `premiumPaywallHref` and published app
 * builds; `terug` wins when both are present. Only same-site paths pass.
 */
export interface PremiumPageQuery {
  locked: boolean;
  /** Validated way back, or null when none was given. */
  returnPath: string | null;
  plan: PremiumPlanId;
  checkoutCancelled: boolean;
}

export function readPremiumPageQuery(params: Record<string, string | string[] | undefined>): PremiumPageQuery {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const rawReturn = first(params.terug) ?? first(params.next);
  const returnPath = rawReturn ? readReturnPath(rawReturn, '') || null : null;

  return {
    locked: first(params.vergrendeld) === '1',
    // A way back to the paywall itself would loop the player after paying.
    returnPath: returnPath && !/^\/premium(\/|\?|#|$)/.test(returnPath) ? returnPath : null,
    plan: readPremiumPlan(first(params.plan)),
    checkoutCancelled: first(params.checkout) === 'geannuleerd',
  };
}

/** `/premium` with the locked state and way back kept, e.g. for sign-in callbacks. */
export function premiumPageHref({ locked, returnPath, plan }: { locked?: boolean; returnPath?: string | null; plan?: PremiumPlanId }): string {
  const params = new URLSearchParams();
  if (locked) params.set('vergrendeld', '1');
  if (returnPath) params.set('terug', returnPath);
  if (plan && plan !== 'yearly') params.set('plan', plan);
  const query = params.toString();
  return query ? `/premium?${query}` : '/premium';
}
