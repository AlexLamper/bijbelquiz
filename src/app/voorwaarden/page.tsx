import type { Metadata } from 'next';
import { pageAlternates } from '@/config/routes';

import { LegalPage, LegalText, type LegalSection } from '@/components/web2/marketing/LegalPage';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.voorwaarden.title'),
    description: t('pages.voorwaarden.description'),
    alternates: pageAlternates('/voorwaarden'),
  };
}

function sections(): LegalSection[] {
  return [
    { id: 'algemeen', title: t('termsPage.s1.title'), content: <LegalText>{t('termsPage.s1.text')}</LegalText> },
    { id: 'gebruik', title: t('termsPage.s2.title'), content: <LegalText>{t('termsPage.s2.text')}</LegalText> },
    { id: 'premium', title: t('termsPage.s3.title'), content: <LegalText>{t('termsPage.s3.text')}</LegalText> },
    { id: 'eigendom', title: t('termsPage.s4.title'), content: <LegalText>{t('termsPage.s4.text')}</LegalText> },
    { id: 'aansprakelijkheid', title: t('termsPage.s5.title'), content: <LegalText>{t('termsPage.s5.text')}</LegalText> },
  ];
}

export default function TermsPage() {
  return <LegalPage active="voorwaarden" title={t('termsPage.title')} meta={t('termsPage.meta')} sections={sections()} />;
}
