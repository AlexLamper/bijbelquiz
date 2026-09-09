import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { connectDB, User } from '@/database';
import { resolvePremiumSubscription } from '@/lib/premium-subscription';
import PremiumMemberLayout from '@/components/premium/PremiumMemberLayout';

export const metadata: Metadata = {
  title: 'Je lidmaatschap | BijbelQuiz',
  description: 'Bekijk en beheer je BijbelQuiz-lidmaatschap.',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * What is left of the pricing page.
 *
 * BijbelQuiz no longer sells a personal subscription: everything it used to
 * gate - explanations, the review, the premium quizzes, unlimited hosting - is
 * free. This route survives because it cannot be deleted: it is linked from
 * receipt emails, from published app builds, and from anywhere a member looks
 * for "waar zeg ik dit op". A member sees their subscription and how to cancel
 * it. Everybody else is sent to the one thing still for sale, the group licence.
 */
export default async function PremiumPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/groepslicentie');
  }

  // The session flag can lag a fresh purchase, so the database decides here.
  await connectDB();
  const user = await User.findById(session.user.id)
    .select('email isPremium hasLifetimePremium stripeCustomerId stripeSubscriptionId stripeSubscriptionStatus')
    .lean();

  const subscription = user && user.isPremium ? await resolvePremiumSubscription(user) : null;

  if (!subscription) {
    redirect('/groepslicentie');
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-10">
        <PremiumMemberLayout
          isLifetime={subscription.isLifetime}
          statusLabel={subscription.statusText}
          renewalLabel={subscription.endDateLabel}
          cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
        />
      </div>
    </div>
  );
}
