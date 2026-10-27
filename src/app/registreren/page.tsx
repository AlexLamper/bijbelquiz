import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AuthPage, RegisterVisual } from '@/components/web2/account/AuthLayout';
import { isAppleWebSignInEnabled } from '@/lib/auth/apple-web';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Gratis Account Aanmaken | BijbelQuiz',
  description:
    'Registreer je gratis bij BijbelQuiz. Houd je voortgang bij, verdien badges en leer meer over de Bijbel. Sluit je aan bij de community.',
  alternates: {
    canonical: '/registreren',
  },
  openGraph: {
    title: 'Start met BijbelQuiz - Maak een Account',
    description: 'Begin vandaag nog met het testen van je Bijbelkennis. Gratis aanmelden.',
    url: 'https://www.bijbelquiz.com/registreren',
  },
};

export default function RegisterPage() {
  return (
    <AuthPage visual={<RegisterVisual />}>
      <Suspense fallback={<div className="h-[840px] w-full max-w-[480px] rounded-[16px] border border-line bg-card" />}>
        <RegisterForm appleEnabled={isAppleWebSignInEnabled()} />
      </Suspense>
    </AuthPage>
  );
}
