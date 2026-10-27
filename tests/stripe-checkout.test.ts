import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getPremiumSnapshot, isManualPremium, subscriptionStatusGrantsPremium } from '@/lib/premium-state';
import { buildCheckoutSessionParams, resolveCheckoutOrigin, type CheckoutSessionInput } from '@/lib/stripe-checkout';
import { planForStripePrice, STRIPE_PLAN_IDS } from '@/lib/stripe-plans';
import { premiumReassurance } from '@/lib/premium-offer';
import { buildTrialReminderMail } from '@/lib/trial-reminder';
import { STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe-billing';

const base: CheckoutSessionInput = {
  plan: 'yearly',
  priceId: 'price_yearly',
  userId: '64b7f0c2a1b2c3d4e5f60718',
  email: 'koper@voorbeeld.nl',
  customerId: null,
  origin: 'https://www.bijbelquiz.com',
  returnPath: '/quiz/abc',
  locked: false,
  trialDays: 7,
};

test('yearly: subscription with the 7-day trial and the user and plan in every metadata', () => {
  const params = buildCheckoutSessionParams(base);
  assert.equal(params.mode, 'subscription');
  assert.deepEqual(params.line_items, [{ price: 'price_yearly', quantity: 1 }]);
  assert.equal(params.subscription_data?.trial_period_days, 7);
  assert.deepEqual(params.metadata, { userId: base.userId, plan: 'yearly', returnPath: '/quiz/abc' });
  assert.deepEqual(params.subscription_data?.metadata, params.metadata);
  assert.equal(params.client_reference_id, base.userId);
  assert.equal(params.payment_intent_data, undefined);
  assert.equal(params.locale, 'nl');
});

test('monthly: no trial, even when a trial length is passed', () => {
  const params = buildCheckoutSessionParams({ ...base, plan: 'monthly', priceId: 'price_monthly' });
  assert.equal(params.mode, 'subscription');
  assert.equal(params.subscription_data?.trial_period_days, undefined);
  assert.equal(params.subscription_data?.metadata?.plan, 'monthly');
});

test('yearly without a configured trial: no trial', () => {
  const params = buildCheckoutSessionParams({ ...base, trialDays: 0 });
  assert.equal(params.subscription_data?.trial_period_days, undefined);
});

test('lifetime: one-off payment, metadata on the payment intent for refunds and disputes, customer created', () => {
  const params = buildCheckoutSessionParams({ ...base, plan: 'lifetime', priceId: 'price_lifetime' });
  assert.equal(params.mode, 'payment');
  assert.equal(params.subscription_data, undefined);
  assert.deepEqual(params.payment_intent_data?.metadata, { userId: base.userId, plan: 'lifetime' });
  assert.equal(params.customer_email, base.email);
  assert.equal(params.customer_creation, 'always');
});

test('group: subscription without trial, cancel returns to the group page', () => {
  const params = buildCheckoutSessionParams({ ...base, plan: 'group', priceId: 'price_group' });
  assert.equal(params.mode, 'subscription');
  assert.equal(params.subscription_data?.trial_period_days, undefined);
  assert.equal(params.subscription_data?.metadata?.plan, 'group');
  assert.equal(params.cancel_url, 'https://www.bijbelquiz.com/groepslicentie?checkout=geannuleerd');
});

test('an existing Stripe customer is reused instead of the e-mail address', () => {
  for (const plan of STRIPE_PLAN_IDS) {
    const params = buildCheckoutSessionParams({ ...base, plan, customerId: 'cus_123' });
    assert.equal(params.customer, 'cus_123', plan);
    assert.equal(params.customer_email, undefined, plan);
    assert.equal(params.customer_creation, undefined, plan);
  }
});

test('success and cancel URLs: Stripe placeholder kept literal, locked paywall kept', () => {
  const params = buildCheckoutSessionParams(base);
  assert.equal(
    params.success_url,
    'https://www.bijbelquiz.com/premium/succes?session_id={CHECKOUT_SESSION_ID}&next=%2Fquiz%2Fabc',
  );
  assert.equal(params.cancel_url, 'https://www.bijbelquiz.com/premium?checkout=geannuleerd');

  const locked = buildCheckoutSessionParams({ ...base, plan: 'monthly', locked: true });
  assert.equal(
    locked.cancel_url,
    'https://www.bijbelquiz.com/premium?vergrendeld=1&terug=%2Fquiz%2Fabc&plan=monthly&checkout=geannuleerd',
  );
});

test('checkout origin: the browser origin only when it is this site', () => {
  const configuredUrl = 'https://www.bijbelquiz.com';
  assert.equal(
    resolveCheckoutOrigin({ originHeader: 'https://www.bijbelquiz.com', requestOrigin: 'http://localhost:3000', configuredUrl }),
    'https://www.bijbelquiz.com',
  );
  assert.equal(
    resolveCheckoutOrigin({ originHeader: 'https://evil.example', requestOrigin: 'http://localhost:3000', configuredUrl }),
    'https://www.bijbelquiz.com',
  );
  assert.equal(
    resolveCheckoutOrigin({ originHeader: 'http://localhost:3100', requestOrigin: 'http://localhost:3100', configuredUrl: null }),
    'http://localhost:3100',
  );
});

test('plan from a Stripe price: price id first, then metadata, then recurrence', () => {
  const env = { STRIPE_PRICE_MONTHLY: 'price_m', STRIPE_PRICE_YEARLY: 'price_y', STRIPE_PRICE_GROUP: 'price_g' };
  assert.equal(planForStripePrice({ priceId: 'price_y', metadataPlan: 'monthly' }, env), 'yearly');
  assert.equal(planForStripePrice({ priceId: 'price_g', interval: 'year' }, env), 'group');
  assert.equal(planForStripePrice({ priceId: 'price_other', interval: 'year', metadataPlan: 'monthly' }, env), 'yearly');
  assert.equal(planForStripePrice({ priceId: 'price_other', interval: 'year', metadataPlan: 'group' }, env), 'group');
  assert.equal(planForStripePrice({ metadataPlan: 'monthly' }, env), 'monthly');
  assert.equal(planForStripePrice({}, env), null);
});

test('which subscription statuses keep Premium', () => {
  for (const status of ['trialing', 'active', 'past_due']) assert.equal(subscriptionStatusGrantsPremium(status), true, status);
  for (const status of ['unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused', '', null]) {
    assert.equal(subscriptionStatusGrantsPremium(status), false, String(status));
  }
});

test('premium snapshot counts lifetime and manual grants; manual is what no flag explains', () => {
  assert.equal(getPremiumSnapshot({ hasLifetimePremium: true }).isPremium, true);
  assert.equal(getPremiumSnapshot({ premiumGranted: true }).isPremium, true);
  assert.equal(getPremiumSnapshot({ groupPremiumUntil: new Date(Date.now() - 1000) }).isPremium, false);
  assert.equal(isManualPremium({ isPremium: true }), true);
  assert.equal(isManualPremium({ isPremium: true, premiumStripe: true }), false);
  assert.equal(isManualPremium({ isPremium: true, premiumGranted: false }), false);
});

test('the reminder is only promised when it is sent', () => {
  assert.equal(premiumReassurance('yearly', 7), 'Vandaag betaal je niets. Herinnering op dag 5.');
  assert.equal(premiumReassurance('yearly', 7, false), 'Vandaag betaal je niets.');
});

test('the trial reminder mail says when it ends, what it costs and how to stop', () => {
  const mail = buildTrialReminderMail({
    to: 'koper@voorbeeld.nl',
    name: 'Anna de Vries',
    trialEnd: new Date('2026-11-03T10:00:00Z'),
    amountCents: 3999,
    currency: 'eur',
    siteUrl: 'https://www.bijbelquiz.com',
  });
  assert.equal(mail.subject, 'Je proefperiode van BijbelQuiz Premium loopt op 3 november af');
  assert.match(mail.text, /^Hoi Anna,/);
  assert.match(mail.text, /€39,99 per jaar/);
  assert.match(mail.text, /voor 3 november op/);
  assert.match(mail.text, /https:\/\/www\.bijbelquiz\.com\/premium/);
  assert.doesNotMatch(mail.text, /[–—]/, 'plain hyphens only');

  const unknownPrice = buildTrialReminderMail({ to: 'x@y.nl', trialEnd: new Date(), siteUrl: 'https://x' });
  assert.match(unknownPrice.text, /het jaarbedrag/);
});

test('the documented webhook event list covers every event the brief requires', () => {
  for (const event of [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.trial_will_end',
    'invoice.paid',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'charge.refunded',
    'charge.dispute.created',
    'charge.dispute.closed',
  ]) {
    assert.ok((STRIPE_WEBHOOK_EVENTS as readonly string[]).includes(event), event);
  }
});
