'use client';

import { useState, useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/bq';

/**
 * The dashboard is a server component, so every number on it comes from the
 * RSC payload. `router.refresh()` re-runs that server render and swaps in the
 * fresh payload without a browser reload, which refreshes all of the data at
 * once - stats, recente gebruikers/quizzen, betalingen and de pijplijnstatus.
 */
export default function AdminRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refreshedAt, setRefreshedAt] = useState<Date>(() => new Date());
  // Only after hydration, so the server and client markup agree on first paint.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      setRefreshedAt(new Date());
    });
  };

  return (
    <>
      {hydrated && (
        <span className="tabular text-[13px] font-semibold text-ink-muted" aria-live="polite">
          Bijgewerkt {refreshedAt.toLocaleTimeString('nl-NL')}
        </span>
      )}
      <Button type="button" variant="secondary" size="md" onClick={handleRefresh} disabled={isPending} className="px-4" title="Gegevens verversen">
        <RefreshCw className={`size-[18px] ${isPending ? 'animate-spin' : ''}`} strokeWidth={2.4} aria-hidden="true" />
        {isPending ? 'Verversen...' : 'Ververs'}
      </Button>
    </>
  );
}

function noopSubscribe() {
  return () => {};
}
