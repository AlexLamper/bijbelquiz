import { Suspense } from 'react';
import { localizePath } from '@/config/routes';
import type { Metadata } from 'next';

import { AuthPage, LoginVisual } from '@/components/web2/account/AuthLayout';
import { isAppleWebSignInEnabled } from '@/lib/auth/apple-web';
import LoginForm from './LoginForm';
import { getSiteConfig } from '@/config/site';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.inloggen.title'),
    description: t('pages.inloggen.description'),
    alternates: {
      canonical: localizePath('/inloggen'),
    },
    openGraph: {
      title: t('pages.inloggen.ogTitle'),
      description: t('pages.inloggen.ogDescription'),
      url: `${getSiteConfig().baseUrl}/inloggen`,
    },
  };
}

export default function LoginPage() {
  return (
    <AuthPage visual={<LoginVisual />}>
      {/* useSearchParams needs a boundary; the fallback is the same card, empty. */}
      <Suspense fallback={<div className="h-[640px] w-full max-w-[480px] rounded-[16px] border border-line bg-card" />}>
        <LoginForm appleEnabled={isAppleWebSignInEnabled()} />
      </Suspense>
    </AuthPage>
  );
}
