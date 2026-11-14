import type { Metadata } from 'next';

import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.foutmelding.title'),
    description: t('pages.foutmelding.description'),
    alternates: { canonical: '/foutmelding' },
  };
}

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
