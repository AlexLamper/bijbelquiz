/**
 * The events the Stripe webhook endpoint must send, and the only ones
 * `src/lib/stripe-billing.ts` acts on. Shared with
 * `scripts/setup-stripe-products.mts` and docs/setup/betalingen-web.md, so the
 * endpoint in Stripe and the code never disagree.
 */
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
] as const;

export type StripeWebhookEventType = (typeof STRIPE_WEBHOOK_EVENTS)[number];

/** Path of the endpoint, after https://www.bijbelquiz.com. */
export const STRIPE_WEBHOOK_PATH = '/api/webhook/stripe';
