import type { Metadata } from 'next';

import { AuthPage } from '@/components/web2/account/AuthLayout';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Wachtwoord vergeten | BijbelQuiz',
  description: 'Vraag een link aan om een nieuw wachtwoord voor je BijbelQuiz account te kiezen.',
  alternates: { canonical: '/wachtwoord-vergeten' },
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      <ForgotPasswordForm />
    </AuthPage>
  );
}
