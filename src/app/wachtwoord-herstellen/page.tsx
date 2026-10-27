import type { Metadata } from 'next';

import { AuthPage } from '@/components/web2/account/AuthLayout';
import { isResetTokenUsable } from '@/lib/auth/password-reset';
import ResetPasswordForm, { InvalidResetLink } from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Nieuw wachtwoord | BijbelQuiz',
  description: 'Kies een nieuw wachtwoord voor je BijbelQuiz account.',
  robots: { index: false, follow: false },
  // The token is in the address; never hand it to another site as a referrer.
  referrer: 'no-referrer',
};

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token: raw } = await searchParams;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const usable = token ? await isResetTokenUsable(token) : false;

  return <AuthPage>{usable && token ? <ResetPasswordForm token={token} /> : <InvalidResetLink />}</AuthPage>;
}
