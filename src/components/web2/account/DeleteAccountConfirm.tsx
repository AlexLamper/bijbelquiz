'use client';

import * as React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/bq';
import { AuthNotice } from './AuthLayout';

/** Step 2 of /account-verwijderen for a signed-in visitor: tick, then delete. */
export default function DeleteAccountConfirm() {
  const [understood, setUnderstood] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState('');

  const remove = async () => {
    if (!understood) return;
    setDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error || 'Verwijderen is niet gelukt. Probeer het opnieuw of mail ons.');
        setDeleting(false);
        return;
      }
      // The session cookie still names an account that no longer exists.
      await signOut({ callbackUrl: '/account-verwijderen?verwijderd=1' });
    } catch {
      setError('Netwerkfout. Probeer het opnieuw.');
      setDeleting(false);
    }
  };

  return (
    <>
      <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-line p-4 text-base leading-6 font-bold">
        <input
          type="checkbox"
          checked={understood}
          onChange={(event) => setUnderstood(event.target.checked)}
          className="mt-px size-[22px] shrink-0 accent-lapis"
        />
        Ik begrijp dat mijn account en voortgang voorgoed weg zijn. Dit kan niet ongedaan worden gemaakt.
      </label>
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button
          variant="danger-secondary"
          size="xl"
          className="px-[22px]"
          disabled={!understood}
          loading={deleting}
          onClick={() => void remove()}
        >
          {!deleting && <Trash2 className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />}
          Account definitief verwijderen
        </Button>
        <Link href="/instellingen" className="flex h-11 items-center text-base font-bold no-underline">
          Annuleren
        </Link>
      </div>
    </>
  );
}
