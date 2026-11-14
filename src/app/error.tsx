'use client';

import * as React from 'react';

import { Button } from '@/components/bq';
import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';
import { t } from '@/i18n';

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
      kicker={t('pagesBody.error.kicker')}
      title={t('pagesBody.error.title')}
      text={t('pagesBody.error.text')}
      cardKicker={t('pagesBody.error.cardKicker')}
      actions={
        <>
          <Button size="xl" className="px-6" onClick={() => reset()}>
            {t('samen.room.retry')}
          </Button>
          <Button href="/" variant="secondary" size="xl" className="px-6">
            {t('pagesBody.error.home')}
          </Button>
        </>
      }
    />
  );
}
