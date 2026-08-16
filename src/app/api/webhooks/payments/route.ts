import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import { connectDB, Payment, User } from '@/database';
import { updateUserPremiumFromStripe } from '@/lib/premium-state';
import { recordPurchase } from '@/lib/analytics/record';
import { endGroupLicense, grantGroupLicense } from '@/lib/group-license';

/**
 * When the paid period ends, plus a two day grace so a renewal that is a few
 * hours late does not lock a group out mid-evening.
 */
function subscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
  const periodEnd = (subscription as unknown as { current_period_end?: number })
    .current_period_end;

  if (typeof periodEnd === 'number') {
    return new Date(periodEnd * 1000 + 2 * 24 * 60 * 60 * 1000);
  }

  const fallback = new Date();
  fallback.setFullYear(fallback.getFullYear() + 1);
  return fallback;
}

export const dynamic = 'force-dynamic';

/**
 * Plan label carried in the checkout metadata.
 *
 * Unknown values fall back to `lifetime` because that is the one-off payment
 * mode: treating an unrecognised plan as a subscription would leave an account
 * waiting for a renewal that never arrives.
 */
function readStripePlan(value: unknown): 'monthly' | 'yearly' | 'group' | 'lifetime' {
  if (value === 'monthly') return 'monthly';
  if (value === 'yearly') return 'yearly';
  if (value === 'group') return 'group';
  return 'lifetime';
}

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
    const planType = readStripePlan(session.metadata?.plan);
    const customerId = typeof session.customer === 'string' ? session.customer : null;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined;

    const user = await findUserByReference(userId, userEmail);

    if (!user) {
      return NextResponse.json({ received: true, provider: 'stripe', status: 'user_not_found' });
    }

    // A group licence buys access for a whole group, not a personal
    // subscription: it must not set `premiumStripe`, or cancelling the licence
    // would leave the buyer's own flag stuck on.
    if (planType === 'group') {
      const { joinCode } = await grantGroupLicense({
        ownerId: user._id.toString(),
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      });

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
        { upsert: true },
      );

      await recordPurchase({
        userId: user._id.toString(),
        plan: 'group',
        platform: 'web',
        provider: 'stripe',
        amountCents: session.amount_total ?? null,
        currency: session.currency ?? 'eur',
      });

      return NextResponse.json({
        received: true,
        provider: 'stripe',
        event: event.type,
        groupJoinCode: joinCode,
      });
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

    // The only place a Stripe sale is known for certain. The trigger is
    // recovered from the user's most recent paywall view rather than threaded
    // through the hosted checkout.
    await recordPurchase({
      userId: user._id.toString(),
      plan: planType,
      platform: 'web',
      provider: 'stripe',
      amountCents: session.amount_total ?? null,
      currency: session.currency ?? 'eur',
    });

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

  // A recurring subscription is monthly unless the checkout said otherwise, so
  // a yearly plan is not filed away as a monthly one.
  const subscriptionPlan = readStripePlan(subscription.metadata?.plan);

  // A group licence renews and lapses on its own model. Routing it through the
  // personal premium path would grant the buyer a personal subscription they
  // never bought, and would leave the other members untouched.
  if (subscriptionPlan === 'group') {
    if (isPremiumSubscriptionStatus(eventStatus)) {
      await grantGroupLicense({
        ownerId: user._id.toString(),
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        expiresAt: subscriptionPeriodEnd(subscription),
      });
    } else {
      // Members keep what they already paid for; only the renewal stops.
      await endGroupLicense(subscription.id);
    }

    return NextResponse.json({ received: true, provider: 'stripe', event: event.type });
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
      planType: subscriptionPlan,
    },
    {
      $setOnInsert: {
        user: user._id,
        provider: 'stripe',
        planType: subscriptionPlan,
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
