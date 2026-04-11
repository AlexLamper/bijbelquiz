import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { connectDB, Payment, User } from '@/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    redirect('/login');
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

        // Update DB immediately in case webhook is slow or missing.
        await User.findByIdAndUpdate(session.user.id, {
          isPremium: true,
          hasLifetimePremium: planType === 'lifetime',
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeSubscriptionStatus: subscriptionStatus,
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
    <div className="min-h-[80vh] flex items-center justify-center">
      <SessionRefresher />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <Card className="w-full max-w-md text-center shadow-lg border-primary/20">
           <CardHeader>
             <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
               <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
             </div>
             <CardTitle className="text-3xl font-bold">Betaling Geslaagd!</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Bedankt voor je steun! Je account is nu opgewaardeerd naar <strong>Premium</strong>.
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Je hebt nu directe toegang tot alle quizzen en diepgaande studies.
                </p>
              </div>
           </CardContent>
           <CardContent className="pt-0 space-y-3">
             <Button asChild className="w-full h-12 text-lg">
               <Link href="/quizzes">Start een Premium Quiz</Link>
             </Button>
             <Button asChild variant="outline" className="w-full h-12 text-lg">
               <Link href="/">Terug naar Home</Link>
             </Button>
           </CardContent>
        </Card>
      </main>
    </div>
  );
}
