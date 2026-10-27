import type { Metadata } from 'next';

import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';

export const metadata: Metadata = {
  title: 'Fout melden | BijbelQuiz Support',
  description: 'Meld technische problemen of fouten in BijbelQuiz zodat we ze snel kunnen oplossen.',
  alternates: { canonical: '/foutmelding' },
};

/**
 * Reporting a problem on purpose ("Fout melden" in the help and contact
 * pages). Same layout as the 404 page; the page field is filled with the page
 * the visitor came from.
 */
export default function FoutmeldingPage() {
  return (
    <ErrorScreen
      kicker="FOUT MELDEN"
      title="Iets werkt niet goed?"
      text="Vertel ons wat er misging, dan zoeken we het uit. Of kies waar je heen wilt, of ga terug naar home."
      cardKicker="VERDER SPELEN"
      reportLabel="Naar het formulier"
      pageSource="referrer"
    />
  );
}
