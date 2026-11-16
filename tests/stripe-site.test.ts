import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildCheckoutSessionParams, type CheckoutSessionInput } from '@/lib/stripe-checkout';
import { eventBelongsToSite, eventSiteTag } from '@/lib/stripe-site';

const ev = (type: string, object: Record<string, unknown>) => ({ type, data: { object } }) as never;

test('site tag is read from metadata, invoice parent and subscription_details', () => {
  assert.equal(eventSiteTag(ev('checkout.session.completed', { metadata: { site: 'biblequizzes-de' } })), 'biblequizzes-de');
  assert.equal(
    eventSiteTag(ev('invoice.paid', { parent: { subscription_details: { metadata: { site: 'biblequizzes-en' } } } })),
    'biblequizzes-en',
  );
  assert.equal(eventSiteTag(ev('invoice.paid', { subscription_details: { metadata: { site: 'biblequizzes-fr' } } })), 'biblequizzes-fr');
  assert.equal(eventSiteTag(ev('customer.subscription.updated', { metadata: { userId: 'x' } })), null);
});

test('NL (no tag) processes untagged events and ignores intl ones', () => {
  assert.equal(eventBelongsToSite(ev('checkout.session.completed', { metadata: { userId: 'x' } }), null), true);
  assert.equal(eventBelongsToSite(ev('checkout.session.completed', { metadata: { site: 'biblequizzes-en' } }), null), false);
  assert.equal(eventBelongsToSite(ev('customer.subscription.updated', { metadata: { site: 'biblequizzes-de' } }), null), false);
});

test('an intl site processes only its own tag', () => {
  const own = 'biblequizzes-de';
  assert.equal(eventBelongsToSite(ev('checkout.session.completed', { metadata: { site: own } }), own), true);
  assert.equal(eventBelongsToSite(ev('checkout.session.completed', { metadata: { site: 'biblequizzes-fr' } }), own), false);
  assert.equal(eventBelongsToSite(ev('invoice.paid', { parent: { subscription_details: { metadata: {} } } }), own), false);
  assert.equal(eventBelongsToSite(ev('customer.subscription.deleted', { metadata: {} }), own), false);
});

test('charge events are not filtered (looked up by payment intent in the own database)', () => {
  assert.equal(eventBelongsToSite(ev('charge.refunded', { metadata: {} }), 'biblequizzes-en'), true);
  assert.equal(eventBelongsToSite(ev('charge.refunded', { metadata: {} }), null), true);
});

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
  assert.ok(params.success_url.startsWith('https://biblequizzes.app/de/premium/success?session_id='));
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
  assert.ok(params.success_url.startsWith('https://www.bijbelquiz.com/premium/succes?'));
});
