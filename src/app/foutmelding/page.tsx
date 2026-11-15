import type { Metadata } from 'next';
import { pageAlternates } from '@/config/routes';

import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.foutmelding.title'),
    description: t('pages.foutmelding.description'),
    alternates: pageAlternates('/foutmelding'),
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
      kicker={t('pagesBody.report.kicker')}
      title={t('pagesBody.report.title')}
      text={t('pagesBody.report.text')}
      cardKicker={t('pagesBody.report.cardKicker')}
      reportLabel={t('pagesBody.report.formLabel')}
      pageSource="referrer"
    />
  );
}
