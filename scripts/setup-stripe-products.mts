/**
 * Brings a Stripe account in line with what the website expects: products and
 * prices, a webhook endpoint, a customer portal configuration, and the payment
 * methods a Dutch audience actually uses.
 *
 * Safe by default: it only reports what it would do. Nothing is written until
 * you pass `--apply`, and writing to a live account additionally requires
 * `--live`, so a live key that happens to be in the environment cannot be acted
 * on by accident.
 *
 *   npm run stripe:setup                      # show the plan
 *   npm run stripe:setup -- --apply           # apply to a test account
 *   npm run stripe:setup -- --apply --live    # apply to a live account
 *
 * Everything is idempotent: prices are found again by `lookup_key`, products by
 * a metadata tag, the webhook by its URL, the portal by being the default one.
 * Re-running reports "exists" rather than creating a duplicate.
 *
 * Changing a price is deliberately not supported - Stripe prices are immutable
 * by design, and rewriting one under an existing subscriber is not something a
 * script should do. To change a price, create a new one and repoint the
 * environment variable.
 */

import Stripe from 'stripe';

import { loadEnvFiles, stripeModeOf } from './lib/stripe-env.mjs';

loadEnvFiles();

interface PlanSpec {
  /** Plan id shared with the app (`STRIPE_PLANS` in `src/lib/stripe-plans.ts`). */
  id: 'monthly' | 'yearly' | 'lifetime' | 'group';
  productName: string;
  productDescription: string;
  /** Amount in cents. */
  amount: number;
  /** Null for a one-off payment. */
  interval: 'month' | 'year' | null;
  /** Environment variable the site reads this price id from. */
  envKey: string;
  /** Stable handle used to find the price again on the next run. */
  lookupKey: string;
}

const CURRENCY = 'eur';

/** Where Stripe should deliver events. */
const WEBHOOK_PATH = '/api/webhook/stripe';

const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

/**
 * Payment methods to switch on, never off.
 *
 * iDEAL first: it is the dominant consumer method in the Netherlands, and a
 * Dutch checkout without it loses buyers who have no intention of typing a card
 * number. SEPA debit is what an iDEAL-initiated subscription renews on.
 */
const PAYMENT_METHODS = ['ideal', 'sepa_debit', 'card', 'apple_pay', 'google_pay', 'link'] as const;

/**
 * List prices. Overridable per run, e.g.
 * `MONTHLY_CENTS=699 npm run stripe:setup -- --apply`.
 */
function cents(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number of cents, got "${raw}"`);
  }
  return parsed;
}

const PLANS: PlanSpec[] = [
  {
    id: 'monthly',
    productName: 'BijbelQuiz Premium (maandelijks)',
    productDescription:
      'Onbeperkt samen spelen tot 20 spelers, uitleg en bijbelverwijzing bij elke vraag, alle premium quizzen.',
    amount: cents('MONTHLY_CENTS', 599),
    interval: 'month',
    envKey: 'STRIPE_PRICE_MONTHLY',
    lookupKey: 'bijbelquiz_premium_monthly',
  },
  {
    id: 'yearly',
    productName: 'BijbelQuiz Premium (jaarlijks)',
    productDescription:
      'Alles uit Premium, een keer per jaar betaald. De laagste prijs per week.',
    amount: cents('YEARLY_CENTS', 3999),
    interval: 'year',
    envKey: 'STRIPE_PRICE_YEARLY',
    lookupKey: 'bijbelquiz_premium_yearly',
  },
  {
    id: 'lifetime',
    productName: 'BijbelQuiz Premium (levenslang)',
    productDescription: 'Eenmalige aankoop. Permanent Premium, geen verlenging.',
    amount: cents('LIFETIME_CENTS', 7499),
    interval: null,
    envKey: 'STRIPE_PRICE_LIFETIME',
    lookupKey: 'bijbelquiz_premium_lifetime',
  },
  {
    id: 'group',
    productName: 'BijbelQuiz Groepslicentie (30 plekken)',
    productDescription:
      '30 plekken Premium voor een jeugdgroep, gemeente of klas, via een deelbare code.',
    amount: cents('GROUP_CENTS', 9900),
    interval: 'year',
    envKey: 'STRIPE_PRICE_GROUP',
    lookupKey: 'bijbelquiz_group_yearly',
  },
];

function formatAmount(amountCents: number): string {
  return `€${(amountCents / 100).toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function describe(plan: PlanSpec): string {
  const period = plan.interval === null ? 'eenmalig' : `per ${plan.interval === 'month' ? 'maand' : 'jaar'}`;
  return `${plan.id.padEnd(9)} ${formatAmount(plan.amount).padStart(9)} ${period}`;
}

/**
 * Find the price the site should use for a plan.
 *
 * The `lookup_key` is checked first, because that is what this script sets. An
 * account configured by hand in the dashboard will not have one, so the second
 * pass matches on the thing that actually defines a plan - currency, amount and
 * recurrence - which is how an existing, already-correct price gets adopted
 * instead of duplicated.
 */
async function findPrice(stripe: Stripe, plan: PlanSpec): Promise<Stripe.Price | null> {
  const byLookupKey = await stripe.prices.list({ lookup_keys: [plan.lookupKey], limit: 1 });
  if (byLookupKey.data[0]) return byLookupKey.data[0];

  const candidates = await stripe.prices.list({ active: true, limit: 100 });

  return (
    candidates.data.find((price) => {
      if (price.currency !== CURRENCY) return false;
      if (price.unit_amount !== plan.amount) return false;

      if (plan.interval === null) return !price.recurring;

      return price.recurring?.interval === plan.interval && (price.recurring.interval_count ?? 1) === 1;
    }) ?? null
  );
}

/** Find the product for a plan by its metadata tag, so names can be edited freely. */
async function findProduct(stripe: Stripe, plan: PlanSpec): Promise<Stripe.Product | null> {
  const search = await stripe.products.search({
    query: `metadata['bijbelquiz_plan']:'${plan.id}'`,
    limit: 2,
  });

  return search.data[0] ?? null;
}

async function syncPlans(stripe: Stripe, apply: boolean): Promise<string[]> {
  const envLines: string[] = [];

  console.log('\n--- products and prices ---');

  for (const plan of PLANS) {
    const existingPrice = await findPrice(stripe, plan);

    if (existingPrice) {
      const adopted = existingPrice.lookup_key ? '' : ' (matched on amount + recurrence)';
      console.log(
        `= price exists    ${plan.id.padEnd(9)} ${existingPrice.id}  ${formatAmount(existingPrice.unit_amount ?? 0)}${adopted}`
      );
      envLines.push(`${plan.envKey}=${existingPrice.id}`);
      continue;
    }

    if (!apply) {
      console.log(`+ would create    ${plan.id.padEnd(9)} ${formatAmount(plan.amount)}`);
      continue;
    }

    let product = await findProduct(stripe, plan);
    if (product) {
      console.log(`= product exists  ${plan.id.padEnd(9)} ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: plan.productName,
        description: plan.productDescription,
        metadata: { bijbelquiz_plan: plan.id },
      });
      console.log(`+ product created ${plan.id.padEnd(9)} ${product.id}`);
    }

    const price = await stripe.prices.create({
      product: product.id,
      currency: CURRENCY,
      unit_amount: plan.amount,
      lookup_key: plan.lookupKey,
      ...(plan.interval ? { recurring: { interval: plan.interval } } : {}),
      metadata: { bijbelquiz_plan: plan.id },
    });

    console.log(`+ price created   ${plan.id.padEnd(9)} ${price.id}  ${formatAmount(plan.amount)}`);
    envLines.push(`${plan.envKey}=${price.id}`);
  }

  return envLines;
}

/**
 * The webhook is the only place a purchase is known for certain. Without it a
 * renewal, a cancellation and - because the success page deliberately does not
 * touch group licences - an entire group purchase are never written to the
 * database.
 */
async function syncWebhook(stripe: Stripe, apply: boolean, baseUrl: string): Promise<string[]> {
  console.log('\n--- webhook ---');

  const url = `${baseUrl.replace(/\/$/, '')}${WEBHOOK_PATH}`;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((endpoint) => endpoint.url === url);

  if (existing) {
    const missing = WEBHOOK_EVENTS.filter((event) => !existing.enabled_events.includes(event));

    if (missing.length === 0) {
      console.log(`= webhook exists  ${url}`);
      console.log('  (signing secret is only shown at creation - keep the STRIPE_WEBHOOK_SECRET you have)');
      return [];
    }

    if (!apply) {
      console.log(`~ would add events to ${url}: ${missing.join(', ')}`);
      return [];
    }

    await stripe.webhookEndpoints.update(existing.id, {
      enabled_events: [...new Set([...existing.enabled_events, ...WEBHOOK_EVENTS])] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
    });
    console.log(`~ webhook updated ${url}  added: ${missing.join(', ')}`);
    return [];
  }

  if (!apply) {
    console.log(`+ would create webhook ${url}`);
    console.log(`  events: ${WEBHOOK_EVENTS.join(', ')}`);
    return [];
  }

  const created = await stripe.webhookEndpoints.create({
    url,
    enabled_events: WEBHOOK_EVENTS,
    description: 'BijbelQuiz premium + group licence',
  });

  console.log(`+ webhook created ${url}  [${created.id}]`);

  // Stripe returns the signing secret exactly once, at creation.
  return created.secret ? [`STRIPE_WEBHOOK_SECRET=${created.secret}`] : [];
}

/** Without a portal configuration the "manage subscription" button 500s. */
async function syncPortal(stripe: Stripe, apply: boolean, baseUrl: string): Promise<void> {
  console.log('\n--- customer portal ---');

  const configurations = await stripe.billingPortal.configurations.list({ limit: 10 });
  const existing = configurations.data.find((configuration) => configuration.is_default && configuration.active);

  if (existing) {
    console.log(`= portal exists   ${existing.id}`);
    return;
  }

  if (!apply) {
    console.log('+ would create a default portal configuration (cancel, invoices, payment method)');
    return;
  }

  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'BijbelQuiz Premium',
      privacy_policy_url: `${baseUrl}/privacybeleid`,
      terms_of_service_url: `${baseUrl}/voorwaarden`,
    },
    default_return_url: `${baseUrl}/premium`,
    features: {
      customer_update: { enabled: true, allowed_updates: ['email', 'address', 'name'] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      // Cancellation stays at period end: the member keeps what they paid for,
      // which is what the premium page tells them will happen.
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        cancellation_reason: {
          enabled: true,
          options: ['too_expensive', 'missing_features', 'unused', 'other'],
        },
      },
    },
  });

  console.log(`+ portal created  ${configuration.id}`);
}

/** Turn payment methods on. Never off - this only ever adds. */
async function syncPaymentMethods(stripe: Stripe, apply: boolean): Promise<void> {
  console.log('\n--- payment methods ---');

  const configurations = await stripe.paymentMethodConfigurations.list({ limit: 10 });
  const target = configurations.data.find((configuration) => configuration.is_default) ?? configurations.data[0];

  if (!target) {
    console.log('(no payment method configuration on this account - Stripe uses account defaults)');
    return;
  }

  const record = target as unknown as Record<string, { display_preference?: { value?: string } }>;
  const missing = PAYMENT_METHODS.filter((method) => record[method]?.display_preference?.value !== 'on');

  if (missing.length === 0) {
    console.log(`= all enabled     ${target.id}`);
    return;
  }

  if (!apply) {
    console.log(`~ would enable on ${target.id}: ${missing.join(', ')}`);
    return;
  }

  const update: Record<string, { display_preference: { preference: 'on' } }> = {};
  for (const method of missing) update[method] = { display_preference: { preference: 'on' } };

  try {
    await stripe.paymentMethodConfigurations.update(target.id, update as Stripe.PaymentMethodConfigurationUpdateParams);
    console.log(`~ enabled         ${missing.join(', ')}`);
  } catch (error) {
    // A method the account is not approved for is a dashboard/underwriting
    // matter, not something this script can fix. Report and carry on.
    console.log(`! could not enable ${missing.join(', ')}: ${error instanceof Error ? error.message : error}`);
    console.log('  Enable the remaining ones under Settings -> Payment methods.');
  }
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const liveConfirmed = process.argv.includes('--live');
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set. Point it at the account you want to configure.');
  }

  const mode = stripeModeOf(secretKey);

  if (apply && mode === 'live' && !liveConfirmed) {
    throw new Error(
      'Refusing to write to a LIVE account without --live.\n' +
      '       Re-run as: npm run stripe:setup -- --apply --live'
    );
  }

  const baseUrl = (process.env.NEXTAUTH_URL || 'https://www.bijbelquiz.com').replace(/\/$/, '');

  console.log(`\nStripe account mode: ${mode.toUpperCase()}`);
  console.log(`Site base URL:       ${baseUrl}`);
  console.log(apply ? 'Mode: APPLY (objects will be created)\n' : 'Mode: dry run (nothing is written)\n');

  console.log('Plans:');
  for (const plan of PLANS) console.log(`  ${describe(plan)}`);

  const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });

  const priceLines = await syncPlans(stripe, apply);
  const webhookLines = await syncWebhook(stripe, apply, baseUrl);
  await syncPortal(stripe, apply, baseUrl);
  await syncPaymentMethods(stripe, apply);

  if (!apply) {
    console.log('\nRe-run with --apply to create anything missing.');
    console.log('Per-run overrides: MONTHLY_CENTS, YEARLY_CENTS, LIFETIME_CENTS, GROUP_CENTS.\n');
    return;
  }

  const envLines = [...priceLines, ...webhookLines];

  if (envLines.length > 0) {
    console.log('\n--- paste into .env ---');
    for (const line of envLines) console.log(line);
    console.log('-----------------------');
  }

  console.log('\nStill worth checking by hand:');
  console.log('  - Settings -> Payment methods: anything the API could not switch on.');
  console.log('  - Send a test event from the webhook you just created and confirm a 200.\n');
}

main().catch((error) => {
  console.error('\nFailed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
