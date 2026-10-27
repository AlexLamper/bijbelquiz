import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { readReturnPath, readStripePlan, STRIPE_PLANS, trialDaysForPlan } from '@/lib/stripe-plans';
import { premiumPageHref } from '@/lib/premium-offer';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { connectDB, User } from '@/database';
import { recordServerEvent } from '@/lib/analytics/record';
import { readPaywallTrigger } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id || !session.user?.email) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', '/premium');
    return NextResponse.redirect(signInUrl, 303);
  }

  const formData = await req.formData();
  const selectedPlan = readStripePlan(formData.get('plan'));
  const selectedConfig = STRIPE_PLANS[selectedPlan];
  const stripePriceId = process.env[selectedConfig.priceEnvKey];

  // Premium belongs to the account, whichever way it was bought (Stripe, the
  // App Store / Google Play, a group licence). Somebody who already has it is
  // sent back to the Premium page, which shows their state, instead of into a
  // second subscription. A group licence is bought for others, so it may.
  if (!selectedConfig.isGroup) {
    try {
      await connectDB();
      const user = await User.findById(session.user.id)
        .select('isPremium premiumStripe premiumStore storePremiumExpiresAt groupPremiumUntil hasLifetimePremium')
        .lean();
      if (user && (getPremiumSnapshot(user).isPremium || user.hasLifetimePremium)) {
        return NextResponse.redirect(new URL('/premium', req.nextUrl.origin), 303);
      }
    } catch (error) {
      // Not being able to check is no reason to refuse a sale.
      console.warn('[Stripe Checkout] Could not check existing premium', error);
    }
  }

  if (!stripePriceId) {
    console.error(`[Stripe Checkout] Missing environment variable: ${selectedConfig.priceEnvKey}`);
    return new NextResponse('Stripe price is not configured', { status: 500 });
  }

  // Where the buyer was when they hit the wall. A host who upgrades mid-evening
  // should land back in their lobby, not on a generic thank-you page they then
  // have to navigate out of.
  const returnPath = readReturnPath(formData.get('next'));
  // The locked paywall (4th new quiz) has no way out but buying; an abandoned
  // checkout returns to that same locked page, with the way back intact.
  const lockedPaywall = formData.get('vergrendeld') === '1';

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

  // Use the origin from the request to support both localhost and production dynamically
  const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // A trial only exists if it is configured, and only on the plan that offers
  // one (yearly). Monthly starts paying at once; a one-off has nothing to trial.
  const trialDays = trialDaysForPlan(selectedPlan, process.env.STRIPE_TRIAL_DAYS);

  console.log(`[Stripe Checkout] Creating session for user: ${session.user.id} (${session.user.email})`);
  console.log(`[Stripe Checkout] plan=${selectedPlan} trialDays=${trialDays} return=${returnPath}`);

  // Built by hand rather than through `URL`: the Stripe placeholder has to
  // reach them as literal braces, and `searchParams` percent-encodes them.
  const successUrl =
    `${origin}/premium/succes?session_id={CHECKOUT_SESSION_ID}` +
    `&next=${encodeURIComponent(returnPath)}`;

  // Coming back from an abandoned checkout says so, so the page can offer the
  // plans again instead of silently looking like a fresh visit.
  const cancelBase = selectedConfig.isGroup
    ? '/groepslicentie'
    : premiumPageHref({
        locked: lockedPaywall,
        returnPath: lockedPaywall ? returnPath : null,
        plan: selectedPlan === 'group' ? undefined : selectedPlan,
      });
  const cancelUrl = `${origin}${cancelBase}${cancelBase.includes('?') ? '&' : '?'}checkout=geannuleerd`;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: selectedConfig.mode,
      // Point straight at the Dutch route. Sending Stripe to `/premium/success`
      // only worked by way of the permanent redirect in next.config.ts, which
      // browsers cache aggressively and which would silently break the whole
      // post-payment confirmation if that entry were ever removed.
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: session.user.email,
      allow_promotion_codes: true,
      metadata: {
        userId: session.user.id,
        plan: selectedPlan,
        returnPath,
      },
      // Carried onto the subscription so the renewal webhooks, which never see
      // the checkout session, still know which plan this is.
      subscription_data: selectedConfig.mode === 'subscription' ? {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: {
          userId: session.user.id,
          plan: selectedPlan,
          returnPath,
        },
      } : undefined,
    });

    console.log(`[Stripe Checkout] Session created: ${checkoutSession.id}`);
    return NextResponse.redirect(checkoutSession.url!, 303);
  } catch (err) {
    console.error("[Stripe Checkout] Error:", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
