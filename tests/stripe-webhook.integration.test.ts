import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { NextRequest } from 'next/server';
import type Stripe from 'stripe';

import { GET as cronGET } from '@/app/api/cron/trial-reminder/route';
import { POST } from '@/app/api/webhook/stripe/route';
import { AnalyticsEvent, connectDB, GroupLicense, Payment, User, WebhookEvent } from '@/database';
import { getPremiumSnapshot, updateUserPremiumFromStore } from '@/lib/premium-state';
import stripe from '@/lib/stripe';
import { applyCheckoutSession } from '@/lib/stripe-billing';
import { runTrialReminders, sendTrialReminder } from '@/lib/trial-reminder';

/**
 * The Stripe webhook end to end: real signed events (built with Stripe's own
 * `generateTestHeaderString`) posted to the route handler, against a real
 * mongod (mongodb-memory-server). Stripe API calls the handler makes
 * (retrieving a subscription, looking up an invoice) are stubbed on the shared
 * client; nothing leaves this machine.
 */

// Read by the code at call time, so setting them here (after the imports) is enough.
const SECRET = 'whsec_test_bijbelquiz';
process.env.STRIPE_WEBHOOK_SECRET = SECRET;
process.env.STRIPE_PRICE_MONTHLY = 'price_monthly';
process.env.STRIPE_PRICE_YEARLY = 'price_yearly';
process.env.STRIPE_PRICE_LIFETIME = 'price_lifetime';
process.env.STRIPE_PRICE_GROUP = 'price_group';
delete process.env.SMTP_HOST;
delete process.env.CRON_SECRET;

let mongod: MongoMemoryServer;

/** Subscriptions `stripe.subscriptions.retrieve` returns, by id. */
const remoteSubscriptions = new Map<string, Stripe.Subscription>();

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('bijbelquiz-stripe-test');
  await connectDB();
  await Promise.all([Payment.init(), User.init(), WebhookEvent.init(), GroupLicense.init(), AnalyticsEvent.init()]);

  const subscriptions = stripe.subscriptions as unknown as Record<string, unknown>;
  subscriptions.retrieve = async (id: string) => {
    const found = remoteSubscriptions.get(id);
    if (!found) throw Object.assign(new Error(`No such subscription: ${id}`), { code: 'resource_missing' });
    return found;
  };
  (stripe.invoicePayments as unknown as Record<string, unknown>).list = async () => ({ data: [] });
  (stripe.checkout.sessions as unknown as Record<string, unknown>).list = async () => ({ data: [] });
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(() => {
  remoteSubscriptions.clear();
});

/* ── Fixtures ─────────────────────────────────────────────────────────────── */

const DAY = 24 * 60 * 60;
const nowUnix = () => Math.floor(Date.now() / 1000);
let counter = 0;
const nextId = (prefix: string) => `${prefix}_${(counter += 1).toString().padStart(6, '0')}`;

async function makeUser(extra: Record<string, unknown> = {}) {
  counter += 1;
  const user = await User.create({ email: `stripe-${counter}@test.local`, name: `Koper ${counter}`, ...extra });
  return String(user._id);
}

async function readUser(id: string) {
  return User.findById(id).lean();
}

function subscription(input: {
  id?: string;
  customer: string;
  userId?: string;
  status: Stripe.Subscription.Status;
  priceId?: string;
  interval?: 'month' | 'year';
  amount?: number;
  metadataPlan?: string;
  periodEnd?: number;
  trialStart?: number | null;
  trialEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
}): Stripe.Subscription {
  const start = nowUnix();
  return {
    id: input.id ?? nextId('sub'),
    object: 'subscription',
    customer: input.customer,
    status: input.status,
    livemode: false,
    currency: 'eur',
    cancel_at_period_end: Boolean(input.cancelAtPeriodEnd),
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
    trial_start: input.trialStart ?? null,
    trial_end: input.trialEnd ?? null,
    metadata: { ...(input.userId ? { userId: input.userId } : {}), plan: input.metadataPlan ?? 'monthly' },
    items: {
      object: 'list',
      data: [
        {
          id: nextId('si'),
          object: 'subscription_item',
          quantity: 1,
          current_period_start: start,
          current_period_end: input.periodEnd ?? start + 30 * DAY,
          price: {
            id: input.priceId ?? 'price_monthly',
            object: 'price',
            currency: 'eur',
            unit_amount: input.amount ?? 599,
            recurring: { interval: input.interval ?? 'month', interval_count: 1 },
          },
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}

function checkoutSession(input: {
  userId: string;
  plan: string;
  mode: 'payment' | 'subscription';
  customer: string;
  amount: number;
  paymentStatus?: Stripe.Checkout.Session.PaymentStatus;
  status?: Stripe.Checkout.Session.Status;
  subscription?: string | null;
  invoice?: string | null;
  paymentIntent?: string | null;
}): Stripe.Checkout.Session {
  return {
    id: nextId('cs_test'),
    object: 'checkout.session',
    mode: input.mode,
    status: input.status ?? 'complete',
    payment_status: input.paymentStatus ?? 'paid',
    customer: input.customer,
    customer_email: null,
    customer_details: { email: null },
    client_reference_id: input.userId,
    amount_total: input.amount,
    currency: 'eur',
    livemode: false,
    metadata: { userId: input.userId, plan: input.plan, returnPath: '/quizzen' },
    subscription: input.subscription ?? null,
    invoice: input.invoice ?? null,
    payment_intent: input.paymentIntent ?? null,
  } as unknown as Stripe.Checkout.Session;
}

function invoice(input: {
  id?: string;
  customer: string;
  subscription: string;
  userId?: string;
  plan?: string;
  amountPaid: number;
  amountDue?: number;
  billingReason: Stripe.Invoice.BillingReason;
  priceId?: string;
  paymentIntent?: string;
}): Stripe.Invoice {
  const start = nowUnix();
  return {
    id: input.id ?? nextId('in'),
    object: 'invoice',
    customer: input.customer,
    currency: 'eur',
    livemode: false,
    amount_paid: input.amountPaid,
    amount_due: input.amountDue ?? input.amountPaid,
    billing_reason: input.billingReason,
    period_start: start,
    period_end: start,
    status_transitions: { paid_at: start },
    parent: {
      type: 'subscription_details',
      quote_details: null,
      subscription_details: {
        subscription: input.subscription,
        metadata: { ...(input.userId ? { userId: input.userId } : {}), plan: input.plan ?? 'monthly' },
      },
    },
    lines: {
      object: 'list',
      data: [
        {
          id: nextId('il'),
          amount: input.amountDue ?? input.amountPaid,
          period: { start, end: start + 30 * DAY },
          pricing: { type: 'price_details', price_details: { price: input.priceId ?? 'price_monthly', product: 'prod_x' } },
        },
      ],
    },
    ...(input.paymentIntent
      ? { payments: { object: 'list', data: [{ payment: { type: 'payment_intent', payment_intent: input.paymentIntent } }] } }
      : {}),
  } as unknown as Stripe.Invoice;
}

/* ── Sending signed events ────────────────────────────────────────────────── */

interface Sent {
  status: number;
  body: Record<string, unknown>;
  eventId: string;
}

async function postRaw(payload: string, signature: string | null): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (signature !== null) headers['stripe-signature'] = signature;
  const response = await POST(
    new NextRequest('http://localhost:3100/api/webhook/stripe', { method: 'POST', body: payload, headers }),
  );
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

async function send(
  type: string,
  object: unknown,
  options: { id?: string; created?: number; previous?: Record<string, unknown> } = {},
): Promise<Sent> {
  const eventId = options.id ?? nextId('evt');
  const payload = JSON.stringify({
    id: eventId,
    object: 'event',
    api_version: '2026-02-25.clover',
    created: options.created ?? nowUnix(),
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type,
    data: { object, ...(options.previous ? { previous_attributes: options.previous } : {}) },
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  return { ...(await postRaw(payload, signature)), eventId };
}

async function stripePayments(userId: string) {
  return Payment.find({ user: userId, provider: 'stripe' }).sort({ createdAt: 1 }).lean();
}

/* ── Signature and idempotency ────────────────────────────────────────────── */

test('refuses a missing or forged signature and ignores event types it does not handle', async () => {
  const payload = JSON.stringify({ id: 'evt_x', object: 'event', type: 'invoice.paid', data: { object: {} } });
  assert.equal((await postRaw(payload, null)).status, 400);

  const forged = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_someone_else' });
  assert.equal((await postRaw(payload, forged)).status, 400);

  const tampered = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  assert.equal((await postRaw(payload.replace('invoice.paid', 'invoice.voided'), tampered)).status, 400);

  const ignored = await send('customer.created', { id: 'cus_ignored', object: 'customer' });
  assert.equal(ignored.status, 200);
  assert.equal(ignored.body.ignored, 'customer.created');
});

/* ── Yearly with trial ────────────────────────────────────────────────────── */

test('yearly with a 7-day trial: trial, reminder date, conversion and the real renewal amount', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const start = nowUnix();
  const trialEnd = start + 7 * DAY;
  const sub = subscription({
    customer,
    userId,
    status: 'trialing',
    priceId: 'price_yearly',
    interval: 'year',
    amount: 3999,
    metadataPlan: 'yearly',
    periodEnd: trialEnd,
    trialStart: start,
    trialEnd,
  });
  remoteSubscriptions.set(sub.id, sub);
  const trialInvoiceId = nextId('in');

  const session = checkoutSession({
    userId,
    plan: 'yearly',
    mode: 'subscription',
    customer,
    amount: 0,
    paymentStatus: 'no_payment_required',
    subscription: sub.id,
    invoice: trialInvoiceId,
  });

  const completed = await send('checkout.session.completed', session, { created: start });
  assert.equal(completed.status, 200);
  assert.equal(completed.body.result, 'premium_on');

  let user = await readUser(userId);
  assert.equal(user?.isPremium, true);
  assert.equal(user?.premiumStripe, true);
  assert.equal(user?.stripeCustomerId, customer);
  assert.equal(user?.stripeSubscriptionStatus, 'trialing');
  assert.equal(user?.stripeSubscriptionPlan, 'yearly');
  assert.equal(user?.stripeTrialEnd?.getTime(), trialEnd * 1000);
  // Day 5 of 7: four days after the start.
  assert.equal(user?.stripeTrialReminderAt?.getTime(), (start + 4 * DAY) * 1000);

  // Stripe delivers again: nothing new.
  const repeat = await send('checkout.session.completed', session, { id: completed.eventId, created: start });
  assert.equal(repeat.status, 200);
  assert.equal(repeat.body.duplicate, true);

  // The subscription.created event (older than the state we fetched) changes nothing.
  const created = await send('customer.subscription.created', sub, { created: start - 5 });
  assert.equal(created.body.result, 'stale_event');

  // The trial's EUR 0 invoice lands on the same row as the checkout.
  await send(
    'invoice.paid',
    invoice({ id: trialInvoiceId, customer, subscription: sub.id, userId, plan: 'yearly', amountPaid: 0, billingReason: 'subscription_create', priceId: 'price_yearly' }),
  );
  let payments = await stripePayments(userId);
  assert.equal(payments.length, 1);
  assert.equal(payments[0].status, 'trial');
  assert.equal(payments[0].amount, 0);
  assert.equal(payments[0].stripeSessionId, session.id);
  assert.equal(payments[0].environment, 'sandbox');

  // Trial over: Stripe charges the year.
  const active = subscription({ ...sub, id: sub.id, customer, userId, status: 'active', priceId: 'price_yearly', interval: 'year', amount: 3999, metadataPlan: 'yearly', periodEnd: trialEnd + 365 * DAY, trialStart: start, trialEnd });
  const converted = await send('customer.subscription.updated', active, { created: nowUnix() + 10, previous: { status: 'trialing' } });
  assert.equal(converted.body.result, 'premium_on');
  const renewal = await send(
    'invoice.paid',
    invoice({ customer, subscription: sub.id, userId, plan: 'yearly', amountPaid: 3999, billingReason: 'subscription_cycle', priceId: 'price_yearly', paymentIntent: 'pi_yearly_1' }),
  );
  assert.equal(renewal.body.result, 'invoice_recorded');
  // Stripe sends invoice.payment_succeeded for the same invoice too.
  user = await readUser(userId);
  assert.equal(user?.stripeSubscriptionStatus, 'active');
  assert.equal(user?.stripeTrialReminderAt, null);

  payments = await stripePayments(userId);
  assert.equal(payments.length, 2);
  const paid = payments.find((payment) => payment.billingReason === 'subscription_cycle');
  assert.equal(paid?.amount, 3999);
  assert.equal(paid?.currency, 'eur');
  assert.equal(paid?.status, 'completed');
  assert.equal(paid?.planType, 'yearly');
  assert.equal(paid?.stripePaymentIntentId, 'pi_yearly_1');

  const conversions = await AnalyticsEvent.countDocuments({ name: 'trial_converted', userId });
  assert.equal(conversions, 1);
  const trials = await AnalyticsEvent.countDocuments({ name: 'trial_started', userId });
  assert.equal(trials, 1, 'one trial_started despite the duplicate delivery');
});

test('invoice.paid and invoice.payment_succeeded for one invoice make one row', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const sub = nextId('sub');
  const inv = invoice({ customer, subscription: sub, userId, amountPaid: 599, billingReason: 'subscription_cycle' });
  await send('invoice.payment_succeeded', inv);
  await send('invoice.paid', inv);
  const payments = await stripePayments(userId);
  assert.equal(payments.length, 1);
  assert.equal(payments[0].amount, 599);
});

/* ── Monthly: renewals, failures, past_due, unpaid ────────────────────────── */

test('monthly: first payment, renewals at their real amount, failed payment, past_due keeps access, unpaid ends it', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const sub = subscription({ customer, userId, status: 'active', amount: 599 });
  remoteSubscriptions.set(sub.id, sub);
  const firstInvoice = nextId('in');

  await send('checkout.session.completed', checkoutSession({ userId, plan: 'monthly', mode: 'subscription', customer, amount: 599, subscription: sub.id, invoice: firstInvoice }));
  await send('invoice.paid', invoice({ id: firstInvoice, customer, subscription: sub.id, userId, amountPaid: 599, billingReason: 'subscription_create' }));

  let user = await readUser(userId);
  assert.equal(user?.isPremium, true);
  assert.equal(user?.stripeSubscriptionPlan, 'monthly');

  // Next month: the card fails first, Stripe retries and it goes through.
  const renewalId = nextId('in');
  await send('invoice.payment_failed', invoice({ id: renewalId, customer, subscription: sub.id, amountPaid: 0, amountDue: 599, billingReason: 'subscription_cycle' }));
  await send('customer.subscription.updated', subscription({ ...sub, id: sub.id, customer, status: 'past_due' }), { created: nowUnix() + 1 });
  user = await readUser(userId);
  assert.equal(user?.isPremium, true, 'past_due keeps Premium while Stripe retries');
  let payments = await stripePayments(userId);
  assert.equal(payments.find((payment) => payment.stripeInvoiceId === renewalId)?.status, 'failed');

  await send('invoice.paid', invoice({ id: renewalId, customer, subscription: sub.id, amountPaid: 599, billingReason: 'subscription_cycle' }));
  // A late duplicate of the failure does not undo the payment.
  await send('invoice.payment_failed', invoice({ id: renewalId, customer, subscription: sub.id, amountPaid: 0, amountDue: 599, billingReason: 'subscription_cycle' }));
  payments = await stripePayments(userId);
  assert.equal(payments.length, 2);
  assert.ok(payments.every((payment) => payment.status === 'completed' && payment.amount === 599));

  // A later month fails for good.
  await send('customer.subscription.updated', subscription({ ...sub, id: sub.id, customer, status: 'unpaid' }), { created: nowUnix() + 2 });
  user = await readUser(userId);
  assert.equal(user?.premiumStripe, false);
  assert.equal(user?.isPremium, false);
});

/* ── Cancellation in the portal, plan switch ──────────────────────────────── */

test('cancelled in the portal: Premium until the period ends, then off', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const sub = subscription({ customer, userId, status: 'active' });
  await send('customer.subscription.created', sub, { created: nowUnix() - 10 });
  assert.equal((await readUser(userId))?.isPremium, true);

  await send('customer.subscription.updated', { ...sub, cancel_at_period_end: true }, { created: nowUnix() - 5, previous: { cancel_at_period_end: false } });
  let user = await readUser(userId);
  assert.equal(user?.isPremium, true, 'keeps what was paid for');
  assert.equal(user?.stripeCancelAtPeriodEnd, true);

  await send('customer.subscription.deleted', { ...sub, status: 'canceled', cancel_at_period_end: false }, { created: nowUnix() });
  user = await readUser(userId);
  assert.equal(user?.isPremium, false);
  assert.equal(user?.stripeSubscriptionStatus, 'canceled');
});

test('a switch from monthly to yearly in the portal is read from the price, not the old metadata', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const sub = subscription({ customer, userId, status: 'active', metadataPlan: 'monthly' });
  await send('customer.subscription.created', sub, { created: nowUnix() - 10 });
  assert.equal((await readUser(userId))?.stripeSubscriptionPlan, 'monthly');

  const switched = subscription({ id: sub.id, customer, userId, status: 'active', metadataPlan: 'monthly', priceId: 'price_yearly', interval: 'year', amount: 3999 });
  await send('customer.subscription.updated', switched, { created: nowUnix() });
  const user = await readUser(userId);
  assert.equal(user?.stripeSubscriptionPlan, 'yearly');
  assert.equal(user?.stripePriceAmount, 3999);
});

test('events out of order: an older "active" after "deleted" does not reopen Premium', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const sub = subscription({ customer, userId, status: 'active' });
  const t = nowUnix();
  await send('customer.subscription.deleted', { ...sub, status: 'canceled' }, { created: t });
  const late = await send('customer.subscription.updated', sub, { created: t - 60 });
  assert.equal(late.body.result, 'stale_event');
  assert.equal((await readUser(userId))?.isPremium, false);
});

test('an old subscription ending does not switch off a newer running one', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const oldSub = subscription({ customer, userId, status: 'active' });
  const newSub = subscription({ customer, userId, status: 'active' });
  await send('customer.subscription.created', oldSub, { created: nowUnix() - 100 });
  await send('customer.subscription.created', newSub, { created: nowUnix() - 50 });
  const ended = await send('customer.subscription.deleted', { ...oldSub, status: 'canceled' }, { created: nowUnix() });
  assert.equal(ended.body.result, 'ignored_other_subscription');
  const user = await readUser(userId);
  assert.equal(user?.isPremium, true);
  assert.equal(user?.stripeSubscriptionId, newSub.id);
});

/* ── Premium from other sources survives ──────────────────────────────────── */

test('a Stripe subscription ending never clobbers store, lifetime, manual or group Premium', async () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ['store (RevenueCat)', { premiumStore: true, storePremiumExpiresAt: new Date(Date.now() + 30 * DAY * 1000), isPremium: true }],
    ['lifetime', { hasLifetimePremium: true, isPremium: true }],
    ['manual grant', { isPremium: true }],
    ['group licence', { groupPremiumUntil: new Date(Date.now() + 30 * DAY * 1000) }],
  ];

  for (const [label, fields] of cases) {
    const userId = await makeUser(fields);
    const customer = nextId('cus');
    const sub = subscription({ customer, userId, status: 'active' });
    await send('customer.subscription.created', sub, { created: nowUnix() - 10 });
    await send('customer.subscription.deleted', { ...sub, status: 'canceled' }, { created: nowUnix() });
    const user = await readUser(userId);
    assert.equal(user?.premiumStripe, false, label);
    assert.equal(getPremiumSnapshot(user!).isPremium, true, `${label} keeps Premium`);
    if (label !== 'group licence') assert.equal(user?.isPremium, true, `${label}: stored flag stays on`);
  }
});

test('a store purchase ending does not switch off a running Stripe subscription', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  await send('customer.subscription.created', subscription({ customer, userId, status: 'active' }));
  await updateUserPremiumFromStore(userId, true, new Date(Date.now() + DAY * 1000));
  await updateUserPremiumFromStore(userId, false, null);
  const user = await readUser(userId);
  assert.equal(user?.premiumStripe, true);
  assert.equal(user?.isPremium, true);
});

/* ── Lifetime: payment, refunds, disputes, async ──────────────────────────── */

test('lifetime: paid once, partial refund keeps it, full refund takes it away', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const pi = nextId('pi');
  const done = await send('checkout.session.completed', checkoutSession({ userId, plan: 'lifetime', mode: 'payment', customer, amount: 7499, paymentIntent: pi }));
  assert.equal(done.body.result, 'lifetime_on');

  let user = await readUser(userId);
  assert.equal(user?.hasLifetimePremium, true);
  assert.equal(user?.isPremium, true);
  let [payment] = await stripePayments(userId);
  assert.equal(payment.amount, 7499);
  assert.equal(payment.status, 'completed');
  assert.equal(payment.planType, 'lifetime');
  assert.equal(payment.stripePaymentIntentId, pi);

  const charge = { id: nextId('ch'), object: 'charge', amount: 7499, payment_intent: pi, livemode: false };
  await send('charge.refunded', { ...charge, refunded: false, amount_refunded: 2000 });
  user = await readUser(userId);
  assert.equal(user?.hasLifetimePremium, true, 'a partial refund keeps the licence');
  [payment] = await stripePayments(userId);
  assert.equal(payment.amountRefunded, 2000);
  assert.equal(payment.status, 'completed');

  const full = await send('charge.refunded', { ...charge, refunded: true, amount_refunded: 7499 });
  assert.equal(full.body.result, 'refunded:lifetime_off');
  user = await readUser(userId);
  assert.equal(user?.hasLifetimePremium, false);
  assert.equal(user?.isPremium, false);
  [payment] = await stripePayments(userId);
  assert.equal(payment.status, 'refunded');
});

test('lifetime refunded while a subscription runs: the subscription keeps Premium', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const pi = nextId('pi');
  await send('customer.subscription.created', subscription({ customer, userId, status: 'active' }));
  await send('checkout.session.completed', checkoutSession({ userId, plan: 'lifetime', mode: 'payment', customer, amount: 7499, paymentIntent: pi }));
  await send('charge.refunded', { id: nextId('ch'), object: 'charge', amount: 7499, amount_refunded: 7499, refunded: true, payment_intent: pi });
  const user = await readUser(userId);
  assert.equal(user?.hasLifetimePremium, false);
  assert.equal(user?.isPremium, true);
});

test('lifetime chargeback: off while disputed, back on when won, off for good when lost', async () => {
  for (const outcome of ['won', 'lost'] as const) {
    const userId = await makeUser();
    const customer = nextId('cus');
    const pi = nextId('pi');
    await send('checkout.session.completed', checkoutSession({ userId, plan: 'lifetime', mode: 'payment', customer, amount: 7499, paymentIntent: pi }));
    const dispute = { id: nextId('dp'), object: 'dispute', amount: 7499, charge: nextId('ch'), payment_intent: pi, status: 'needs_response' };

    await send('charge.dispute.created', dispute);
    assert.equal((await readUser(userId))?.isPremium, false, 'disputed');
    assert.equal((await stripePayments(userId))[0].status, 'disputed');

    await send('charge.dispute.closed', { ...dispute, status: outcome });
    const user = await readUser(userId);
    const [payment] = await stripePayments(userId);
    if (outcome === 'won') {
      assert.equal(user?.hasLifetimePremium, true);
      assert.equal(payment.status, 'completed');
    } else {
      assert.equal(user?.isPremium, false);
      assert.equal(payment.status, 'refunded');
      assert.equal(payment.amountRefunded, 7499);
    }
  }
});

test('lifetime paid by a delayed method opens only when the payment succeeds', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const session = checkoutSession({ userId, plan: 'lifetime', mode: 'payment', customer, amount: 7499, paymentStatus: 'unpaid', paymentIntent: nextId('pi') });
  const pending = await send('checkout.session.completed', session);
  assert.equal(pending.body.result, 'payment_pending');
  assert.equal((await readUser(userId))?.isPremium, false);
  assert.equal((await stripePayments(userId))[0].status, 'pending');

  await send('checkout.session.async_payment_succeeded', { ...session, payment_status: 'paid' });
  assert.equal((await readUser(userId))?.hasLifetimePremium, true);
  assert.equal((await stripePayments(userId))[0].status, 'completed');

  const other = await makeUser();
  const failing = checkoutSession({ userId: other, plan: 'lifetime', mode: 'payment', customer: nextId('cus'), amount: 7499, paymentStatus: 'unpaid' });
  await send('checkout.session.completed', failing);
  await send('checkout.session.async_payment_failed', failing);
  assert.equal((await readUser(other))?.isPremium, false);
  assert.equal((await stripePayments(other))[0].status, 'failed');
});

test('the success page path: an open or unpaid session opens nothing', async () => {
  const userId = await makeUser();
  const open = checkoutSession({ userId, plan: 'lifetime', mode: 'payment', customer: nextId('cus'), amount: 7499, status: 'open', paymentStatus: 'unpaid' });
  const outcome = await applyCheckoutSession(open, { observedAt: new Date(), recordAnalytics: false });
  assert.equal(outcome.result, 'session_not_complete');
  assert.equal((await readUser(userId))?.isPremium, false);
  assert.equal(await Payment.countDocuments({ user: userId }), 0);
});

/* ── Group licence ───────────────────────────────────────────────────────── */

test('group licence: licence and code for the buyer, no personal subscription, ends on cancel, at once on refund', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const sub = subscription({ customer, userId, status: 'active', priceId: 'price_group', interval: 'year', amount: 9900, metadataPlan: 'group', periodEnd: nowUnix() + 365 * DAY });
  remoteSubscriptions.set(sub.id, sub);
  const firstInvoice = nextId('in');
  const pi = nextId('pi');

  const bought = await send('checkout.session.completed', checkoutSession({ userId, plan: 'group', mode: 'subscription', customer, amount: 9900, subscription: sub.id, invoice: firstInvoice }));
  assert.equal(bought.body.result, 'group_active');
  assert.match(String(bought.body.groupJoinCode), /^[A-Z2-9]{6}$/);

  await send('invoice.paid', invoice({ id: firstInvoice, customer, subscription: sub.id, userId, plan: 'group', amountPaid: 9900, billingReason: 'subscription_create', priceId: 'price_group', paymentIntent: pi }));

  let user = await readUser(userId);
  assert.equal(user?.premiumStripe, false, 'a group licence is not a personal subscription');
  assert.ok(user?.groupPremiumUntil && user.groupPremiumUntil.getTime() > Date.now() + 300 * DAY * 1000);
  const [payment] = await stripePayments(userId);
  assert.equal(payment.planType, 'group');
  assert.equal(payment.amount, 9900);

  await send('customer.subscription.deleted', { ...sub, status: 'canceled' });
  let license = await GroupLicense.findOne({ stripeSubscriptionId: sub.id }).lean();
  assert.equal(license?.status, 'cancelled');
  user = await readUser(userId);
  assert.ok(getPremiumSnapshot(user!).premiumGroup, 'members keep the term already paid');

  await send('charge.refunded', { id: nextId('ch'), object: 'charge', amount: 9900, amount_refunded: 9900, refunded: true, payment_intent: pi });
  license = await GroupLicense.findOne({ stripeSubscriptionId: sub.id }).lean();
  user = await readUser(userId);
  assert.equal(getPremiumSnapshot(user!).premiumGroup, false, 'refunded: access ends now');
  assert.ok(license?.expiresAt && license.expiresAt.getTime() <= Date.now());
});

/* ── Trial reminder ──────────────────────────────────────────────────────── */

async function trialingUser(options: { reminderInPast: boolean; cancelled?: boolean }) {
  const userId = await makeUser();
  const customer = nextId('cus');
  const start = options.reminderInPast ? nowUnix() - 4 * DAY - 60 : nowUnix();
  const sub = subscription({
    customer,
    userId,
    status: 'trialing',
    priceId: 'price_yearly',
    interval: 'year',
    amount: 3999,
    metadataPlan: 'yearly',
    periodEnd: start + 7 * DAY,
    trialStart: start,
    trialEnd: start + 7 * DAY,
    cancelAtPeriodEnd: options.cancelled,
  });
  await send('customer.subscription.created', sub, { created: nowUnix() - 1 });
  return { userId, sub };
}

test('trial_will_end webhook: the reminder is tied to the trial and only logged without SMTP', async () => {
  const { userId, sub } = await trialingUser({ reminderInPast: true });
  const sent = await send('customer.subscription.trial_will_end', sub, { created: nowUnix() });
  assert.equal(sent.body.result, 'trial_reminder:logged');
  assert.equal((await readUser(userId))?.stripeTrialReminderSentFor ?? null, null, 'not marked sent when nothing was mailed');
});

test('trial reminder: once per trial, never for a cancelled trial, retried after a failed send', async () => {
  const mails: Array<{ to: string; subject: string; text: string }> = [];
  const send = async (mail: { to: string; subject: string; text: string }) => {
    mails.push(mail);
  };

  const due = await trialingUser({ reminderInPast: true });
  const notYet = await trialingUser({ reminderInPast: false });
  const cancelled = await trialingUser({ reminderInPast: true, cancelled: true });

  const first = await runTrialReminders({ send, siteUrl: 'https://www.bijbelquiz.com' });
  assert.ok(first.sent >= 1);
  const dueEmail = (await readUser(due.userId))?.email;
  const mine = mails.filter((mail) => mail.to === dueEmail);
  assert.equal(mine.length, 1);
  assert.match(mine[0].text, /€39,99 per jaar/);
  assert.match(mine[0].text, /https:\/\/www\.bijbelquiz\.com\/premium/);
  assert.doesNotMatch(mine[0].text, /—/);

  const before = mails.length;
  await runTrialReminders({ send });
  assert.equal(mails.length, before, 'second run sends nothing new');
  assert.equal(await sendTrialReminder(due.userId, { send }), 'already_sent');
  assert.equal(await sendTrialReminder(notYet.userId, { send }), 'not_due');
  assert.equal(await sendTrialReminder(cancelled.userId, { send }), 'not_due');

  const flaky = await trialingUser({ reminderInPast: true });
  const failing = async () => {
    throw new Error('SMTP down');
  };
  assert.equal(await sendTrialReminder(flaky.userId, { send: failing }), 'failed');
  assert.equal(await sendTrialReminder(flaky.userId, { send }), 'sent', 'the claim was given back');
});

test('cron route: refused without CRON_SECRET or with a wrong one, runs with the right one', async () => {
  const request = (auth?: string) =>
    new NextRequest('http://localhost:3100/api/cron/trial-reminder', { headers: auth ? { authorization: auth } : {} });

  assert.equal((await cronGET(request('Bearer x'))).status, 503);
  process.env.CRON_SECRET = 'cron-test-secret';
  try {
    assert.equal((await cronGET(request())).status, 401);
    assert.equal((await cronGET(request('Bearer wrong'))).status, 401);
    const ok = await cronGET(request('Bearer cron-test-secret'));
    assert.equal(ok.status, 200);
    const body = (await ok.json()) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(typeof body.candidates, 'number');
  } finally {
    delete process.env.CRON_SECRET;
  }
});

/* ── Failure handling ────────────────────────────────────────────────────── */

test('a failed handler answers 500 and releases the event, so Stripe retry processes it', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const inv = invoice({ customer, subscription: nextId('sub'), userId, amountPaid: 599, billingReason: 'subscription_cycle' });

  const original = Payment.findOneAndUpdate;
  (Payment as unknown as Record<string, unknown>).findOneAndUpdate = () => {
    throw new Error('database hiccup');
  };
  let first: Sent;
  try {
    first = await send('invoice.paid', inv);
  } finally {
    (Payment as unknown as Record<string, unknown>).findOneAndUpdate = original;
  }
  assert.equal(first.status, 500);
  assert.equal(await WebhookEvent.countDocuments({ provider: 'stripe', eventId: first.eventId }), 0);

  const retry = await send('invoice.paid', inv, { id: first.eventId });
  assert.equal(retry.status, 200);
  assert.equal(retry.body.result, 'invoice_recorded');
  const stored = await WebhookEvent.findOne({ provider: 'stripe', eventId: first.eventId }).lean();
  assert.equal(stored?.status, 'processed');
  assert.equal((await stripePayments(userId)).length, 1);
});

test('many Stripe payments without a session id can coexist (partial unique indexes)', async () => {
  const userId = await makeUser();
  const customer = nextId('cus');
  const sub = nextId('sub');
  for (let index = 0; index < 3; index += 1) {
    await send('invoice.paid', invoice({ customer, subscription: sub, userId, amountPaid: 599, billingReason: 'subscription_cycle' }));
  }
  const payments = await stripePayments(userId);
  assert.equal(payments.length, 3);
  assert.equal(
    payments.reduce((sum, payment) => sum + payment.amount, 0),
    1797,
  );
});
