import type Stripe from 'stripe';

import { connectDB, User } from '@/database';
import stripe from '@/lib/stripe';

/**
 * Resolving a member's billing state means talking to Stripe, because our own
 * columns drift: a webhook can be missed, and a customer created through the
 * portal may never have been written back. Both the profile page and the
 * Premium page need the same answer, so the lookup lives here once.
 */

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Proefperiode',
  active: 'Actief',
  past_due: 'Betaling achterstallig',
  unpaid: 'Onbetaald',
  canceled: 'Geannuleerd',
  incomplete: 'Onvolledig',
  incomplete_expired: 'Verlopen',
};

export interface PremiumSubscriptionState {
  /** Bought once, nothing recurring to manage. */
  isLifetime: boolean;
  /** Recurring Stripe subscription, so the billing portal applies. */
  isMonthly: boolean;
  /** Dutch label for the Stripe status, or a sensible fallback. */
  statusText: string;
  /** Renewal / end date formatted in nl-NL, or null when unknown. */
  endDateLabel: string | null;
  /** Cancelled but still running out the paid term. */
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

interface BillingUser {
  _id: unknown;
  email?: string | null;
  isPremium?: boolean;
  hasLifetimePremium?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: string | null;
}

export async function resolvePremiumSubscription(
  user: BillingUser
): Promise<PremiumSubscriptionState> {
  const isLifetime = !!user.hasLifetimePremium;
  const isMonthly = !!user.isPremium && !isLifetime;

  let customerId = user.stripeCustomerId || '';
  let subscriptionId = user.stripeSubscriptionId || '';
  let status = (user.stripeSubscriptionStatus || '').toLowerCase();
  let periodEnd: Date | null = null;
  let cancelAtPeriodEnd = false;

  const readPeriodEnd = (subscription: Stripe.Subscription) => {
    const periodEndUnix = subscription.items?.data?.[0]?.current_period_end;
    if (typeof periodEndUnix === 'number') {
      periodEnd = new Date(periodEndUnix * 1000);
    }
  };

  const adopt = (subscription: Stripe.Subscription) => {
    subscriptionId = subscription.id;
    status = subscription.status;
    cancelAtPeriodEnd = !!subscription.cancel_at_period_end;
    readPeriodEnd(subscription);
  };

  if (isMonthly) {
    try {
      if (!subscriptionId && customerId) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 1,
        });
        if (subscriptions.data[0]) adopt(subscriptions.data[0]);
      }

      // Last resort: the account may hold a Stripe customer we never recorded.
      if (!subscriptionId && user.email) {
        const customers = await stripe.customers.list({ email: user.email, limit: 10 });

        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
            limit: 1,
          });

          if (subscriptions.data[0]) {
            customerId = customer.id;
            adopt(subscriptions.data[0]);
            break;
          }
        }
      }

      if (subscriptionId && !periodEnd) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        status = subscription.status || status;
        cancelAtPeriodEnd = !!subscription.cancel_at_period_end;
        readPeriodEnd(subscription);
        if (!customerId && typeof subscription.customer === 'string') {
          customerId = subscription.customer;
        }
      }
    } catch (error) {
      console.warn('[PREMIUM] Failed to resolve Stripe subscription details', error);
    }

    const drifted =
      customerId !== (user.stripeCustomerId || '') ||
      subscriptionId !== (user.stripeSubscriptionId || '') ||
      status !== (user.stripeSubscriptionStatus || '').toLowerCase();

    if (drifted) {
      await connectDB();
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId || undefined,
        stripeSubscriptionId: subscriptionId || undefined,
        stripeSubscriptionStatus: status || undefined,
      });
    }
  }

  const resolvedPeriodEnd = periodEnd as Date | null;

  return {
    isLifetime,
    isMonthly,
    statusText: STATUS_LABELS[status] || (isMonthly ? 'In verwerking' : 'Levenslang actief'),
    endDateLabel: resolvedPeriodEnd
      ? resolvedPeriodEnd.toLocaleDateString('nl-NL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null,
    cancelAtPeriodEnd,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  };
}
