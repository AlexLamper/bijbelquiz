import type { Types } from 'mongoose';
import type Stripe from 'stripe';

import { connectDB, User } from '@/database';
import { subscriptionStatusGrantsPremium } from '@/lib/premium-state';
import stripe from '@/lib/stripe';

/**
 * A member's Stripe billing state for the Premium page, Instellingen and
 * account deletion.
 *
 * The webhook stores the subscription on the account (status, period end,
 * cancellation, plan), so normally this reads only our own columns. Accounts
 * from before those columns existed are looked up in Stripe once and written
 * back, because a webhook can have been missed and a customer created through
 * the portal may never have been recorded.
 */

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Proefperiode',
  active: 'Actief',
  past_due: 'Betaling mislukt, we proberen het opnieuw',
  unpaid: 'Onbetaald',
  canceled: 'Beëindigd',
  incomplete: 'Onvolledig',
  incomplete_expired: 'Verlopen',
  paused: 'Gepauzeerd',
};

export interface PremiumSubscriptionState {
  /** Bought once, nothing recurring to manage. */
  isLifetime: boolean;
  /** Recurring Stripe subscription, so the billing portal applies. */
  isMonthly: boolean;
  /** Dutch label for the Stripe status, or a sensible fallback. */
  statusText: string;
  /** Raw Stripe status, lower case, or '' when unknown. */
  status: string;
  /** `monthly` / `yearly` when known. */
  plan: 'monthly' | 'yearly' | null;
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
  stripeSubscriptionPlan?: 'monthly' | 'yearly' | null;
  stripeCurrentPeriodEnd?: Date | string | null;
  stripeCancelAtPeriodEnd?: boolean | null;
}

const dateLabel = (date: Date) =>
  date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Amsterdam' });

/** Whether the account has a Stripe subscription that currently gives Premium. */
export function hasActiveStripeSubscription(user: Pick<BillingUser, 'stripeSubscriptionId' | 'stripeSubscriptionStatus' | 'hasLifetimePremium'> & { premiumStripe?: boolean }): boolean {
  if (user.hasLifetimePremium) return false;
  if (user.stripeSubscriptionId && user.stripeSubscriptionStatus) {
    return subscriptionStatusGrantsPremium(user.stripeSubscriptionStatus);
  }
  // Older accounts: the flag without the details.
  return Boolean(user.premiumStripe);
}

export async function resolvePremiumSubscription(user: BillingUser): Promise<PremiumSubscriptionState> {
  const isLifetime = !!user.hasLifetimePremium;
  const isMonthly = (!!user.isPremium || !!user.stripeSubscriptionId) && !isLifetime;

  let customerId = user.stripeCustomerId || '';
  let subscriptionId = user.stripeSubscriptionId || '';
  let status = (user.stripeSubscriptionStatus || '').toLowerCase();
  let periodEnd: Date | null = user.stripeCurrentPeriodEnd ? new Date(user.stripeCurrentPeriodEnd) : null;
  let cancelAtPeriodEnd = Boolean(user.stripeCancelAtPeriodEnd);
  let plan: 'monthly' | 'yearly' | null = user.stripeSubscriptionPlan ?? null;
  let fetched = false;

  const adopt = (subscription: Stripe.Subscription) => {
    fetched = true;
    subscriptionId = subscription.id;
    status = subscription.status;
    cancelAtPeriodEnd =
      subscription.status !== 'canceled' && Boolean(subscription.cancel_at_period_end || subscription.cancel_at);
    const item = subscription.items?.data?.[0];
    if (typeof item?.current_period_end === 'number') periodEnd = new Date(item.current_period_end * 1000);
    const interval = item?.price?.recurring?.interval;
    if (interval === 'year') plan = 'yearly';
    else if (interval === 'month') plan = 'monthly';
    if (!customerId && typeof subscription.customer === 'string') customerId = subscription.customer;
  };

  // The webhook keeps these columns; only an account without them asks Stripe.
  const needsLookup = isMonthly && (!subscriptionId || !status || !periodEnd);

  if (needsLookup) {
    try {
      if (subscriptionId) {
        adopt(await stripe.subscriptions.retrieve(subscriptionId));
      } else if (customerId) {
        const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
        if (subscriptions.data[0]) adopt(subscriptions.data[0]);
      }

      // Last resort: the account may hold a Stripe customer we never recorded.
      if (!subscriptionId && user.email) {
        const customers = await stripe.customers.list({ email: user.email, limit: 10 });
        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 1 });
          if (subscriptions.data[0]) {
            customerId = customer.id;
            adopt(subscriptions.data[0]);
            break;
          }
        }
      }
    } catch (error) {
      console.warn('[PREMIUM] Failed to resolve Stripe subscription details', error);
    }

    if (fetched) {
      await connectDB();
      await User.updateOne(
        { _id: user._id as Types.ObjectId },
        {
          $set: {
            ...(customerId ? { stripeCustomerId: customerId } : {}),
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            ...(status ? { stripeSubscriptionStatus: status } : {}),
            ...(plan ? { stripeSubscriptionPlan: plan } : {}),
            stripeCurrentPeriodEnd: periodEnd,
            stripeCancelAtPeriodEnd: cancelAtPeriodEnd,
          },
        },
      );
    }
  }

  const resolvedPeriodEnd = periodEnd as Date | null;

  return {
    isLifetime,
    isMonthly,
    statusText: STATUS_LABELS[status] || (isMonthly ? 'In verwerking' : 'Levenslang actief'),
    status,
    plan,
    endDateLabel: resolvedPeriodEnd && !Number.isNaN(resolvedPeriodEnd.getTime()) ? dateLabel(resolvedPeriodEnd) : null,
    cancelAtPeriodEnd,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  };
}
