import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatStripeAmount,
  pickPriceLabel,
  premiumCtaLabel,
  premiumPageHref,
  premiumReassurance,
  PREMIUM_PRICE_FALLBACKS,
  readPremiumPageQuery,
  readPremiumPlan,
  trialReminderDate,
  trialReminderDay,
} from '@/lib/premium-offer';
import { STRIPE_PLANS, trialDaysForPlan } from '@/lib/stripe-plans';

/**
 * The web 2.0 offer: Jaarlijks with a free week, Maandelijks without one,
 * levenslang as a one-off. The trial used to apply to every subscription; these
 * pin it to the yearly plan, and pin the copy that promises it.
 */

test('only the yearly plan gets the free trial', () => {
  assert.equal(trialDaysForPlan('yearly', '7'), 7);
  assert.equal(trialDaysForPlan('monthly', '7'), 0, 'monthly has no trial');
  assert.equal(trialDaysForPlan('lifetime', '7'), 0, 'a one-off has nothing to trial');
  assert.equal(trialDaysForPlan('group', '7'), 0, 'the group licence has no trial');
});

test('the yearly trial still follows STRIPE_TRIAL_DAYS', () => {
  assert.equal(trialDaysForPlan('yearly', undefined), 0, 'unset means no trial anywhere');
  assert.equal(trialDaysForPlan('yearly', '0'), 0);
  assert.equal(trialDaysForPlan('yearly', '14'), 14);
});

test('plan table: one trial plan, lifetime is a payment, the rest subscribe', () => {
  const withTrial = Object.entries(STRIPE_PLANS).filter(([, config]) => config.offersTrial).map(([id]) => id);
  assert.deepEqual(withTrial, ['yearly']);
  assert.equal(STRIPE_PLANS.lifetime.mode, 'payment');
  assert.equal(STRIPE_PLANS.monthly.mode, 'subscription');
  assert.equal(STRIPE_PLANS.yearly.mode, 'subscription');
});

test('the reminder falls on day 5 of a 7-day trial', () => {
  assert.equal(trialReminderDay(7), 5);
  assert.equal(trialReminderDay(14), 12);
  assert.equal(trialReminderDay(2), null, 'too short to remind before it ends');
  assert.equal(trialReminderDay(0), null);

  // Started 26 October: free until 2 November, reminded on 30 October.
  const start = new Date('2026-10-26T10:00:00Z');
  assert.equal(trialReminderDate(start, 7)?.toISOString().slice(0, 10), '2026-10-30');
  assert.equal(trialReminderDate(start, 0), null);
});

test('button and reassurance copy follow the chosen plan', () => {
  assert.equal(premiumCtaLabel('yearly', 7), 'Probeer 7 dagen gratis');
  assert.equal(premiumCtaLabel('yearly', 0), 'Start Premium', 'no trial configured, no trial promised');
  assert.equal(premiumCtaLabel('monthly', 7), 'Start Premium');
  assert.equal(premiumCtaLabel('lifetime', 7), 'Koop levenslang Premium');

  assert.equal(premiumReassurance('yearly', 7), 'Vandaag betaal je niets. Herinnering op dag 5.');
  assert.equal(premiumReassurance('yearly', 0), 'Zeg op wanneer je wilt.');
  assert.equal(premiumReassurance('monthly', 7), 'Zeg op wanneer je wilt.');
  assert.equal(premiumReassurance('lifetime', 7), 'Eenmalig betalen, geen abonnement.');
});

test('prices: configured label, then Stripe, then the list price', () => {
  assert.equal(formatStripeAmount(3999, 'eur'), '€39,99');
  assert.equal(formatStripeAmount(599, 'EUR'), '€5,99');
  assert.equal(formatStripeAmount(3999, 'usd'), null, 'never print dollars as euros');
  assert.equal(formatStripeAmount(null, 'eur'), null);
  assert.equal(formatStripeAmount(0, 'eur'), null);

  assert.equal(pickPriceLabel(' €44,99 ', '€39,99', '€1'), '€44,99');
  assert.equal(pickPriceLabel('', '€39,99', '€1'), '€39,99');
  assert.equal(pickPriceLabel(undefined, null, PREMIUM_PRICE_FALLBACKS.yearly), '€39,99');
  // Same list prices as the app and the Stripe setup script.
  assert.deepEqual(PREMIUM_PRICE_FALLBACKS, { monthly: '€5,99', yearly: '€39,99', lifetime: '€74,99' });
});

test('plan query defaults to yearly and ignores the group licence', () => {
  assert.equal(readPremiumPlan('monthly'), 'monthly');
  assert.equal(readPremiumPlan('lifetime'), 'lifetime');
  assert.equal(readPremiumPlan('group'), 'yearly');
  assert.equal(readPremiumPlan(undefined), 'yearly');
});

test('the locked paywall keeps a same-site way back only', () => {
  const locked = readPremiumPageQuery({ vergrendeld: '1', terug: '/bijbelquiz/genesis-1' });
  assert.equal(locked.locked, true);
  assert.equal(locked.returnPath, '/bijbelquiz/genesis-1');

  assert.equal(readPremiumPageQuery({ terug: 'https://evil.example' }).returnPath, null);
  assert.equal(readPremiumPageQuery({ terug: '//evil.example' }).returnPath, null);
  assert.equal(readPremiumPageQuery({ terug: '/\\evil.example' }).returnPath, null);
  assert.equal(readPremiumPageQuery({ terug: '/premium?vergrendeld=1' }).returnPath, null, 'no loop back to the paywall');
  assert.equal(readPremiumPageQuery({}).locked, false);
  assert.equal(readPremiumPageQuery({ vergrendeld: 'ja' }).locked, false);

  // The older `next` still works; `terug` wins.
  assert.equal(readPremiumPageQuery({ next: '/samen-spelen' }).returnPath, '/samen-spelen');
  assert.equal(readPremiumPageQuery({ next: '/a', terug: '/b' }).returnPath, '/b');
  assert.equal(readPremiumPageQuery({ checkout: 'geannuleerd' }).checkoutCancelled, true);
});

test('the premium href round-trips the locked state', () => {
  const href = premiumPageHref({ locked: true, returnPath: '/quiz/abc?x=1', plan: 'monthly' });
  assert.equal(href, '/premium?vergrendeld=1&terug=%2Fquiz%2Fabc%3Fx%3D1&plan=monthly');
  const query = Object.fromEntries(new URL(href, 'https://www.bijbelquiz.com').searchParams);
  const read = readPremiumPageQuery(query);
  assert.equal(read.locked, true);
  assert.equal(read.returnPath, '/quiz/abc?x=1');
  assert.equal(read.plan, 'monthly');
  assert.equal(premiumPageHref({}), '/premium');
});
