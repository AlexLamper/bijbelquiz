import { connectDB, AnalyticsEvent, Payment, User, WebhookEvent } from '@/database';
import stripe from '@/lib/stripe';
import { STRIPE_PLANS, type StripePlanId } from '@/lib/stripe-plans';

/**
 * "Does the whole paying pipeline work" - one report.
 *
 * Answers, in order: is the config there, does Stripe accept our key, is the
 * webhook wired, are the prices real, did people click pay, did checkout
 * succeed, and did the buyer actually end up with a premium account. Every
 * check degrades to a row with a remediation line instead of throwing, so a
 * broken key never blanks the admin page.
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
    accountCurrency: string | null;
    webhookEndpoints: Array<{
      url: string;
      status: string;
      coversCheckoutCompleted: boolean;
      coversSubscription: boolean;
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
    revenuecat: number;
    revenuecatNewestAt: string | null;
  };
  funnel30d: {
    paywallShown: number;
    checkoutStarted: number;
    purchaseCompleted: number;
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

function worst(a: CheckStatus, b: CheckStatus): CheckStatus {
  const rank: Record<CheckStatus, number> = { ok: 0, warn: 1, fail: 2 };
  return rank[a] >= rank[b] ? a : b;
}

function envSet(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function isPremiumNow(user: {
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  hasLifetimePremium?: boolean;
  groupPremiumUntil?: Date | null;
}): boolean {
  return Boolean(
    user.isPremium ||
      user.premiumStripe ||
      user.premiumStore ||
      user.hasLifetimePremium ||
      (user.groupPremiumUntil && new Date(user.groupPremiumUntil).getTime() > Date.now())
  );
}

/**
 * @param deep  Run the network-heavy Stripe list calls (sessions, events,
 *              webhook endpoints). Off for the mobile admin screen, which only
 *              needs the config verdict.
 */
export async function getPaymentsHealth({ deep = true }: { deep?: boolean } = {}): Promise<PaymentsHealthReport> {
  await connectDB();

  const checks: HealthCheck[] = [];
  const now = Date.now();
  const since30d = new Date(now - 30 * DAY_MS);

  // ── 1. Config presence ────────────────────────────────────────────────────
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const keyMode: 'live' | 'test' | 'missing' = secretKey.startsWith('sk_live_')
    ? 'live'
    : secretKey.startsWith('sk_test_')
      ? 'test'
      : 'missing';

  checks.push(
    keyMode === 'missing'
      ? {
          id: 'stripe_secret_key',
          label: 'Stripe geheime sleutel',
          status: 'fail',
          detail: 'STRIPE_SECRET_KEY ontbreekt of is de bouw-placeholder.',
          action: 'Zet STRIPE_SECRET_KEY (sk_live_...) in de omgeving. Zie stap 1 van de handleiding.',
        }
      : {
          id: 'stripe_secret_key',
          label: 'Stripe geheime sleutel',
          status: keyMode === 'test' ? 'warn' : 'ok',
          detail: keyMode === 'test' ? 'Test-sleutel actief (sk_test_).' : 'Live-sleutel actief.',
          action:
            keyMode === 'test'
              ? 'In productie hoort een sk_live_ sleutel. Alleen laten staan als dit bewust een testomgeving is.'
              : undefined,
        }
  );

  checks.push(
    envSet('STRIPE_WEBHOOK_SECRET')
      ? { id: 'stripe_webhook_secret', label: 'Stripe webhook-secret', status: 'ok', detail: 'STRIPE_WEBHOOK_SECRET is gezet.' }
      : {
          id: 'stripe_webhook_secret',
          label: 'Stripe webhook-secret',
          status: 'fail',
          detail: 'STRIPE_WEBHOOK_SECRET ontbreekt - inkomende webhooks worden geweigerd (400).',
          action: 'Kopieer de "Signing secret" van je webhook-endpoint in Stripe naar STRIPE_WEBHOOK_SECRET. Zie stap 4.',
        }
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

  checks.push(
    envSet('NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL')
      ? { id: 'price_labels', label: 'Prijslabels (weergave)', status: 'ok', detail: 'NEXT_PUBLIC_*_PRICE_LABEL is gezet.' }
      : {
          id: 'price_labels',
          label: 'Prijslabels (weergave)',
          status: 'warn',
          detail: 'NEXT_PUBLIC_PREMIUM_*_PRICE_LABEL ontbreekt - de paywall valt terug op ingebouwde bedragen.',
          action: 'Zet de NEXT_PUBLIC_PREMIUM_MONTHLY/YEARLY/LIFETIME_PRICE_LABEL zodat de getoonde prijs de echte prijs is.',
        }
  );

  const trialRaw = process.env.STRIPE_TRIAL_DAYS;
  const trialDays = Number.parseInt(trialRaw || '0', 10) || 0;
  checks.push({
    id: 'trial',
    label: 'Gratis proefperiode',
    status: trialDays > 0 ? 'ok' : 'warn',
    detail: trialDays > 0 ? `${trialDays} dagen proef actief.` : 'STRIPE_TRIAL_DAYS=0 - geen proefperiode. Alle proef-teksten en knoppen staan uit.',
    action: trialDays > 0 ? undefined : 'Wil je conversie verhogen: zet STRIPE_TRIAL_DAYS op 7 of 14. Zie het conversieplan.',
  });

  // ── 2. RevenueCat / App Store config ──────────────────────────────────────
  const rcAuth = envSet('REVENUECAT_WEBHOOK_AUTHORIZATION');
  const rcRest = envSet('REVENUECAT_REST_API_KEY');
  checks.push(
    rcAuth
      ? { id: 'rc_webhook_auth', label: 'RevenueCat webhook-autorisatie', status: 'ok', detail: 'REVENUECAT_WEBHOOK_AUTHORIZATION is gezet.' }
      : {
          id: 'rc_webhook_auth',
          label: 'RevenueCat webhook-autorisatie',
          status: 'fail',
          detail: 'REVENUECAT_WEBHOOK_AUTHORIZATION ontbreekt - de app-webhook geeft op elke call 401. App-aankopen geven GEEN premium.',
          action: 'Bedenk een lange willekeurige string, zet die zowel in de omgeving als in RevenueCat -> Webhooks -> Authorization header. Zie stap 7.',
        }
  );
  checks.push(
    rcRest
      ? { id: 'rc_rest_key', label: 'RevenueCat REST-sleutel', status: 'ok', detail: 'REVENUECAT_REST_API_KEY is gezet.' }
      : {
          id: 'rc_rest_key',
          label: 'RevenueCat REST-sleutel',
          status: 'fail',
          detail: 'REVENUECAT_REST_API_KEY ontbreekt - /api/mobile/sync-premium geeft 500. App-aankopen worden niet bevestigd.',
          action: 'Kopieer de secret API key uit RevenueCat -> API keys naar REVENUECAT_REST_API_KEY. Zie stap 8.',
        }
  );

  checks.push(
    envSet('NEXTAUTH_SECRET') || envSet('JWT_SECRET')
      ? { id: 'jwt_secret', label: 'JWT-secret (app-login)', status: 'ok', detail: 'NEXTAUTH_SECRET / JWT_SECRET is gezet.' }
      : {
          id: 'jwt_secret',
          label: 'JWT-secret (app-login)',
          status: 'fail',
          detail: 'NEXTAUTH_SECRET/JWT_SECRET ontbreekt - de app kan geen sessie verifiëren.',
          action: 'Zet NEXTAUTH_SECRET op een lange willekeurige string (zelfde waarde in web en app-backend).',
        }
  );

  // ── 3. Stripe live checks ─────────────────────────────────────────────────
  let keyWorks: boolean | null = null;
  let accountCurrency: string | null = null;
  const priceRows: PaymentsHealthReport['stripe']['prices'] = [];
  const webhookEndpoints: PaymentsHealthReport['stripe']['webhookEndpoints'] = [];
  let sessions30d: PaymentsHealthReport['stripe']['sessions30d'] = null;
  const recentEventTypes: PaymentsHealthReport['stripe']['recentEventTypes'] = [];
  let newestCheckoutCompletedAt: string | null = null;

  if (keyMode !== 'missing') {
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

    // Prices
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
      // Webhook endpoints
      try {
        const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
        for (const endpoint of endpoints.data) {
          const events = endpoint.enabled_events ?? [];
          const all = events.includes('*');
          webhookEndpoints.push({
            url: endpoint.url,
            status: endpoint.status ?? 'unknown',
            coversCheckoutCompleted: all || events.includes('checkout.session.completed'),
            coversSubscription:
              all ||
              events.some((e) => e.startsWith('customer.subscription.')),
          });
        }
        const usable = webhookEndpoints.find(
          (e) => e.status === 'enabled' && e.coversCheckoutCompleted
        );
        checks.push(
          usable
            ? { id: 'stripe_webhook_endpoint', label: 'Stripe webhook-endpoint', status: 'ok', detail: `Actief endpoint: ${usable.url}` }
            : {
                id: 'stripe_webhook_endpoint',
                label: 'Stripe webhook-endpoint',
                status: 'fail',
                detail:
                  webhookEndpoints.length === 0
                    ? 'Geen enkel webhook-endpoint in Stripe geconfigureerd.'
                    : 'Er is een endpoint, maar geen actief endpoint dat checkout.session.completed ontvangt.',
                action:
                  'Stripe -> Developers -> Webhooks -> Add endpoint: https://www.bijbelquiz.com/api/webhook/stripe, events checkout.session.completed + customer.subscription.created/updated/deleted. Zie stap 3.',
              }
        );
      } catch (error) {
        checks.push({
          id: 'stripe_webhook_endpoint',
          label: 'Stripe webhook-endpoint',
          status: 'warn',
          detail: `Kon endpoints niet opvragen: ${(error as Error).message}`,
          action: 'Controleer handmatig in Stripe -> Developers -> Webhooks.',
        });
      }

      // Checkout sessions, last 30 days
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

      // Recent events + newest checkout.session.completed
      try {
        const events = await stripe.events.list({ limit: 20 });
        for (const e of events.data) {
          recentEventTypes.push({ type: e.type, at: new Date(e.created * 1000).toISOString() });
          if (e.type === 'checkout.session.completed' && !newestCheckoutCompletedAt) {
            newestCheckoutCompletedAt = new Date(e.created * 1000).toISOString();
          }
        }
      } catch {
        // non-fatal
      }
    }
  }

  // ── 4. RevenueCat REST key live test ─────────────────────────────────────
  let rcRestWorks: boolean | null = null;
  if (rcRest) {
    try {
      const probe = await fetch(
        'https://api.revenuecat.com/v1/subscribers/000000000000000000000000',
        { headers: { Authorization: `Bearer ${process.env.REVENUECAT_REST_API_KEY}` } }
      );
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
            }
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

  // ── 5. Stored webhook events ────────────────────────────────────────────
  const [stripeWebhookCount, rcWebhookCount, newestStripeWebhook, newestRcWebhook] = await Promise.all([
    WebhookEvent.countDocuments({ provider: 'stripe' }),
    WebhookEvent.countDocuments({ provider: 'revenuecat' }),
    WebhookEvent.findOne({ provider: 'stripe' }).sort({ createdAt: -1 }).select('createdAt').lean(),
    WebhookEvent.findOne({ provider: 'revenuecat' }).sort({ createdAt: -1 }).select('createdAt').lean(),
  ]);

  // ── 6. Funnel counts (30 days) ─────────────────────────────────────────
  const funnelAgg = await AnalyticsEvent.aggregate([
    { $match: { name: { $in: ['paywall_shown', 'checkout_started', 'purchase_completed', 'trial_started', 'trial_converted'] }, createdAt: { $gte: since30d } } },
    { $group: { _id: '$name', n: { $sum: 1 } } },
  ]);
  const funnelMap = new Map<string, number>(funnelAgg.map((r: { _id: string; n: number }) => [r._id, r.n]));
  const funnel30d = {
    paywallShown: funnelMap.get('paywall_shown') ?? 0,
    checkoutStarted: funnelMap.get('checkout_started') ?? 0,
    purchaseCompleted: funnelMap.get('purchase_completed') ?? 0,
    trialStarted: funnelMap.get('trial_started') ?? 0,
    trialConverted: funnelMap.get('trial_converted') ?? 0,
  };

  if (funnel30d.checkoutStarted > 0 && funnel30d.purchaseCompleted === 0) {
    checks.push({
      id: 'funnel_no_purchase',
      label: 'Klik -> aankoop',
      status: 'fail',
      detail: `${funnel30d.checkoutStarted} keer op "betalen" geklikt in 30 dagen, 0 voltooide aankopen geregistreerd.`,
      action: 'Of niemand rondt af, of de webhook bevestigt het niet. Vergelijk met "Stripe checkout-sessies" hieronder: staat daar wel "complete", dan is het de webhook (stap 3-4).',
    });
  }

  // ── 7. Access gaps: paid in Stripe but no premium on the account ────────
  const accessGaps: PaymentsHealthReport['accessGaps'] = [];
  const recentAttempts: PaymentsHealthReport['recentAttempts'] = [];

  if (deep && keyMode !== 'missing') {
    try {
      const list = await stripe.checkout.sessions.list({ limit: 25 });
      const userIds = list.data
        .map((s) => s.metadata?.userId)
        .filter((id): id is string => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id));
      const users = userIds.length
        ? await User.find({ _id: { $in: userIds } })
            .select('name email isPremium premiumStripe premiumStore hasLifetimePremium groupPremiumUntil')
            .lean()
        : [];
      const userById = new Map(users.map((u) => [String(u._id), u]));

      const sessionIds = list.data.map((s) => s.id);
      const payments = sessionIds.length
        ? await Payment.find({ stripeSessionId: { $in: sessionIds } }).select('stripeSessionId status').lean()
        : [];
      const paymentBySession = new Map(payments.map((p) => [p.stripeSessionId, p.status]));

      for (const s of list.data) {
        const uid = s.metadata?.userId;
        const user = uid ? userById.get(uid) : undefined;
        const access = user ? isPremiumNow(user) : false;
        const settledPaid = s.status === 'complete' && (s.payment_status === 'paid' || s.payment_status === 'no_payment_required');

        recentAttempts.push({
          when: new Date(s.created * 1000).toISOString(),
          name: user?.name ?? '-',
          email: user?.email ?? s.customer_email ?? '-',
          plan: String(s.metadata?.plan ?? '-'),
          amountCents: s.amount_total ?? 0,
          currency: s.currency ?? 'eur',
          stripeSessionStatus: s.status ?? null,
          stripePaymentStatus: s.payment_status ?? null,
          ourPaymentStatus: paymentBySession.get(s.id) ?? null,
          hasAccessNow: access,
          source: 'stripe',
        });

        if (settledPaid && user && !access) {
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

  // Also: our own completed Payment rows whose user is not premium.
  const completedPayments = await Payment.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('user', 'name email isPremium premiumStripe premiumStore hasLifetimePremium groupPremiumUntil')
    .lean();
  for (const p of completedPayments as unknown as Array<Record<string, unknown>>) {
    const user = p.user as
      | { _id?: unknown; name?: string; email?: string; isPremium?: boolean; premiumStripe?: boolean; premiumStore?: boolean; hasLifetimePremium?: boolean; groupPremiumUntil?: Date | null }
      | null;
    if (user && !isPremiumNow(user)) {
      const uid = String(user._id ?? '');
      if (!accessGaps.some((g) => g.userId === uid)) {
        accessGaps.push({
          userId: uid,
          name: user.name ?? '-',
          email: user.email ?? '-',
          reason: 'Betaling staat op "completed" in onze database, maar het account is niet premium.',
          when: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt ?? ''),
        });
      }
    }
  }

  if (accessGaps.length > 0) {
    checks.push({
      id: 'access_gaps',
      label: 'Betaald zonder toegang',
      status: 'fail',
      detail: `${accessGaps.length} account(s) hebben betaald maar zijn niet premium.`,
      action: 'Fix de webhook (stap 3-4). Zet toegang tijdelijk handmatig via /beheer of de Stripe-portal terwijl je dat doet.',
    });
  } else {
    checks.push({
      id: 'access_gaps',
      label: 'Betaald zonder toegang',
      status: 'ok',
      detail: 'Geen mismatch gevonden: iedereen die betaalde is premium.',
    });
  }

  // Webhook freshness: Stripe sent a checkout completion but we stored nothing near it.
  if (deep && newestCheckoutCompletedAt) {
    const stripeAt = new Date(newestCheckoutCompletedAt).getTime();
    const oursAt = newestStripeWebhook?.createdAt ? new Date(newestStripeWebhook.createdAt).getTime() : 0;
    if (stripeAt - oursAt > 6 * 60 * 60 * 1000) {
      checks.push({
        id: 'webhook_freshness',
        label: 'Webhook komt aan',
        status: 'fail',
        detail: `Stripe verstuurde recent (${newestCheckoutCompletedAt}) een checkout-bevestiging, maar onze nieuwste opgeslagen webhook is van ${newestStripeWebhook?.createdAt ?? 'nooit'}.`,
        action: 'De webhook bereikt de server niet of faalt. Check Stripe -> Webhooks -> je endpoint -> "Recent deliveries" op non-2xx antwoorden.',
      });
    }
  }

  const overall = checks.reduce<CheckStatus>((acc, c) => worst(acc, c.status), 'ok');

  return {
    generatedAt: new Date().toISOString(),
    overall,
    checks,
    stripe: {
      keyMode,
      keyWorks,
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
      newestWebhookEventAt: newestRcWebhook?.createdAt ? new Date(newestRcWebhook.createdAt).toISOString() : null,
    },
    webhooksStored: {
      stripe: stripeWebhookCount,
      stripeNewestAt: newestStripeWebhook?.createdAt ? new Date(newestStripeWebhook.createdAt).toISOString() : null,
      revenuecat: rcWebhookCount,
      revenuecatNewestAt: newestRcWebhook?.createdAt ? new Date(newestRcWebhook.createdAt).toISOString() : null,
    },
    funnel30d,
    accessGaps,
    recentAttempts: recentAttempts.slice(0, 20),
  };
}
