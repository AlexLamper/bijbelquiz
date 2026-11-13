import test from 'node:test';
import assert from 'node:assert/strict';

import { EMPTY_PAID, premiumStatus, type PaidSummary } from '@/lib/admin/premium-status';

const now = new Date('2026-11-13T12:00:00Z');
const inDays = (days: number) => new Date(now.getTime() + days * 86_400_000);
const paidOnce = (amount: number, plan: string, provider: 'store' | 'stripe'): PaidSummary => ({
  count: 1,
  totalCents: amount,
  lastAt: '2026-10-01T10:00:00.000Z',
  lastAmount: amount,
  lastCurrency: 'eur',
  lastPlan: plan,
  store: provider === 'store',
  stripe: provider === 'stripe',
  lastAmountByPlan: { [plan]: { amount, currency: 'eur' } },
});

test('a store account with no charge yet is a free trial, with the date it starts paying', () => {
  const status = premiumStatus(
    { premiumStore: true, storePremiumExpiresAt: inDays(5), storeWillRenew: true, storePlan: 'yearly', storeName: 'app_store' },
    EMPTY_PAID,
    now,
  )!;
  assert.equal(status.kind, 'trial');
  assert.equal(status.channel, 'app_store');
  assert.equal(status.nextCharge?.at, inDays(5).toISOString());
  assert.match(status.summary, /Gratis proefperiode \(jaarabonnement, via de App Store\) tot 18 nov 2026\. Er is nog niets betaald\./);
});

test('a cancelled store trial says nothing will be paid', () => {
  const status = premiumStatus(
    { premiumStore: true, storePremiumExpiresAt: inDays(5), storeWillRenew: false, storePeriodType: 'trial' },
    EMPTY_PAID,
    now,
  )!;
  assert.equal(status.kind, 'trial');
  assert.equal(status.nextCharge, null);
  assert.match(status.summary, /opgezegd: Premium stopt dan en er wordt niets betaald/);
});

test('a charged store subscription is paid, with the renewal and its amount', () => {
  const status = premiumStatus(
    { premiumStore: true, storePremiumExpiresAt: inDays(200), storeWillRenew: true, storePeriodType: 'normal', storePlan: 'yearly' },
    paidOnce(2999, 'yearly', 'store'),
    now,
  )!;
  assert.equal(status.kind, 'paid');
  assert.deepEqual(status.nextCharge, { at: inDays(200).toISOString(), amount: 2999, currency: 'eur' });
  assert.match(status.summary, /Totaal betaald: € 29,99/);
});

test('website trial, website paid, lifetime, given', () => {
  assert.equal(
    premiumStatus({ premiumStripe: true, stripeSubscriptionStatus: 'trialing', stripeTrialEnd: inDays(3), stripePriceAmount: 2999 }, EMPTY_PAID, now)!.kind,
    'trial',
  );
  assert.equal(
    premiumStatus({ premiumStripe: true, stripeSubscriptionStatus: 'active', stripeCurrentPeriodEnd: inDays(20) }, paidOnce(399, 'monthly', 'stripe'), now)!.kind,
    'paid',
  );
  assert.equal(premiumStatus({ hasLifetimePremium: true, premiumStore: true }, paidOnce(5999, 'lifetime', 'store'), now)!.kind, 'lifetime');
  const given = premiumStatus({ isPremium: true, premiumGranted: true, premiumGrantedUntil: inDays(30) }, EMPTY_PAID, now)!;
  assert.equal(given.kind, 'manual');
  assert.match(given.summary, /niet voor betaald/);
  assert.equal(premiumStatus({}, EMPTY_PAID, now), null);
});
