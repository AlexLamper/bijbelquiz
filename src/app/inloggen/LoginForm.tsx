'use client';

import * as React from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Field, Input, PasswordInput } from '@/components/bq';
import { AuthCard, AuthNotice } from '@/components/web2/account/AuthLayout';
import { SocialButtons } from '@/components/web2/account/SocialButtons';
import { safeCallbackUrl } from '@/lib/auth/callback-url';

/** next-auth's `?error=` codes, in words a player understands. */
const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: 'Dit e-mailadres hoort al bij een account. Log in zoals je dat eerder deed.',
  AccessDenied: 'Inloggen is niet gelukt. Probeer het opnieuw of kies een andere manier.',
  OAuthSignin: 'Inloggen is niet gelukt. Probeer het opnieuw.',
  OAuthCallback: 'Inloggen is niet gelukt. Probeer het opnieuw.',
  Callback: 'Inloggen is niet gelukt. Probeer het opnieuw.',
  SessionRequired: 'Log in om verder te gaan.',
};

/**
 * Sign in with e-mail and password, Google, or Apple (when configured).
 *
 * `?callbackUrl=` is honoured (as a path on this site only). Quiz attempts
 * played as a guest are claimed for the account by `PendingAttemptSync` as
 * soon as the session appears, wherever the sign-in lands.
 */
export default function LoginForm({ appleEnabled }: { appleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));

  const [email, setEmail] = React.useState(searchParams.get('email') ?? '');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(() => {
    const code = searchParams.get('error');
    return code ? (OAUTH_ERRORS[code] ?? 'Inloggen is niet gelukt. Probeer het opnieuw.') : '';
  });
  const [loading, setLoading] = React.useState(false);

  const notice = searchParams.get('reset')
    ? 'Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.'
    : searchParams.get('registered')
      ? 'Je account is aangemaakt. Log in om verder te gaan.'
      : searchParams.get('verwijderd')
        ? 'Je account is verwijderd.'
        : '';

  const registerHref =
    callbackUrl === '/dashboard' ? '/registreren' : `/registreren?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', { redirect: false, email, password, callbackUrl });
      if (result?.error) {
        setError('Onjuist e-mailadres of wachtwoord.');
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Er is iets misgegaan. Probeer het later opnieuw.');
      setLoading(false);
    }
  };

  return (
    <AuthCard titleId="login-title" title="Welkom terug" subtitle="Log in en speel verder waar je gebleven was.">
      {notice && <AuthNotice tone="success">{notice}</AuthNotice>}

      <SocialButtons callbackUrl={callbackUrl} appleEnabled={appleEnabled} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate={false}>
        {error && <AuthNotice tone="error">{error}</AuthNotice>}

        <Field label="E-mailadres" htmlFor="login-email">
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="naam@voorbeeld.nl"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(error)}
            required
          />
        </Field>

        <Field
          label="Wachtwoord"
          htmlFor="login-password"
          aside={<Link href="/wachtwoord-vergeten">Wachtwoord vergeten?</Link>}
        >
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="Je wachtwoord"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            invalid={Boolean(error)}
            required
          />
        </Field>

        <Button type="submit" size="xl" block loading={loading} className="mt-1">
          Inloggen
        </Button>
      </form>

      <p className="m-0 text-center text-[15px] font-semibold text-ink-muted">
        Nog geen account?{' '}
        <Link href={registerHref} className="font-extrabold no-underline">
          Account aanmaken
        </Link>
      </p>
    </AuthCard>
  );
}
