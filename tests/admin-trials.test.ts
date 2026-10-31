import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyTrial } from '@/lib/admin/trials';
import { renewalFromEvent } from '@/lib/revenuecat';

const DAY = 24 * 60 * 60 * 1000;
const start = new Date('2026-10-30T10:00:00Z');
const at = (days: number) => new Date(start.getTime() + days * DAY);

test('a store trial runs for seven days and then turns into the subscription', () => {
  const user = { _id: 'u', premiumStore: true, storePremiumExpiresAt: at(7), storeWillRenew: true };
  const result = classifyTrial({ provider: 'revenuecat', startedAt: start, paidAfterStart: false, user }, at(1));
  assert.equal(result.status, 'running');
  assert.equal(result.endsAt.toISOString(), at(7).toISOString());
  assert.equal(result.daysLeft, 6);
  assert.equal(classifyTrial({ provider: "revenuecat", startedAt: start, paidAfterStart: false, user }, new Date(at(3).getTime() + 1000)).daysLeft, 4);
});

test('renewal turned off during the trial: cancelled, still open', () => {
  const user = { _id: 'u', premiumStore: true, storePremiumExpiresAt: at(7), storeWillRenew: false };
  assert.equal(classifyTrial({ provider: 'revenuecat', startedAt: start, paidAfterStart: false, user }, at(2)).status, 'cancelled');
});

test('a payment after the start means converted; no payment after the end means ended', () => {
  const user = { _id: 'u', premiumStore: true, storePremiumExpiresAt: at(372) };
  assert.equal(classifyTrial({ provider: 'revenuecat', startedAt: start, paidAfterStart: true, user }, at(8)).status, 'converted');
  const gone = { _id: 'u', premiumStore: false, storePremiumExpiresAt: null };
  const ended = classifyTrial({ provider: 'revenuecat', startedAt: start, paidAfterStart: false, user: gone }, at(9));
  assert.equal(ended.status, 'ended');
  assert.equal(ended.daysLeft, null);
});

test('a far-away store end date (a renewed year) is not taken as the trial end', () => {
  const user = { _id: 'u', premiumStore: true, storePremiumExpiresAt: at(372) };
  const result = classifyTrial({ provider: 'revenuecat', startedAt: start, paidAfterStart: false, user }, at(1));
  assert.equal(result.endsAt.toISOString(), at(7).toISOString());
});

test('website trials use Stripe trial end and cancel flag', () => {
  const user = { _id: 'u', premiumStripe: true, stripeTrialEnd: at(7), stripeCancelAtPeriodEnd: true };
  const result = classifyTrial({ provider: 'stripe', startedAt: start, paidAfterStart: false, user }, at(3));
  assert.equal(result.status, 'cancelled');
  assert.equal(result.daysLeft, 4);
});

test('store events say what they say about renewal', () => {
  assert.equal(renewalFromEvent({ type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE' } as never), false);
  assert.equal(renewalFromEvent({ type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' } as never), null);
  assert.equal(renewalFromEvent({ type: 'UNCANCELLATION' } as never), true);
  assert.equal(renewalFromEvent({ type: 'INITIAL_PURCHASE' } as never), true);
  assert.equal(renewalFromEvent({ type: 'EXPIRATION' } as never), null);
  assert.equal(renewalFromEvent({ type: 'BILLING_ISSUE' } as never), undefined);
});
