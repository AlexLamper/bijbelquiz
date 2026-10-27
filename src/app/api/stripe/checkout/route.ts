import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Types } from 'mongoose';
import type Stripe from 'stripe';

import { connectDB, User } from '@/database';
import { readPaywallTrigger } from '@/lib/analytics/events';
import { recordServerEvent } from '@/lib/analytics/record';
import { authOptions } from '@/lib/auth';
import { premiumPageHref } from '@/lib/premium-offer';
import { getPremiumSnapshot } from '@/lib/premium-state';
import stripe from '@/lib/stripe';
import { buildCheckoutSessionParams, resolveCheckoutOrigin } from '@/lib/stripe-checkout';
import { readReturnPath, readStripePlan, STRIPE_PLANS, trialDaysForPlan } from '@/lib/stripe-plans';

export const dynamic = 'force-dynamic';

interface CheckoutUser {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | null;
  groupPremiumUntil?: Date | null;
  hasLifetimePremium?: boolean;
  stripeCustomerId?: string;
}

function isMissingCustomer(error: unknown): boolean {
  const stripeError = error as { code?: string; param?: string };
  return stripeError?.code === 'resource_missing' && stripeError?.param === 'customer';
}

/** The account's Stripe customer, created once and remembered. */
async function ensureCustomer(user: CheckoutUser, userId: string, email: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.create({
      email,
      name: user.name || undefined,
      metadata: { userId },
    });
    await User.updateOne({ _id: user._id }, { $set: { stripeCustomerId: customer.id } });
    return customer.id;
  } catch (error) {
    // Checkout can create the customer itself from the e-mail address.
    console.warn('[Stripe Checkout] Could not create a customer up front', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const formData = await req.formData();
  const selectedPlan = readStripePlan(formData.get('plan'));
  const selectedConfig = STRIPE_PLANS[selectedPlan];
  const returnPath = readReturnPath(formData.get('next'));
  // The locked paywall (4th new quiz) has no way out but buying; an abandoned
  // checkout returns to that same locked page, with the way back intact.
  const lockedPaywall = formData.get('vergrendeld') === '1';

  if (!session || !session.user?.id || !session.user?.email) {
    const back = selectedConfig.isGroup
      ? '/groepslicentie'
      : premiumPageHref({ locked: lockedPaywall, returnPath: lockedPaywall ? returnPath : null, plan: selectedPlan === 'group' ? undefined : selectedPlan });
    const signInUrl = new URL('/inloggen', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', back);
    return NextResponse.redirect(signInUrl, 303);
  }

  const stripePriceId = process.env[selectedConfig.priceEnvKey];

  let user: CheckoutUser | null = null;
  try {
    await connectDB();
    user = await User.findById(session.user.id)
      .select('name email isPremium premiumStripe premiumStore storePremiumExpiresAt groupPremiumUntil hasLifetimePremium stripeCustomerId')
      .lean<CheckoutUser>();
  } catch (error) {
    // Not being able to check is no reason to refuse a sale.
    console.warn('[Stripe Checkout] Could not read the account', error);
  }

  // Premium belongs to the account, whichever way it was bought (Stripe, the
  // App Store / Google Play, lifetime, a group licence, by hand). Somebody who
  // already has it is sent back to the Premium page, which shows their state,
  // instead of into a second subscription. A group licence is bought for
  // others, so it may.
  if (!selectedConfig.isGroup && user && getPremiumSnapshot(user).isPremium) {
    return NextResponse.redirect(new URL('/premium', req.nextUrl.origin), 303);
  }

  if (!stripePriceId) {
    console.error(`[Stripe Checkout] Missing environment variable: ${selectedConfig.priceEnvKey}`);
    return new NextResponse('Stripe price is not configured', { status: 500 });
  }

  // "Pressed pay" - recorded here, server-side, so it counts even if the buyer
  // bails at Stripe. The gap to `purchase_completed` is the abandon rate the
  // payments-health page reads.
  void recordServerEvent('checkout_started', {
    userId: session.user.id,
    platform: 'web',
    props: {
      plan: selectedPlan,
      trigger: readPaywallTrigger(formData.get('reden')),
    },
  });

  const origin = resolveCheckoutOrigin({
    originHeader: req.headers.get('origin'),
    requestOrigin: req.nextUrl.origin,
    configuredUrl: process.env.NEXTAUTH_URL,
  });

  let customerId = user?.stripeCustomerId || null;
  if (!customerId && user) customerId = await ensureCustomer(user, session.user.id, session.user.email);

  const paramsFor = (customer: string | null): Stripe.Checkout.SessionCreateParams =>
    buildCheckoutSessionParams({
      plan: selectedPlan,
      priceId: stripePriceId,
      userId: session.user.id,
      email: session.user.email!,
      customerId: customer,
      origin,
      returnPath,
      locked: lockedPaywall,
      trialDays: trialDaysForPlan(selectedPlan, process.env.STRIPE_TRIAL_DAYS),
    });

  try {
    let checkoutSession: Stripe.Checkout.Session;
    try {
      checkoutSession = await stripe.checkout.sessions.create(paramsFor(customerId));
    } catch (error) {
      // A stored customer that this Stripe account does not know (deleted,
      // or created with the other mode's keys): start over with a new one.
      if (!customerId || !isMissingCustomer(error) || !user) throw error;
      console.warn(`[Stripe Checkout] Stored customer ${customerId} is unknown to Stripe; creating a new one`);
      customerId = await ensureCustomer(user, session.user.id, session.user.email);
      checkoutSession = await stripe.checkout.sessions.create(paramsFor(customerId));
    }

    return NextResponse.redirect(checkoutSession.url!, 303);
  } catch (err) {
    console.error('[Stripe Checkout] Error:', err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
