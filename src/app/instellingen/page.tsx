import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import SettingsView, { type PremiumRow } from '@/components/web2/account/SettingsView';
import { authOptions } from '@/lib/auth';
import { connectDB, User } from '@/database';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { hasActiveStripeSubscription, resolvePremiumSubscription } from '@/lib/premium-subscription';
import { normalizeOnboardingSettings, normalizeUserSettings } from '@/lib/user-settings';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.instellingen.title'),
    description: t('pages.instellingen.description'),
    robots: { index: false, follow: true },
  };
}

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
    ? t('pagesBody.settings.signInEmail')
    : user.appleId
      ? t('pagesBody.settings.signInApple')
      : t('pagesBody.settings.signInGoogle');

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
  if (!snapshot.isPremium) return { label: t('pagesBody.settings.free'), action: 'link', href: '/premium' };
  if (user.hasLifetimePremium) return { label: t('pagesBody.settings.lifetime'), action: 'link', href: '/premium' };

  // Only a running subscription: an ended one must not hide app or group Premium.
  if (hasActiveStripeSubscription(user)) {
    const subscription = await resolvePremiumSubscription(user);
    const label = subscription.cancelAtPeriodEnd
      ? t('pagesBody.settings.cancelledUntil', { date: subscription.endDateLabel || t('pagesBody.settings.endOfPeriod') })
      : subscription.endDateLabel
        ? t('pagesBody.settings.renews', { status: subscription.statusText, date: subscription.endDateLabel })
        : subscription.statusText;
    // The Stripe portal: change payment details, see invoices, cancel.
    return { label, action: 'portal' };
  }

  if (snapshot.premiumStore) return { label: t('pagesBody.settings.viaStore'), action: 'link', href: '/premium' };
  if (snapshot.premiumGroup) return { label: t('pagesBody.settings.viaGroup'), action: 'link', href: '/groepslicentie' };
  return { label: t('pagesBody.settings.active'), action: 'link', href: '/premium' };
}
