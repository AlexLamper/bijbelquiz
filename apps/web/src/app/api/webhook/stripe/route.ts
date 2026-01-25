import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import { connectDB, User, Payment } from '@bijbelquiz/database';

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
    const userEmail = session.customer_email || session.customer_details?.email;
    const amount = session.amount_total || 0;
    const currency = session.currency || 'eur';
    
    console.log(`[Stripe Webhook] Processing checkout for UserID: ${userId}, Email: ${userEmail}, Session: ${session.id}`);

    try {
        await connectDB();
        let updatedUser = null;

        // 1. Try finding by ID (if valid MongoDB ID)
        if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
            updatedUser = await User.findByIdAndUpdate(userId, { isPremium: true }, { new: true });
        }

        // 2. Fallback: Find by Email if ID lookup failed or ID was invalid (e.g. Google ID)
        if (!updatedUser && userEmail) {
            console.log(`[Stripe Webhook] User not found by ID or invalid ID. Trying email: ${userEmail}`);
            updatedUser = await User.findOneAndUpdate(
                { email: userEmail },
                { isPremium: true },
                { new: true }
            );
        }
        
        if (!updatedUser) {
           console.error(`[Stripe Webhook] User not found via ID (${userId}) OR Email (${userEmail})`);
           // Return 200 to prevent Stripe retries if user really doesn't exist
           return new NextResponse("User not found", { status: 200 });
        }

        console.log(`[Stripe Webhook] User ${updatedUser._id} (Email: ${updatedUser.email}) updated to Premium:`, updatedUser.isPremium);

        // Record Payment
        await Payment.create({
          user: updatedUser._id, // Use real ID
          stripeSessionId: session.id,
          amount: amount,
          currency: currency,
          status: 'completed',
        });
        
        console.log(`[Stripe Webhook] Payment recorded in DB`);
      } catch (dbErr) {
        console.error(`[Stripe Webhook] Database error:`, dbErr);
        // Return 200 on DB error to avoid infinite loop of 500s if it's a code issue? No, 500 is better for retry if transient.
        // But here it was a CastError which is permanent.
        return new NextResponse("Database Error", { status: 500 });
      }
  } else {
     console.log(`[Stripe Webhook] Ignoring unhandled event type: ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
