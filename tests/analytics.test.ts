import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ANALYTICS_EVENTS,
  MAX_PROPS_PER_EVENT,
  MAX_PROP_VALUE_LENGTH,
  PAYWALL_TRIGGERS,
  isAnalyticsEventName,
  readPaywallTrigger,
  sanitizeProps,
} from '@/lib/analytics/events';
import {
  monthlyEquivalentOfYearly,
  parsePriceLabel,
  yearlySavingsPercent,
} from '@/lib/premium-benefits';

test('only known event names are accepted', () => {
  assert.ok(isAnalyticsEventName('purchase_completed'));
  assert.ok(!isAnalyticsEventName('purchase_complete'));
  assert.ok(!isAnalyticsEventName(''));
  assert.ok(!isAnalyticsEventName(null));
});

test('the event list the Flutter app mirrors has not shifted', () => {
  // The app ships its own copy of these names. Renaming one silently orphans
  // half the funnel: the server drops what it does not recognise.
  assert.deepEqual(
    [...ANALYTICS_EVENTS],
    [
      'quiz_completed',
      'room_started',
      'room_joined',
      'room_invite_shared',
      'paywall_shown',
      'paywall_dismissed',
      'purchase_completed',
      'trial_started',
      'trial_converted',
      'streak_broken',
    ],
  );
});

test('paywall triggers are a closed set', () => {
  assert.deepEqual(
    [...PAYWALL_TRIGGERS],
    [
      'host_quota_exhausted',
      'host_quota_warning',
      'host_player_cap',
      'explanation_locked',
      'premium_quiz_locked',
      'direct',
    ],
  );
});

test('an unknown trigger query parameter reads as a direct visit', () => {
  assert.equal(readPaywallTrigger('host_quota_exhausted'), 'host_quota_exhausted');
  assert.equal(readPaywallTrigger('something_else'), 'direct');
  assert.equal(readPaywallTrigger(undefined), 'direct');
  assert.equal(readPaywallTrigger(42), 'direct');
});

test('props keep primitives and drop everything else', () => {
  const cleaned = sanitizeProps({
    trigger: 'explanation_locked',
    count: 3,
    flag: true,
    nested: { a: 1 },
    list: [1, 2],
    missing: null,
    undef: undefined,
  });

  assert.deepEqual(cleaned, { trigger: 'explanation_locked', count: 3, flag: true });
});

test('props are capped so a client bug cannot fill the collection', () => {
  const raw: Record<string, string> = {};
  for (let i = 0; i < 50; i += 1) raw[`key${i}`] = 'value';

  assert.equal(Object.keys(sanitizeProps(raw)).length, MAX_PROPS_PER_EVENT);
});

test('long strings are truncated rather than rejected', () => {
  const cleaned = sanitizeProps({ note: 'x'.repeat(500) });
  assert.equal((cleaned.note as string).length, MAX_PROP_VALUE_LENGTH);
});

test('sanitizeProps survives junk input', () => {
  assert.deepEqual(sanitizeProps(null), {});
  assert.deepEqual(sanitizeProps('nope'), {});
  assert.deepEqual(sanitizeProps([1, 2, 3]), {});
});

test('NaN and Infinity never reach the database', () => {
  assert.deepEqual(sanitizeProps({ a: Number.NaN, b: Number.POSITIVE_INFINITY, c: 1 }), { c: 1 });
});

test('price labels parse in the Dutch format', () => {
  assert.equal(parsePriceLabel('€5,99'), 5.99);
  assert.equal(parsePriceLabel('€39,99'), 39.99);
  assert.equal(parsePriceLabel('gratis'), null);
});

test('yearly savings are only claimed when they are real', () => {
  assert.equal(yearlySavingsPercent('€5,99', '€39,99'), 44);
  // A "yearly" price that is not actually cheaper must print no claim at all.
  assert.equal(yearlySavingsPercent('€5,99', '€99,99'), null);
  assert.equal(yearlySavingsPercent('€5,99', 'onbekend'), null);
});

test('the monthly equivalent of a yearly plan is formatted for nl-NL', () => {
  assert.equal(monthlyEquivalentOfYearly('€39,99'), '€3,33');
  assert.equal(monthlyEquivalentOfYearly('onbekend'), null);
});
