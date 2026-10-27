import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { GROUP_LICENSE_PRICE_LABEL, GROUP_LICENSE_SEATS } from '@/lib/group-license-constants';
import { getPremiumPriceLabels } from '@/lib/premium-prices';
import { trialDaysForPlan } from '@/lib/stripe-plans';
import { GroupLicenseView } from '@/components/web2/premium/GroupLicenseView';

export const metadata: Metadata = {
  title: 'Groepslicentie | BijbelQuiz voor gemeentes en scholen',
  description:
    `Premium voor je hele groep: één licentie, één code. Tot ${GROUP_LICENSE_SEATS} mensen spelen met Premium, ieder op zijn eigen telefoon. Voor jeugdgroepen, gemeentes en klassen.`,
  alternates: { canonical: '/groepslicentie' },
  openGraph: {
    title: 'BijbelQuiz Groepslicentie',
    description: 'Premium voor je hele groep met een code die je gewoon voorleest.',
    url: 'https://www.bijbelquiz.com/groepslicentie',
  },
};

export const dynamic = 'force-dynamic';

/** W4 P-Groepslicentie. */
export default async function GroupLicensePage() {
  const [session, prices] = await Promise.all([getServerSession(authOptions), getPremiumPriceLabels()]);

  return (
    <GroupLicenseView
      priceLabel={GROUP_LICENSE_PRICE_LABEL}
      seats={GROUP_LICENSE_SEATS}
      premiumYearlyPrice={prices.yearly}
      trialDays={trialDaysForPlan('yearly', process.env.STRIPE_TRIAL_DAYS)}
      isLoggedIn={Boolean(session?.user)}
      // Without a Stripe price the buy button would open a checkout that
      // 500s, so the page falls back to an email address instead.
      purchasable={Boolean(process.env.STRIPE_PRICE_GROUP)}
    />
  );
}
