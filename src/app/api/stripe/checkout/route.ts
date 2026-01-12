import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Use the origin from the request to support both localhost and production dynamically
  const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log(`[Stripe Checkout] Creating session for user: ${session.user.id} (${session.user.email})`);
  console.log(`[Stripe Checkout] Return URL set to: ${origin}`);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'], 
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'BijbelQuiz Premium',
              description: 'Toegang tot alle premium quizzen en features',
            },
            unit_amount: 999, // 9.99 EUR
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
      },
    });

    console.log(`[Stripe Checkout] Session created: ${checkoutSession.id}`);
    return NextResponse.redirect(checkoutSession.url!, 303);
  } catch (err) {
    console.error("[Stripe Checkout] Error:", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
