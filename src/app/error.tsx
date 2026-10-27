'use client';

import * as React from 'react';

import { Button } from '@/components/bq';
import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';

/**
 * The error boundary for every page under the root layout: the same screen
 * as the 404 page, with "Opnieuw proberen" first, so a passing hiccup (a
 * dropped connection, a slow database) is one click away from fixed.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      kicker="FOUT 500"
      title="Er ging iets mis"
      text="Deze pagina kon niet goed laden. Probeer het opnieuw, of kies waar je heen wilt."
      cardKicker="VRAAG 500"
      actions={
        <>
          <Button size="xl" className="px-6" onClick={() => reset()}>
            Opnieuw proberen
          </Button>
          <Button href="/" variant="secondary" size="xl" className="px-6">
            Naar home
          </Button>
        </>
      }
    />
  );
}
