import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AuthPage, LoginVisual } from '@/components/web2/account/AuthLayout';
import { isAppleWebSignInEnabled } from '@/lib/auth/apple-web';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Inloggen | BijbelQuiz - Ga Verder met Leren',
  description: 'Log in op je BijbelQuiz account. Bekijk je statistieken, hervat openstaande quizzen en houd je streak vast.',
  alternates: {
    canonical: '/inloggen',
  },
  openGraph: {
    title: 'Inloggen bij BijbelQuiz',
    description: 'Welkom terug! Log in om verder te spelen.',
    url: 'https://www.bijbelquiz.com/inloggen',
  },
};

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
