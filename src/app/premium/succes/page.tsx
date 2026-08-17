import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Check } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { connectDB, Payment } from '@/database';
import { updateUserPremiumFromStripe } from '@/lib/premium-state';
import { Button } from '@/components/ui/button';
import { readReturnPath, readStripePlan, STRIPE_PLANS } from '@/lib/stripe-plans';
import SessionRefresher from './SessionRefresher';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Betaling Geslaagd - Welkom bij Premium',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: Promise<{ session_id?: string; next?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { session_id, next } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/inloggen?callbackUrl=/premium');
  }

  let planLabel: string | null = null;
  let isTrialing = false;
  let trialEndLabel: string | null = null;

  // Verify the payment securely on the server
  if (session_id) {
    try {
      await connectDB();
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

      if (checkoutSession.metadata?.userId === session.user.id) {
        // Read through the shared plan table. Deciding "monthly or else
        // lifetime" here is what used to hand every yearly subscriber - and
        // every group licence buyer - permanent free access.
        const planType = readStripePlan(checkoutSession.metadata?.plan);
        const planConfig = STRIPE_PLANS[planType];
        planLabel = planConfig.label;

        const customerId = typeof checkoutSession.customer === 'string' ? checkoutSession.customer : undefined;
        const subscriptionId = typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : undefined;

        let subscriptionStatus: string | undefined;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionStatus = subscription.status;
            isTrialing = subscription.status === 'trialing';

            if (isTrialing && typeof subscription.trial_end === 'number') {
              trialEndLabel = new Intl.DateTimeFormat('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'Europe/Amsterdam',
              }).format(new Date(subscription.trial_end * 1000));
            }
          } catch (subscriptionError) {
            console.warn('Could not fetch subscription status on success page', subscriptionError);
          }
        }

        // A group licence is not a personal subscription: the webhook grants the
        // licence and its join code, and touching the buyer's own premium flags
        // here would leave them stuck on after the licence lapses.
        if (!planConfig.isGroup) {
          // Update DB immediately in case webhook is slow or missing. Route the
          // write through the same helper the webhook uses: setting `isPremium`
          // directly used to leave `premiumStripe` unset, so the two sources of
          // truth disagreed until some later Stripe event happened to repair it.
          await updateUserPremiumFromStripe(session.user.id, true, {
            hasLifetimePremium: planConfig.isLifetime,
            ...(customerId ? { stripeCustomerId: customerId } : {}),
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            ...(subscriptionStatus ? { stripeSubscriptionStatus: subscriptionStatus } : {}),
          });
        }

        await Payment.updateOne(
          { provider: 'stripe', stripeSessionId: checkoutSession.id },
          {
            $setOnInsert: {
              user: session.user.id,
              provider: 'stripe',
              planType,
              stripeSessionId: checkoutSession.id,
              stripeSubscriptionId: subscriptionId,
              amount: checkoutSession.amount_total || 0,
              currency: checkoutSession.currency || 'eur',
              status: 'completed',
            },
          },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  }

  // Back to whatever the buyer was doing when they hit the wall.
  const continuePath = readReturnPath(next);

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-paper">
      <SessionRefresher />
      <main className="container mx-auto flex flex-col items-center px-4 py-12">
        <section className="w-full max-w-md rounded-lg border border-rule bg-paper-raised p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-positive/35 bg-positive/10">
            <Check className="h-8 w-8 text-positive" strokeWidth={2} aria-hidden />
          </div>

          <h1 className="font-display text-3xl font-normal tracking-tight text-ink">
            {isTrialing ? 'Je proefperiode is gestart' : 'Betaling geslaagd'}
          </h1>

          <p className="mt-4 text-ink-soft">
            {isTrialing ? (
              <>
                Premium staat open.{' '}
                {trialEndLabel
                  ? `Je proefperiode loopt tot ${trialEndLabel}; daarna gaat het abonnement door tenzij je opzegt.`
                  : 'Zeg op wanneer je wilt voordat de proefperiode eindigt.'}
              </>
            ) : (
              <>
                Bedankt voor je steun. Je account is opgewaardeerd naar{' '}
                <span className="font-medium text-lapis">{planLabel || 'Premium'}</span>.
              </>
            )}
          </p>

          <p className="mt-6 border-t border-rule pt-6 text-sm text-ink-soft">
            Je kunt nu onbeperkt samen spelen, alle quizzen openen en bij elke vraag de uitleg lezen.
          </p>

          <div className="mt-8 space-y-3">
            <Button asChild className="h-12 w-full bg-ink text-ink-inverted hover:bg-ink-soft">
              <Link href={continuePath}>Ga verder waar je was</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full border-rule">
              <Link href="/premium">Beheer je lidmaatschap</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
