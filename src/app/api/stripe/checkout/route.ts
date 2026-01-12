import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover', // Use latest api version or what's compatible
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const baseUrl = 'https://www.bijbelquiz.com';

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'], // Ideal is popular in NL (BijbelQuiz implies Dutch)
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'BijbelQuiz Premium',
              description: 'Toegang tot alle premium quizzen en features',
            },
            unit_amount: 499, // 4.99 EUR
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/premium`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.redirect(checkoutSession.url!, 303);
  } catch (err) {
    console.error("Stripe error:", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
