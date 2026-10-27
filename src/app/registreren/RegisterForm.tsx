'use client';

import * as React from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, Field, Input, PasswordInput } from '@/components/bq';
import { AuthCard, AuthNotice } from '@/components/web2/account/AuthLayout';
import { SocialButtons } from '@/components/web2/account/SocialButtons';
import { safeCallbackUrl } from '@/lib/auth/callback-url';

export default function RegisterForm({ appleEnabled }: { appleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const loginHref =
    callbackUrl === '/dashboard' ? '/inloggen' : `/inloggen?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      setError('Kies een naam van 2 tot 30 tekens.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email, password }),
      });

      if (!response.ok) {
        const message = await response.text();
        setError(message || 'Er is iets misgegaan bij het registreren.');
        setLoading(false);
        return;
      }

      // Signed in straight away with the credentials just created. Sending a
      // brand-new account to the login form to type them a second time was
      // the step between "bewaar je score" and the score being saved, and the
      // step where people gave up.
      const result = await signIn('credentials', { redirect: false, email, password, callbackUrl });
      if (result?.error) {
        router.push(`${loginHref}${loginHref.includes('?') ? '&' : '?'}registered=true`);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Netwerkfout. Probeer het later opnieuw.');
      setLoading(false);
    }
  };

  return (
    <AuthCard titleId="reg-title" title="Account aanmaken" subtitle="Gratis, en je voortgang blijft bewaard.">
      <SocialButtons callbackUrl={callbackUrl} appleEnabled={appleEnabled} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <AuthNotice tone="error">{error}</AuthNotice>}

        <Field label="Naam" htmlFor="reg-name" hint={<span id="reg-name-hint">Zo zien anderen je op de ranglijst en in duels.</span>}>
          <Input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="given-name"
            placeholder="Bijvoorbeeld Alex"
            aria-describedby="reg-name-hint"
            maxLength={30}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>

        <Field label="E-mailadres" htmlFor="reg-email">
          <Input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="naam@voorbeeld.nl"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field label="Wachtwoord" htmlFor="reg-password">
          <PasswordInput
            id="reg-password"
            name="password"
            autoComplete="new-password"
            minLength={6}
            placeholder="Minimaal 6 tekens"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        <Button type="submit" size="xl" block loading={loading} className="mt-1">
          Account aanmaken
        </Button>

        <p className="m-0 text-center text-[13px] leading-5 font-semibold text-ink-muted">
          Door een account te maken ga je akkoord met de{' '}
          <Link href="/voorwaarden" className="font-bold underline">
            voorwaarden
          </Link>{' '}
          en het{' '}
          <Link href="/privacybeleid" className="font-bold underline">
            privacybeleid
          </Link>
          .
        </p>
      </form>

      <p className="m-0 border-t border-line-soft pt-5 text-center text-[15px] font-semibold text-ink-muted">
        Heb je al een account?{' '}
        <Link href={loginHref} className="font-extrabold no-underline">
          Inloggen
        </Link>
      </p>
    </AuthCard>
  );
}
