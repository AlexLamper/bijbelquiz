import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook Error: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Fulfill the purchase
    const userId = session.metadata?.userId;
    const amount = session.amount_total || 0;
    const currency = session.currency || 'eur';
    
    if (userId) {
      await connectDB();
      
      // Update User
      await User.findByIdAndUpdate(userId, { isPremium: true });

      // Record Payment
      await Payment.create({
        user: userId,
        stripeSessionId: session.id,
        amount: amount,
        currency: currency,
        status: 'completed',
      });
      
      console.log(`User ${userId} upgraded to Premium`);
    }
  }

  return new NextResponse(null, { status: 200 });
}
