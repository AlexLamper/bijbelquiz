import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import { connectDB, User } from '@/database';
import { resolvePremiumSubscription } from '@/lib/premium-subscription';
import PremiumMemberLayout from '@/components/premium/PremiumMemberLayout';
import PremiumOfferLayout from '@/components/premium/PremiumOfferLayout';
import { readPaywallTrigger } from '@/lib/analytics/events';

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
  searchParams?: Promise<{ reden?: string }>;
}

export default async function PremiumPage({ searchParams }: PremiumPageProps) {
  const session = await getServerSession(authOptions);

  const lifetimePriceLabel = process.env.NEXT_PUBLIC_PREMIUM_LIFETIME_PRICE_LABEL || '€74,99';
  const monthlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || '€5,99';
  const yearlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_LABEL || '€39,99';
  // The yearly card only appears once Stripe actually has a price for it.
  // Rendering the button before then would offer a plan whose checkout 500s.
  const yearlyAvailable = Boolean(process.env.STRIPE_PRICE_YEARLY);

  // `?reden=` names the surface that sent the user here, so the page can open
  // on what they were just prevented from doing and the funnel can attribute
  // the sale. Anything unrecognised is treated as a direct visit.
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const trigger = readPaywallTrigger(resolvedSearchParams?.reden);

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
    <div className="flex min-h-screen flex-col">
      <section className="flex-1 pt-8 pb-16 md:pt-16">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-5 lg:px-4">
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
              trigger={trigger}
            />
          )}
        </div>
      </section>
    </div>
  );
}

