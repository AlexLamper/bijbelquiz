import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Check } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { connectDB, Payment } from '@/database';
import { updateUserPremiumFromStripe } from '@/lib/premium-state';
import { Button } from '@/components/ui/button';
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
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/inloggen?callbackUrl=/premium');
  }

  // Verify the payment securely on the server
  if (session_id) {
    try {
      await connectDB();
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

      if (checkoutSession.metadata?.userId === session.user.id) {
        const planType = checkoutSession.metadata?.plan === 'monthly' ? 'monthly' : 'lifetime';
        const customerId = typeof checkoutSession.customer === 'string' ? checkoutSession.customer : undefined;
        const subscriptionId = typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : undefined;

        let subscriptionStatus: string | undefined;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionStatus = subscription.status;
          } catch (subscriptionError) {
            console.warn('Could not fetch subscription status on success page', subscriptionError);
          }
        }

        // Update DB immediately in case webhook is slow or missing. Route the
        // write through the same helper the webhook uses: setting `isPremium`
        // directly used to leave `premiumStripe` unset, so the two sources of
        // truth disagreed until some later Stripe event happened to repair it.
        await updateUserPremiumFromStripe(session.user.id, true, {
          hasLifetimePremium: planType === 'lifetime',
          ...(customerId ? { stripeCustomerId: customerId } : {}),
          ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
          ...(subscriptionStatus ? { stripeSubscriptionStatus: subscriptionStatus } : {}),
        });

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

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-paper">
      <SessionRefresher />
      <main className="container mx-auto flex flex-col items-center px-4 py-12">
        <section className="w-full max-w-md rounded-lg border border-rule bg-paper-raised p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-positive/35 bg-positive/10">
            <Check className="h-8 w-8 text-positive" strokeWidth={2} aria-hidden />
          </div>

          <h1 className="text-3xl tracking-tight text-ink">Betaling Geslaagd!</h1>

          <p className="mt-4 text-ink-soft">
            Bedankt voor je steun! Je account is nu opgewaardeerd naar{' '}
            <span className="font-medium text-lapis">Premium</span>.
          </p>

          <p className="mt-6 border-t border-rule pt-6 text-sm text-ink-soft">
            Je hebt nu directe toegang tot alle quizzen en diepgaande studies.
          </p>

          <div className="mt-8 space-y-3">
            <Button asChild className="h-12 w-full bg-ink text-ink-inverted hover:bg-ink-soft">
              <Link href="/quizzen">Start een Premium Quiz</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full border-rule">
              <Link href="/">Terug naar Home</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
