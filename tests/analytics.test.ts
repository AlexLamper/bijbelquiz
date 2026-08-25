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
  INTERNAL_ACCOUNT_EMAILS,
  isInternalAccount,
} from '@/lib/analytics/internal-accounts';
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
  //
  // Asserted as a prefix rather than the whole list, because the usage events
  // below are web-only and the app has no reason to learn about them. Adding
  // one must not fail this test; touching a funnel name still does.
  assert.deepEqual(ANALYTICS_EVENTS.slice(0, 10), [
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
  ]);
});

test('the automatic usage events the reports read are all present', () => {
  // `insights.ts` queries these by name. A rename here without one there
  // produces an empty report rather than an error, so it is worth pinning.
  for (const name of [
    'page_view',
    'ui_click',
    'ui_seen',
    'session_start',
    'theme_changed',
    'quiz_started',
    'quiz_abandoned',
  ]) {
    assert.ok(isAnalyticsEventName(name), `${name} is missing from ANALYTICS_EVENTS`);
  }
});

test('the test and reviewer accounts are recognised however they are written', () => {
  // Stored addresses are lowercase today, but an older document or a manual
  // edit is not guaranteed to be - and a case slip here silently puts a test
  // account back into the premium count.
  for (const email of INTERNAL_ACCOUNT_EMAILS) {
    assert.ok(isInternalAccount(email), `${email} should be internal`);
    assert.ok(isInternalAccount(email.toUpperCase()), `${email} uppercased should be internal`);
    assert.ok(isInternalAccount(`  ${email}  `), `${email} padded should be internal`);
  }

  assert.ok(!isInternalAccount('lamper0020@hz.nl'));
  assert.ok(!isInternalAccount('aplamper06@gmail.com.attacker.example'));
  assert.ok(!isInternalAccount(''));
  assert.ok(!isInternalAccount(null));
  assert.ok(!isInternalAccount(undefined));
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
