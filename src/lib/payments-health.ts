import { connectDB, AnalyticsEvent, Payment, User, WebhookEvent } from '@/database';
import { getInternalAccountIds } from '@/lib/analytics/internal-accounts';
import { classifyPayment, paidPeriodCoversNow, paymentDate, type PaymentLike } from '@/lib/admin/revenue';
import { amsterdamWindowStart } from '@/lib/admin/time';
import { PREMIUM_PRICE_LABEL_ENV } from '@/lib/premium-offer';
import stripe from '@/lib/stripe';
import { STRIPE_PLANS, type StripePlanId } from '@/lib/stripe-plans';

/**
 * "Does the whole paying pipeline work" - one report.
 *
 * Answers, in order: is the config there, does Stripe accept our key, is the
 * webhook wired, are the prices real, did people click pay, did checkout
 * succeed, did renewals fail, and did the buyer actually end up with a premium
 * account. Every check degrades to a row with a remediation line instead of
 * throwing, so a broken key never blanks the admin page - and a check that
 * could not run says so, instead of reporting "nothing found".
 *
 * Setup steps live in docs/setup/betalingen-web.md (Stripe) and
 * docs/setup/betalingen-app.md (RevenueCat / App Store / Play).
 */

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface HealthCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  /** What to do about it. Present on warn / fail. */
  action?: string;
}

export interface PaymentsHealthReport {
  generatedAt: string;
  /** Worst status across every check. */
  overall: CheckStatus;
  checks: HealthCheck[];
  stripe: {
    keyMode: 'live' | 'test' | 'missing';
    keyWorks: boolean | null;
    /** The live Stripe calls (key, prices) ran. False without a key. */
    liveChecked: boolean;
    /** The deep calls (endpoints, sessions, events) ran. */
    deepChecked: boolean;
    accountCurrency: string | null;
    webhookEndpoints: Array<{
      url: string;
      status: string;
      coversCheckoutCompleted: boolean;
      coversSubscription: boolean;
      coversInvoices: boolean;
      coversRefunds: boolean;
      /** Recommended events this endpoint does not receive. */
      missingEvents: string[];
    }>;
    prices: Array<{
      plan: StripePlanId;
      envKey: string;
      priceId: string | null;
      active: boolean | null;
      amountCents: number | null;
      currency: string | null;
      interval: string | null;
      error?: string;
    }>;
    sessions30d: {
      total: number;
      complete: number;
      open: number;
      expired: number;
      paid: number;
    } | null;
    recentEventTypes: Array<{ type: string; at: string }>;
    newestCheckoutCompletedAt: string | null;
  };
  revenuecat: {
    webhookAuthConfigured: boolean;
    restKeyConfigured: boolean;
    restKeyWorks: boolean | null;
    webhookEventsStored: number;
    newestWebhookEventAt: string | null;
  };
  webhooksStored: {
    stripe: number;
    stripeNewestAt: string | null;
    /** Stripe events claimed but never finished (handler crashed or timed out). */
    stripeStuck: number;
    revenuecat: number;
    revenuecatNewestAt: string | null;
  };
  failures30d: {
    /** Real (non-test) payments that failed in the last 30 days, mostly renewals. */
    failedPayments: number;
    /** Accounts whose Stripe subscription is behind on payment right now. */
    pastDueAccounts: number;
    refunds: number;
  };
  /** Funnel events, last 30 days, test/reviewer accounts excluded. */
  funnel30d: {
    paywallShown: number;
    /** Stripe checkout sessions created (the web pay button). */
    checkoutStarted: number;
    /** Purchases on every platform (web and app). */
    purchaseCompleted: number;
    /** Web (Stripe) purchases plus web trials: the outcome of `checkoutStarted`. */
    stripeCheckoutsCompleted: number;
    trialStarted: number;
    trialConverted: number;
  };
  accessGaps: Array<{
    userId: string;
    name: string;
    email: string;
    reason: string;
    when: string;
  }>;
  /** Where `recentAttempts` came from: Stripe's own sessions, or our Payment rows when Stripe could not be asked. */
  recentAttemptsSource: 'stripe' | 'payment';
  recentAttempts: Array<{
    when: string;
    name: string;
    email: string;
    plan: string;
    amountCents: number;
    currency: string;
    stripeSessionStatus: string | null;
    stripePaymentStatus: string | null;
    ourPaymentStatus: string | null;
    hasAccessNow: boolean;
    source: 'stripe' | 'payment';
  }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEB_DOC = 'docs/setup/betalingen-web.md';
const APP_DOC = 'docs/setup/betalingen-app.md';

/**
 * Events the Stripe endpoint should send. `checkout.session.completed` is the
 * one without which nobody gets Premium; the rest keep renewals, failed
 * payments, cancellations, refunds and chargebacks in step. Mirrors
 * `STRIPE_WEBHOOK_EVENTS` in `stripe-billing.ts` (the core of it).
 */
export const RECOMMENDED_STRIPE_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
] as const;

/** Paths that run our Stripe webhook handler. */
const STRIPE_WEBHOOK_PATHS = ['/api/webhook/stripe', '/api/webhooks/payments'];

function worst(a: CheckStatus, b: CheckStatus): CheckStatus {
  const rank: Record<CheckStatus, number> = { ok: 0, warn: 1, fail: 2 };
  return rank[a] >= rank[b] ? a : b;
}

function envSet(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

/** sk_live_ / rk_live_ (restricted) are live; sk_test_ / rk_test_ test. The build placeholder is "missing". */
export function stripeKeyMode(key: string | undefined): 'live' | 'test' | 'missing' {
  const value = (key || '').trim();
  if (/^(sk|rk)_live_/.test(value)) return 'live';
  if (/^(sk|rk)_test_/.test(value) && !value.includes('dummy_key_for_build')) return 'test';
  return 'missing';
}

function isPremiumNow(
  user: {
    isPremium?: boolean;
    premiumStripe?: boolean;
    premiumStore?: boolean;
    hasLifetimePremium?: boolean;
    groupPremiumUntil?: Date | null;
    premiumGrantedUntil?: Date | null;
  },
  now: number,
): boolean {
  // A dated beheer grant that ran out leaves a stale `isPremium` behind.
  const grantExpired = Boolean(user.premiumGrantedUntil && new Date(user.premiumGrantedUntil).getTime() <= now);
  return Boolean(
    (user.isPremium && !grantExpired) ||
      user.premiumStripe ||
      user.premiumStore ||
      user.hasLifetimePremium ||
      (user.groupPremiumUntil && new Date(user.groupPremiumUntil).getTime() > now),
  );
}

function iso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * @param deep  Run the network-heavy calls (Stripe sessions, events, webhook
 *              endpoints; the RevenueCat key probe). Off for the dashboard
 *              tile and the mobile admin screen, which only need the verdict.
 */
export async function getPaymentsHealth({
  deep = true,
  now: nowDate = new Date(),
}: { deep?: boolean; now?: Date } = {}): Promise<PaymentsHealthReport> {
  await connectDB();

  const checks: HealthCheck[] = [];
  const now = nowDate.getTime();
  const since30d = amsterdamWindowStart(30, nowDate);

  // ── 1. Config presence ────────────────────────────────────────────────────
  const keyMode = stripeKeyMode(process.env.STRIPE_SECRET_KEY);

  checks.push(
    keyMode === 'missing'
      ? {
          id: 'stripe_secret_key',
          label: 'Stripe geheime sleutel',
          status: 'fail',
          detail:
            'STRIPE_SECRET_KEY ontbreekt (of is de bouw-placeholder). Er kan niet via de website betaald worden, en de Stripe-controles hieronder (sleutel, prijzen, webhook-endpoint, sessies) zijn daarom niet uitgevoerd.',
          action: `Zet STRIPE_SECRET_KEY (sk_live_...) in de omgeving. Zie ${WEB_DOC}.`,
        }
      : {
          id: 'stripe_secret_key',
          label: 'Stripe geheime sleutel',
          status: keyMode === 'test' ? 'warn' : 'ok',
          detail: keyMode === 'test' ? 'Test-sleutel actief (sk_test_ / rk_test_).' : 'Live-sleutel actief.',
          action:
            keyMode === 'test'
              ? 'In productie hoort een live-sleutel (sk_live_). Alleen laten staan als dit bewust een testomgeving is.'
              : undefined,
        },
  );

  checks.push(
    envSet('STRIPE_WEBHOOK_SECRET')
      ? { id: 'stripe_webhook_secret', label: 'Stripe webhook-secret', status: 'ok', detail: 'STRIPE_WEBHOOK_SECRET is gezet.' }
      : {
          id: 'stripe_webhook_secret',
          label: 'Stripe webhook-secret',
          status: 'fail',
          detail: 'STRIPE_WEBHOOK_SECRET ontbreekt - inkomende Stripe-webhooks worden geweigerd (400), dus betalingen en verlengingen komen niet aan.',
          action: `Kopieer de "Signing secret" van je webhook-endpoint in Stripe naar STRIPE_WEBHOOK_SECRET. Zie ${WEB_DOC}.`,
        },
  );

  for (const [plan, config] of Object.entries(STRIPE_PLANS) as [StripePlanId, (typeof STRIPE_PLANS)[StripePlanId]][]) {
    const optional = plan === 'yearly' || plan === 'group';
    if (!envSet(config.priceEnvKey)) {
      checks.push({
        id: `price_${plan}`,
        label: `Prijs-id ${plan}`,
        status: optional ? 'warn' : 'fail',
        detail: `${config.priceEnvKey} ontbreekt.`,
        action: optional
          ? `${plan === 'yearly' ? 'Het jaarplan' : 'De groepslicentie'} wordt niet verkocht zolang deze leeg is. Vul aan als je dit plan wilt aanbieden.`
          : `Zet ${config.priceEnvKey} met de price-id uit Stripe. Zonder dit plan kan er niet betaald worden.`,
      });
    }
  }

  const trialDays = Number.parseInt(process.env.STRIPE_TRIAL_DAYS || '0', 10) || 0;
  // A product choice, not a fault: reported, never a warning.
  checks.push({
    id: 'trial',
    label: 'Gratis proefperiode',
    status: 'ok',
    detail:
      trialDays > 0
        ? `${trialDays} dagen proef bij een abonnement via de website.`
        : 'Geen proefperiode op de website (STRIPE_TRIAL_DAYS is 0 of leeg). Proef-teksten en -knoppen staan uit.',
  });

  // ── 2. RevenueCat / App Store config ──────────────────────────────────────
  const rcAuth = envSet('REVENUECAT_WEBHOOK_AUTHORIZATION');
  const rcKeyName = envSet('REVENUECAT_SECRET_KEY') ? 'REVENUECAT_SECRET_KEY' : envSet('REVENUECAT_REST_API_KEY') ? 'REVENUECAT_REST_API_KEY' : null;
  const rcRest = rcKeyName !== null;
  checks.push(
    rcAuth
      ? { id: 'rc_webhook_auth', label: 'RevenueCat webhook-autorisatie', status: 'ok', detail: 'REVENUECAT_WEBHOOK_AUTHORIZATION is gezet.' }
      : {
          id: 'rc_webhook_auth',
          label: 'RevenueCat webhook-autorisatie',
          status: 'fail',
          detail: 'REVENUECAT_WEBHOOK_AUTHORIZATION ontbreekt - de app-webhook weigert elke call (401). App-aankopen, verlengingen en terugbetalingen komen niet aan.',
          action: `Bedenk een lange willekeurige string en zet die zowel in de omgeving als in RevenueCat -> Integrations -> Webhooks -> Authorization header. Zie ${APP_DOC}.`,
        },
  );
  checks.push(
    rcRest
      ? { id: 'rc_rest_key', label: 'RevenueCat REST-sleutel', status: 'ok', detail: `${rcKeyName} is gezet.` }
      : {
          id: 'rc_rest_key',
          label: 'RevenueCat REST-sleutel',
          status: 'fail',
          detail: 'REVENUECAT_SECRET_KEY (of het oudere REVENUECAT_REST_API_KEY) ontbreekt - de app kan een aankoop niet direct laten bevestigen; Premium komt dan pas met de webhook.',
          action: `Kopieer de secret API key (sk_...) uit RevenueCat -> API keys naar REVENUECAT_SECRET_KEY. Zie ${APP_DOC}.`,
        },
  );

  checks.push(
    envSet('NEXTAUTH_SECRET') || envSet('JWT_SECRET')
      ? { id: 'jwt_secret', label: 'JWT-secret (app-login)', status: 'ok', detail: 'NEXTAUTH_SECRET / JWT_SECRET is gezet.' }
      : {
          id: 'jwt_secret',
          label: 'JWT-secret (app-login)',
          status: 'fail',
          detail: 'NEXTAUTH_SECRET en JWT_SECRET ontbreken - de server valt terug op een ingebouwde ontwikkelsleutel, dus app-sessies zijn niet veilig.',
          action: 'Zet NEXTAUTH_SECRET op een lange willekeurige string (zelfde waarde in web en app-backend).',
        },
  );

  // ── 3. Stripe live checks ─────────────────────────────────────────────────
  let keyWorks: boolean | null = null;
  let accountCurrency: string | null = null;
  const priceRows: PaymentsHealthReport['stripe']['prices'] = [];
  const webhookEndpoints: PaymentsHealthReport['stripe']['webhookEndpoints'] = [];
  let sessions30d: PaymentsHealthReport['stripe']['sessions30d'] = null;
  const recentEventTypes: PaymentsHealthReport['stripe']['recentEventTypes'] = [];
  let newestCheckoutCompletedAt: string | null = null;
  const liveChecked = keyMode !== 'missing';
  let deepChecked = false;

  if (liveChecked) {
    try {
      const balance = await stripe.balance.retrieve();
      keyWorks = true;
      accountCurrency = balance.available[0]?.currency ?? null;
      checks.push({ id: 'stripe_key_live', label: 'Stripe-sleutel getest', status: 'ok', detail: 'Stripe accepteert de sleutel (balance opgehaald).' });
    } catch (error) {
      keyWorks = false;
      checks.push({
        id: 'stripe_key_live',
        label: 'Stripe-sleutel getest',
        status: 'fail',
        detail: `Stripe weigert de sleutel: ${(error as Error).message}`,
        action: 'Controleer STRIPE_SECRET_KEY. Live-modus vereist een sk_live_ sleutel van hetzelfde account als de webhook.',
      });
    }

    for (const [plan, config] of Object.entries(STRIPE_PLANS) as [StripePlanId, (typeof STRIPE_PLANS)[StripePlanId]][]) {
      const priceId = process.env[config.priceEnvKey] || null;
      if (!priceId) {
        priceRows.push({ plan, envKey: config.priceEnvKey, priceId: null, active: null, amountCents: null, currency: null, interval: null });
        continue;
      }
      try {
        const price = await stripe.prices.retrieve(priceId);
        priceRows.push({
          plan,
          envKey: config.priceEnvKey,
          priceId,
          active: price.active,
          amountCents: price.unit_amount ?? null,
          currency: price.currency ?? null,
          interval: price.recurring?.interval ?? (config.mode === 'payment' ? 'eenmalig' : null),
        });
        if (!price.active) {
          checks.push({
            id: `price_active_${plan}`,
            label: `Prijs ${plan} actief`,
            status: 'fail',
            detail: `Price ${priceId} bestaat maar staat op inactief in Stripe.`,
            action: 'Activeer de prijs in Stripe, of vervang de price-id door een actieve.',
          });
        }
      } catch (error) {
        priceRows.push({ plan, envKey: config.priceEnvKey, priceId, active: false, amountCents: null, currency: null, interval: null, error: (error as Error).message });
        checks.push({
          id: `price_valid_${plan}`,
          label: `Prijs ${plan} geldig`,
          status: 'fail',
          detail: `Stripe kent price-id ${priceId} niet: ${(error as Error).message}`,
          action: `Corrigeer ${config.priceEnvKey}. De id moet uit hetzelfde Stripe-account/modus komen als de sleutel.`,
        });
      }
    }

    if (deep) {
      deepChecked = true;
      try {
        const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
        for (const endpoint of endpoints.data) {
          const events = endpoint.enabled_events ?? [];
          const all = events.includes('*');
          const covers = (name: string) => all || events.includes(name);
          webhookEndpoints.push({
            url: endpoint.url,
            status: endpoint.status ?? 'unknown',
            coversCheckoutCompleted: covers('checkout.session.completed'),
            coversSubscription: covers('customer.subscription.updated') && covers('customer.subscription.deleted'),
            coversInvoices: covers('invoice.paid') || covers('invoice.payment_succeeded'),
            coversRefunds: covers('charge.refunded'),
            missingEvents: RECOMMENDED_STRIPE_EVENTS.filter((name) => !covers(name)),
          });
        }
        const ours = webhookEndpoints.filter(
          (e) => e.status === 'enabled' && e.coversCheckoutCompleted && STRIPE_WEBHOOK_PATHS.some((path) => e.url.includes(path)),
        );
        const usable = ours[0] ?? webhookEndpoints.find((e) => e.status === 'enabled' && e.coversCheckoutCompleted);
        if (!usable) {
          checks.push({
            id: 'stripe_webhook_endpoint',
            label: 'Stripe webhook-endpoint',
            status: 'fail',
            detail:
              webhookEndpoints.length === 0
                ? 'Geen enkel webhook-endpoint in Stripe geconfigureerd.'
                : 'Er is een endpoint, maar geen actief endpoint dat checkout.session.completed ontvangt.',
            action: `Stripe -> Developers -> Webhooks -> Add endpoint: https://www.bijbelquiz.com/api/webhook/stripe, met de events uit ${WEB_DOC}.`,
          });
        } else if (usable.missingEvents.length > 0) {
          checks.push({
            id: 'stripe_webhook_endpoint',
            label: 'Stripe webhook-endpoint',
            status: 'warn',
            detail: `Actief endpoint ${usable.url}, maar het ontvangt niet: ${usable.missingEvents.join(', ')}. Zonder die events kloppen verlengingen, mislukte betalingen, opzeggingen of terugbetalingen niet.`,
            action: `Voeg de ontbrekende events toe aan het endpoint in Stripe -> Developers -> Webhooks. Zie ${WEB_DOC}.`,
          });
        } else {
          checks.push({ id: 'stripe_webhook_endpoint', label: 'Stripe webhook-endpoint', status: 'ok', detail: `Actief endpoint: ${usable.url}` });
        }
      } catch (error) {
        checks.push({
          id: 'stripe_webhook_endpoint',
          label: 'Stripe webhook-endpoint',
          status: 'warn',
          detail: `Kon endpoints niet opvragen: ${(error as Error).message}`,
          action: 'Controleer handmatig in Stripe -> Developers -> Webhooks.',
        });
      }

      try {
        const list = await stripe.checkout.sessions.list({
          limit: 100,
          created: { gte: Math.floor(since30d.getTime() / 1000) },
        });
        const tally = { total: 0, complete: 0, open: 0, expired: 0, paid: 0 };
        for (const s of list.data) {
          tally.total += 1;
          if (s.status === 'complete') tally.complete += 1;
          else if (s.status === 'open') tally.open += 1;
          else if (s.status === 'expired') tally.expired += 1;
          if (s.payment_status === 'paid' || s.payment_status === 'no_payment_required') tally.paid += 1;
        }
        sessions30d = tally;
      } catch (error) {
        checks.push({
          id: 'stripe_sessions',
          label: 'Stripe checkout-sessies',
          status: 'warn',
          detail: `Kon sessies niet opvragen: ${(error as Error).message}`,
        });
      }

      try {
        const events = await stripe.events.list({ limit: 20 });
        for (const e of events.data) {
          recentEventTypes.push({ type: e.type, at: new Date(e.created * 1000).toISOString() });
          if (e.type === 'checkout.session.completed' && !newestCheckoutCompletedAt) {
            newestCheckoutCompletedAt = new Date(e.created * 1000).toISOString();
          }
        }
      } catch {
        // non-fatal: the freshness check below simply does not run
      }
    }
  }

  // Shown prices: an explicit label wins, then the live Stripe price, then a
  // built-in fallback (`premium-prices.ts`). Only the last is a problem.
  const labelFallbacks = (Object.keys(PREMIUM_PRICE_LABEL_ENV) as Array<keyof typeof PREMIUM_PRICE_LABEL_ENV>).filter((plan) => {
    if (envSet(PREMIUM_PRICE_LABEL_ENV[plan])) return false;
    const live = priceRows.find((row) => row.plan === plan);
    return !(live?.active && typeof live.amountCents === 'number' && (live.currency || '').toLowerCase() === 'eur');
  });
  checks.push(
    labelFallbacks.length === 0
      ? { id: 'price_labels', label: 'Getoonde prijzen', status: 'ok', detail: 'Elke getoonde prijs komt uit een prijslabel of uit de live Stripe-prijs.' }
      : {
          id: 'price_labels',
          label: 'Getoonde prijzen',
          status: 'warn',
          detail: `Voor ${labelFallbacks.join(', ')} is geen prijslabel gezet en geen live Stripe-prijs opgehaald - de paywall toont dan een ingebouwd bedrag dat kan afwijken van wat Stripe rekent.`,
          action: `Zet ${labelFallbacks.map((plan) => PREMIUM_PRICE_LABEL_ENV[plan]).join(', ')}, of zorg dat de Stripe-sleutel en price-id werken.`,
        },
  );

  // ── 4. RevenueCat REST key live test (deep only: it is a network call) ──
  let rcRestWorks: boolean | null = null;
  if (rcRest && deep) {
    try {
      const probe = await fetch('https://api.revenuecat.com/v1/subscribers/bijbelquiz-healthcheck', {
        headers: { Authorization: `Bearer ${process.env[rcKeyName!]}` },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      });
      rcRestWorks = probe.status === 200 || probe.status === 201;
      checks.push(
        rcRestWorks
          ? { id: 'rc_rest_live', label: 'RevenueCat REST-sleutel getest', status: 'ok', detail: 'RevenueCat accepteert de REST-sleutel.' }
          : {
              id: 'rc_rest_live',
              label: 'RevenueCat REST-sleutel getest',
              status: 'fail',
              detail: `RevenueCat weigert de REST-sleutel (HTTP ${probe.status}).`,
              action: 'Gebruik de SECRET key (sk_...) uit RevenueCat -> API keys, niet de public SDK-key.',
            },
      );
    } catch (error) {
      checks.push({
        id: 'rc_rest_live',
        label: 'RevenueCat REST-sleutel getest',
        status: 'warn',
        detail: `Kon RevenueCat niet bereiken: ${(error as Error).message}`,
      });
    }
  }

  // ── 5. Stored webhook events, failures, funnel ─────────────────────────
  const internalIds = await getInternalAccountIds();
  const internalSet = new Set(internalIds.map(String));
  const notInternalEvent = internalIds.length > 0 ? { userId: { $nin: internalIds } } : {};
  const stuckBefore = new Date(now - 15 * 60 * 1000);

  const [
    stripeWebhookCount,
    rcWebhookCount,
    newestStripeWebhook,
    newestRcWebhook,
    stripeStuck,
    recentPayments,
    pastDueAccounts,
    funnelAgg,
    stripeCheckoutsCompleted,
  ] = await Promise.all([
    WebhookEvent.countDocuments({ provider: 'stripe' }),
    WebhookEvent.countDocuments({ provider: 'revenuecat' }),
    WebhookEvent.findOne({ provider: 'stripe' }).sort({ createdAt: -1 }).select('createdAt').lean(),
    WebhookEvent.findOne({ provider: 'revenuecat' }).sort({ createdAt: -1 }).select('createdAt').lean(),
    WebhookEvent.countDocuments({ provider: 'stripe', status: 'processing', updatedAt: { $lt: stuckBefore } }),
    Payment.find({ createdAt: { $gte: since30d } }).lean<PaymentLike[]>(),
    User.countDocuments({ stripeSubscriptionStatus: { $in: ['past_due', 'unpaid'] }, ...(internalIds.length > 0 ? { _id: { $nin: internalIds } } : {}) }),
    AnalyticsEvent.aggregate([
      {
        $match: {
          name: { $in: ['paywall_shown', 'checkout_started', 'purchase_completed', 'trial_started', 'trial_converted'] },
          createdAt: { $gte: since30d },
          ...notInternalEvent,
        },
      },
      { $group: { _id: '$name', n: { $sum: 1 } } },
    ]),
    // What a web checkout ends in: a purchase or, with a trial, a trial start.
    AnalyticsEvent.countDocuments({
      name: { $in: ['purchase_completed', 'trial_started'] },
      'props.provider': 'stripe',
      createdAt: { $gte: since30d },
      ...notInternalEvent,
    }),
  ]);

  const funnelMap = new Map<string, number>(funnelAgg.map((r: { _id: string; n: number }) => [r._id, r.n]));
  const funnel30d = {
    paywallShown: funnelMap.get('paywall_shown') ?? 0,
    checkoutStarted: funnelMap.get('checkout_started') ?? 0,
    purchaseCompleted: funnelMap.get('purchase_completed') ?? 0,
    stripeCheckoutsCompleted,
    trialStarted: funnelMap.get('trial_started') ?? 0,
    trialConverted: funnelMap.get('trial_converted') ?? 0,
  };

  if (funnel30d.checkoutStarted > 0 && funnel30d.stripeCheckoutsCompleted === 0) {
    checks.push({
      id: 'funnel_no_purchase',
      label: 'Klik -> aankoop',
      status: 'fail',
      detail: `${funnel30d.checkoutStarted} keer op "betalen" geklikt in 30 dagen, 0 voltooide web-aankopen of proefperiodes geregistreerd.`,
      action: `Of niemand rondt af, of de webhook bevestigt het niet. Vergelijk met "Checkout-sessies" bij Stripe hieronder: staat daar wel "voltooid", dan is het de webhook (${WEB_DOC}).`,
    });
  }

  const classified = recentPayments.map((payment) => ({ payment, row: classifyPayment(payment, internalSet) }));
  // Only rows written since the payment rework (they carry `environment`):
  // before it, a cancelled subscription also left a EUR 0 row on `failed`,
  // which is not a failed payment.
  const failedPayments = classified.filter(
    ({ payment, row }) =>
      Boolean(payment.environment) &&
      Number(payment.amount ?? 0) > 0 &&
      !row.isTest &&
      !row.isInternal &&
      row.verdict === 'unpaid' &&
      row.displayStatus === 'failed',
  ).length;
  const refunds30d = classified.filter(({ row }) => row.verdict === 'paid' && row.refundedCents > 0).length;
  const failures30d = { failedPayments, pastDueAccounts, refunds: refunds30d };

  checks.push(
    failedPayments === 0 && pastDueAccounts === 0
      ? { id: 'payment_failures', label: 'Mislukte betalingen', status: 'ok', detail: 'Geen mislukte betalingen in 30 dagen en geen abonnement met een betaalachterstand.' }
      : {
          id: 'payment_failures',
          label: 'Mislukte betalingen',
          status: 'warn',
          detail: `${failedPayments} betaling(en) mislukt in 30 dagen; ${pastDueAccounts} account(s) met een abonnement dat achterloopt (past_due/unpaid). Meestal een verlopen kaart bij een verlenging.`,
          action: 'Stripe probeert zelf opnieuw en mailt de klant als dat in Stripe -> Billing -> Revenue recovery aanstaat. Kijk in Stripe -> Payments bij "Failed" wie het betreft.',
        },
  );

  if (stripeStuck > 0) {
    checks.push({
      id: 'webhook_stuck',
      label: 'Webhook-verwerking',
      status: 'warn',
      detail: `${stripeStuck} Stripe-event(s) zijn binnengekomen maar niet afgerond (langer dan 15 minuten "processing").`,
      action: 'Stripe probeert ze opnieuw. Zie de serverlogs bij [stripe-billing] voor de fout.',
    });
  }

  // ── 6. Access gaps: paid but no premium on the account ──────────────────
  const accessGaps: PaymentsHealthReport['accessGaps'] = [];
  let recentAttempts: PaymentsHealthReport['recentAttempts'] = [];
  let recentAttemptsSource: PaymentsHealthReport['recentAttemptsSource'] = 'payment';

  if (deepChecked) {
    try {
      const list = await stripe.checkout.sessions.list({ limit: 25 });
      const userIds = list.data
        .map((s) => s.metadata?.userId)
        .filter((id): id is string => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id));
      const users = userIds.length
        ? await User.find({ _id: { $in: userIds } })
            .select('name email isPremium premiumStripe premiumStore hasLifetimePremium groupPremiumUntil premiumGranted premiumGrantedUntil')
            .lean()
        : [];
      const userById = new Map(users.map((u) => [String(u._id), u]));

      const sessionIds = list.data.map((s) => s.id);
      const payments = sessionIds.length
        ? await Payment.find({ stripeSessionId: { $in: sessionIds } }).select('stripeSessionId status').lean()
        : [];
      const paymentBySession = new Map(payments.map((p) => [p.stripeSessionId, p.status]));

      recentAttemptsSource = 'stripe';
      for (const s of list.data) {
        const uid = s.metadata?.userId;
        const user = uid ? userById.get(uid) : undefined;
        const access = user ? isPremiumNow(user, now) : false;
        const plan = String(s.metadata?.plan ?? '-');
        const settledPaid = s.status === 'complete' && (s.payment_status === 'paid' || s.payment_status === 'no_payment_required');
        // Only where the purchase should still be running: a lifetime buy, or
        // a subscription started in the last 35 days. An older subscription
        // may simply have ended; a group licence gives Premium to the members.
        const shouldHaveAccess =
          plan !== 'group' && (plan === 'lifetime' || now - s.created * 1000 < 35 * DAY_MS);

        recentAttempts.push({
          when: new Date(s.created * 1000).toISOString(),
          name: user?.name ?? '-',
          email: user?.email ?? s.customer_email ?? s.customer_details?.email ?? '-',
          plan,
          amountCents: s.amount_total ?? 0,
          currency: s.currency ?? 'eur',
          stripeSessionStatus: s.status ?? null,
          stripePaymentStatus: s.payment_status ?? null,
          ourPaymentStatus: paymentBySession.get(s.id) ?? null,
          hasAccessNow: access,
          source: 'stripe',
        });

        if (settledPaid && user && !access && shouldHaveAccess) {
          accessGaps.push({
            userId: uid!,
            name: user.name ?? '-',
            email: user.email ?? '-',
            reason: 'Stripe-sessie is "complete" en betaald, maar het account is niet premium. Webhook niet aangekomen of gefaald.',
            when: new Date(s.created * 1000).toISOString(),
          });
        }
      }
    } catch (error) {
      checks.push({
        id: 'access_reconcile',
        label: 'Toegang gereconcilieerd',
        status: 'warn',
        detail: `Kon Stripe-sessies niet met accounts vergelijken: ${(error as Error).message}`,
      });
    }
  }

  // Our own received payments whose paid period still runs, but whose
  // account is not premium. Test money and refunded payments are not checked.
  const ownPayments = await Payment.find({ status: { $in: ['completed', 'refunded'] } })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('user', 'name email isPremium premiumStripe premiumStore hasLifetimePremium groupPremiumUntil')
    .lean<PaymentLike[]>();
  for (const p of ownPayments) {
    const row = classifyPayment(p, internalSet);
    if (row.isTest || row.isRefunded || (row.verdict !== 'paid' && row.verdict !== 'internal')) continue;
    if (!paidPeriodCoversNow(p, nowDate)) continue;
    const user = p.user as
      | { _id?: unknown; name?: string; email?: string; isPremium?: boolean; premiumStripe?: boolean; premiumStore?: boolean; hasLifetimePremium?: boolean; groupPremiumUntil?: Date | null }
      | null;
    if (!user || typeof user !== 'object' || !('email' in user) || isPremiumNow(user, now)) continue;
    const uid = String(user._id ?? '');
    if (accessGaps.some((g) => g.userId === uid)) continue;
    accessGaps.push({
      userId: uid,
      name: user.name ?? '-',
      email: user.email ?? '-',
      reason: `Betaling (${p.provider === 'revenuecat' ? 'app' : 'web'}, ${p.planType ?? 'onbekend plan'}) is ontvangen en de betaalde periode loopt nog, maar het account is niet premium.`,
      when: iso(paymentDate(p)) ?? '',
    });
  }

  checks.push(
    accessGaps.length > 0
      ? {
          id: 'access_gaps',
          label: 'Betaald zonder toegang',
          status: 'fail',
          detail: `${accessGaps.length} account(s) hebben betaald voor een periode die nog loopt, maar zijn niet premium.`,
          action: 'Kijk of de webhook aankomt (zie hierboven). Zet toegang tijdelijk handmatig terwijl je dat oplost.',
        }
      : {
          id: 'access_gaps',
          label: 'Betaald zonder toegang',
          status: 'ok',
          detail: 'Geen mismatch gevonden: iedereen met een lopende betaalde periode is premium.',
        },
  );

  // Without Stripe to ask, show our own newest payment rows.
  if (recentAttemptsSource === 'payment') {
    const rows = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name email isPremium premiumStripe premiumStore hasLifetimePremium groupPremiumUntil')
      .lean<PaymentLike[]>();
    recentAttempts = rows.map((p) => {
      const user = (p.user ?? null) as { name?: string; email?: string; isPremium?: boolean } | null;
      const row = classifyPayment(p, internalSet);
      return {
        when: iso(paymentDate(p)) ?? '',
        name: user?.name ?? '-',
        email: user?.email ?? 'verwijderd account',
        plan: String(p.planType ?? '-'),
        amountCents: Math.max(0, Math.round(Number(p.amount ?? 0))),
        currency: row.currency,
        stripeSessionStatus: null,
        stripePaymentStatus: null,
        ourPaymentStatus: row.isTest ? 'sandbox' : row.displayStatus,
        hasAccessNow: user ? isPremiumNow(user, now) : false,
        source: 'payment' as const,
      };
    });
  }

  // ── 7. Webhook freshness ───────────────────────────────────────────────
  // Stripe sent a checkout completion but we stored nothing near it.
  if (newestCheckoutCompletedAt) {
    const stripeAt = new Date(newestCheckoutCompletedAt).getTime();
    const oursAt = newestStripeWebhook?.createdAt ? new Date(newestStripeWebhook.createdAt).getTime() : 0;
    if (stripeAt - oursAt > 6 * 60 * 60 * 1000) {
      checks.push({
        id: 'webhook_freshness',
        label: 'Webhook komt aan',
        status: 'fail',
        detail: `Stripe verstuurde op ${newestCheckoutCompletedAt} een checkout-bevestiging, maar onze nieuwste opgeslagen Stripe-webhook is van ${iso(newestStripeWebhook?.createdAt) ?? 'nooit'}.`,
        action: 'De webhook bereikt de server niet of faalt. Check Stripe -> Webhooks -> je endpoint -> "Recent deliveries" op antwoorden die geen 2xx zijn.',
      });
    } else {
      checks.push({ id: 'webhook_freshness', label: 'Webhook komt aan', status: 'ok', detail: 'De nieuwste checkout-bevestiging van Stripe is ook bij ons verwerkt.' });
    }
  }

  // App purchases recorded, but no app webhook ever: the purchase came in
  // through the app's own sync, so renewals and refunds will not arrive.
  const storePayments30d = classified.filter(({ payment }) => payment.provider === 'revenuecat').length;
  if (storePayments30d > 0 && rcWebhookCount === 0) {
    checks.push({
      id: 'rc_webhook_freshness',
      label: 'App-webhook komt aan',
      status: 'fail',
      detail: `${storePayments30d} app-betaling(en) in 30 dagen, maar nog nooit een RevenueCat-webhook opgeslagen.`,
      action: `Zet in RevenueCat -> Integrations -> Webhooks de URL https://www.bijbelquiz.com/api/mobile/revenuecat-webhook met dezelfde Authorization als REVENUECAT_WEBHOOK_AUTHORIZATION. Zie ${APP_DOC}.`,
    });
  }

  const overall = checks.reduce<CheckStatus>((acc, c) => worst(acc, c.status), 'ok');

  return {
    generatedAt: new Date(now).toISOString(),
    overall,
    checks,
    stripe: {
      keyMode,
      keyWorks,
      liveChecked,
      deepChecked,
      accountCurrency,
      webhookEndpoints,
      prices: priceRows,
      sessions30d,
      recentEventTypes,
      newestCheckoutCompletedAt,
    },
    revenuecat: {
      webhookAuthConfigured: rcAuth,
      restKeyConfigured: rcRest,
      restKeyWorks: rcRestWorks,
      webhookEventsStored: rcWebhookCount,
      newestWebhookEventAt: iso(newestRcWebhook?.createdAt),
    },
    webhooksStored: {
      stripe: stripeWebhookCount,
      stripeNewestAt: iso(newestStripeWebhook?.createdAt),
      stripeStuck,
      revenuecat: rcWebhookCount,
      revenuecatNewestAt: iso(newestRcWebhook?.createdAt),
    },
    failures30d,
    funnel30d,
    accessGaps,
    recentAttemptsSource,
    recentAttempts: recentAttempts.slice(0, 20),
  };
}
