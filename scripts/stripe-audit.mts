/**
 * Read-only report of what the Stripe account actually contains.
 *
 * Writes nothing, ever. Run it before and after `setup-stripe-products.mts` to
 * see what changed, and to check that the price ids in `.env` still point at
 * prices that exist and cost what the website claims they cost.
 *
 *   npx tsx scripts/stripe-audit.mts                 # uses .env / .env.local
 *   STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/stripe-audit.mts
 *
 * An explicit `STRIPE_SECRET_KEY` in the environment wins over the files, so
 * the live account can be inspected from a machine whose `.env.local` points at
 * test mode.
 */

import Stripe from 'stripe';

import { loadEnvFiles, stripeModeOf } from './lib/stripe-env.mjs';

loadEnvFiles();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('STRIPE_SECRET_KEY is not set.');
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });
const mode = stripeModeOf(secretKey);

function euro(amount: number | null | undefined, currency = 'eur'): string {
  if (typeof amount !== 'number') return '(no amount)';
  const symbol = currency.toLowerCase() === 'eur' ? '€' : `${currency.toUpperCase()} `;
  return `${symbol}${(amount / 100).toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function recurrenceOf(price: Stripe.Price): string {
  if (!price.recurring) return 'one-off';
  const { interval, interval_count: count } = price.recurring;
  return count && count > 1 ? `every ${count} ${interval}s` : `per ${interval}`;
}

const ENV_PRICE_KEYS = [
  'STRIPE_PRICE_MONTHLY',
  'STRIPE_PRICE_YEARLY',
  'STRIPE_PRICE_LIFETIME',
  'STRIPE_PRICE_GROUP',
] as const;

async function main(): Promise<void> {
  const account = await stripe.accounts.retrieve();

  console.log(`\n=== Stripe account (${mode.toUpperCase()} mode) ===`);
  console.log(`id            ${account.id}`);
  console.log(`name          ${account.business_profile?.name || account.settings?.dashboard?.display_name || '(unnamed)'}`);
  console.log(`country       ${account.country}`);
  console.log(`charges       ${account.charges_enabled ? 'enabled' : 'DISABLED'}`);
  console.log(`payouts       ${account.payouts_enabled ? 'enabled' : 'DISABLED'}`);

  // ── Products and prices ──────────────────────────────────────────────────
  console.log('\n=== Active products ===');
  const products = await stripe.products.list({ active: true, limit: 100 });

  for (const product of products.data) {
    const tag = product.metadata?.bijbelquiz_plan;
    console.log(`\n${product.name}  [${product.id}]${tag ? `  plan=${tag}` : ''}`);

    const prices = await stripe.prices.list({ product: product.id, limit: 100 });
    if (prices.data.length === 0) {
      console.log('  (no prices)');
      continue;
    }

    for (const price of prices.data) {
      const flags = [
        price.active ? 'active' : 'ARCHIVED',
        price.lookup_key ? `lookup=${price.lookup_key}` : null,
      ].filter(Boolean).join(' ');
      console.log(`  ${price.id}  ${euro(price.unit_amount, price.currency)} ${recurrenceOf(price)}  ${flags}`);
    }
  }

  // ── What the site is configured to sell ──────────────────────────────────
  console.log('\n=== Price ids in the environment ===');
  for (const key of ENV_PRICE_KEYS) {
    const id = process.env[key];
    if (!id) {
      console.log(`${key.padEnd(22)} (EMPTY) - this plan is hidden on the site`);
      continue;
    }

    try {
      const price = await stripe.prices.retrieve(id);
      const state = price.active ? 'active' : 'ARCHIVED - checkout will fail';
      console.log(`${key.padEnd(22)} ${id}  ${euro(price.unit_amount, price.currency)} ${recurrenceOf(price)}  ${state}`);
    } catch {
      console.log(`${key.padEnd(22)} ${id}  NOT FOUND in this account (wrong mode?)`);
    }
  }

  // ── Webhooks ─────────────────────────────────────────────────────────────
  console.log('\n=== Webhook endpoints ===');
  const endpoints = await stripe.webhookEndpoints.list({ limit: 50 });
  if (endpoints.data.length === 0) console.log('(none)');

  for (const endpoint of endpoints.data) {
    console.log(`\n${endpoint.url}  [${endpoint.id}]  ${endpoint.status}`);
    console.log(`  events: ${endpoint.enabled_events.join(', ')}`);
  }

  // ── Customer portal ──────────────────────────────────────────────────────
  console.log('\n=== Billing portal configurations ===');
  const portals = await stripe.billingPortal.configurations.list({ limit: 10 });
  if (portals.data.length === 0) console.log('(none - the portal button will fail)');

  for (const portal of portals.data) {
    const features = portal.features;
    console.log(
      `${portal.id}  default=${portal.is_default}  active=${portal.active}\n` +
      `  cancel=${features.subscription_cancel?.enabled}` +
      `  update=${features.subscription_update?.enabled}` +
      `  invoices=${features.invoice_history?.enabled}` +
      `  payment_method=${features.payment_method_update?.enabled}`
    );
  }

  // ── Payment methods ──────────────────────────────────────────────────────
  console.log('\n=== Payment method configurations ===');
  const configurations = await stripe.paymentMethodConfigurations.list({ limit: 10 });
  if (configurations.data.length === 0) console.log('(none - Stripe falls back to account defaults)');

  for (const configuration of configurations.data) {
    const enabled = Object.entries(configuration)
      .filter(([, value]) =>
        value && typeof value === 'object' && 'display_preference' in (value as object)
      )
      .filter(([, value]) => (value as { display_preference?: { value?: string } }).display_preference?.value === 'on')
      .map(([name]) => name);

    console.log(`${configuration.id}  ${configuration.name}  default=${configuration.is_default}`);
    console.log(`  on: ${enabled.join(', ') || '(none)'}`);
  }

  console.log('');
}

main().catch((error) => {
  console.error('\nFailed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
