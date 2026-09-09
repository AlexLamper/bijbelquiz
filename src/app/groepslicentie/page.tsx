import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { GROUP_LICENSE_PRICE_LABEL, GROUP_LICENSE_SEATS } from '@/lib/group-license';
import GroupLicenseClient from '@/components/premium/GroupLicenseClient';

export const metadata: Metadata = {
  title: 'Groepslicentie | BijbelQuiz voor gemeentes en scholen',
  description:
    'BijbelQuiz is gratis. Voor wie een jeugdgroep, gemeente of klas begeleidt is er een groepslicentie: een code voor je hele groep en plekken die je zelf beheert.',
  alternates: { canonical: '/groepslicentie' },
  openGraph: {
    title: 'BijbelQuiz Groepslicentie',
    description: 'Premium voor je hele groep met een code die je gewoon voorleest.',
    url: 'https://www.bijbelquiz.com/groepslicentie',
  },
};

export const dynamic = 'force-dynamic';

export default async function GroupLicensePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-paper pb-16 pt-8 lg:pt-14">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <GroupLicenseClient
          priceLabel={GROUP_LICENSE_PRICE_LABEL}
          defaultSeats={GROUP_LICENSE_SEATS}
          isLoggedIn={Boolean(session?.user)}
          // Without a Stripe price the buy button would open a checkout that
          // 500s, so the page falls back to an email address instead.
          purchasable={Boolean(process.env.STRIPE_PRICE_GROUP)}
        />
      </section>
    </div>
  );
}
