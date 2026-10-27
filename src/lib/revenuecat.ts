import { timingSafeEqual } from 'node:crypto';
import { Types } from 'mongoose';
import { Payment, User, WebhookEvent } from '@/database';
import { getPremiumSnapshot, recomputeUserPremium } from '@/lib/premium-state';
import { recordPurchase, recordServerEvent } from '@/lib/analytics/record';

/**
 * RevenueCat (App Store + Google Play) -> the account.
 *
 * Two ways in, one way to write:
 * - the webhook (`/api/mobile/revenuecat-webhook`), for every store event;
 * - the sync endpoint (`/api/mobile/sync-premium`), which the app calls right
 *   after a purchase or restore so Premium shows without waiting for the
 *   webhook.
 *
 * Both end in `applyStorePremium`, which only ever touches the store part of
 * Premium. Premium from Stripe, a lifetime purchase, a group licence or a
 * manual grant is never taken away by a store event.
 */

const REVENUECAT_API_BASE_URL = 'https://api.revenuecat.com/v1';
const DEFAULT_ENTITLEMENT_ID = 'premium';

/** Product ids as configured in App Store Connect / Google Play. */
export const REVENUECAT_PRODUCT_IDS = {
  monthly: 'bijbelquiz_premium_monthly',
  yearly: 'bijbelquiz_premium_yearly',
  lifetime: 'bijbelquiz_premium_lifetime',
} as const;

export type StorePlan = 'monthly' | 'yearly' | 'lifetime';

export type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
  entitlement_id?: string | null;
  entitlement_ids?: string[] | null;
  /** Store product id, e.g. `bijbelquiz_premium_yearly` (Play: may carry `:baseplan`). */
  product_id?: string;
  new_product_id?: string;
  /** NORMAL, TRIAL, INTRO, PROMOTIONAL, PREPAID. */
  period_type?: string;
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number | null;
  /** SANDBOX or PRODUCTION. */
  environment?: string;
  /** APP_STORE, MAC_APP_STORE, PLAY_STORE, STRIPE, PROMOTIONAL, AMAZON, ... */
  store?: string;
  /** Price in USD. */
  price?: number | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
  transaction_id?: string | null;
  original_transaction_id?: string | null;
  /** CANCELLATION only: UNSUBSCRIBE, BILLING_ERROR, DEVELOPER_INITIATED, PRICE_INCREASE, CUSTOMER_SUPPORT, UNKNOWN. */
  cancel_reason?: string | null;
  expiration_reason?: string | null;
  is_trial_conversion?: boolean | null;
};

export type WebhookResult = {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
};

export function getEntitlementId(): string {
  return process.env.REVENUECAT_PREMIUM_ENTITLEMENT_ID || DEFAULT_ENTITLEMENT_ID;
}

/** The REST secret key (`sk_...`). `REVENUECAT_REST_API_KEY` is the older name. */
export function getRevenueCatSecretKey(): string | null {
  return process.env.REVENUECAT_SECRET_KEY || process.env.REVENUECAT_REST_API_KEY || null;
}

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * RevenueCat sends the exact value typed in the dashboard's "Authorization
 * header value" field. Accept that value as-is, and also with or without a
 * `Bearer ` prefix on either side, so `Bearer abc` in the dashboard and `abc`
 * in Vercel (or the other way round) still match. Without a configured
 * secret every call is refused.
 */
export function verifyRevenueCatAuthorization(
  header: string | null | undefined,
  expected: string | null | undefined = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION,
): boolean {
  if (!expected || !header) return false;
  const strip = (value: string) => value.trim().replace(/^Bearer\s+/i, '');
  const given = header.trim();
  const want = expected.trim();
  return safeEqual(given, want) || safeEqual(strip(given), strip(want));
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Map a store product id onto the plan labels the funnel and Payment use.
 * Play subscription ids can arrive as `product:baseplan`; only the product
 * part counts.
 */
export function planFromProductId(productId: string | null | undefined): StorePlan {
  const id = (productId || '').toLowerCase().split(':')[0];
  if (id.includes('life') || id.includes('levenslang')) return 'lifetime';
  if (id.includes('year') || id.includes('annual') || id.includes('jaar')) return 'yearly';
  return 'monthly';
}

/** `app_store` / `play_store` / ... for the Payment row. */
export function storeLabel(store: string | null | undefined): string {
  const value = (store || '').toUpperCase();
  if (value === 'APP_STORE' || value === 'MAC_APP_STORE') return 'app_store';
  if (value === 'PLAY_STORE') return 'play_store';
  return value ? value.toLowerCase() : 'unknown';
}

function platformFromStore(store: string | null | undefined): 'ios' | 'android' {
  return (store || '').toUpperCase() === 'PLAY_STORE' ? 'android' : 'ios';
}

function environmentOf(event: RevenueCatEvent): 'sandbox' | 'production' {
  return (event.environment || '').toUpperCase() === 'SANDBOX' ? 'sandbox' : 'production';
}

function msToDate(ms: number | null | undefined): Date | null {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return null;
  return new Date(ms);
}

function isKnownPremiumProduct(productId: string | null | undefined): boolean {
  const id = (productId || '').toLowerCase().split(':')[0];
  return Object.values(REVENUECAT_PRODUCT_IDS).includes(id as never);
}

/** Does this event concern the Premium entitlement? */
function concernsPremium(event: RevenueCatEvent, entitlementId: string): boolean {
  const ids = Array.isArray(event.entitlement_ids) ? event.entitlement_ids : [];
  if (ids.includes(entitlementId) || event.entitlement_id === entitlementId) return true;
  // Products not (yet) attached to the entitlement in the dashboard still
  // carry our own product ids.
  return isKnownPremiumProduct(event.product_id) || isKnownPremiumProduct(event.new_product_id);
}

function getWebhookEvent(payload: unknown): RevenueCatEvent | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as Record<string, unknown>;
  const nested = body.event;
  if (nested && typeof nested === 'object') return nested as RevenueCatEvent;
  return body as RevenueCatEvent;
}

/**
 * Every id RevenueCat knows this customer by, most specific first. Only ids
 * that are Mongo ObjectIds can be accounts (the app logs in with the user id);
 * `$RCAnonymousID:...` ids are skipped.
 */
export function candidateUserIds(event: RevenueCatEvent): string[] {
  const raw = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
  ];
  const seen = new Set<string>();
  for (const id of raw) {
    if (typeof id === 'string' && Types.ObjectId.isValid(id) && /^[0-9a-f]{24}$/i.test(id)) {
      seen.add(id);
    }
  }
  return [...seen];
}

async function resolveAccount(ids: string[]): Promise<string | null> {
  for (const id of ids) {
    const exists = await User.exists({ _id: id });
    if (exists) return id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Writing store Premium without clobbering any other source
// ---------------------------------------------------------------------------

export type StorePremiumUpdate = {
  active: boolean;
  expiresAt: Date | null;
  /**
   * true: the store sold a lifetime licence; false: a store lifetime licence
   * was refunded; undefined: leave lifetime as it is.
   */
  lifetime?: boolean;
};

async function hasStripeLifetime(userId: string): Promise<boolean> {
  const row = await Payment.exists({
    user: userId,
    provider: 'stripe',
    planType: 'lifetime',
    status: 'completed',
  });
  return Boolean(row);
}

/**
 * Set the store part of Premium and recompute the stored `isPremium` flag
 * from every source, so Stripe, lifetime, group and manual (admin) Premium
 * survive a store expiration.
 *
 * "Manual" is the only source with no flag of its own: an account that is
 * `isPremium` while no Stripe, store or lifetime flag explains it was granted
 * by hand, and keeps it.
 */
export async function applyStorePremium(userId: string, update: StorePremiumUpdate) {
  const user = await User.findById(userId)
    .select('_id isPremium premiumStripe premiumStore storePremiumExpiresAt hasLifetimePremium groupPremiumUntil')
    .lean<{
      _id: Types.ObjectId;
      isPremium?: boolean;
      premiumStripe?: boolean;
      premiumStore?: boolean;
      storePremiumExpiresAt?: Date | null;
      hasLifetimePremium?: boolean;
      groupPremiumUntil?: Date | null;
    }>();
  if (!user) return null;

  let hasLifetimePremium = Boolean(user.hasLifetimePremium);
  if (update.lifetime === true) hasLifetimePremium = true;
  if (update.lifetime === false) hasLifetimePremium = await hasStripeLifetime(userId);

  // A lifetime licence has no end date; a subscription does.
  const premiumStore = update.active || (update.lifetime === true);
  const storePremiumExpiresAt = premiumStore && update.lifetime !== true ? update.expiresAt : null;

  // One atomic recompute shared with the Stripe side (premium-state.ts): the
  // manual grant is judged and remembered (`premiumGranted`) there, so a store
  // purchase that starts and ends never takes a manual grant with it.
  const written = await recomputeUserPremium(String(user._id), { premiumStore, storePremiumExpiresAt, hasLifetimePremium });
  if (!written) return null;

  const snapshot = getPremiumSnapshot({
    ...user,
    premiumStore,
    storePremiumExpiresAt,
    hasLifetimePremium,
    isPremium: written.isPremium,
  });

  return {
    userId: String(user._id),
    premiumStore,
    storePremiumExpiresAt,
    hasLifetimePremium,
    isPremium: snapshot.isPremium,
  };
}

// ---------------------------------------------------------------------------
// RevenueCat REST API (canonical state)
// ---------------------------------------------------------------------------

export type SubscriberPremiumState = {
  active: boolean;
  expiresAt: Date | null;
  lifetime: boolean;
  productId: string | null;
  willRenew: boolean | null;
  billingIssue: boolean;
  isSandbox: boolean | null;
  store: string | null;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Read the Premium entitlement straight from RevenueCat. Null when no secret
 * key is configured. Throws on a failed request.
 */
export async function fetchSubscriberPremiumState(
  appUserId: string,
  options: { fetchImpl?: FetchLike; now?: Date } = {},
): Promise<SubscriberPremiumState | null> {
  const apiKey = getRevenueCatSecretKey();
  if (!apiKey) return null;

  const fetchImpl = options.fetchImpl ?? (fetch as FetchLike);
  const response = await fetchImpl(`${REVENUECAT_API_BASE_URL}/subscribers/${encodeURIComponent(appUserId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`RevenueCat subscriber lookup failed (${response.status})`);
  }

  const payload = (await response.json()) as { subscriber?: RestSubscriber };
  return subscriberPremiumStateFrom(payload?.subscriber, getEntitlementId(), options.now ?? new Date());
}

type RestEntitlement = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
  product_identifier?: string;
};
type RestSubscription = {
  unsubscribe_detected_at?: string | null;
  billing_issues_detected_at?: string | null;
  refunded_at?: string | null;
  is_sandbox?: boolean;
  store?: string;
};
/** The parts of RevenueCat's `GET /v1/subscribers/{id}` this code reads. */
export type RestSubscriber = {
  entitlements?: Record<string, RestEntitlement | undefined>;
  subscriptions?: Record<string, RestSubscription | undefined>;
};

/** Pure part of the REST read, exported for tests. */
export function subscriberPremiumStateFrom(
  subscriber: RestSubscriber | undefined,
  entitlementId: string,
  now: Date,
): SubscriberPremiumState {
  const entitlement = subscriber?.entitlements?.[entitlementId];
  const empty: SubscriberPremiumState = {
    active: false,
    expiresAt: null,
    lifetime: false,
    productId: null,
    willRenew: null,
    billingIssue: false,
    isSandbox: null,
    store: null,
  };
  if (!entitlement) return empty;

  const productId = typeof entitlement.product_identifier === 'string' ? entitlement.product_identifier : null;
  const parse = (value: unknown) => {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const expiresAt = parse(entitlement.expires_date);
  const graceEnd = parse(entitlement.grace_period_expires_date);

  const subscription = productId ? subscriber?.subscriptions?.[productId] : undefined;
  const refunded = Boolean(subscription?.refunded_at);

  const lifetime = !entitlement.expires_date && planFromProductId(productId) === 'lifetime';
  const active =
    !refunded &&
    (!entitlement.expires_date ||
      Boolean(expiresAt && expiresAt.getTime() > now.getTime()) ||
      Boolean(graceEnd && graceEnd.getTime() > now.getTime()));

  const effectiveEnd = graceEnd && expiresAt && graceEnd > expiresAt ? graceEnd : expiresAt;

  return {
    active,
    expiresAt: lifetime ? null : effectiveEnd,
    lifetime: lifetime && active,
    productId,
    willRenew: subscription ? !subscription.unsubscribe_detected_at : null,
    billingIssue: Boolean(subscription?.billing_issues_detected_at),
    isSandbox: typeof subscription?.is_sandbox === 'boolean' ? subscription.is_sandbox : null,
    store: typeof subscription?.store === 'string' ? subscription.store : null,
  };
}

/**
 * Re-read the subscriber from RevenueCat and write the result. Used by the
 * sync endpoint and by the webhook when a secret key is set.
 *
 * A lifetime purchase the REST API no longer reports (refunded) is not taken
 * away here: refunds arrive as a CANCELLATION webhook, which knows it is one.
 */
export async function syncStorePremiumForAppUser(appUserId: string, options: { fetchImpl?: FetchLike } = {}) {
  if (!Types.ObjectId.isValid(appUserId)) {
    throw new Error(`Invalid app_user_id: ${appUserId}`);
  }

  const state = await fetchSubscriberPremiumState(appUserId, options);
  if (!state) {
    throw new Error('REVENUECAT_SECRET_KEY is not set');
  }

  const result = await applyStorePremium(appUserId, {
    active: state.active,
    expiresAt: state.expiresAt,
    lifetime: state.lifetime ? true : undefined,
  });
  if (!result) {
    throw new Error(`User not found: ${appUserId}`);
  }

  return { ...result, store: state };
}

// ---------------------------------------------------------------------------
// Event -> state (when the REST API is not available)
// ---------------------------------------------------------------------------

const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'SUBSCRIPTION_EXTENDED',
]);

/** A CANCELLATION RevenueCat sends for a refund. */
export function isRefund(event: RevenueCatEvent): boolean {
  return (event.type || '').toUpperCase() === 'CANCELLATION' && (event.cancel_reason || '').toUpperCase() === 'CUSTOMER_SUPPORT';
}

type InferredAction =
  | { action: 'set'; update: StorePremiumUpdate }
  | { action: 'ignore'; reason: string };

/**
 * What a single event means for store Premium, read from the event itself.
 * `current` is what the account holds now; it keeps a late, out-of-order
 * event from undoing a newer one.
 */
export function inferStoreUpdate(
  event: RevenueCatEvent,
  current: { premiumStore?: boolean; storePremiumExpiresAt?: Date | null },
  now: Date = new Date(),
): InferredAction {
  const type = (event.type || '').toUpperCase();
  const product = event.new_product_id || event.product_id;
  const lifetimeProduct = planFromProductId(product) === 'lifetime';
  const expiresAt = msToDate(event.expiration_at_ms);
  const currentExpiry = current.storePremiumExpiresAt ? new Date(current.storePremiumExpiresAt) : null;

  if (GRANT_EVENTS.has(type) || type === 'TRANSFER') {
    if (type === 'NON_RENEWING_PURCHASE' || (lifetimeProduct && !expiresAt)) {
      return { action: 'set', update: { active: true, expiresAt: null, lifetime: true } };
    }
    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
      return { action: 'ignore', reason: 'already_expired' };
    }
    // A late renewal for an older period must not shorten a newer one.
    const keepLater =
      current.premiumStore && currentExpiry && expiresAt && currentExpiry.getTime() > expiresAt.getTime();
    return { action: 'set', update: { active: true, expiresAt: keepLater ? currentExpiry : expiresAt } };
  }

  if (type === 'CANCELLATION') {
    if (isRefund(event)) {
      return {
        action: 'set',
        update: lifetimeProduct
          ? { active: false, expiresAt: null, lifetime: false }
          : { active: false, expiresAt: null },
      };
    }
    // Opting out of renewal: access runs to the end of the paid period.
    if (expiresAt && expiresAt.getTime() > now.getTime()) {
      return { action: 'ignore', reason: 'access_until_period_end' };
    }
    return { action: 'set', update: { active: false, expiresAt: null } };
  }

  if (type === 'EXPIRATION') {
    // An expiration for an older period, after the account already renewed.
    if (current.premiumStore && currentExpiry && expiresAt && currentExpiry.getTime() > expiresAt.getTime() + 60_000) {
      return { action: 'ignore', reason: 'stale_expiration' };
    }
    return { action: 'set', update: { active: false, expiresAt: null } };
  }

  // BILLING_ISSUE: the store retries and RevenueCat sends EXPIRATION if it
  // gives up (after any grace period). SUBSCRIPTION_PAUSED: the pause starts
  // at the end of the paid period, again followed by EXPIRATION. Neither
  // changes access by itself.
  return { action: 'ignore', reason: type.toLowerCase() || 'unknown' };
}

// ---------------------------------------------------------------------------
// Payment rows + funnel
// ---------------------------------------------------------------------------

const PAYMENT_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE']);

/**
 * One Payment row per real charge: the first paid period, every renewal,
 * and the lifetime purchase. A free trial start is not a payment (its price is
 * 0); the conversion arrives as a RENEWAL with the real price. Sandbox
 * purchases carry `environment: 'sandbox'`, which revenue figures leave out.
 */
export async function recordStorePayment(event: RevenueCatEvent, userId: string): Promise<void> {
  const type = (event.type || '').toUpperCase();

  if (isRefund(event)) {
    // Only the refunded charge: the first purchase is stored under the
    // original transaction id, so matching that too would mark the first
    // purchase refunded when a later renewal is.
    const refundedId = event.transaction_id || event.original_transaction_id;
    if (refundedId) {
      await Payment.updateMany(
        { provider: 'revenuecat', externalTransactionId: refundedId, user: userId },
        { $set: { status: 'refunded', refundedAt: msToDate(event.event_timestamp_ms) ?? new Date() } },
      );
    }
    return;
  }

  if (!PAYMENT_EVENTS.has(type)) return;

  const price = typeof event.price_in_purchased_currency === 'number' ? event.price_in_purchased_currency : null;
  if (price === null || price <= 0) return;

  const transactionId = event.transaction_id || `${event.id}`;
  const environment = environmentOf(event);

  await Payment.updateOne(
    { provider: 'revenuecat', externalTransactionId: transactionId },
    {
      $setOnInsert: {
        user: userId,
        provider: 'revenuecat',
        planType: planFromProductId(event.product_id),
        externalTransactionId: transactionId,
        originalTransactionId: event.original_transaction_id ?? undefined,
        productId: event.product_id,
        store: storeLabel(event.store),
        environment,
        eventType: type,
        amount: Math.round(price * 100),
        currency: (event.currency || 'eur').toLowerCase(),
        priceUsdCents: typeof event.price === 'number' ? Math.round(event.price * 100) : undefined,
        status: 'completed',
        isTrialConversion: Boolean(event.is_trial_conversion),
        purchasedAt: msToDate(event.purchased_at_ms) ?? undefined,
      },
    },
    { upsert: true },
  );
}

/**
 * Funnel events. Runs after the idempotency guard, so a retried webhook cannot
 * count a purchase twice. Sandbox purchases stay out of the funnel.
 */
async function recordFunnelEvent(event: RevenueCatEvent, userId: string): Promise<void> {
  if (environmentOf(event) === 'sandbox') return;
  const type = (event.type || '').toUpperCase();
  const isTrial = (event.period_type || '').toUpperCase() === 'TRIAL';
  const plan = planFromProductId(event.product_id);
  const platform = platformFromStore(event.store);

  try {
    if (type === 'INITIAL_PURCHASE' || type === 'NON_RENEWING_PURCHASE') {
      await recordPurchase({
        userId,
        plan,
        platform,
        provider: 'revenuecat',
        isTrial,
        amountCents:
          typeof event.price_in_purchased_currency === 'number'
            ? Math.round(event.price_in_purchased_currency * 100)
            : null,
        currency: event.currency ?? null,
      });
      return;
    }

    if (type === 'RENEWAL' && event.is_trial_conversion) {
      await recordServerEvent('trial_converted', {
        userId,
        platform,
        props: { plan, provider: 'revenuecat' },
      });
    }
  } catch (error) {
    console.error('[REVENUECAT_WEBHOOK_ANALYTICS]', { type, error });
  }
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

async function applyEventToAccount(
  event: RevenueCatEvent,
  userId: string,
  options: { fetchImpl?: FetchLike },
): Promise<string> {
  // Refunds are applied from the event: it says what happened, and the REST
  // API may briefly still list the refunded lifetime purchase.
  if (!isRefund(event) && getRevenueCatSecretKey()) {
    try {
      await syncStorePremiumForAppUser(userId, options);
      return 'revenuecat_rest_api';
    } catch (error) {
      console.error('[REVENUECAT_WEBHOOK_SUBSCRIBER_FETCH_ERROR]', { eventId: event.id, userId, error });
    }
  }

  const current = await User.findById(userId).select('premiumStore storePremiumExpiresAt').lean<{
    premiumStore?: boolean;
    storePremiumExpiresAt?: Date | null;
  }>();
  const inferred = inferStoreUpdate(event, current ?? {});
  if (inferred.action === 'ignore') return `ignored:${inferred.reason}`;
  await applyStorePremium(userId, inferred.update);
  return 'event';
}

export async function processRevenueCatWebhook(
  body: unknown,
  options: { fetchImpl?: FetchLike } = {},
): Promise<WebhookResult> {
  const event = getWebhookEvent(body);
  if (!event) {
    return { ok: false, status: 400, body: { error: 'Malformed payload' } };
  }

  const eventId = event.id;
  const eventType = (event.type || 'UNKNOWN').toUpperCase();
  if (!eventId) {
    return { ok: false, status: 400, body: { error: 'Missing event.id' } };
  }

  // The dashboard's "Send test event" button.
  if (eventType === 'TEST') {
    return { ok: true, status: 200, body: { received: true, test: true } };
  }

  const entitlementId = getEntitlementId();
  const isTransfer = eventType === 'TRANSFER';

  // Who is affected. A TRANSFER moves the purchase from one set of ids to
  // another; everything else concerns the event's own customer.
  const targets: string[] = [];
  const losers: string[] = [];
  if (isTransfer) {
    const to = await resolveAccount(candidateUserIds({ aliases: event.transferred_to ?? [] }));
    if (to) targets.push(to);
    for (const id of candidateUserIds({ aliases: event.transferred_from ?? [] })) {
      if (id !== to && (await User.exists({ _id: id }))) losers.push(id);
    }
  } else {
    const account = await resolveAccount(candidateUserIds(event));
    if (account) targets.push(account);
  }

  if (targets.length === 0 && losers.length === 0) {
    console.error('[REVENUECAT_WEBHOOK_UNKNOWN_USER]', {
      eventId,
      eventType,
      appUserId: event.app_user_id,
      aliases: event.aliases,
    });
    // 200 so RevenueCat stops retrying: no account will ever match this id.
    return { ok: true, status: 200, body: { received: true, ignored: 'unknown_app_user_id' } };
  }

  if (!isTransfer && !concernsPremium(event, entitlementId)) {
    return { ok: true, status: 200, body: { received: true, ignored: 'other_entitlement' } };
  }

  // Claim the event. A retry of an event already processed stops here.
  try {
    await WebhookEvent.create({ provider: 'revenuecat', eventId });
  } catch (error) {
    if ((error as { code?: number } | null)?.code === 11000) {
      return { ok: true, status: 200, body: { received: true, duplicate: true } };
    }
    console.error('[REVENUECAT_WEBHOOK_IDEMPOTENCY_ERROR]', { eventId, eventType, error });
    return { ok: false, status: 500, body: { error: 'Idempotency tracking failed' } };
  }

  try {
    const sources: string[] = [];
    for (const userId of targets) {
      sources.push(await applyEventToAccount(event, userId, options));
      await recordStorePayment(event, userId);
      await recordFunnelEvent(event, userId);
    }
    for (const userId of losers) {
      // The purchase now belongs to someone else.
      if (getRevenueCatSecretKey()) {
        try {
          await syncStorePremiumForAppUser(userId, options);
          continue;
        } catch (error) {
          console.error('[REVENUECAT_TRANSFER_SYNC_ERROR]', { eventId, userId, error });
        }
      }
      await applyStorePremium(userId, { active: false, expiresAt: null });
    }

    return { ok: true, status: 200, body: { received: true, type: eventType, source: sources[0] ?? 'transfer' } };
  } catch (error) {
    // Release the claim so RevenueCat's retry gets another go.
    await WebhookEvent.deleteOne({ provider: 'revenuecat', eventId }).catch(() => undefined);
    throw error;
  }
}
