'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/bq';
import { DuelApiError, errorMessage, joinDuelRequest } from './api';

/**
 * "Speel mee" on an invite: takes the empty seat (`POST /api/duels/join`)
 * and opens the duel. A taken or expired invite says so in place.
 */
export function JoinInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const { duel } = await joinDuelRequest(token);
      router.push(`/duels/${duel.id}`);
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
      if (caught instanceof DuelApiError && caught.code === 'DUEL_TAKEN') router.refresh();
    }
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      <Button variant="danger" size="xl" block onClick={join} loading={busy}>
        Speel mee
      </Button>
      {error && (
        <p role="alert" className="m-0 text-center text-[15px] font-bold text-coral-text">
          {error}
        </p>
      )}
    </div>
  );
}
