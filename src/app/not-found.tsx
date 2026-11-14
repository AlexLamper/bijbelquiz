import type { Metadata } from 'next';

import { ErrorScreen } from '@/components/web2/marketing/ErrorScreen';
import { t } from '@/i18n';

export const metadata: Metadata = {
  title: t('pagesBody.notFound.metaTitle'),
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <ErrorScreen
      kicker={t('pagesBody.notFound.kicker')}
      title={t('pagesBody.notFound.title')}
      text={t('pagesBody.notFound.text')}
    />
  );
}
