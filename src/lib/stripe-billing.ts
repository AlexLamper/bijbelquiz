import mongoose from 'mongoose';
import type Stripe from 'stripe';

import { connectDB, GroupLicense, Payment, User, WebhookEvent } from '@/database';
import { recordPurchase, recordServerEvent } from '@/lib/analytics/record';
import { endGroupLicense, grantGroupLicense } from '@/lib/group-license';
import { trialReminderDate } from '@/lib/premium-offer';
import { STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe-webhook-events';
import { recomputeUserPremium, subscriptionStatusGrantsPremium } from '@/lib/premium-state';
import stripe from '@/lib/stripe';
import { planForStripePrice, STRIPE_PLAN_IDS, type StripePlanId } from '@/lib/stripe-plans';
import { sendTrialReminder } from '@/lib/trial-reminder';

/**
 * Everything a Stripe event changes in our database, in one place.
 *
 * The webhook (`/api/webhook/stripe`) verifies the signature, claims the event
 * id once (`WebhookEvent`) and hands it to `processStripeEvent`. The success
 * page calls `applyCheckoutSession` with the same session so Premium opens at
 * once even when the webhook is slow; every write here is an upsert or a
 * conditional update, so running a step twice changes nothing.
 *
 * Money and access are kept apart:
 * - `Payment` rows are money: one per invoice for subscriptions (the first
 *   charge and every renewal, with the real amount), one per checkout for a
 *   lifetime purchase, updated on refunds and disputes.
 * - Premium follows the subscription status (`premium-state.ts`): trialing,
 *   active and past_due keep it, so a member who cancels keeps Premium until
 *   the period they paid for ends (`customer.subscription.deleted`).
 */

export { STRIPE_WEBHOOK_EVENTS };

const HANDLED = new Set<string>(STRIPE_WEBHOOK_EVENTS);

const DAY_MS = 24 * 60 * 60 * 1000;
/** A group licence runs two days past its period, so a late renewal does not lock a room out. */
const GROUP_GRACE_MS = 2 * DAY_MS;

export interface StripeEventOutcome {
  /** Short machine-readable result, returned to Stripe and used by the tests. */
  result: string;
  userId?: string;
  plan?: StripePlanId;
  groupJoinCode?: string;
}

/* ── Small readers ───────────────────────────────────────────────────────── */

type Ref = string | { id: string } | null | undefined;

function idOf(value: Ref | unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id;
  }
  return null;
}

function toDate(unix: number | null | undefined): Date | null {
  return typeof unix === 'number' && Number.isFinite(unix) ? new Date(unix * 1000) : null;
}

function environmentOf(livemode: boolean | undefined): 'production' | 'sandbox' {
  return livemode ? 'production' : 'sandbox';
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
}

const PLAN_SET = new Set<string>(STRIPE_PLAN_IDS);

function knownPlan(value: unknown): StripePlanId | null {
  return typeof value === 'string' && PLAN_SET.has(value) ? (value as StripePlanId) : null;
}

/* ── Users ───────────────────────────────────────────────────────────────── */

interface UserRef {
  _id: mongoose.Types.ObjectId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  stripeSubscriptionPlan?: 'monthly' | 'yearly';
}

const USER_REF_FIELDS = '_id stripeCustomerId stripeSubscriptionId stripeSubscriptionStatus stripeSubscriptionPlan';

/**
 * The account a Stripe object belongs to: our user id in the metadata (set by
 * checkout), then the Stripe customer we stored, then the e-mail address the
 * buyer used in checkout.
 */
async function findUser(refs: { userId?: unknown; customerId?: string | null; email?: string | null }): Promise<UserRef | null> {
  if (isObjectId(refs.userId)) {
    const byId = await User.findById(refs.userId).select(USER_REF_FIELDS).lean<UserRef>();
    if (byId) return byId;
  }

  if (refs.customerId) {
    const byCustomer = await User.findOne({ stripeCustomerId: refs.customerId }).select(USER_REF_FIELDS).lean<UserRef>();
    if (byCustomer) return byCustomer;
  }

  const email = refs.email?.trim();
  if (email) {
    const byEmail = await User.findOne({ email: { $in: [...new Set([email, email.toLowerCase()])] } })
      .select(USER_REF_FIELDS)
      .lean<UserRef>();
    if (byEmail) return byEmail;
  }

  return null;
}

/* ── Subscriptions ───────────────────────────────────────────────────────── */

export interface SubscriptionFacts {
  id: string;
  customerId: string | null;
  status: string;
  plan: StripePlanId | null;
  priceId: string | null;
  amount: number | null;
  currency: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  /** Cancelled in the portal (or dashboard) but running out the paid period. */
  cancelAtPeriodEnd: boolean;
  trialStart: Date | null;
  trialEnd: Date | null;
  metadataUserId: string | null;
  livemode: boolean;
}

export function readSubscription(subscription: Stripe.Subscription): SubscriptionFacts {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  // Since API version 2025-03-31 the period lives on the item; older payloads
  // still carry it on the subscription.
  const legacy = subscription as unknown as { current_period_end?: number; current_period_start?: number };

  return {
    id: subscription.id,
    customerId: idOf(subscription.customer),
    status: subscription.status,
    plan: planForStripePrice({
      priceId: price?.id ?? null,
      interval: price?.recurring?.interval ?? null,
      metadataPlan: subscription.metadata?.plan ?? null,
    }),
    priceId: price?.id ?? null,
    amount: typeof price?.unit_amount === 'number' ? price.unit_amount * (item?.quantity ?? 1) : null,
    currency: price?.currency ?? subscription.currency ?? null,
    currentPeriodStart: toDate(item?.current_period_start ?? legacy.current_period_start),
    currentPeriodEnd: toDate(item?.current_period_end ?? legacy.current_period_end),
    cancelAtPeriodEnd:
      subscription.status !== 'canceled' && Boolean(subscription.cancel_at_period_end || subscription.cancel_at),
    trialStart: toDate(subscription.trial_start),
    trialEnd: toDate(subscription.trial_end),
    metadataUserId: subscription.metadata?.userId ?? null,
    livemode: Boolean(subscription.livemode),
  };
}

/** When the "trial ends soon" mail is due: day 5 of a 7-day trial. */
export function trialReminderAtFor(facts: Pick<SubscriptionFacts, 'status' | 'plan' | 'trialStart' | 'trialEnd'>): Date | null {
  if (facts.status !== 'trialing' || facts.plan !== 'yearly' || !facts.trialStart || !facts.trialEnd) return null;
  const trialDays = Math.round((facts.trialEnd.getTime() - facts.trialStart.getTime()) / DAY_MS);
  return trialReminderDate(facts.trialStart, trialDays);
}

async function applyGroupSubscription(facts: SubscriptionFacts, ownerId: string): Promise<StripeEventOutcome> {
  if (facts.status === 'active' || facts.status === 'trialing') {
    const { joinCode } = await grantGroupLicense({
      ownerId,
      stripeCustomerId: facts.customerId,
      stripeSubscriptionId: facts.id,
      expiresAt: facts.currentPeriodEnd ? new Date(facts.currentPeriodEnd.getTime() + GROUP_GRACE_MS) : undefined,
    });
    return { result: 'group_active', userId: ownerId, plan: 'group', groupJoinCode: joinCode };
  }

  // past_due: Stripe is retrying. The licence keeps the end date that was
  // paid for and is not extended until the renewal is paid.
  if (facts.status === 'past_due') return { result: 'group_past_due', userId: ownerId, plan: 'group' };

  // canceled, unpaid, incomplete_expired, paused: no renewal. Members keep
  // the term already paid for (`expiresAt`).
  await endGroupLicense(facts.id);
  return { result: 'group_ended', userId: ownerId, plan: 'group' };
}

/**
 * Bring the account in line with a subscription as Stripe describes it.
 *
 * `observedAt` is when that description was true (the event's `created`, or
 * "now" for an object fetched from the API). An older description arriving
 * after a newer one is dropped, because Stripe does not deliver events in
 * order.
 */
export async function applySubscription(
  subscription: Stripe.Subscription,
  observedAt: Date,
  options: { previousStatus?: string | null; userHint?: UserRef | null } = {},
): Promise<StripeEventOutcome> {
  const facts = readSubscription(subscription);
  const user = options.userHint ?? (await findUser({ userId: facts.metadataUserId, customerId: facts.customerId }));

  if (!user) {
    console.error('[stripe-billing] No account for subscription', facts.id, facts.customerId);
    return { result: 'user_not_found' };
  }

  const userId = String(user._id);

  if (facts.plan === 'group') return applyGroupSubscription(facts, userId);

  // A second subscription on the same account (an old one that ended, or a
  // new one after a cancellation): an ending one must not switch off the one
  // that is running.
  const fresh = await User.findById(user._id).select('stripeSubscriptionId stripeSubscriptionStatus').lean<UserRef>();
  if (
    fresh?.stripeSubscriptionId &&
    fresh.stripeSubscriptionId !== facts.id &&
    subscriptionStatusGrantsPremium(fresh.stripeSubscriptionStatus) &&
    !subscriptionStatusGrantsPremium(facts.status)
  ) {
    return { result: 'ignored_other_subscription', userId };
  }

  const personalPlan = facts.plan === 'monthly' || facts.plan === 'yearly' ? facts.plan : undefined;

  const written = await recomputeUserPremium(
    userId,
    {
      stripeCustomerId: facts.customerId ?? undefined,
      stripeSubscriptionId: facts.id,
      stripeSubscriptionStatus: facts.status,
      stripeSubscriptionPlan: personalPlan,
      stripeCurrentPeriodEnd: facts.currentPeriodEnd,
      stripeCancelAtPeriodEnd: facts.cancelAtPeriodEnd,
      stripeTrialStart: facts.trialStart,
      stripeTrialEnd: facts.trialEnd,
      stripePriceAmount: facts.amount,
      stripePriceCurrency: facts.currency,
      stripeSubscriptionEventAt: observedAt,
      stripeTrialReminderAt: trialReminderAtFor(facts),
    },
    {
      deriveStripe: true,
      filter: {
        $or: [
          { stripeSubscriptionId: { $ne: facts.id } },
          { stripeSubscriptionEventAt: null },
          { stripeSubscriptionEventAt: { $lte: observedAt } },
        ],
      },
    },
  );

  if (!written) return { result: 'stale_event', userId, plan: personalPlan };

  // The moment a free trial becomes revenue, reported apart from the original
  // `trial_started` so trial-to-paid can be measured.
  if (options.previousStatus === 'trialing' && facts.status === 'active') {
    await recordServerEvent('trial_converted', {
      userId,
      platform: 'web',
      props: { plan: personalPlan ?? 'monthly', provider: 'stripe' },
    });
  }

  return { result: written.premiumStripe ? 'premium_on' : 'premium_off', userId, plan: personalPlan };
}

async function retrieveSubscription(id: string): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(id);
  } catch (error) {
    console.warn('[stripe-billing] Could not retrieve subscription', id, error);
    return null;
  }
}

/* ── Payments ────────────────────────────────────────────────────────────── */

function isDuplicateKey(error: unknown): boolean {
  return (error as { code?: number })?.code === 11000;
}

/**
 * Upsert a Payment row. A duplicate-key error here means the legacy sparse
 * indexes are still in place in production (see betalingen-web.md): it is
 * rethrown so the webhook answers 500 and Stripe retries after the fix.
 */
async function upsertPayment(
  filter: Record<string, unknown>,
  update: { $setOnInsert?: Record<string, unknown>; $set?: Record<string, unknown> },
) {
  try {
    return await Payment.findOneAndUpdate(filter, update, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }).lean();
  } catch (error) {
    if (isDuplicateKey(error)) {
      console.error('[stripe-billing] Payment upsert hit a unique index. Are the old sparse Payment indexes dropped?', error);
    }
    throw error;
  }
}

/** Promote a row to a final status without undoing a refund or a dispute. */
async function settlePayment(paymentId: mongoose.Types.ObjectId | undefined, status: 'completed' | 'trial', extra: Record<string, unknown> = {}) {
  await Payment.updateOne(
    { _id: paymentId, status: { $in: ['pending', 'failed'] } },
    { $set: { status, ...extra } },
  );
}

/** Whether another completed lifetime purchase (web or app) still covers this account. */
async function otherLifetimeCovers(userId: mongoose.Types.ObjectId, excludePaymentId: mongoose.Types.ObjectId): Promise<boolean> {
  const other = await Payment.exists({
    _id: { $ne: excludePaymentId },
    user: userId,
    planType: 'lifetime',
    status: 'completed',
  });
  return Boolean(other);
}

/* ── Checkout ────────────────────────────────────────────────────────────── */

/**
 * Apply a finished checkout: Premium on, the Stripe customer remembered, the
 * first payment recorded.
 *
 * Used by the webhook (`checkout.session.completed` and the async payment
 * events) and by the success page. Only a `complete` session with its payment
 * done (or nothing to pay: a trial) unlocks anything; an open or unpaid
 * session id pasted into the success page opens nothing.
 */
export async function applyCheckoutSession(
  session: Stripe.Checkout.Session,
  context: { observedAt: Date; recordAnalytics: boolean },
): Promise<StripeEventOutcome> {
  if (session.status !== 'complete') return { result: 'session_not_complete' };

  const metadataPlan = knownPlan(session.metadata?.plan);
  const customerId = idOf(session.customer);
  const user = await findUser({
    userId: session.metadata?.userId ?? session.client_reference_id,
    customerId,
    email: session.customer_details?.email ?? session.customer_email,
  });

  if (!user) {
    console.error('[stripe-billing] No account for checkout session', session.id);
    return { result: 'user_not_found' };
  }

  const userId = String(user._id);
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  const environment = environmentOf(session.livemode);

  // Remember the customer, so the next checkout and the billing portal use it.
  if (customerId && user.stripeCustomerId !== customerId) {
    await User.updateOne({ _id: user._id }, { $set: { stripeCustomerId: customerId } });
  }

  if (session.mode === 'payment') {
    // Only lifetime is sold as a one-off. A payment without our plan in its
    // metadata (a payment link made by hand) is not ours to interpret.
    if (metadataPlan !== 'lifetime') return { result: 'ignored_unknown_payment', userId };

    const payment = await upsertPayment(
      { provider: 'stripe', stripeSessionId: session.id },
      {
        $setOnInsert: { user: user._id, provider: 'stripe', stripeSessionId: session.id, status: paid ? 'completed' : 'pending' },
        $set: {
          planType: 'lifetime',
          amount: session.amount_total ?? 0,
          currency: (session.currency || 'eur').toLowerCase(),
          stripePaymentIntentId: idOf(session.payment_intent) ?? undefined,
          stripeCustomerId: customerId ?? undefined,
          environment,
        },
      },
    );

    if (!paid) return { result: 'payment_pending', userId, plan: 'lifetime' };

    await settlePayment(payment?._id, 'completed', { paidAt: context.observedAt });
    const fresh = await Payment.findById(payment?._id).select('status').lean<{ status?: string }>();
    // A refund or a chargeback that was processed before this (late) event
    // keeps the licence off.
    if (fresh?.status !== 'completed') return { result: 'payment_reversed', userId, plan: 'lifetime' };

    await recomputeUserPremium(userId, { hasLifetimePremium: true });

    if (context.recordAnalytics) {
      await recordPurchase({
        userId,
        plan: 'lifetime',
        platform: 'web',
        provider: 'stripe',
        amountCents: session.amount_total ?? null,
        currency: session.currency ?? 'eur',
      });
    }

    return { result: 'lifetime_on', userId, plan: 'lifetime' };
  }

  if (session.mode !== 'subscription') return { result: 'ignored_mode', userId };

  const subscriptionId = idOf(session.subscription);
  const subscription =
    session.subscription && typeof session.subscription === 'object'
      ? (session.subscription as Stripe.Subscription)
      : subscriptionId
        ? await retrieveSubscription(subscriptionId)
        : null;
  const facts = subscription ? readSubscription(subscription) : null;
  const plan: StripePlanId = facts?.plan ?? metadataPlan ?? 'monthly';

  let outcome: StripeEventOutcome;

  if (plan === 'group') {
    const { joinCode } = await grantGroupLicense({
      ownerId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      expiresAt: facts?.currentPeriodEnd ? new Date(facts.currentPeriodEnd.getTime() + GROUP_GRACE_MS) : undefined,
    });
    outcome = { result: 'group_active', userId, plan, groupJoinCode: joinCode };
  } else if (subscription) {
    // Fetched just now, so this is the newest description there is.
    outcome = await applySubscription(subscription, new Date(), { userHint: user });
  } else if (paid && subscriptionId) {
    // Stripe unreachable: open Premium on the checkout's word, without an
    // event time, so the subscription events that follow overwrite it.
    await recomputeUserPremium(
      userId,
      {
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: session.payment_status === 'no_payment_required' ? 'trialing' : 'active',
        stripeSubscriptionPlan: plan === 'yearly' ? 'yearly' : 'monthly',
      },
      { deriveStripe: true },
    );
    outcome = { result: 'premium_on', userId, plan };
  } else {
    outcome = { result: 'payment_pending', userId, plan };
  }

  // The first invoice; `invoice.paid` fills in the same row (by invoice id).
  const invoiceId = idOf(session.invoice);
  const amount = session.amount_total ?? 0;
  const trial = amount === 0 && (facts?.status === 'trialing' || session.payment_status === 'no_payment_required');
  const firstStatus = !paid ? 'pending' : trial ? 'trial' : 'completed';
  const base = {
    user: user._id,
    provider: 'stripe',
    planType: plan,
    amount,
    currency: (session.currency || 'eur').toLowerCase(),
    stripeSubscriptionId: subscriptionId ?? undefined,
    stripeCustomerId: customerId ?? undefined,
    billingReason: 'subscription_create',
    environment,
    status: firstStatus,
  };

  if (invoiceId) {
    await upsertPayment(
      { provider: 'stripe', stripeInvoiceId: invoiceId },
      { $setOnInsert: { ...base, stripeInvoiceId: invoiceId }, $set: { stripeSessionId: session.id } },
    );
  } else {
    await upsertPayment({ provider: 'stripe', stripeSessionId: session.id }, { $setOnInsert: { ...base, stripeSessionId: session.id } });
  }

  if (context.recordAnalytics && paid) {
    await recordPurchase({
      userId,
      plan,
      platform: 'web',
      provider: 'stripe',
      isTrial: facts?.status === 'trialing',
      amountCents: session.amount_total ?? null,
      currency: session.currency ?? 'eur',
    });
  }

  return outcome;
}

async function failCheckoutPayment(session: Stripe.Checkout.Session): Promise<StripeEventOutcome> {
  await Payment.updateOne(
    { provider: 'stripe', stripeSessionId: session.id, status: 'pending' },
    { $set: { status: 'failed' } },
  );
  return { result: 'payment_failed' };
}

/* ── Invoices ────────────────────────────────────────────────────────────── */

interface InvoiceFacts {
  id: string;
  subscriptionId: string | null;
  customerId: string | null;
  metadataUserId: string | null;
  metadataPlan: string | null;
  priceId: string | null;
  interval: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  paidAt: Date | null;
}

function readInvoice(invoice: Stripe.Invoice): InvoiceFacts {
  // Newer API versions moved these under `parent` and `payments`; the
  // `legacy` reads keep events of older endpoint versions working.
  const legacy = invoice as unknown as {
    subscription?: Ref;
    payment_intent?: Ref;
    charge?: Ref;
    subscription_details?: { metadata?: Stripe.Metadata | null };
  };
  const details = invoice.parent?.subscription_details ?? null;
  const metadata = details?.metadata ?? legacy.subscription_details?.metadata ?? {};
  const line = invoice.lines?.data?.find((entry) => entry.amount > 0) ?? invoice.lines?.data?.[0];
  const linePrice = line?.pricing?.price_details?.price;
  const legacyLine = line as unknown as { price?: { id?: string; recurring?: { interval?: string } } } | undefined;
  const payment = invoice.payments?.data?.[0]?.payment;

  return {
    id: invoice.id ?? '',
    subscriptionId: idOf(details?.subscription) ?? idOf(legacy.subscription),
    customerId: idOf(invoice.customer),
    metadataUserId: metadata?.userId ?? null,
    metadataPlan: metadata?.plan ?? null,
    priceId: idOf(linePrice) ?? legacyLine?.price?.id ?? null,
    interval:
      (linePrice && typeof linePrice === 'object' ? linePrice.recurring?.interval : null) ??
      legacyLine?.price?.recurring?.interval ??
      null,
    paymentIntentId: idOf(payment?.payment_intent) ?? idOf(legacy.payment_intent),
    chargeId: idOf(payment?.charge) ?? idOf(legacy.charge),
    periodStart: toDate(line?.period?.start ?? invoice.period_start),
    periodEnd: toDate(line?.period?.end ?? invoice.period_end),
    paidAt: toDate(invoice.status_transitions?.paid_at),
  };
}

/**
 * Record a subscription invoice as a payment, with what was really charged.
 * Every renewal is its own row, so the admin revenue adds up.
 */
export async function recordInvoice(invoice: Stripe.Invoice, outcome: 'paid' | 'failed', observedAt: Date): Promise<StripeEventOutcome> {
  const facts = readInvoice(invoice);
  if (!facts.id || !facts.subscriptionId) return { result: 'ignored_not_subscription' };

  let user = await findUser({ userId: facts.metadataUserId, customerId: facts.customerId });
  if (!user) {
    const license = await GroupLicense.findOne({ stripeSubscriptionId: facts.subscriptionId }).select('ownerId').lean();
    if (license) user = await findUser({ userId: String(license.ownerId) });
  }
  if (!user) {
    console.error('[stripe-billing] No account for invoice', facts.id);
    return { result: 'user_not_found' };
  }

  const plan =
    planForStripePrice({ priceId: facts.priceId, interval: facts.interval, metadataPlan: facts.metadataPlan }) ??
    user.stripeSubscriptionPlan ??
    'monthly';

  const amount = outcome === 'paid' ? invoice.amount_paid : invoice.amount_due;
  const trial = outcome === 'paid' && invoice.amount_paid === 0 && invoice.billing_reason === 'subscription_create';
  const target = outcome === 'failed' ? 'failed' : trial ? 'trial' : 'completed';

  const payment = await upsertPayment(
    { provider: 'stripe', stripeInvoiceId: facts.id },
    {
      $setOnInsert: { user: user._id, provider: 'stripe', stripeInvoiceId: facts.id, status: target },
      $set: {
        planType: plan,
        amount,
        currency: (invoice.currency || 'eur').toLowerCase(),
        stripeSubscriptionId: facts.subscriptionId,
        stripeCustomerId: facts.customerId ?? undefined,
        stripePaymentIntentId: facts.paymentIntentId ?? undefined,
        stripeChargeId: facts.chargeId ?? undefined,
        billingReason: invoice.billing_reason ?? undefined,
        environment: environmentOf(invoice.livemode),
        periodStart: facts.periodStart ?? undefined,
        periodEnd: facts.periodEnd ?? undefined,
      },
    },
  );

  // A failed attempt never overwrites a paid row (Stripe does not promise the
  // order); a paid invoice settles an earlier failed attempt.
  if (target !== 'failed') await settlePayment(payment?._id, target, { paidAt: facts.paidAt ?? observedAt });

  return { result: outcome === 'paid' ? 'invoice_recorded' : 'invoice_failed_recorded', userId: String(user._id), plan };
}

/* ── Refunds and disputes ────────────────────────────────────────────────── */

type PaymentRow = {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  planType?: StripePlanId;
  status: string;
  amount: number;
  stripeSubscriptionId?: string;
};

/** The Payment row behind a charge: by payment intent, by charge, then by asking Stripe. */
async function findPaymentForCharge(paymentIntentId: string | null, chargeId: string | null): Promise<PaymentRow | null> {
  const or: Record<string, string>[] = [];
  if (paymentIntentId) or.push({ stripePaymentIntentId: paymentIntentId });
  if (chargeId) or.push({ stripeChargeId: chargeId });
  if (or.length > 0) {
    const direct = await Payment.findOne({ provider: 'stripe', $or: or }).lean<PaymentRow>();
    if (direct) return direct;
  }

  if (!paymentIntentId) return null;

  // Webhook invoices do not always carry their payment intent; Stripe knows.
  try {
    const invoicePayments = await stripe.invoicePayments.list({
      payment: { type: 'payment_intent', payment_intent: paymentIntentId },
      limit: 1,
    });
    const invoiceId = idOf(invoicePayments.data[0]?.invoice);
    if (invoiceId) {
      const row = await Payment.findOneAndUpdate(
        { provider: 'stripe', stripeInvoiceId: invoiceId },
        { $set: { stripePaymentIntentId: paymentIntentId } },
        { returnDocument: 'after' },
      ).lean<PaymentRow>();
      if (row) return row;
    }
  } catch (error) {
    console.warn('[stripe-billing] Could not look up the invoice of', paymentIntentId, error);
  }

  try {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
    const sessionId = sessions.data[0]?.id;
    if (sessionId) {
      const row = await Payment.findOneAndUpdate(
        { provider: 'stripe', stripeSessionId: sessionId },
        { $set: { stripePaymentIntentId: paymentIntentId } },
        { returnDocument: 'after' },
      ).lean<PaymentRow>();
      if (row) return row;
    }
  } catch (error) {
    console.warn('[stripe-billing] Could not look up the checkout of', paymentIntentId, error);
  }

  return null;
}

/**
 * Money that went back takes what it bought with it: a lifetime licence (unless
 * another lifetime purchase still covers the account) or a group licence, at
 * once. A subscription is different: its access follows the subscription, so
 * refunding a renewal is paired with cancelling the subscription in Stripe
 * (which sends `customer.subscription.deleted`).
 */
async function revokeForPayment(payment: PaymentRow): Promise<string> {
  if (payment.planType === 'lifetime') {
    if (await otherLifetimeCovers(payment.user, payment._id)) return 'lifetime_kept_other_purchase';
    await recomputeUserPremium(String(payment.user), { hasLifetimePremium: false });
    return 'lifetime_off';
  }

  if (payment.planType === 'group' && payment.stripeSubscriptionId) {
    await endGroupLicense(payment.stripeSubscriptionId, { immediate: true });
    return 'group_ended_now';
  }

  return 'subscription_follows_status';
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<StripeEventOutcome> {
  const payment = await findPaymentForCharge(idOf(charge.payment_intent), charge.id);
  if (!payment) {
    console.error('[stripe-billing] Refund for an unknown payment', charge.id);
    return { result: 'payment_not_found' };
  }

  const full = charge.refunded || charge.amount_refunded >= charge.amount;
  await Payment.updateOne(
    { _id: payment._id },
    {
      $set: {
        amountRefunded: charge.amount_refunded,
        refundedAt: new Date(),
        stripeChargeId: charge.id,
        ...(full ? { status: 'refunded' } : {}),
      },
    },
  );

  if (!full) return { result: 'partial_refund', userId: String(payment.user), plan: payment.planType };

  const effect = await revokeForPayment(payment);
  return { result: `refunded:${effect}`, userId: String(payment.user), plan: payment.planType };
}

async function handleDispute(dispute: Stripe.Dispute, phase: 'created' | 'closed'): Promise<StripeEventOutcome> {
  const payment = await findPaymentForCharge(idOf(dispute.payment_intent), idOf(dispute.charge));
  if (!payment) {
    console.error('[stripe-billing] Dispute for an unknown payment', dispute.id);
    return { result: 'payment_not_found' };
  }

  const userId = String(payment.user);

  if (phase === 'created') {
    await Payment.updateOne({ _id: payment._id }, { $set: { status: 'disputed', disputeStatus: dispute.status } });
    // The money is withdrawn when the dispute opens; a lifetime licence
    // closes with it and reopens if the dispute is won.
    if (payment.planType === 'lifetime') {
      const effect = await revokeForPayment(payment);
      return { result: `disputed:${effect}`, userId, plan: payment.planType };
    }
    return { result: 'disputed', userId, plan: payment.planType };
  }

  if (dispute.status === 'won' || dispute.status === 'warning_closed') {
    await Payment.updateOne(
      { _id: payment._id, status: 'disputed' },
      { $set: { status: 'completed', disputeStatus: dispute.status } },
    );
    if (payment.planType === 'lifetime') await recomputeUserPremium(userId, { hasLifetimePremium: true });
    return { result: 'dispute_won', userId, plan: payment.planType };
  }

  await Payment.updateOne(
    { _id: payment._id },
    { $set: { status: 'refunded', disputeStatus: dispute.status, amountRefunded: dispute.amount, refundedAt: new Date() } },
  );
  const effect = await revokeForPayment(payment);
  return { result: `dispute_lost:${effect}`, userId, plan: payment.planType };
}

/* ── Dispatch ────────────────────────────────────────────────────────────── */

export async function processStripeEvent(event: Stripe.Event): Promise<StripeEventOutcome> {
  if (!HANDLED.has(event.type)) return { result: `ignored:${event.type}` };

  await connectDB();
  const observedAt = new Date(event.created * 1000);

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return applyCheckoutSession(event.data.object, { observedAt, recordAnalytics: true });

    case 'checkout.session.async_payment_failed':
      return failCheckoutPayment(event.data.object);

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed': {
      const previous = (event.data.previous_attributes as { status?: string } | undefined)?.status ?? null;
      return applySubscription(event.data.object, observedAt, { previousStatus: previous });
    }

    case 'customer.subscription.trial_will_end': {
      // Sent by Stripe three days before the trial ends, which is day 5 of a
      // 7-day trial: the moment the Premium page promises a reminder. The
      // daily cron (`/api/cron/trial-reminder`) is the fallback; both claim
      // the same flag, so the mail goes out once.
      const outcome = await applySubscription(event.data.object, observedAt);
      if (!outcome.userId) return outcome;
      const reminder = await sendTrialReminder(outcome.userId);
      return { ...outcome, result: `trial_reminder:${reminder}` };
    }

    case 'invoice.paid':
    case 'invoice.payment_succeeded':
      return recordInvoice(event.data.object, 'paid', observedAt);

    case 'invoice.payment_failed':
      return recordInvoice(event.data.object, 'failed', observedAt);

    case 'charge.refunded':
      return handleChargeRefunded(event.data.object);

    case 'charge.dispute.created':
      return handleDispute(event.data.object, 'created');

    case 'charge.dispute.closed':
      return handleDispute(event.data.object, 'closed');

    default:
      return { result: `ignored:${event.type}` };
  }
}

/* ── Webhook request ─────────────────────────────────────────────────────── */

/** A claim older than this is from a crashed run and may be taken over. */
const STALE_CLAIM_MS = 5 * 60 * 1000;

async function claimEvent(event: Stripe.Event): Promise<'claimed' | 'duplicate' | 'in_progress'> {
  try {
    await WebhookEvent.create({ provider: 'stripe', eventId: event.id, status: 'processing', type: event.type });
    return 'claimed';
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }

  const existing = await WebhookEvent.findOne({ provider: 'stripe', eventId: event.id }).lean<{
    _id: mongoose.Types.ObjectId;
    status?: string;
    updatedAt?: Date;
  }>();
  if (!existing || existing.status !== 'processing') return 'duplicate';

  const updatedAt = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
  if (Date.now() - updatedAt < STALE_CLAIM_MS) return 'in_progress';

  const taken = await WebhookEvent.updateOne(
    { _id: existing._id, status: 'processing', updatedAt: existing.updatedAt },
    { $set: { status: 'processing', type: event.type } },
  );
  return taken.modifiedCount === 1 ? 'claimed' : 'in_progress';
}

export interface WebhookResponse {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Verify, claim once, process. Answers 400 for a bad signature, 200 for a
 * processed or duplicate event, 409 while the same event is being processed
 * elsewhere and 500 when processing failed (the claim is released, so
 * Stripe's retry runs it again).
 */
export async function handleStripeWebhookRequest(
  rawBody: string,
  signature: string | null,
  secret: string | undefined = process.env.STRIPE_WEBHOOK_SECRET,
): Promise<WebhookResponse> {
  if (!signature) return { status: 400, body: { error: 'Missing Stripe signature header' } };
  if (!secret) {
    console.error('[stripe-billing] STRIPE_WEBHOOK_SECRET is not set; refusing webhook');
    return { status: 400, body: { error: 'Webhook secret not configured' } };
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Stripe signature error';
    return { status: 400, body: { error: `Webhook Error: ${message}` } };
  }

  if (!HANDLED.has(event.type)) {
    return { status: 200, body: { received: true, ignored: event.type } };
  }

  await connectDB();

  const claim = await claimEvent(event);
  if (claim === 'duplicate') return { status: 200, body: { received: true, duplicate: true } };
  if (claim === 'in_progress') return { status: 409, body: { error: 'Event is being processed' } };

  try {
    const outcome = await processStripeEvent(event);
    await WebhookEvent.updateOne({ provider: 'stripe', eventId: event.id }, { $set: { status: 'processed' } });
    return { status: 200, body: { received: true, event: event.type, ...outcome } };
  } catch (error) {
    console.error('[stripe-billing] Processing failed', event.id, event.type, error);
    await WebhookEvent.deleteOne({ provider: 'stripe', eventId: event.id, status: 'processing' }).catch(() => undefined);
    return { status: 500, body: { error: 'Processing failed' } };
  }
}
