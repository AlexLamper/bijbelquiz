import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatPricePerWeek,
  formatTrialLabel,
  lifetimePricePerWeek,
  monthlyEquivalentOfYearly,
  premiumPaywallHref,
  pricePerWeek,
  readTrialDays,
  yearlyPricePerWeek,
  yearlySavingsPercent,
} from '@/lib/premium-benefits';
import { readReturnPath, readStripePlan, STRIPE_PLANS } from '@/lib/stripe-plans';

/**
 * Money on a page is a promise. Every derived number here - per week, savings
 * percentage, trial length - is printed next to a real charge, so the tests pin
 * both the arithmetic and the refusal to print anything at all when the input
 * cannot be trusted.
 */

test('a per-week price is quoted off the real billing period', () => {
  // 5,99 / 4,345 weeks
  assert.equal(formatPricePerWeek('€5,99'), '€1,38');
  // 39,99 over a year of weeks - the number the paywall leads with.
  assert.equal(yearlyPricePerWeek('€39,99'), '€0,77');
  // 74,99 amortised over the three-year horizon.
  assert.equal(lifetimePricePerWeek('€74,99'), '€0,48');
});

test('an unreadable price label yields no claim at all', () => {
  assert.equal(formatPricePerWeek('gratis'), null);
  assert.equal(yearlyPricePerWeek(''), null);
  assert.equal(pricePerWeek('€39,99', 0), null);
});

test('a localized label with a dot decimal is read correctly', () => {
  assert.equal(formatPricePerWeek('EUR 5.99'), '€1,38');
});

test('the yearly saving is only claimed when the year is actually cheaper', () => {
  assert.equal(yearlySavingsPercent('€5,99', '€39,99'), 44);
  assert.equal(yearlySavingsPercent('€5,99', '€71,88'), null, 'equal to twelve months is not a saving');
  assert.equal(yearlySavingsPercent('€5,99', '€99,00'), null, 'more expensive is never a saving');
});

test('the yearly plan reports its monthly equivalent', () => {
  assert.equal(monthlyEquivalentOfYearly('€39,99'), '€3,33');
});

test('a trial is off unless it is configured', () => {
  assert.equal(readTrialDays(undefined), 0);
  assert.equal(readTrialDays(''), 0);
  assert.equal(readTrialDays('0'), 0);
  assert.equal(readTrialDays('-7'), 0);
  assert.equal(readTrialDays('nonsense'), 0);
  assert.equal(readTrialDays('7'), 7);
  assert.equal(readTrialDays(' 14 '), 14);
  assert.equal(readTrialDays('5000'), 730, 'clamped to what Stripe accepts');
});

test('the trial label is grammatical in Dutch', () => {
  assert.equal(formatTrialLabel(1), '1 dag gratis');
  assert.equal(formatTrialLabel(7), '7 dagen gratis');
});

test('a paywall link carries the trigger and only a safe return path', () => {
  assert.equal(premiumPaywallHref('explanation_locked'), '/premium?reden=explanation_locked');
  assert.equal(
    premiumPaywallHref('host_quota_exhausted', '/samen-spelen'),
    '/premium?reden=host_quota_exhausted&next=%2Fsamen-spelen',
  );
  // An off-site destination is dropped rather than carried.
  assert.equal(premiumPaywallHref('direct', 'https://evil.example'), '/premium?reden=direct');
  assert.equal(premiumPaywallHref('direct', '//evil.example'), '/premium?reden=direct');
});

test('the return path never leaves the site', () => {
  assert.equal(readReturnPath('/quiz/genesis'), '/quiz/genesis');
  assert.equal(readReturnPath('https://evil.example'), '/quizzen');
  assert.equal(readReturnPath('//evil.example'), '/quizzen');
  assert.equal(readReturnPath('/\\evil.example'), '/quizzen');
  assert.equal(readReturnPath(undefined), '/quizzen');
  assert.equal(readReturnPath('/x'.repeat(600)), '/quizzen');
});

test('an unknown plan is never treated as a subscription', () => {
  assert.equal(readStripePlan('yearly'), 'yearly');
  assert.equal(readStripePlan('group'), 'group');
  assert.equal(readStripePlan('nonsense'), 'lifetime');
  assert.equal(readStripePlan(undefined), 'lifetime');

  // The bug this table exists to prevent: only lifetime may grant permanent
  // access, and only the group plan may skip the personal premium flag.
  assert.equal(STRIPE_PLANS.yearly.isLifetime, false);
  assert.equal(STRIPE_PLANS.monthly.isLifetime, false);
  assert.equal(STRIPE_PLANS.group.isLifetime, false);
  assert.equal(STRIPE_PLANS.lifetime.isLifetime, true);
  assert.equal(STRIPE_PLANS.group.isGroup, true);
  assert.equal(STRIPE_PLANS.yearly.isGroup, false);
});
