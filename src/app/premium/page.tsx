import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import { connectDB, User } from '@/database';
import { resolvePremiumSubscription } from '@/lib/premium-subscription';
import PremiumMemberLayout from '@/components/premium/PremiumMemberLayout';
import PremiumOfferLayout from '@/components/premium/PremiumOfferLayout';
import { readPaywallTrigger } from '@/lib/analytics/events';
import { readTrialDays } from '@/lib/premium-benefits';
import { GROUP_LICENSE_PRICE_LABEL } from '@/lib/group-license-constants';
import { readReturnPath } from '@/lib/stripe-plans';

export const metadata: Metadata = {
  title: 'Premium Lidmaatschap | Ontgrendel Alles op BijbelQuiz',
  description: 'Word Premium en krijg onbeperkt toegang tot alle Bijbelquizzen, diepgaande studie-uitleg en uitgebreide statistieken. Investeer in je geloofskennis.',
  keywords: ['premium bijbelquiz', 'bijbelstudie abonnement', 'geloofsverdieping', 'onbeperkt quizzen', 'steun bijbelquiz'],
  alternates: {
    canonical: '/premium',
  },
  openGraph: {
     title: 'Premium Lidmaatschap - BijbelQuiz',
     description: 'Upgrade naar Premium voor de ultieme Bijbelquiz ervaring. Onbeperkt spelen en leren.',
     url: 'https://www.bijbelquiz.com/premium',
  }
};

interface PremiumPageProps {
  searchParams?: Promise<{ reden?: string; next?: string; checkout?: string }>;
}

export default async function PremiumPage({ searchParams }: PremiumPageProps) {
  const session = await getServerSession(authOptions);

  const lifetimePriceLabel = process.env.NEXT_PUBLIC_PREMIUM_LIFETIME_PRICE_LABEL || '€74,99';
  const monthlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || '€5,99';
  const yearlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_LABEL || '€39,99';
  // The yearly row only appears once Stripe actually has a price for it.
  // Offering it before then would send the buyer into a checkout that 500s.
  const yearlyAvailable = Boolean(process.env.STRIPE_PRICE_YEARLY);
  // Read from the server so the claim on the page and the trial the checkout
  // actually creates can never disagree.
  const trialDays = readTrialDays(process.env.STRIPE_TRIAL_DAYS);

  // `?reden=` names the surface that sent the user here, so the page can open
  // on what they were just prevented from doing and the funnel can attribute
  // the sale. Anything unrecognised is treated as a direct visit.
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const trigger = readPaywallTrigger(resolvedSearchParams?.reden);
  // `?next=` carries the page the reader was on. A host who upgrades mid-evening
  // returns to their lobby rather than to a dead-end thank-you screen.
  const returnPath = readReturnPath(resolvedSearchParams?.next);
  const checkoutCancelled = resolvedSearchParams?.checkout === 'geannuleerd';

  // The session flag can lag a fresh purchase, so the database decides here.
  let isPremium = Boolean(session?.user?.isPremium);
  let subscription = null;

  if (session?.user?.id) {
    await connectDB();
    const user = await User.findById(session.user.id)
      .select('email isPremium hasLifetimePremium stripeCustomerId stripeSubscriptionId stripeSubscriptionStatus')
      .lean();

    if (user) {
      isPremium = Boolean(user.isPremium);
      if (isPremium) {
        subscription = await resolvePremiumSubscription(user);
      }
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-10">
        {isPremium && subscription ? (
          <PremiumMemberLayout
            isLifetime={subscription.isLifetime}
            statusLabel={subscription.statusText}
            renewalLabel={subscription.endDateLabel}
            cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
          />
        ) : (
          <PremiumOfferLayout
            isPremium={isPremium}
            isLoggedIn={Boolean(session)}
            monthlyPriceLabel={monthlyPriceLabel}
            yearlyPriceLabel={yearlyPriceLabel}
            yearlyAvailable={yearlyAvailable}
            lifetimePriceLabel={lifetimePriceLabel}
            groupPriceLabel={GROUP_LICENSE_PRICE_LABEL}
            trialDays={trialDays}
            trigger={trigger}
            returnPath={returnPath}
            checkoutCancelled={checkoutCancelled}
          />
        )}
      </div>
    </div>
  );
}
