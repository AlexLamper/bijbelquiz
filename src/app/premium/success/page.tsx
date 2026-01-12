import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SessionRefresher from './SessionRefresher';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

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
      
      if (checkoutSession.payment_status === 'paid' && checkoutSession.metadata?.userId === session.user.id) {
        // Update DB immediately in case webhook is slow or missing
        await User.findByIdAndUpdate(session.user.id, { isPremium: true });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <SessionRefresher />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <Card className="w-full max-w-md text-center shadow-lg border-green-100">
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
           <CardContent className="pt-0">
             <Button asChild className="w-full h-12 text-lg">
               <Link href="/">Start een Premium Quiz</Link>
             </Button>
           </CardContent>
        </Card>
      </main>
    </div>
  );
}
