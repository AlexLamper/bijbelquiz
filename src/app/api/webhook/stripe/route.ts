import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("⚠️ STRIPE_WEBHOOK_SECRET is missing in environment variables!");
      return new NextResponse("Webhook Secret Missing", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log(`[Stripe Webhook] Received event: ${event.type}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
    console.error(`[Stripe Webhook] Make sure your CLI webhook secret matches .env.local STRIPE_WEBHOOK_SECRET`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Fulfill the purchase
    const userId = session.metadata?.userId;
    const amount = session.amount_total || 0;
    const currency = session.currency || 'eur';
    
    console.log(`[Stripe Webhook] Processing checkout for User: ${userId}, Session: ${session.id}`);

    if (userId) {
      try {
        await connectDB();
        
        // Update User
        const updatedUser = await User.findByIdAndUpdate(userId, { isPremium: true }, { new: true });
        
        if (!updatedUser) {
           console.error(`[Stripe Webhook] User not found: ${userId}`);
           return new NextResponse("User not found", { status: 404 });
        }

        console.log(`[Stripe Webhook] User ${userId} updated to Premium:`, updatedUser.isPremium);

        // Record Payment
        await Payment.create({
          user: userId,
          stripeSessionId: session.id,
          amount: amount,
          currency: currency,
          status: 'completed',
        });
        
        console.log(`[Stripe Webhook] Payment recorded in DB`);
      } catch (dbErr) {
        console.error(`[Stripe Webhook] Database error:`, dbErr);
        return new NextResponse("Database Error", { status: 500 });
      }
    } else {
       console.warn(`[Stripe Webhook] No userId found in session metadata`);
    }
  } else {
     console.log(`[Stripe Webhook] Ignoring unhandled event type: ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
