'use client';

import * as React from 'react';

import Link from 'next/link';

import './globals.css';
import { Button, Wordmark } from '@/components/bq';
import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';

/**
 * Last resort when the root layout itself fails: it replaces the whole
 * document, so it draws its own minimal header (no session, no providers).
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="nl">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <header className="h-[68px] border-b border-line bg-card">
          <div className="mx-auto flex h-full max-w-[1200px] items-center px-4 m:px-8">
            <Link href="/" aria-label="BijbelQuiz, naar de startpagina" className="no-underline">
              <Wordmark />
            </Link>
          </div>
        </header>
        <main>
          <ErrorScreen
            kicker="FOUT 500"
            title="Er ging iets mis"
            text="BijbelQuiz kon niet goed laden. Probeer het opnieuw, of ga terug naar home."
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
        </main>
      </body>
    </html>
  );
}
