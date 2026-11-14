'use client';

import * as React from 'react';

import Link from 'next/link';

import './globals.css';
import { Button, Wordmark } from '@/components/bq';
import { getDefaultLocale } from '@/i18n';
import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';
import { t } from '@/i18n';

/**
 * Last resort when the root layout itself fails: it replaces the whole
 * document, so it draws its own minimal header (no session, no providers).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={getDefaultLocale()}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <header className="h-[68px] border-b border-line bg-card">
          <div className="mx-auto flex h-full max-w-[1200px] items-center px-4 m:px-8">
            <Link href="/" aria-label={t('pagesBody.error.logoAria')} className="no-underline">
              <Wordmark />
            </Link>
          </div>
        </header>
        <main>
          <ErrorScreen
            kicker={t('pagesBody.error.kicker')}
            title={t('pagesBody.error.title')}
            text={t('pagesBody.error.globalText')}
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
        </main>
      </body>
    </html>
  );
}
