import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import PremiumOfferLayout from '@/components/premium/PremiumOfferLayout';

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

export default async function PremiumPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/premium');
  }

  const isPremium = session?.user?.isPremium;
  const lifetimePriceLabel = process.env.NEXT_PUBLIC_PREMIUM_LIFETIME_PRICE_LABEL || '€74,99';
  const monthlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || '€5,99';

  return (
    <div className="flex min-h-screen flex-col">
      <section className="flex-1 pt-8 pb-16 md:pt-16">
        <div className="mx-auto max-w-340 px-4 sm:px-5 lg:px-4">
          <PremiumOfferLayout
            isPremium={Boolean(isPremium)}
            isLoggedIn={Boolean(session)}
            monthlyPriceLabel={monthlyPriceLabel}
            lifetimePriceLabel={lifetimePriceLabel}
          />
        </div>
      </section>
    </div>
  );
}

