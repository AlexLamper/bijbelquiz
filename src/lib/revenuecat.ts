import { Types } from 'mongoose';
import { User, WebhookEvent } from '@/database';
import { updateUserPremiumFromStore } from '@/lib/premium-state';
import { recordPurchase, recordServerEvent } from '@/lib/analytics/record';

const REVENUECAT_API_BASE_URL = 'https://api.revenuecat.com/v1';
const DEFAULT_ENTITLEMENT_ID = 'premium';

type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  entitlement_ids?: string[];
  /** Store product id, e.g. `bijbelquiz_premium_yearly`. */
  product_id?: string;
  /** RevenueCat's own period label: NORMAL, TRIAL, INTRO, PROMOTIONAL. */
  period_type?: string;
  store?: string;
  price_in_purchased_currency?: number;
  currency?: string;
};

/**
 * Map a store product id onto the plan labels the funnel reports on.
 *
 * Matches on substring rather than an exact list so renaming a product in App
 * Store Connect does not silently reclassify every sale as lifetime.
 */
function planFromProductId(productId: string | undefined): 'monthly' | 'yearly' | 'lifetime' {
  const id = (productId || '').toLowerCase();
  if (id.includes('year') || id.includes('annual') || id.includes('jaar')) return 'yearly';
  if (id.includes('month') || id.includes('maand')) return 'monthly';
  if (id.includes('life') || id.includes('levenslang')) return 'lifetime';
  return 'monthly';
}

/** Which store this came from, for the platform column on the event. */
function platformFromStore(store: string | undefined): 'ios' | 'android' | 'web' {
  const value = (store || '').toUpperCase();
  if (value === 'PLAY_STORE') return 'android';
  if (value === 'APP_STORE' || value === 'MAC_APP_STORE') return 'ios';
  return 'ios';
}

function getWebhookEvent(payload: unknown): RevenueCatEvent | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const body = payload as Record<string, unknown>;
  const nested = body.event;
  if (nested && typeof nested === 'object') {
    return nested as RevenueCatEvent;
  }

  return body as RevenueCatEvent;
}

function isPremiumEntitlementActive(entitlement: Record<string, unknown> | undefined) {
  if (!entitlement) {
    return { active: false, expiresAt: null as Date | null };
  }

  const expiresDate = entitlement.expires_date;
  if (!expiresDate) {
    return { active: true, expiresAt: null as Date | null };
  }

  const parsed = new Date(String(expiresDate));
  if (Number.isNaN(parsed.getTime())) {
    return { active: false, expiresAt: null as Date | null };
  }

  return {
    active: parsed.getTime() > Date.now(),
    expiresAt: parsed,
  };
}

async function fetchSubscriberEntitlementState(appUserId: string, entitlementId: string) {
  const apiKey = process.env.REVENUECAT_REST_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch(`${REVENUECAT_API_BASE_URL}/subscribers/${encodeURIComponent(appUserId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`RevenueCat subscriber lookup failed (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, any>;
  const entitlement = payload?.subscriber?.entitlements?.[entitlementId] as Record<string, unknown> | undefined;
  return isPremiumEntitlementActive(entitlement);
}

function inferStateFromEvent(event: RevenueCatEvent, entitlementId: string) {
  const eventType = (event.type || '').toUpperCase();
  const entitlementIds = Array.isArray(event.entitlement_ids) ? event.entitlement_ids : [];
  const hasEntitlement = entitlementIds.includes(entitlementId);

  const grantEvents = new Set([
    'INITIAL_PURCHASE',
    'RENEWAL',
    'NON_RENEWING_PURCHASE',
    'UNCANCELLATION',
    'PRODUCT_CHANGE',
    'TEMPORARY_ENTITLEMENT_GRANT',
  ]);

  if (eventType === 'EXPIRATION') {
    return { action: 'revoke' as const };
  }

  if (grantEvents.has(eventType) && hasEntitlement) {
    return { action: 'grant' as const };
  }

  return { action: 'ignore' as const };
}

export async function syncStorePremiumForAppUser(appUserId: string) {
  if (!Types.ObjectId.isValid(appUserId)) {
    throw new Error(`Invalid app_user_id: ${appUserId}`);
  }

  const entitlementId = process.env.REVENUECAT_PREMIUM_ENTITLEMENT_ID || DEFAULT_ENTITLEMENT_ID;
  const state = await fetchSubscriberEntitlementState(appUserId, entitlementId);
  if (!state) {
    throw new Error('REVENUECAT_REST_API_KEY is not set');
  }

  const result = await updateUserPremiumFromStore(appUserId, state.active, state.expiresAt);
  if (!result) {
    throw new Error(`User not found: ${appUserId}`);
  }

  return {
    isPremium: result.isPremium,
    premiumStore: result.premiumStore,
    storePremiumExpiresAt: result.storePremiumExpiresAt,
  };
}

/**
 * Turn a store event into a funnel event.
 *
 * Runs after the idempotency guard above, so a webhook RevenueCat retries
 * cannot count the same purchase twice. Only the three revenue-relevant types
 * are recorded; renewals and expirations are subscription health, not funnel.
 */
async function recordRevenueCatFunnelEvent(
  event: RevenueCatEvent,
  appUserId: string,
  eventType: string,
): Promise<void> {
  const type = eventType.toUpperCase();
  const isTrial = (event.period_type || '').toUpperCase() === 'TRIAL';
  const plan = planFromProductId(event.product_id);
  const platform = platformFromStore(event.store);

  try {
    if (type === 'INITIAL_PURCHASE' || type === 'NON_RENEWING_PURCHASE') {
      await recordPurchase({
        userId: appUserId,
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

    // The first paid renewal after a trial is the conversion. A renewal that
    // is itself still in the trial period is not.
    if (type === 'RENEWAL' && !isTrial) {
      await recordServerEvent('trial_converted', {
        userId: appUserId,
        platform,
        props: { plan, provider: 'revenuecat' },
      });
    }
  } catch (error) {
    console.error('[REVENUECAT_WEBHOOK_ANALYTICS]', { eventType, error });
  }
}

export async function processRevenueCatWebhook(body: unknown) {
  const event = getWebhookEvent(body);
  if (!event) {
    return { ok: false as const, status: 400, body: { error: 'Malformed payload' } };
  }

  const eventId = event.id;
  const appUserId = event.app_user_id;
  const eventType = event.type || 'unknown';
  if (!eventId || !appUserId) {
    return { ok: false as const, status: 400, body: { error: 'Missing event.id or app_user_id' } };
  }

  if (!Types.ObjectId.isValid(appUserId)) {
    console.error('[REVENUECAT_WEBHOOK_INVALID_APP_USER_ID]', { eventId, eventType, appUserId });
    return { ok: true as const, status: 200, body: { received: true, ignored: 'invalid_app_user_id' } };
  }

  try {
    await WebhookEvent.create({ provider: 'revenuecat', eventId });
  } catch (error: any) {
    if (error?.code === 11000) {
      return { ok: true as const, status: 200, body: { received: true, duplicate: true } };
    }
    console.error('[REVENUECAT_WEBHOOK_IDEMPOTENCY_ERROR]', { eventId, eventType, appUserId, error });
    return { ok: false as const, status: 500, body: { error: 'Idempotency tracking failed' } };
  }

  await recordRevenueCatFunnelEvent(event, appUserId, eventType);

  const entitlementId = process.env.REVENUECAT_PREMIUM_ENTITLEMENT_ID || DEFAULT_ENTITLEMENT_ID;

  try {
    const canonicalState = await fetchSubscriberEntitlementState(appUserId, entitlementId);
    if (canonicalState) {
      await updateUserPremiumFromStore(appUserId, canonicalState.active, canonicalState.expiresAt);
      return { ok: true as const, status: 200, body: { received: true, source: 'revenuecat_rest_api' } };
    }
  } catch (error) {
    console.error('[REVENUECAT_WEBHOOK_SUBSCRIBER_FETCH_ERROR]', { eventId, eventType, appUserId, error });
  }

  const fallback = inferStateFromEvent(event, entitlementId);
  if (fallback.action === 'ignore') {
    return { ok: true as const, status: 200, body: { received: true, ignored: eventType } };
  }

  await updateUserPremiumFromStore(appUserId, fallback.action === 'grant', null);
  return { ok: true as const, status: 200, body: { received: true, source: 'event_fallback' } };
}

