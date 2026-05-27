import { Types } from 'mongoose';
import { User, WebhookEvent } from '@/database';
import { updateUserPremiumFromStore } from '@/lib/premium-state';

const REVENUECAT_API_BASE_URL = 'https://api.revenuecat.com/v1';
const DEFAULT_ENTITLEMENT_ID = 'premium';

type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  entitlement_ids?: string[];
};

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

