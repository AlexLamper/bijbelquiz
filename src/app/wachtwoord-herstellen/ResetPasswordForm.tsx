'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button, Field, PasswordInput } from '@/components/bq';
import { AuthCard, AuthNotice } from '@/components/web2/account/AuthLayout';

const MIN_LENGTH = 6;

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [repeat, setRepeat] = React.useState('');
  const [error, setError] = React.useState('');
  const [repeatError, setRepeatError] = React.useState('');
  const [expired, setExpired] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setRepeatError('');

    if (password.length < MIN_LENGTH) {
      setError(`Kies een wachtwoord van minimaal ${MIN_LENGTH} tekens.`);
      return;
    }
    if (password !== repeat) {
      setRepeatError('De wachtwoorden zijn niet hetzelfde.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; code?: string; email?: string };

      if (!response.ok) {
        if (payload.code === 'INVALID_TOKEN') setExpired(true);
        setError(payload.error || 'Er ging iets mis. Probeer het opnieuw.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({ reset: '1' });
      if (payload.email) params.set('email', payload.email);
      router.replace(`/inloggen?${params.toString()}`);
    } catch {
      setError('Netwerkfout. Probeer het later opnieuw.');
      setLoading(false);
    }
  };

  if (expired) {
    return <InvalidResetLink />;
  }

  return (
    <AuthCard titleId="reset-title" title="Nieuw wachtwoord" subtitle="Kies een nieuw wachtwoord voor je account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <Field label="Nieuw wachtwoord" htmlFor="reset-password" hint="Minimaal 6 tekens.">
          <PasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            minLength={MIN_LENGTH}
            placeholder="Minimaal 6 tekens"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Field label="Herhaal wachtwoord" htmlFor="reset-repeat" error={repeatError || undefined}>
          <PasswordInput
            id="reset-repeat"
            name="password-repeat"
            autoComplete="new-password"
            placeholder="Nog een keer"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
            invalid={Boolean(repeatError)}
            required
          />
        </Field>
        <Button type="submit" size="xl" block loading={loading} className="mt-1">
          Wachtwoord opslaan
        </Button>
      </form>
    </AuthCard>
  );
}

export function InvalidResetLink() {
  return (
    <AuthCard
      titleId="reset-title"
      title="Deze link werkt niet meer"
      subtitle="De link is verlopen of al gebruikt. Vraag een nieuwe aan; die werkt een uur."
    >
      <Button href="/wachtwoord-vergeten" size="xl" block>
        Nieuwe link aanvragen
      </Button>
      <Button href="/inloggen" variant="secondary" size="xl" block>
        Terug naar inloggen
      </Button>
    </AuthCard>
  );
}
