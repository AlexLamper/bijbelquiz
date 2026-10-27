/**
 * One-off: write the real Stripe payments into the Payment collection.
 *
 * Before the payments rework, renewals were never recorded and subscription
 * events wrote a EUR 0 row per subscription, so the admin revenue was wrong.
 * This reads every paid subscription invoice from Stripe and records it
 * through the same code the webhook uses (`recordInvoice`, one row per
 * invoice, real amount), then reports - and with `--apply` removes - the old
 * EUR 0 subscription rows (provider stripe, no invoice id, no session id).
 *
 * Dry run by default. Writing to the database needs `--apply`; with a live
 * Stripe key it also needs `--live`.
 *
 *   node --import tsx scripts/backfill-stripe-payments.mts
 *   node --import tsx scripts/backfill-stripe-payments.mts --apply --live
 *
 * Needs MONGODB_URI and STRIPE_SECRET_KEY (from the environment, .env or
 * .env.local). Drop the old sparse Payment indexes first (docs/setup/
 * betalingen-web.md), or the second row fails with E11000.
 */

import mongoose from 'mongoose';
import Stripe from 'stripe';

import { loadEnvFiles, stripeModeOf } from './lib/stripe-env.mjs';

loadEnvFiles();

const apply = process.argv.includes('--apply');
const live = process.argv.includes('--live');

async function main(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set.');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');

  const mode = stripeModeOf(secretKey);
  if (apply && mode === 'live' && !live) {
    throw new Error('Refusing to write payments of a LIVE account without --live.');
  }

  // Imported after the environment is loaded: the shared Stripe client reads
  // the key when it is created.
  const { connectDB, Payment } = await import('../src/database');
  const { recordInvoice } = await import('../src/lib/stripe-billing');

  await connectDB();
  const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });

  console.log(`Stripe mode: ${mode.toUpperCase()}  ${apply ? 'APPLY' : 'dry run'}\n`);

  let seen = 0;
  let recorded = 0;
  let skipped = 0;

  for await (const invoice of stripe.invoices.list({ status: 'paid', limit: 100 })) {
    seen += 1;
    const subscription = invoice.parent?.subscription_details?.subscription;
    if (!subscription) {
      skipped += 1;
      continue;
    }

    const exists = await Payment.exists({ provider: 'stripe', stripeInvoiceId: invoice.id });
    const label = `${invoice.id}  ${(invoice.amount_paid / 100).toFixed(2)} ${invoice.currency}  ${invoice.billing_reason}`;

    if (!apply) {
      console.log(`${exists ? '=' : '+'} ${label}`);
      continue;
    }

    const outcome = await recordInvoice(invoice, 'paid', new Date((invoice.status_transitions?.paid_at ?? invoice.created) * 1000));
    if (outcome.result === 'invoice_recorded') recorded += 1;
    else skipped += 1;
    console.log(`${outcome.result.padEnd(24)} ${label}`);
  }

  const legacyFilter = {
    provider: 'stripe',
    amount: 0,
    stripeInvoiceId: { $exists: false },
    stripeSessionId: { $exists: false },
  };
  const legacy = await Payment.countDocuments(legacyFilter);
  console.log(`\nOld EUR 0 subscription rows: ${legacy}`);

  if (apply && legacy > 0) {
    const removed = await Payment.deleteMany(legacyFilter);
    console.log(`Removed ${removed.deletedCount} old EUR 0 rows.`);
  }

  console.log(`\nInvoices seen: ${seen}, recorded: ${recorded}, skipped (no subscription / no account): ${skipped}`);
  if (!apply) console.log('Re-run with --apply to write.');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('\nFailed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
