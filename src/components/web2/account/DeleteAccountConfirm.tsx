'use client';

import * as React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/bq';
import { AuthNotice } from './AuthLayout';
import { t } from '@/i18n';

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
        setError(payload?.error || t('account.delete.failed'));
        setDeleting(false);
        return;
      }
      // The session cookie still names an account that no longer exists.
      await signOut({ callbackUrl: '/account-verwijderen?verwijderd=1' });
    } catch {
      setError(t('account.delete.network'));
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
        {t('account.delete.confirm')}
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
          {t('account.delete.submit')}
        </Button>
        <Link href="/instellingen" className="flex h-11 items-center text-base font-bold no-underline">
          {t('account.cancel')}
        </Link>
      </div>
    </>
  );
}
