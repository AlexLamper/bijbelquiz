import type { Metadata } from 'next';

import { AuthPage } from '@/components/web2/account/AuthLayout';
import ForgotPasswordForm from './ForgotPasswordForm';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.wachtwoord-vergeten.title'),
    description: t('pages.wachtwoord-vergeten.description'),
    alternates: { canonical: '/wachtwoord-vergeten' },
    robots: { index: false, follow: true },
  };
}

export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      <ForgotPasswordForm />
    </AuthPage>
  );
}
