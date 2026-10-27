import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import SettingsView, { type PremiumRow } from '@/components/web2/account/SettingsView';
import { authOptions } from '@/lib/auth';
import { connectDB, User } from '@/database';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { hasActiveStripeSubscription, resolvePremiumSubscription } from '@/lib/premium-subscription';
import { normalizeOnboardingSettings, normalizeUserSettings } from '@/lib/user-settings';

export const metadata: Metadata = {
  title: 'Instellingen | BijbelQuiz',
  description: 'Beheer je persoonlijke voorkeuren en accountinstellingen.',
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

export default async function InstellingenPage({ searchParams }: { searchParams: Promise<{ billing?: string | string[] }> }) {
  const billingParam = (await searchParams).billing;
  const billing = Array.isArray(billingParam) ? billingParam[0] : billingParam;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/inloggen?callbackUrl=/instellingen');
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();

  if (!user) {
    redirect('/inloggen?callbackUrl=/instellingen');
  }

  const signInMethod = user.password
    ? 'Ingelogd met e-mail en wachtwoord'
    : user.appleId
      ? 'Ingelogd met Apple'
      : 'Ingelogd met Google';

  return (
    <SettingsView
      initialData={{
        profile: { name: user.name || '', email: user.email || '', signInMethod },
        settings: normalizeUserSettings(user.settings),
        onboarding: normalizeOnboardingSettings(user.onboarding),
      }}
      premium={await premiumRow(user)}
      billingError={billing === 'error' || billing === 'unavailable' ? billing : null}
    />
  );
}

/** What the "Premium beheren" row says, and where it goes. */
async function premiumRow(user: Parameters<typeof getPremiumSnapshot>[0] & Parameters<typeof resolvePremiumSubscription>[0]): Promise<PremiumRow> {
  const snapshot = getPremiumSnapshot(user);
  if (!snapshot.isPremium) return { label: 'Je speelt gratis', action: 'link', href: '/premium' };
  if (user.hasLifetimePremium) return { label: 'Levenslang Premium', action: 'link', href: '/premium' };

  // Only a running subscription: an ended one must not hide app or group Premium.
  if (hasActiveStripeSubscription(user)) {
    const subscription = await resolvePremiumSubscription(user);
    const label = subscription.cancelAtPeriodEnd
      ? `Opgezegd, actief tot ${subscription.endDateLabel || 'het einde van de periode'}`
      : subscription.endDateLabel
        ? `${subscription.statusText}, verlengt op ${subscription.endDateLabel}`
        : subscription.statusText;
    // The Stripe portal: change payment details, see invoices, cancel.
    return { label, action: 'portal' };
  }

  if (snapshot.premiumStore) return { label: 'Premium via de App Store of Google Play', action: 'link', href: '/premium' };
  if (snapshot.premiumGroup) return { label: 'Premium via een groepslicentie', action: 'link', href: '/groepslicentie' };
  return { label: 'Premium actief', action: 'link', href: '/premium' };
}
