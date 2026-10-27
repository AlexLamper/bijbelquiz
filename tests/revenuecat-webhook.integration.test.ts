import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { Payment, User, WebhookEvent, connectDB } from '@/database';
import { syncMobilePremium, mobilePremiumPayload } from '@/lib/mobile-premium';
import {
  candidateUserIds,
  inferStoreUpdate,
  planFromProductId,
  processRevenueCatWebhook,
  subscriberPremiumStateFrom,
  verifyRevenueCatAuthorization,
  type RestSubscriber,
  type RevenueCatEvent,
} from '@/lib/revenuecat';

/**
 * The RevenueCat webhook and sync against a real mongod
 * (mongodb-memory-server, cached after the first run). One test per event
 * type, plus the "never clobber another Premium source" rules.
 */

let mongod: MongoMemoryServer;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('bijbelquiz-revenuecat-test');
  delete process.env.REVENUECAT_SECRET_KEY;
  delete process.env.REVENUECAT_REST_API_KEY;
  delete process.env.REVENUECAT_PREMIUM_ENTITLEMENT_ID;
  await connectDB();
  await Promise.all([User.init(), Payment.init(), WebhookEvent.init()]);
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(() => {
  delete process.env.REVENUECAT_SECRET_KEY;
  delete process.env.REVENUECAT_REST_API_KEY;
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;
let counter = 0;

async function makeUser(fields: Record<string, unknown> = {}): Promise<string> {
  counter += 1;
  const user = await User.create({ email: `rc-${counter}@test.local`, name: `RC ${counter}`, ...fields });
  return String(user._id);
}

function event(type: string, appUserId: string, fields: Partial<RevenueCatEvent> = {}): { api_version: string; event: RevenueCatEvent } {
  counter += 1;
  return {
    api_version: '1.0',
    event: {
      id: `evt-${counter}-${type}`,
      type,
      app_user_id: appUserId,
      original_app_user_id: appUserId,
      aliases: [appUserId],
      entitlement_ids: ['premium'],
      product_id: 'bijbelquiz_premium_yearly',
      period_type: 'NORMAL',
      purchased_at_ms: Date.now(),
      expiration_at_ms: Date.now() + 365 * DAY,
      event_timestamp_ms: Date.now(),
      environment: 'PRODUCTION',
      store: 'APP_STORE',
      price: 43.5,
      price_in_purchased_currency: 39.99,
      currency: 'EUR',
      transaction_id: `tx-${counter}`,
      original_transaction_id: `otx-${appUserId}`,
      ...fields,
    },
  };
}

async function account(id: string) {
  const user = await User.findById(id).lean();
  assert.ok(user);
  return user;
}

async function send(body: unknown) {
  const result = await processRevenueCatWebhook(body);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return result;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe('helpers', () => {
  test('authorization header: exact value, with or without Bearer, constant time', () => {
    assert.equal(verifyRevenueCatAuthorization('Bearer s3cret', 'Bearer s3cret'), true);
    assert.equal(verifyRevenueCatAuthorization('s3cret', 'Bearer s3cret'), true);
    assert.equal(verifyRevenueCatAuthorization('Bearer s3cret', 's3cret'), true);
    assert.equal(verifyRevenueCatAuthorization('Bearer wrong', 's3cret'), false);
    assert.equal(verifyRevenueCatAuthorization(null, 's3cret'), false);
    assert.equal(verifyRevenueCatAuthorization('anything', ''), false);
    assert.equal(verifyRevenueCatAuthorization('anything', undefined), false);
  });

  test('product ids map to plans, Play base plans included', () => {
    assert.equal(planFromProductId('bijbelquiz_premium_yearly'), 'yearly');
    assert.equal(planFromProductId('bijbelquiz_premium_yearly:yearly-base'), 'yearly');
    assert.equal(planFromProductId('bijbelquiz_premium_monthly:monthly'), 'monthly');
    assert.equal(planFromProductId('bijbelquiz_premium_lifetime'), 'lifetime');
  });

  test('candidate ids skip anonymous RevenueCat ids', () => {
    const id = new mongoose.Types.ObjectId().toString();
    assert.deepEqual(
      candidateUserIds({ app_user_id: '$RCAnonymousID:abc', original_app_user_id: '$RCAnonymousID:abc', aliases: ['$RCAnonymousID:abc', id] }),
      [id],
    );
  });

  test('REST subscriber: active, grace period, lifetime, expired, refunded', () => {
    const now = new Date('2026-10-27T12:00:00Z');
    const future = '2026-11-27T12:00:00Z';
    const past = '2026-10-01T12:00:00Z';
    const sub = (
      entitlement: NonNullable<RestSubscriber['entitlements']>[string],
      subscriptions: RestSubscriber['subscriptions'] = {},
    ): RestSubscriber => ({
      entitlements: entitlement ? { premium: entitlement } : {},
      subscriptions,
    });

    const active = subscriberPremiumStateFrom(
      sub({ expires_date: future, product_identifier: 'bijbelquiz_premium_yearly' }, {
        bijbelquiz_premium_yearly: { unsubscribe_detected_at: null, is_sandbox: true, store: 'app_store' },
      }),
      'premium',
      now,
    );
    assert.equal(active.active, true);
    assert.equal(active.lifetime, false);
    assert.equal(active.willRenew, true);
    assert.equal(active.isSandbox, true);

    const grace = subscriberPremiumStateFrom(
      sub({ expires_date: past, grace_period_expires_date: future, product_identifier: 'bijbelquiz_premium_monthly' }),
      'premium',
      now,
    );
    assert.equal(grace.active, true);
    assert.equal(grace.expiresAt?.toISOString(), new Date(future).toISOString());

    const lifetime = subscriberPremiumStateFrom(sub({ expires_date: null, product_identifier: 'bijbelquiz_premium_lifetime' }), 'premium', now);
    assert.equal(lifetime.active, true);
    assert.equal(lifetime.lifetime, true);
    assert.equal(lifetime.expiresAt, null);

    const expired = subscriberPremiumStateFrom(sub({ expires_date: past, product_identifier: 'bijbelquiz_premium_monthly' }), 'premium', now);
    assert.equal(expired.active, false);

    const refunded = subscriberPremiumStateFrom(
      sub({ expires_date: future, product_identifier: 'bijbelquiz_premium_monthly' }, {
        bijbelquiz_premium_monthly: { refunded_at: past },
      }),
      'premium',
      now,
    );
    assert.equal(refunded.active, false);

    assert.equal(subscriberPremiumStateFrom(sub(undefined), 'premium', now).active, false);
  });

  test('a late renewal never shortens a newer period; a stale expiration is ignored', () => {
    const now = new Date();
    const later = new Date(now.getTime() + 60 * DAY);
    const renewal = inferStoreUpdate(
      { type: 'RENEWAL', expiration_at_ms: now.getTime() + 30 * DAY, product_id: 'bijbelquiz_premium_monthly' },
      { premiumStore: true, storePremiumExpiresAt: later },
      now,
    );
    assert.equal(renewal.action, 'set');
    assert.equal(renewal.action === 'set' && renewal.update.expiresAt?.getTime(), later.getTime());

    const stale = inferStoreUpdate(
      { type: 'EXPIRATION', expiration_at_ms: now.getTime() - DAY, product_id: 'bijbelquiz_premium_monthly' },
      { premiumStore: true, storePremiumExpiresAt: later },
      now,
    );
    assert.deepEqual(stale, { action: 'ignore', reason: 'stale_expiration' });
  });
});

// ---------------------------------------------------------------------------
// Webhook, per event type
// ---------------------------------------------------------------------------

describe('webhook events', () => {
  test('TEST is acknowledged and changes nothing', async () => {
    const result = await send({ event: { id: 'test-1', type: 'TEST', app_user_id: 'whoever' } });
    assert.equal(result.body.test, true);
    assert.equal(await WebhookEvent.countDocuments({ eventId: 'test-1' }), 0);
  });

  test('payload without event id is a 400', async () => {
    const result = await processRevenueCatWebhook({ event: { type: 'RENEWAL' } });
    assert.equal(result.status, 400);
  });

  test('INITIAL_PURCHASE as a 7-day trial: Premium, no Payment, trial expiry stored', async () => {
    const id = await makeUser();
    const trialEnd = Date.now() + 7 * DAY;
    await send(event('INITIAL_PURCHASE', id, { period_type: 'TRIAL', price: 0, price_in_purchased_currency: 0, expiration_at_ms: trialEnd }));

    const user = await account(id);
    assert.equal(user.premiumStore, true);
    assert.equal(user.isPremium, true);
    assert.equal(new Date(user.storePremiumExpiresAt!).getTime(), trialEnd);
    assert.equal(await Payment.countDocuments({ user: id }), 0);
  });

  test('INITIAL_PURCHASE paid: Payment with real price, currency, store, plan, environment', async () => {
    const id = await makeUser();
    const body = event('INITIAL_PURCHASE', id, {
      product_id: 'bijbelquiz_premium_monthly',
      price_in_purchased_currency: 5.99,
      price: 6.5,
      currency: 'EUR',
      store: 'PLAY_STORE',
      expiration_at_ms: Date.now() + 30 * DAY,
    });
    await send(body);

    const user = await account(id);
    assert.equal(user.isPremium, true);
    const payment = await Payment.findOne({ user: id }).lean();
    assert.ok(payment);
    assert.equal(payment.provider, 'revenuecat');
    assert.equal(payment.amount, 599);
    assert.equal(payment.currency, 'eur');
    assert.equal(payment.priceUsdCents, 650);
    assert.equal(payment.store, 'play_store');
    assert.equal(payment.planType, 'monthly');
    assert.equal(payment.environment, 'production');
    assert.equal(payment.status, 'completed');
    assert.equal(payment.externalTransactionId, body.event.transaction_id);
  });

  test('the same event twice is processed once', async () => {
    const id = await makeUser();
    const body = event('INITIAL_PURCHASE', id);
    await send(body);
    const second = await send(body);
    assert.equal(second.body.duplicate, true);
    assert.equal(await Payment.countDocuments({ user: id }), 1);
  });

  test('RENEWAL after a trial: a Payment per renewal, marked as the trial conversion', async () => {
    const id = await makeUser();
    await send(event('INITIAL_PURCHASE', id, { period_type: 'TRIAL', price_in_purchased_currency: 0, expiration_at_ms: Date.now() + 7 * DAY }));
    const nextYear = Date.now() + 372 * DAY;
    await send(event('RENEWAL', id, { is_trial_conversion: true, expiration_at_ms: nextYear }));
    await send(event('RENEWAL', id, { expiration_at_ms: nextYear + 365 * DAY }));

    const user = await account(id);
    assert.equal(user.premiumStore, true);
    assert.equal(new Date(user.storePremiumExpiresAt!).getTime(), nextYear + 365 * DAY);
    const payments = await Payment.find({ user: id }).sort({ createdAt: 1 }).lean();
    assert.equal(payments.length, 2);
    assert.equal(payments[0].isTrialConversion, true);
    assert.equal(payments[0].amount, 3999);
    assert.equal(payments[0].planType, 'yearly');
  });

  test('PRODUCT_CHANGE keeps Premium and records no payment of its own', async () => {
    const id = await makeUser();
    await send(event('INITIAL_PURCHASE', id, { product_id: 'bijbelquiz_premium_monthly', expiration_at_ms: Date.now() + 30 * DAY }));
    await send(event('PRODUCT_CHANGE', id, { product_id: 'bijbelquiz_premium_monthly', new_product_id: 'bijbelquiz_premium_yearly' }));
    const user = await account(id);
    assert.equal(user.premiumStore, true);
    assert.equal(await Payment.countDocuments({ user: id }), 1);
  });

  test('CANCELLATION (opt-out) keeps access until the period ends; UNCANCELLATION keeps it', async () => {
    const id = await makeUser();
    const end = Date.now() + 20 * DAY;
    await send(event('INITIAL_PURCHASE', id, { expiration_at_ms: end }));
    await send(event('CANCELLATION', id, { cancel_reason: 'UNSUBSCRIBE', expiration_at_ms: end }));
    assert.equal((await account(id)).premiumStore, true);
    await send(event('UNCANCELLATION', id, { expiration_at_ms: end }));
    const user = await account(id);
    assert.equal(user.premiumStore, true);
    assert.equal(user.isPremium, true);
  });

  test('EXPIRATION removes store Premium', async () => {
    const id = await makeUser();
    const end = Date.now() + 30 * DAY;
    await send(event('INITIAL_PURCHASE', id, { expiration_at_ms: end }));
    await send(event('EXPIRATION', id, { expiration_at_ms: end, expiration_reason: 'UNSUBSCRIBE' }));
    const user = await account(id);
    assert.equal(user.premiumStore, false);
    assert.equal(user.isPremium, false);
    assert.equal(user.storePremiumExpiresAt, null);
  });

  test('BILLING_ISSUE and SUBSCRIPTION_PAUSED do not change access', async () => {
    const id = await makeUser();
    await send(event('INITIAL_PURCHASE', id));
    await send(event('BILLING_ISSUE', id, { store: 'PLAY_STORE' }));
    assert.equal((await account(id)).premiumStore, true);
    await send(event('SUBSCRIPTION_PAUSED', id, { store: 'PLAY_STORE' }));
    assert.equal((await account(id)).premiumStore, true);
    assert.equal(await Payment.countDocuments({ user: id }), 1);
  });

  test('NON_RENEWING_PURCHASE (lifetime): lifetime Premium and a lifetime Payment', async () => {
    const id = await makeUser();
    await send(
      event('NON_RENEWING_PURCHASE', id, {
        product_id: 'bijbelquiz_premium_lifetime',
        expiration_at_ms: null,
        price_in_purchased_currency: 74.99,
      }),
    );
    const user = await account(id);
    assert.equal(user.hasLifetimePremium, true);
    assert.equal(user.premiumStore, true);
    assert.equal(user.storePremiumExpiresAt, null);
    assert.equal(user.isPremium, true);
    const payment = await Payment.findOne({ user: id }).lean();
    assert.equal(payment?.planType, 'lifetime');
    assert.equal(payment?.amount, 7499);
  });

  test('refund of the lifetime purchase (CANCELLATION / CUSTOMER_SUPPORT) takes it away and marks the Payment', async () => {
    const id = await makeUser();
    const purchase = event('NON_RENEWING_PURCHASE', id, { product_id: 'bijbelquiz_premium_lifetime', expiration_at_ms: null });
    await send(purchase);
    await send(
      event('CANCELLATION', id, {
        product_id: 'bijbelquiz_premium_lifetime',
        cancel_reason: 'CUSTOMER_SUPPORT',
        transaction_id: purchase.event.transaction_id,
        expiration_at_ms: Date.now(),
      }),
    );
    const user = await account(id);
    assert.equal(user.hasLifetimePremium, false);
    assert.equal(user.premiumStore, false);
    assert.equal(user.isPremium, false);
    const payment = await Payment.findOne({ user: id }).lean();
    assert.equal(payment?.status, 'refunded');
    assert.ok(payment?.refundedAt);
  });

  test('refund of a subscription ends store Premium at once', async () => {
    const id = await makeUser();
    const purchase = event('INITIAL_PURCHASE', id);
    await send(purchase);
    await send(event('CANCELLATION', id, { cancel_reason: 'CUSTOMER_SUPPORT', transaction_id: purchase.event.transaction_id }));
    const user = await account(id);
    assert.equal(user.premiumStore, false);
    assert.equal(user.isPremium, false);
    assert.equal((await Payment.findOne({ user: id }).lean())?.status, 'refunded');
  });

  test('refund of a renewal marks only that renewal, not the first purchase', async () => {
    const id = await makeUser();
    // The stores give the first charge the original transaction id itself.
    const first = event('INITIAL_PURCHASE', id, { transaction_id: `otx-${id}` });
    await send(first);
    const renewal = event('RENEWAL', id);
    await send(renewal);
    await send(event('CANCELLATION', id, { cancel_reason: 'CUSTOMER_SUPPORT', transaction_id: renewal.event.transaction_id }));
    const rows = await Payment.find({ user: id }).lean();
    const status = Object.fromEntries(rows.map((row) => [row.externalTransactionId, row.status]));
    assert.equal(status[`otx-${id}`], 'completed');
    assert.equal(status[renewal.event.transaction_id as string], 'refunded');
  });

  test('TRANSFER moves store Premium from one account to another', async () => {
    const from = await makeUser();
    const to = await makeUser();
    await send(event('INITIAL_PURCHASE', from));
    await send({
      event: {
        id: `transfer-${from}`,
        type: 'TRANSFER',
        app_user_id: to,
        transferred_from: [from],
        transferred_to: [to],
        entitlement_ids: ['premium'],
        store: 'APP_STORE',
        environment: 'PRODUCTION',
        event_timestamp_ms: Date.now(),
      },
    });
    assert.equal((await account(from)).premiumStore, false);
    assert.equal((await account(from)).isPremium, false);
    assert.equal((await account(to)).premiumStore, true);
  });

  test('an anonymous app_user_id is matched through its aliases', async () => {
    const id = await makeUser();
    await send(event('INITIAL_PURCHASE', '$RCAnonymousID:1234', { original_app_user_id: '$RCAnonymousID:1234', aliases: ['$RCAnonymousID:1234', id] }));
    assert.equal((await account(id)).premiumStore, true);
  });

  test('an unknown customer is acknowledged and ignored', async () => {
    const result = await send(event('INITIAL_PURCHASE', new mongoose.Types.ObjectId().toString()));
    assert.equal(result.body.ignored, 'unknown_app_user_id');
  });

  test('an event for another entitlement is ignored', async () => {
    const id = await makeUser();
    const result = await send(event('INITIAL_PURCHASE', id, { entitlement_ids: ['something_else'], product_id: 'other_product' }));
    assert.equal(result.body.ignored, 'other_entitlement');
    assert.equal((await account(id)).premiumStore, false);
  });

  test('sandbox purchases are recorded as sandbox', async () => {
    const id = await makeUser();
    await send(event('INITIAL_PURCHASE', id, { environment: 'SANDBOX' }));
    const payment = await Payment.findOne({ user: id }).lean();
    assert.equal(payment?.environment, 'sandbox');
    assert.equal((await account(id)).premiumStore, true);
  });

  test('two payments in a row from different users both land (Payment indexes)', async () => {
    const a = await makeUser();
    const b = await makeUser();
    await send(event('INITIAL_PURCHASE', a));
    await send(event('INITIAL_PURCHASE', b));
    await Payment.create({ user: a, provider: 'stripe', stripeSessionId: `cs_${a}`, amount: 3999, status: 'completed' });
    await Payment.create({ user: b, provider: 'stripe', stripeSessionId: `cs_${b}`, amount: 3999, status: 'completed' });
    assert.equal(await Payment.countDocuments({ user: { $in: [a, b] } }), 4);
  });
});

// ---------------------------------------------------------------------------
// Never clobber another source
// ---------------------------------------------------------------------------

describe('other Premium sources survive store events', () => {
  test('Stripe Premium survives a store EXPIRATION', async () => {
    const id = await makeUser({ premiumStripe: true, isPremium: true });
    await send(event('INITIAL_PURCHASE', id));
    await send(event('EXPIRATION', id));
    const user = await account(id);
    assert.equal(user.premiumStore, false);
    assert.equal(user.premiumStripe, true);
    assert.equal(user.isPremium, true);
  });

  test('manual (admin) Premium survives a store EXPIRATION', async () => {
    const id = await makeUser({ isPremium: true });
    await send(event('EXPIRATION', id));
    assert.equal((await account(id)).isPremium, true);
  });

  test('Stripe lifetime survives a store lifetime refund', async () => {
    const id = await makeUser({ premiumStripe: true, hasLifetimePremium: true, isPremium: true });
    await Payment.create({ user: id, provider: 'stripe', planType: 'lifetime', stripeSessionId: `cs_life_${id}`, amount: 7499, status: 'completed' });
    await send(event('NON_RENEWING_PURCHASE', id, { product_id: 'bijbelquiz_premium_lifetime', expiration_at_ms: null }));
    await send(event('CANCELLATION', id, { product_id: 'bijbelquiz_premium_lifetime', cancel_reason: 'CUSTOMER_SUPPORT' }));
    const user = await account(id);
    assert.equal(user.hasLifetimePremium, true);
    assert.equal(user.isPremium, true);
  });

  test('group Premium is still reported after a store EXPIRATION', async () => {
    const id = await makeUser({ groupPremiumUntil: new Date(Date.now() + 30 * DAY) });
    await send(event('INITIAL_PURCHASE', id));
    await send(event('EXPIRATION', id));
    const user = await account(id);
    assert.equal(user.premiumStore, false);
    const payload = mobilePremiumPayload(user);
    assert.equal(payload.isPremium, true);
    assert.equal(payload.premiumSource, 'group');
  });
});

// ---------------------------------------------------------------------------
// REST API path (sync endpoint + webhook with a secret key)
// ---------------------------------------------------------------------------

function fakeRevenueCat(subscriber: Record<string, unknown>) {
  const calls: string[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push(url);
    assert.match(String((init?.headers as Record<string, string>)?.Authorization), /^Bearer sk_test/);
    return new Response(JSON.stringify({ subscriber }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { calls, fetchImpl };
}

describe('sync with the RevenueCat REST API', () => {
  test('without a secret key: answers with the account as it stands', async () => {
    const id = await makeUser({ premiumStripe: true, isPremium: true });
    const result = await syncMobilePremium(id);
    assert.equal(result?.synced, 'skipped');
    assert.equal(result?.isPremium, true);
    assert.equal(result?.premiumSource, 'stripe');
  });

  test('with a secret key: Premium shows at once after a purchase', async () => {
    process.env.REVENUECAT_SECRET_KEY = 'sk_test_123';
    const id = await makeUser();
    const { calls, fetchImpl } = fakeRevenueCat({
      entitlements: { premium: { expires_date: new Date(Date.now() + 7 * DAY).toISOString(), product_identifier: 'bijbelquiz_premium_yearly' } },
      subscriptions: { bijbelquiz_premium_yearly: { period_type: 'trial', store: 'app_store', is_sandbox: true } },
    });
    const result = await syncMobilePremium(id, { fetchImpl });
    assert.equal(calls.length, 1);
    assert.ok(calls[0].endsWith(`/subscribers/${id}`));
    assert.equal(result?.synced, 'revenuecat');
    assert.equal(result?.isPremium, true);
    assert.equal(result?.premiumSource, 'store');
  });

  test('with a secret key: a lapsed subscription is removed, Stripe kept', async () => {
    process.env.REVENUECAT_SECRET_KEY = 'sk_test_123';
    const id = await makeUser({ premiumStore: true, premiumStripe: true, isPremium: true });
    const { fetchImpl } = fakeRevenueCat({
      entitlements: { premium: { expires_date: new Date(Date.now() - DAY).toISOString(), product_identifier: 'bijbelquiz_premium_monthly' } },
    });
    const result = await syncMobilePremium(id, { fetchImpl });
    assert.equal(result?.premiumStore, false);
    assert.equal(result?.isPremium, true);
    assert.equal(result?.premiumSource, 'stripe');
  });

  test('a failing RevenueCat call still answers with the account', async () => {
    process.env.REVENUECAT_SECRET_KEY = 'sk_test_123';
    const id = await makeUser({ groupPremiumUntil: new Date(Date.now() + DAY) });
    const result = await syncMobilePremium(id, { fetchImpl: async () => new Response('nope', { status: 500 }) });
    assert.equal(result?.synced, 'failed');
    assert.equal(result?.isPremium, true);
  });

  test('webhook with a secret key uses the REST state, and still records the Payment', async () => {
    process.env.REVENUECAT_SECRET_KEY = 'sk_test_123';
    const id = await makeUser();
    const { calls, fetchImpl } = fakeRevenueCat({
      entitlements: { premium: { expires_date: null, product_identifier: 'bijbelquiz_premium_lifetime' } },
      non_subscriptions: { bijbelquiz_premium_lifetime: [{ id: 'x' }] },
    });
    const result = await processRevenueCatWebhook(
      event('NON_RENEWING_PURCHASE', id, { product_id: 'bijbelquiz_premium_lifetime', expiration_at_ms: null }),
      { fetchImpl },
    );
    assert.equal(result.body.source, 'revenuecat_rest_api');
    assert.equal(calls.length, 1);
    const user = await account(id);
    assert.equal(user.hasLifetimePremium, true);
    assert.equal(user.isPremium, true);
    assert.equal(await Payment.countDocuments({ user: id }), 1);
  });
});
