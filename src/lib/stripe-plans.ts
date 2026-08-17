/**
 * The plan catalogue, shared by everything that touches a Stripe purchase.
 *
 * Checkout, the webhook and the post-payment page each used to carry their own
 * idea of what a plan is. That is how a yearly subscriber ended up flagged as a
 * lifetime buyer: one of the three only knew about `monthly` and `lifetime`, so
 * everything else fell through to the one-off. One table, read by all three.
 */

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
}

export const STRIPE_PLANS: Record<StripePlanId, StripePlanConfig> = {
  monthly: {
    mode: 'subscription',
    priceEnvKey: 'STRIPE_PRICE_MONTHLY',
    label: 'Premium maandelijks',
    months: 1,
    isLifetime: false,
    isGroup: false,
  },
  yearly: {
    mode: 'subscription',
    priceEnvKey: 'STRIPE_PRICE_YEARLY',
    label: 'Premium jaarlijks',
    months: 12,
    isLifetime: false,
    isGroup: false,
  },
  lifetime: {
    mode: 'payment',
    priceEnvKey: 'STRIPE_PRICE_LIFETIME',
    label: 'Premium levenslang',
    months: null,
    isLifetime: true,
    isGroup: false,
  },
  // One purchase covering a whole church, school class or youth club.
  group: {
    mode: 'subscription',
    priceEnvKey: 'STRIPE_PRICE_GROUP',
    label: 'Groepslicentie',
    months: 12,
    isLifetime: false,
    isGroup: true,
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
