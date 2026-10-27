import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { connectDB, Payment, User } from '@/database';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { resolveCheckoutOrigin } from '@/lib/stripe-checkout';

export const dynamic = 'force-dynamic';

/** Pages that have a "Beheer je abonnement" button; the portal returns there. */
const RETURN_PAGES = new Set(['/premium', '/instellingen', '/profiel']);

/** Where the member came from: the form's `terug`, else the referring page, else /instellingen. */
function readReturnPage(formValue: FormDataEntryValue | null, referer: string | null, origin: string): string {
  if (typeof formValue === 'string' && RETURN_PAGES.has(formValue)) return formValue;
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.origin === origin && RETURN_PAGES.has(url.pathname)) return url.pathname;
    } catch {
      // fall through
    }
  }
  return '/instellingen';
}

/**
 * "Beheer je abonnement": opens the Stripe customer portal (cancel, switch
 * plan, payment method, invoices). Whatever the member changes there comes
 * back through the webhook (`customer.subscription.updated` / `deleted`), not
 * through this route.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const origin = req.nextUrl.origin;

  let formValue: FormDataEntryValue | null = null;
  try {
    formValue = (await req.formData()).get('terug');
  } catch {
    // A POST without a form body is fine.
  }
  const returnPage = readReturnPage(formValue, req.headers.get('referer'), origin);

  const fail = (reason: 'unavailable' | 'error') => {
    const url = new URL(returnPage, origin);
    url.searchParams.set('billing', reason);
    return NextResponse.redirect(url, 303);
  };

  if (!session?.user?.id) {
    const signInUrl = new URL('/inloggen', origin);
    signInUrl.searchParams.set('callbackUrl', returnPage);
    return NextResponse.redirect(signInUrl, 303);
  }

  await connectDB();
  const user = await User.findById(session.user.id).select('_id stripeCustomerId stripeSubscriptionId');

  if (!user) return fail('unavailable');

  let stripeCustomerId = user.stripeCustomerId || '';

  // Older accounts may lack the customer id: recover it from the
  // subscription, then from our own payment rows.
  if (!stripeCustomerId && user.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      if (typeof subscription.customer === 'string') stripeCustomerId = subscription.customer;
    } catch (error) {
      console.warn('[STRIPE_PORTAL_POST] Failed to resolve customer from subscription', error);
    }
  }

  if (!stripeCustomerId) {
    try {
      const latest = await Payment.findOne({ user: user._id, provider: 'stripe' })
        .sort({ createdAt: -1 })
        .select('stripeCustomerId stripeSessionId stripeSubscriptionId')
        .lean<{ stripeCustomerId?: string; stripeSessionId?: string; stripeSubscriptionId?: string }>();

      if (latest?.stripeCustomerId) stripeCustomerId = latest.stripeCustomerId;

      if (!stripeCustomerId && latest?.stripeSessionId) {
        const checkoutSession = await stripe.checkout.sessions.retrieve(latest.stripeSessionId);
        if (typeof checkoutSession.customer === 'string') stripeCustomerId = checkoutSession.customer;
      }

      if (!stripeCustomerId && latest?.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(latest.stripeSubscriptionId);
        if (typeof subscription.customer === 'string') stripeCustomerId = subscription.customer;
      }
    } catch (error) {
      console.warn('[STRIPE_PORTAL_POST] Failed to resolve customer from payment history', error);
    }
  }

  // Last resort: a customer in Stripe with this e-mail address and a
  // subscription (bought before customer ids were stored).
  if (!stripeCustomerId && session.user.email) {
    try {
      const customers = await stripe.customers.list({ email: session.user.email, limit: 10 });
      for (const customer of customers.data) {
        const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 1 });
        if (subscriptions.data[0]) {
          stripeCustomerId = customer.id;
          break;
        }
      }
    } catch (error) {
      console.warn('[STRIPE_PORTAL_POST] Failed to resolve customer by email', error);
    }
  }

  // Nothing to manage in Stripe: no empty portal, but a message.
  if (!stripeCustomerId) return fail('unavailable');

  if (stripeCustomerId !== (user.stripeCustomerId || '')) {
    await User.updateOne({ _id: user._id }, { $set: { stripeCustomerId } });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${resolveCheckoutOrigin({
        originHeader: req.headers.get('origin'),
        requestOrigin: origin,
        configuredUrl: process.env.NEXTAUTH_URL,
      })}${returnPage}`,
      locale: 'nl',
    });

    return NextResponse.redirect(portalSession.url, 303);
  } catch (error) {
    console.error('[STRIPE_PORTAL_POST] Failed to create billing portal session', error);
    return fail('error');
  }
}
