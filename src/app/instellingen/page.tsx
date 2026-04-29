import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import SettingsClient from '@/components/settings/SettingsClient';
import { authOptions } from '@/lib/auth';
import { connectDB, User } from '@/database';
import { normalizeOnboardingSettings, normalizeUserSettings } from '@/lib/user-settings';

export const metadata: Metadata = {
  title: 'Instellingen | BijbelQuiz',
  description: 'Beheer je persoonlijke voorkeuren en accountinstellingen.',
  robots: { index: false, follow: true },
};

export default async function InstellingenPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  await connectDB();

  const user = await User.findById(session.user.id).lean();

  if (!user) {
    redirect('/login');
  }

  return (
    <SettingsClient
      initialData={{
        profile: {
          name: user.name || '',
          email: user.email || '',
        },
        settings: normalizeUserSettings(user.settings),
        onboarding: normalizeOnboardingSettings(user.onboarding),
      }}
    />
  );
}
