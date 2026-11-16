import assert from 'node:assert/strict';
import { test } from 'node:test';

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

