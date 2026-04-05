import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const PLAN_CONFIG = {
  lifetime: {
    mode: 'payment' as const,
    priceEnvKey: 'STRIPE_PRICE_LIFETIME',
  },
  monthly: {
    mode: 'subscription' as const,
    priceEnvKey: 'STRIPE_PRICE_MONTHLY',
  },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id || !session.user?.email) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', '/premium');
    return NextResponse.redirect(signInUrl, 303);
  }

  const formData = await req.formData();
  const selectedPlanRaw = formData.get('plan');
  const selectedPlan = selectedPlanRaw === 'monthly' ? 'monthly' : 'lifetime';
  const selectedConfig = PLAN_CONFIG[selectedPlan];
  const stripePriceId = process.env[selectedConfig.priceEnvKey];

  if (!stripePriceId) {
    console.error(`[Stripe Checkout] Missing environment variable: ${selectedConfig.priceEnvKey}`);
    return new NextResponse('Stripe price is not configured', { status: 500 });
  }

  // Use the origin from the request to support both localhost and production dynamically
  const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log(`[Stripe Checkout] Creating session for user: ${session.user.id} (${session.user.email})`);
  console.log(`[Stripe Checkout] Return URL set to: ${origin}`);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: selectedConfig.mode,
      success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium`,
      customer_email: session.user.email,
      allow_promotion_codes: true,
      metadata: {
        userId: session.user.id,
        plan: selectedPlan,
      },
      subscription_data: selectedPlan === 'monthly' ? {
        metadata: {
          userId: session.user.id,
          plan: selectedPlan,
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
