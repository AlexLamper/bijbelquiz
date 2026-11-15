import { Suspense } from 'react';
import { pageAlternates } from '@/config/routes';
import type { Metadata } from 'next';

import { AuthPage, RegisterVisual } from '@/components/web2/account/AuthLayout';
import { isAppleWebSignInEnabled } from '@/lib/auth/apple-web';
import RegisterForm from './RegisterForm';
import { getSiteConfig } from '@/config/site';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.registreren.title'),
    description:
    t('pages.registreren.description'),
    alternates: pageAlternates('/registreren'),
    openGraph: {
      title: t('pages.registreren.ogTitle'),
      description: t('pages.registreren.ogDescription'),
      url: `${getSiteConfig().baseUrl}/registreren`,
    },
  };
}

export default function RegisterPage() {
  return (
    <AuthPage visual={<RegisterVisual />}>
      <Suspense fallback={<div className="h-[840px] w-full max-w-[480px] rounded-[16px] border border-line bg-card" />}>
        <RegisterForm appleEnabled={isAppleWebSignInEnabled()} />
      </Suspense>
    </AuthPage>
  );
}
