import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { connectDB, Payment, User } from '@/database';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', '/profile');
    return NextResponse.redirect(signInUrl, 303);
  }

  await connectDB();
  const user = await User.findById(session.user.id);

  if (!user) {
    const profileUrl = new URL('/profile', req.nextUrl.origin);
    profileUrl.searchParams.set('billing', 'unavailable');
    return NextResponse.redirect(profileUrl, 303);
  }

  let stripeCustomerId = user.stripeCustomerId || '';
  const stripeSubscriptionId = user.stripeSubscriptionId || '';
  let stripeSubscriptionStatus = user.stripeSubscriptionStatus || '';

  if (!stripeCustomerId && stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      stripeSubscriptionStatus = subscription.status || stripeSubscriptionStatus;
      if (typeof subscription.customer === 'string') {
        stripeCustomerId = subscription.customer;
      }
    } catch (error) {
      console.warn('[STRIPE_PORTAL_POST] Failed to resolve customer from subscription', error);
    }
  }

  if (!stripeCustomerId) {
    try {
      const latestStripePayment = await Payment.findOne({
        user: user._id,
        provider: 'stripe',
      }).sort({ createdAt: -1 }).lean();

      const latestStripeSessionId = latestStripePayment?.stripeSessionId;
      const latestStripeSubscriptionId = latestStripePayment?.stripeSubscriptionId;

      if (latestStripeSessionId) {
        const checkoutSession = await stripe.checkout.sessions.retrieve(latestStripeSessionId);
        if (typeof checkoutSession.customer === 'string') {
          stripeCustomerId = checkoutSession.customer;
        }
      }

      if (!stripeCustomerId && latestStripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(latestStripeSubscriptionId);
        stripeSubscriptionStatus = subscription.status || stripeSubscriptionStatus;
        if (typeof subscription.customer === 'string') {
          stripeCustomerId = subscription.customer;
        }
      }
    } catch (error) {
      console.warn('[STRIPE_PORTAL_POST] Failed to resolve customer from payment history', error);
    }
  }

  if (!stripeCustomerId && session.user.email) {
    try {
      const customers = await stripe.customers.list({
        email: session.user.email,
        limit: 10,
      });

      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'all',
          limit: 1,
        });

        if (subscriptions.data[0]) {
          stripeCustomerId = customer.id;
          stripeSubscriptionStatus = subscriptions.data[0].status || stripeSubscriptionStatus;
          break;
        }
      }

      if (!stripeCustomerId && customers.data[0]) {
        stripeCustomerId = customers.data[0].id;
      }
    } catch (error) {
      console.warn('[STRIPE_PORTAL_POST] Failed to resolve customer by email', error);
    }
  }

  if (!stripeCustomerId) {
    try {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: String(user._id),
        },
      });
      stripeCustomerId = customer.id;
    } catch (error) {
      console.error('[STRIPE_PORTAL_POST] Failed to create fallback customer', error);
      const profileUrl = new URL('/profile', req.nextUrl.origin);
      profileUrl.searchParams.set('billing', 'unavailable');
      return NextResponse.redirect(profileUrl, 303);
    }
  }

  if (
    stripeCustomerId !== (user.stripeCustomerId || '') ||
    stripeSubscriptionId !== (user.stripeSubscriptionId || '') ||
    stripeSubscriptionStatus !== (user.stripeSubscriptionStatus || '')
  ) {
    user.stripeCustomerId = stripeCustomerId;
    user.stripeSubscriptionId = stripeSubscriptionId || user.stripeSubscriptionId;
    user.stripeSubscriptionStatus = stripeSubscriptionStatus || user.stripeSubscriptionStatus;
    await user.save();
  }

  const returnUrl = `${req.nextUrl.origin}/profile`;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.redirect(portalSession.url, 303);
  } catch (error) {
    console.error('[STRIPE_PORTAL_POST] Failed to create billing portal session', error);
    const profileUrl = new URL('/profile', req.nextUrl.origin);
    profileUrl.searchParams.set('billing', 'error');
    return NextResponse.redirect(profileUrl, 303);
  }
}
