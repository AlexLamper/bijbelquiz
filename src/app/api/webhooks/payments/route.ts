import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import { connectDB, Payment, User } from '@/database';
import { updateUserPremiumFromStripe } from '@/lib/premium-state';

export const dynamic = 'force-dynamic';

async function findUserByReference(userId?: string | null, userEmail?: string | null) {
  let updatedUser = null;

  if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
    updatedUser = await User.findById(userId);
  }

  if (!updatedUser && userEmail) {
    updatedUser = await User.findOne({ email: userEmail });
  }

  return updatedUser;
}

async function getUserByStripeCustomerId(customerId?: string | null) {
  if (!customerId) {
    return null;
  }

  return User.findOne({ stripeCustomerId: customerId });
}

function isPremiumSubscriptionStatus(status?: string | null) {
  return ['trialing', 'active', 'past_due', 'unpaid'].includes(status || '');
}

async function hasLifetimeAccess(userId: string) {
  const lifetimePayment = await Payment.findOne({
    user: userId,
    provider: 'stripe',
    planType: 'lifetime',
    status: 'completed',
  }).lean();

  return !!lifetimePayment;
}

async function handleStripeWebhook(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Missing Stripe signature or secret', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Stripe signature error';
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (![
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ].includes(event.type)) {
    return NextResponse.json({ received: true, provider: 'stripe', ignored: event.type });
  }

  await connectDB();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const userEmail = session.customer_email || session.customer_details?.email;
    const planType = session.metadata?.plan === 'monthly' ? 'monthly' : 'lifetime';
    const customerId = typeof session.customer === 'string' ? session.customer : null;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined;

    const user = await findUserByReference(userId, userEmail);

    if (!user) {
      return NextResponse.json({ received: true, provider: 'stripe', status: 'user_not_found' });
    }

    const updateFields: Record<string, unknown> = {
      premiumStripe: true,
    };

    if (planType === 'lifetime') {
      updateFields.hasLifetimePremium = true;
    }

    if (customerId) {
      updateFields.stripeCustomerId = customerId;
    }

    if (subscriptionId) {
      updateFields.stripeSubscriptionId = subscriptionId;
      updateFields.stripeSubscriptionStatus = 'active';
    }

    await updateUserPremiumFromStripe(user._id.toString(), true, updateFields);

    await Payment.updateOne(
      { provider: 'stripe', stripeSessionId: session.id },
      {
        $setOnInsert: {
          user: user._id,
          provider: 'stripe',
          planType,
          stripeSessionId: session.id,
          stripeSubscriptionId: subscriptionId,
          amount: session.amount_total || 0,
          currency: session.currency || 'eur',
          status: 'completed',
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ received: true, provider: 'stripe', event: event.type });
  }

  const subscription = event.data.object as Stripe.Subscription;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
  const appUserId = subscription.metadata?.userId;
  const eventStatus = subscription.status;

  let user = appUserId ? await User.findById(appUserId) : null;
  if (!user) {
    user = await getUserByStripeCustomerId(customerId);
  }

  if (!user) {
    return NextResponse.json({ received: true, provider: 'stripe', status: 'user_not_found' });
  }

  const premiumFromSubscription = isPremiumSubscriptionStatus(eventStatus);
  const lifetimeAccess = user.hasLifetimePremium || (await hasLifetimeAccess(user._id.toString()));
  const premiumStripe = premiumFromSubscription || lifetimeAccess;

  await updateUserPremiumFromStripe(user._id.toString(), premiumStripe, {
    stripeCustomerId: customerId || user.stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: eventStatus,
    hasLifetimePremium: lifetimeAccess,
  });

  await Payment.updateOne(
    {
      provider: 'stripe',
      stripeSubscriptionId: subscription.id,
      planType: 'monthly',
    },
    {
      $setOnInsert: {
        user: user._id,
        provider: 'stripe',
        planType: 'monthly',
        stripeSubscriptionId: subscription.id,
        amount: 0,
        currency: (subscription.currency || 'eur').toLowerCase(),
      },
      $set: {
        status: premiumFromSubscription ? 'completed' : 'failed',
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ received: true, provider: 'stripe', event: event.type });
}

export async function POST(req: NextRequest) {
  if (req.headers.has('stripe-signature')) {
    return handleStripeWebhook(req);
  }

  return new NextResponse('Missing Stripe signature header', { status: 400 });
}
