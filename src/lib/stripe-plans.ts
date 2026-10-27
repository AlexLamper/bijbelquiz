/**
 * The plan catalogue, shared by everything that touches a Stripe purchase.
 *
 * Checkout, the webhook and the post-payment page each used to carry their own
 * idea of what a plan is. That is how a yearly subscriber ended up flagged as a
 * lifetime buyer: one of the three only knew about `monthly` and `lifetime`, so
 * everything else fell through to the one-off. One table, read by all three.
 */

import { readTrialDays } from './premium-benefits';

export const STRIPE_PLAN_IDS = ['monthly', 'yearly', 'lifetime', 'group'] as const;

export type StripePlanId = (typeof STRIPE_PLAN_IDS)[number];

export interface StripePlanConfig {
  /** Stripe checkout mode. */
  mode: 'payment' | 'subscription';
  /** Environment variable holding the Stripe price id. */
  priceEnvKey: string;
  /** Dutch label, used in confirmations and receipts. */
  label: string;
  /** Months covered by one payment; null for a one-off. */
  months: number | null;
  /** Whether this plan grants permanent access. */
  isLifetime: boolean;
  /** A group licence grants access to members, not a personal subscription. */
  isGroup: boolean;
  /**
   * Whether checkout opens this plan with the free trial. Only the yearly plan
   * has one (the decision for web 2.0, same as the app): monthly starts paying
   * straight away, and a one-off payment has nothing to trial.
   */
  offersTrial: boolean;
}

export const STRIPE_PLANS: Record<StripePlanId, StripePlanConfig> = {
  monthly: {
    mode: 'subscription',
    priceEnvKey: 'STRIPE_PRICE_MONTHLY',
    label: 'Premium maandelijks',
    months: 1,
    isLifetime: false,
    isGroup: false,
    offersTrial: false,
  },
  yearly: {
    mode: 'subscription',
    priceEnvKey: 'STRIPE_PRICE_YEARLY',
    label: 'Premium jaarlijks',
    months: 12,
    isLifetime: false,
    isGroup: false,
    offersTrial: true,
  },
  lifetime: {
    mode: 'payment',
    priceEnvKey: 'STRIPE_PRICE_LIFETIME',
    label: 'Premium levenslang',
    months: null,
    isLifetime: true,
    isGroup: false,
    offersTrial: false,
  },
  // One purchase covering a whole church, school class or youth club.
  group: {
    mode: 'subscription',
    priceEnvKey: 'STRIPE_PRICE_GROUP',
    label: 'Groepslicentie',
    months: 12,
    isLifetime: false,
    isGroup: true,
    offersTrial: false,
  },
};

const PLAN_IDS = new Set<string>(STRIPE_PLAN_IDS);

/**
 * Coerce a plan value from a form field or Stripe metadata.
 *
 * Unknown values fall back to `lifetime`, the one-off payment: treating an
 * unrecognised value as a subscription would start a recurring charge nobody
 * asked for, and would leave the account waiting for a renewal event that never
 * arrives.
 */
export function readStripePlan(value: unknown): StripePlanId {
  return typeof value === 'string' && PLAN_IDS.has(value) ? (value as StripePlanId) : 'lifetime';
}

/** True when the plan is billed on a recurring basis. */
export function isSubscriptionPlan(plan: StripePlanId): boolean {
  return STRIPE_PLANS[plan].mode === 'subscription';
}

/**
 * Free trial days for a checkout of this plan.
 *
 * The length comes from `STRIPE_TRIAL_DAYS` (see `readTrialDays`: unset or 0
 * means no trial anywhere), but only plans that offer a trial get it. That
 * used to apply to every subscription, so a monthly buyer got the yearly
 * plan's free week too.
 */
export function trialDaysForPlan(plan: StripePlanId, raw: string | undefined | null): number {
  return STRIPE_PLANS[plan].offersTrial ? readTrialDays(raw) : 0;
}

/** True when this plan grants permanent, non-expiring access. */
export function isLifetimePlan(plan: StripePlanId): boolean {
  return STRIPE_PLANS[plan].isLifetime;
}

/**
 * Where to send the buyer after checkout.
 *
 * Only same-site paths are accepted, and only ones that start with a single
 * slash: an absolute URL here would turn the payment confirmation into an open
 * redirect. Everything else falls back to the quiz overview.
 */
export function readReturnPath(value: unknown, fallback = '/quizzen'): string {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  // A backslash is normalised to a slash by some browsers, so `/\evil.com`
  // would escape the site.
  if (trimmed.includes('\\')) return fallback;
  if (trimmed.length > 512) return fallback;

  return trimmed;
}

/**
 * Which plan a Stripe price belongs to, for subscription and invoice events.
 *
 * The price id decides first: after a switch in the billing portal (monthly to
 * yearly) the subscription keeps the metadata of the original checkout, so
 * `metadata.plan` alone would keep calling a yearly subscriber monthly. Then
 * the metadata, then the recurrence of the price. Null when nothing fits.
 */
export function planForStripePrice(
  input: {
    priceId?: string | null;
    interval?: string | null;
    metadataPlan?: string | null;
  },
  env: Record<string, string | undefined> = process.env,
): StripePlanId | null {
  if (input.priceId) {
    for (const plan of STRIPE_PLAN_IDS) {
      const configured = env[STRIPE_PLANS[plan].priceEnvKey];
      if (configured && configured === input.priceId) return plan;
    }
  }

  if (typeof input.metadataPlan === 'string' && PLAN_IDS.has(input.metadataPlan)) {
    const fromMetadata = input.metadataPlan as StripePlanId;
    // A group licence is never switched to a personal plan; for the personal
    // plans the recurrence of the actual price wins over stale metadata.
    if (fromMetadata === 'group' || !input.interval) return fromMetadata;
  }

  if (input.interval === 'year') return 'yearly';
  if (input.interval === 'month') return 'monthly';
  if (typeof input.metadataPlan === 'string' && PLAN_IDS.has(input.metadataPlan)) {
    return input.metadataPlan as StripePlanId;
  }
  return null;
}
