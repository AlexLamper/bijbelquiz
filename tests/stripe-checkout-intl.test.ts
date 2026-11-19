import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildCheckoutSessionParams, type CheckoutSessionInput } from '@/lib/stripe-checkout';

const base: CheckoutSessionInput = {
  plan: 'monthly',
  priceId: 'price_m',
  userId: '64b7f0c2a1b2c3d4e5f60718',
  email: 'buyer@example.com',
  customerId: null,
  origin: 'https://biblequizzes.app/de',
  returnPath: '/quizzes',
  locked: false,
  trialDays: 0,
};

test('intl checkout: tag on every metadata, language, localized URLs with the prefix', () => {
  const params = buildCheckoutSessionParams({
    ...base,
    stripeLocale: 'de',
    siteTag: 'biblequizzes-de',
    localize: (p) => p.replace('/premium/succes', '/premium/success'),
  });
  assert.equal(params.locale, 'de');
  assert.equal(params.metadata?.site, 'biblequizzes-de');
  assert.equal(params.subscription_data?.metadata?.site, 'biblequizzes-de');
  assert.ok(String(params.success_url).startsWith('https://biblequizzes.app/de/premium/success?session_id='));
  assert.ok(params.cancel_url?.startsWith('https://biblequizzes.app/de/'));
  assert.equal(params.subscription_data?.trial_period_days, undefined);
});

test('intl lifetime: tag on the payment intent too', () => {
  const params = buildCheckoutSessionParams({ ...base, plan: 'lifetime', siteTag: 'biblequizzes-en' });
  assert.equal(params.payment_intent_data?.metadata?.site, 'biblequizzes-en');
});

test('NL checkout params carry no site tag and stay Dutch', () => {
  const params = buildCheckoutSessionParams({ ...base, origin: 'https://www.bijbelquiz.com' });
  assert.equal(params.locale, 'nl');
  assert.equal('site' in (params.metadata ?? {}), false);
  assert.ok(String(params.success_url).startsWith('https://www.bijbelquiz.com/premium/succes?'));
});
