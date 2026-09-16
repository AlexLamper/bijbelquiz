/**
 * Creates the BijbelQuiz welcome code in BijbelStudie's Stripe account.
 *
 * The code is advertised on this site (the popup after a quiz, `/bijbelstudie`)
 * but redeemed at BijbelStudie's checkout, so the Stripe objects belong to
 * BijbelStudie's account, not to this one. That is why the key comes from its
 * own variable: `STRIPE_SECRET_KEY` in this repo is BijbelQuiz's account, and a
 * coupon created there would simply never apply.
 *
 * What it creates, from the constants in `src/lib/ecosystem-links.ts`:
 *   - a coupon: EUR 9,99 off the first invoice, once
 *   - a promotion code BIJBELQUIZ on it: first-time customers only, a
 *     redemption cap, and the same expiry the site stops showing it at
 *
 * Safe by default: without `--apply` it only reports. Writing to a live
 * account additionally needs `--live`. Idempotent: an existing code with the
 * same name is reported and left alone.
 *
 *   BIJBELSTUDIE_STRIPE_SECRET_KEY=sk_... node --import tsx scripts/create-bijbelstudie-promo.ts
 *   BIJBELSTUDIE_STRIPE_SECRET_KEY=sk_... node --import tsx scripts/create-bijbelstudie-promo.ts --apply
 *   BIJBELSTUDIE_STRIPE_SECRET_KEY=sk_live_... node --import tsx scripts/create-bijbelstudie-promo.ts --apply --live
 *
 * Then set NEXT_PUBLIC_BIJBELSTUDIE_PROMO_ENABLED=true on BijbelQuiz and
 * redeploy, which is what makes the offer visible.
 */

import Stripe from 'stripe';

import {
  STUDIE_PROMO_AMOUNT_OFF_CENTS,
  STUDIE_PROMO_CODE,
  STUDIE_PROMO_EXPIRES_AT,
  STUDIE_PROMO_MAX_REDEMPTIONS,
} from '../src/lib/ecosystem-links';

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');
  const allowLive = args.has('--live');

  const secretKey = process.env.BIJBELSTUDIE_STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Set BIJBELSTUDIE_STRIPE_SECRET_KEY to the secret key of BijbelStudie\'s Stripe account.');
  }

  const mode = secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_') ? 'live' : 'test';
  if (apply && mode === 'live' && !allowLive) {
    throw new Error('Refusing to write to a LIVE account without --live.');
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });
  const expiresAt = Math.floor(Date.parse(STUDIE_PROMO_EXPIRES_AT) / 1000);

  console.log(`\nStripe account mode: ${mode.toUpperCase()}`);
  console.log(apply ? 'Mode: APPLY\n' : 'Mode: dry run (nothing is written)\n');

  // The guard against the wrong account: BijbelStudie sells a EUR 9,99 monthly
  // plan, and this discount is sized to be exactly one month of it. An account
  // without that price is either not BijbelStudie, or BijbelStudie changed its
  // price and the "first month free" copy on the site is no longer true.
  const prices = await stripe.prices.list({ active: true, type: 'recurring', limit: 100 });
  const monthly = prices.data.find(
    (price) =>
      price.currency === 'eur' &&
      price.recurring?.interval === 'month' &&
      price.unit_amount === STUDIE_PROMO_AMOUNT_OFF_CENTS
  );
  if (!monthly) {
    throw new Error(
      `No active EUR ${STUDIE_PROMO_AMOUNT_OFF_CENTS / 100} monthly price in this account. ` +
        'Is this the BijbelStudie account, and is Pro still that price?'
    );
  }
  console.log(`Monthly price found: ${monthly.id} (${monthly.unit_amount} ${monthly.currency})`);

  const existing = await stripe.promotionCodes.list({ code: STUDIE_PROMO_CODE, limit: 10 });
  const active = existing.data.find((code) => code.active);
  if (active) {
    console.log(`Promotion code ${STUDIE_PROMO_CODE} already exists: ${active.id}. Nothing to do.\n`);
    return;
  }

  console.log('Would create:');
  console.log(`  coupon          EUR ${STUDIE_PROMO_AMOUNT_OFF_CENTS / 100} off, duration once`);
  console.log(
    `  promotion code  ${STUDIE_PROMO_CODE}, first-time customers, max ${STUDIE_PROMO_MAX_REDEMPTIONS}, ` +
      `expires ${STUDIE_PROMO_EXPIRES_AT}`
  );

  if (!apply) {
    console.log('\nRe-run with --apply to create it.\n');
    return;
  }

  const coupon = await stripe.coupons.create({
    name: 'BijbelQuiz: eerste maand Pro gratis',
    amount_off: STUDIE_PROMO_AMOUNT_OFF_CENTS,
    currency: 'eur',
    duration: 'once',
    redeem_by: expiresAt,
    metadata: { source: 'bijbelquiz' },
  });

  const promotionCode = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code: STUDIE_PROMO_CODE,
    expires_at: expiresAt,
    max_redemptions: STUDIE_PROMO_MAX_REDEMPTIONS,
    restrictions: { first_time_transaction: true },
    metadata: { source: 'bijbelquiz' },
  });

  console.log(`\nCreated coupon ${coupon.id} and promotion code ${promotionCode.id} (${promotionCode.code}).`);
  console.log('Now set NEXT_PUBLIC_BIJBELSTUDIE_PROMO_ENABLED=true on BijbelQuiz and redeploy.\n');
}

main().catch((error) => {
  console.error('\nFailed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
