'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button, Field, Input } from '@/components/bq';
import { AuthCard, AuthNotice } from '@/components/web2/account/AuthLayout';

export default function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [sent, setSent] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!response.ok) {
        setError(payload.error || 'Er ging iets mis. Probeer het opnieuw.');
      } else {
        setSent(payload.message || 'Kijk in je mail voor de link.');
      }
    } catch {
      setError('Netwerkfout. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      titleId="forgot-title"
      title="Wachtwoord vergeten"
      subtitle="Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord te kiezen."
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <AuthNotice tone="success">{sent}</AuthNotice>
          <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-muted">
            Geen mail gekregen? Controleer of je het goede adres gebruikt, of log in met Google of Apple als je je
            account zo hebt gemaakt.
          </p>
          <Button href="/inloggen" variant="secondary" size="xl" block>
            Terug naar inloggen
          </Button>
          <button
            type="button"
            onClick={() => setSent('')}
            className="mx-auto min-h-11 border-0 bg-transparent px-2 text-[15px] font-extrabold text-lapis hover:text-lapis-edge"
          >
            Ander e-mailadres proberen
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <AuthNotice tone="error">{error}</AuthNotice>}
          <Field label="E-mailadres" htmlFor="forgot-email">
            <Input
              id="forgot-email"
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
          <Button type="submit" size="xl" block loading={loading} className="mt-1">
            Stuur link
          </Button>
        </form>
      )}

      <p className="m-0 text-center text-[15px] font-semibold text-ink-muted">
        Weet je het weer?{' '}
        <Link href="/inloggen" className="font-extrabold no-underline">
          Inloggen
        </Link>
      </p>
    </AuthCard>
  );
}
