'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The dashboard is a server component, so every number on it comes from the
 * RSC payload. `router.refresh()` re-runs that server render and swaps in the
 * fresh payload without a browser reload, which refreshes all of the data at
 * once - stats, recente gebruikers/quizzen, betalingen and de pijplijnstatus.
 */
export default function AdminRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  // Only after mount, so the server and client markup agree on first paint.
  useEffect(() => {
    setRefreshedAt(new Date());
  }, []);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      setRefreshedAt(new Date());
    });
  };

  return (
    <div className="flex items-center gap-3">
      {refreshedAt && (
        <span className="text-xs text-muted-foreground tabular-nums">
          Bijgewerkt {refreshedAt.toLocaleTimeString('nl-NL')}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={handleRefresh}
        disabled={isPending}
        aria-label="Gegevens verversen"
        className="h-10 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Verversen...' : 'Ververs'}
      </Button>
    </div>
  );
}
