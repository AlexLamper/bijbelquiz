// Server only: imports the Stripe client with the secret key.
import stripe from '@/lib/stripe';
import { STRIPE_PLANS } from '@/lib/stripe-plans';
import {
  formatStripeAmount,
  pickPriceLabel,
  PREMIUM_PLAN_IDS,
  PREMIUM_PRICE_FALLBACKS,
  PREMIUM_PRICE_LABEL_ENV,
  type PremiumPlanId,
  type PremiumPriceLabels,
} from '@/lib/premium-offer';

/**
 * The prices the web Premium page quotes.
 *
 * Order: an explicit `NEXT_PUBLIC_PREMIUM_*_PRICE_LABEL`, then the amount of
 * the Stripe price checkout will actually charge, then the list price. The
 * Stripe lookup is cached for a while per process and never blocks the page
 * on a Stripe outage: any error simply falls through to the next source.
 */

const CACHE_MS = 10 * 60 * 1000;
const LOOKUP_TIMEOUT_MS = 2500;

let cache: { at: number; labels: Partial<Record<PremiumPlanId, string>> } | null = null;

function stripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || '';
  return key.startsWith('sk_') && !key.includes('dummy');
}

async function stripeLabel(plan: PremiumPlanId): Promise<string | null> {
  const priceId = process.env[STRIPE_PLANS[plan].priceEnvKey];
  if (!priceId) return null;

  const lookup = stripe.prices.retrieve(priceId).then((price) => formatStripeAmount(price.unit_amount, price.currency));
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), LOOKUP_TIMEOUT_MS));

  try {
    return await Promise.race([lookup, timeout]);
  } catch (error) {
    console.warn(`[premium-prices] Could not read Stripe price for ${plan}`, error);
    return null;
  }
}

async function stripeLabels(): Promise<Partial<Record<PremiumPlanId, string>>> {
  if (!stripeConfigured()) return {};
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.labels;

  const entries = await Promise.all(PREMIUM_PLAN_IDS.map(async (plan) => [plan, await stripeLabel(plan)] as const));
  const labels: Partial<Record<PremiumPlanId, string>> = {};
  for (const [plan, label] of entries) {
    if (label) labels[plan] = label;
  }

  cache = { at: Date.now(), labels };
  return labels;
}

export async function getPremiumPriceLabels(): Promise<PremiumPriceLabels> {
  const needsStripe = PREMIUM_PLAN_IDS.some((plan) => !(process.env[PREMIUM_PRICE_LABEL_ENV[plan]] || '').trim());
  const fromStripe = needsStripe ? await stripeLabels() : {};

  return {
    yearly: pickPriceLabel(process.env[PREMIUM_PRICE_LABEL_ENV.yearly], fromStripe.yearly, PREMIUM_PRICE_FALLBACKS.yearly),
    monthly: pickPriceLabel(process.env[PREMIUM_PRICE_LABEL_ENV.monthly], fromStripe.monthly, PREMIUM_PRICE_FALLBACKS.monthly),
    lifetime: pickPriceLabel(process.env[PREMIUM_PRICE_LABEL_ENV.lifetime], fromStripe.lifetime, PREMIUM_PRICE_FALLBACKS.lifetime),
  };
}

/**
 * Plans the site can sell right now: those with a Stripe price id. When none
 * is configured at all (a fresh or local setup) every plan is shown, so the
 * page still reads as designed; checkout then reports the missing price, and
 * `/beheer/betalingen` flags it.
 */
export function sellablePremiumPlans(): PremiumPlanId[] {
  const configured = PREMIUM_PLAN_IDS.filter((plan) => Boolean(process.env[STRIPE_PLANS[plan].priceEnvKey]));
  return configured.length > 0 ? configured : [...PREMIUM_PLAN_IDS];
}
