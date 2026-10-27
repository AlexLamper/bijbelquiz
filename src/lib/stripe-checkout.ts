import type Stripe from 'stripe';

import { premiumPageHref } from './premium-offer';
import { STRIPE_PLANS, type StripePlanId } from './stripe-plans';

/**
 * The parameters of a Stripe Checkout session, per plan. Pure, so every rule
 * is unit tested (tests/stripe-checkout.test.ts); the route only adds the
 * session, the database and the Stripe call.
 *
 * - The account's Stripe customer is reused, so one person has one customer
 *   in Stripe (portal, invoices, the next purchase). Without one yet, checkout
 *   gets the e-mail address and creates it.
 * - `userId` and `plan` travel in the metadata of the session, of the
 *   subscription (renewal webhooks never see the session) and of the payment
 *   intent of a one-off (so a refund or chargeback finds the account).
 * - Only the yearly plan opens with a free trial.
 */

export interface CheckoutSessionInput {
  plan: StripePlanId;
  priceId: string;
  userId: string;
  email: string;
  /** The account's Stripe customer, when it has one. */
  customerId?: string | null;
  /** Site origin, e.g. https://www.bijbelquiz.com (no trailing slash). */
  origin: string;
  /** Validated same-site path to continue at after paying. */
  returnPath: string;
  /** Came from the locked paywall: an abandoned checkout returns there. */
  locked: boolean;
  /** Days of free trial for this plan (from `trialDaysForPlan`). */
  trialDays: number;
}

export function buildCheckoutSessionParams(input: CheckoutSessionInput): Stripe.Checkout.SessionCreateParams {
  const config = STRIPE_PLANS[input.plan];
  const metadata = { userId: input.userId, plan: input.plan, returnPath: input.returnPath };

  // Built by hand rather than through `URL`: Stripe's placeholder has to reach
  // it as literal braces, and `searchParams` would percent-encode them.
  const successUrl =
    `${input.origin}/premium/succes?session_id={CHECKOUT_SESSION_ID}` + `&next=${encodeURIComponent(input.returnPath)}`;

  const cancelBase = config.isGroup
    ? '/groepslicentie'
    : premiumPageHref({
        locked: input.locked,
        returnPath: input.locked ? input.returnPath : null,
        plan: input.plan === 'group' ? undefined : input.plan,
      });
  const cancelUrl = `${input.origin}${cancelBase}${cancelBase.includes('?') ? '&' : '?'}checkout=geannuleerd`;

  const trialDays = config.offersTrial ? Math.max(0, Math.floor(input.trialDays)) : 0;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: config.mode,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: input.userId,
    locale: 'nl',
    allow_promotion_codes: true,
    metadata,
  };

  if (input.customerId) {
    params.customer = input.customerId;
  } else {
    params.customer_email = input.email;
    // A subscription always creates a customer; a one-off only when asked.
    if (config.mode === 'payment') params.customer_creation = 'always';
  }

  if (config.mode === 'subscription') {
    params.subscription_data = {
      metadata,
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
    };
  } else {
    params.payment_intent_data = { metadata: { userId: input.userId, plan: input.plan } };
  }

  return params;
}

/**
 * The origin to send Stripe back to. The browser's `Origin` is used only when
 * it is this site (the request's own origin or NEXTAUTH_URL); otherwise the
 * configured site URL. Keeps preview deployments and localhost working
 * without letting a forged header choose where a buyer lands.
 */
export function resolveCheckoutOrigin(input: {
  originHeader: string | null;
  requestOrigin: string;
  configuredUrl?: string | null;
}): string {
  const configured = (() => {
    try {
      return input.configuredUrl ? new URL(input.configuredUrl).origin : null;
    } catch {
      return null;
    }
  })();

  const allowed = new Set([input.requestOrigin, configured].filter(Boolean) as string[]);
  if (input.originHeader && allowed.has(input.originHeader)) return input.originHeader;
  return configured ?? input.requestOrigin;
}
