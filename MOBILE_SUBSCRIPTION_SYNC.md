# Mobile Subscription Sync (RevenueCat + Stripe)

This app keeps one premium state per MongoDB user by splitting premium sources:

- `premiumStripe`: premium granted from Stripe (web)
- `premiumStore`: premium granted from mobile store events (RevenueCat)
- `storePremiumExpiresAt`: expiry from RevenueCat entitlement (or `null`)
- `isPremium`: effective premium (`premiumStripe || premiumStore`)

## RevenueCat setup

Configure a RevenueCat webhook:

- URL: `https://<your-domain>/api/mobile/revenuecat-webhook`
- Method: `POST`
- Authorization header value: set to the same secret string as `REVENUECAT_WEBHOOK_AUTHORIZATION`

Set environment variables:

- `REVENUECAT_WEBHOOK_AUTHORIZATION` (required in production)
- `REVENUECAT_REST_API_KEY` (recommended canonical sync)
- `REVENUECAT_PREMIUM_ENTITLEMENT_ID` (optional, default: `premium`)

When `REVENUECAT_REST_API_KEY` is available, webhook processing fetches canonical state from `GET /v1/subscribers/{app_user_id}` and updates store premium from the entitlement payload.
Without that key (dev fallback), webhook event type is used conservatively:

- Grant: `INITIAL_PURCHASE`, `RENEWAL`, `NON_RENEWING_PURCHASE`, `UNCANCELLATION`, `PRODUCT_CHANGE`, `TEMPORARY_ENTITLEMENT_GRANT` (only if entitlement includes `premium`)
- Revoke: `EXPIRATION`
- Ignore: `TEST` and other uncertain/unsupported events

## Idempotency

Webhook processing stores each event by `(provider, eventId)` in `WebhookEvent`.
Duplicate events are acknowledged and ignored safely.

## Migration note (existing users)

If you have legacy users with only `isPremium`, run a one-time backfill:

- Set `premiumStripe = true` for users where `isPremium = true` and both source flags are missing/false
- Keep `isPremium` as `premiumStripe || premiumStore` afterwards

This prevents accidental downgrade of historical premium users when source-specific sync starts.

## Sandbox test steps

1. Purchase monthly/lifetime in mobile sandbox with RevenueCat entitlement `premium`.
2. Confirm webhook hit returns `200` and `{ "received": true }`.
3. Verify user has `premiumStore=true` and `isPremium=true`.
4. Trigger expiration in sandbox and verify only store side is revoked (`premiumStore=false`), while Stripe premium remains untouched if active.
5. Trigger Stripe checkout/subscription activation and verify `premiumStripe=true`.
6. Cancel Stripe subscription while `premiumStore=true` and verify `isPremium` stays `true`.
7. Replay same RevenueCat webhook `event.id` and verify duplicate is ignored (`duplicate: true`).
