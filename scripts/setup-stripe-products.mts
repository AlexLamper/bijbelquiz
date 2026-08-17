/**
 * Creates (or re-uses) the Stripe products and prices the paywall expects, and
 * prints the environment lines to paste into `.env`.
 *
 * Safe by default: it only reports what it would do. Nothing is written to the
 * Stripe account until you pass `--apply`.
 *
 *   npx tsx scripts/setup-stripe-products.mts             # show the plan
 *   npx tsx scripts/setup-stripe-products.mts --apply     # create it
 *
 * Idempotent through price `lookup_key`s: re-running finds the existing price
 * instead of adding a second one, so a repeated run cannot leave the account
 * with two €5,99 monthly prices and no way to tell which one the site uses.
 *
 * Changing a price is deliberately not supported - Stripe prices are immutable
 * by design, and rewriting one under an existing subscriber is not a thing you
 * want a script to do. To change a price, create a new one and point the
 * environment variable at it.
 */

import Stripe from 'stripe';

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

/**
 * List prices. Overridable per run, e.g.
 * `MONTHLY_CENTS=699 npx tsx scripts/setup-stripe-products.mts --apply`.
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

/** Find the product for a plan by its metadata tag, so names can be edited freely. */
async function findProduct(stripe: Stripe, plan: PlanSpec): Promise<Stripe.Product | null> {
  const search = await stripe.products.search({
    query: `metadata['bijbelquiz_plan']:'${plan.id}'`,
    limit: 2,
  });

  return search.data[0] ?? null;
}

async function findPrice(stripe: Stripe, plan: PlanSpec): Promise<Stripe.Price | null> {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], limit: 1 });
  return existing.data[0] ?? null;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set. Point it at the account you want to configure.');
  }

  const mode = secretKey.startsWith('sk_live') ? 'LIVE' : 'test';

  console.log(`\nStripe account mode: ${mode}`);
  console.log(apply ? 'Mode: APPLY (objects will be created)\n' : 'Mode: dry run (nothing is written)\n');

  console.log('Plans:');
  for (const plan of PLANS) console.log(`  ${describe(plan)}`);
  console.log('');

  if (!apply) {
    console.log('Re-run with --apply to create anything that is missing.');
    console.log('Per-run overrides: MONTHLY_CENTS, YEARLY_CENTS, LIFETIME_CENTS, GROUP_CENTS.\n');
    return;
  }

  // Pinned to the same version as `src/lib/stripe.ts`.
  const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });
  const envLines: string[] = [];

  for (const plan of PLANS) {
    let product = await findProduct(stripe, plan);

    if (product) {
      console.log(`= product exists  ${plan.id}: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: plan.productName,
        description: plan.productDescription,
        metadata: { bijbelquiz_plan: plan.id },
      });
      console.log(`+ product created ${plan.id}: ${product.id}`);
    }

    let price = await findPrice(stripe, plan);

    if (price) {
      console.log(`= price exists    ${plan.id}: ${price.id} (${formatAmount(price.unit_amount ?? 0)})`);

      if (price.unit_amount !== plan.amount) {
        console.log(
          `  ! existing price is ${formatAmount(price.unit_amount ?? 0)}, not ${formatAmount(plan.amount)}.\n` +
          '    Stripe prices are immutable: create a new price in the dashboard and update the env var.'
        );
      }
    } else {
      price = await stripe.prices.create({
        product: product.id,
        currency: CURRENCY,
        unit_amount: plan.amount,
        lookup_key: plan.lookupKey,
        ...(plan.interval ? { recurring: { interval: plan.interval } } : {}),
        metadata: { bijbelquiz_plan: plan.id },
      });
      console.log(`+ price created   ${plan.id}: ${price.id} (${formatAmount(plan.amount)})`);
    }

    envLines.push(`${plan.envKey}=${price.id}`);
    envLines.push(
      `NEXT_PUBLIC_${
        plan.id === 'group' ? 'GROUP_LICENSE_PRICE_LABEL' : `PREMIUM_${plan.id.toUpperCase()}_PRICE_LABEL`
      }=${formatAmount(plan.amount)}`
    );
  }

  console.log('\n--- paste into .env ---');
  for (const line of envLines) console.log(line);
  console.log('# Free trial in days for the recurring plans; 0 or unset disables it.');
  console.log(`STRIPE_TRIAL_DAYS=${process.env.STRIPE_TRIAL_DAYS || '0'}`);
  console.log('-----------------------\n');

  console.log('Still to do by hand in the Stripe dashboard:');
  console.log('  1. Webhook endpoint -> https://www.bijbelquiz.com/api/webhook/stripe');
  console.log('     Events: checkout.session.completed, customer.subscription.created,');
  console.log('             customer.subscription.updated, customer.subscription.deleted');
  console.log('     Copy the signing secret into STRIPE_WEBHOOK_SECRET.');
  console.log('  2. Customer portal -> enable cancellation and plan switching.');
  console.log('  3. Payment methods -> enable iDEAL (and Apple Pay / Google Pay) for NL.\n');
}

main().catch((error) => {
  console.error('\nFailed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
