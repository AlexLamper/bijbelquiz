import type { Metadata } from 'next';
import { localizePath } from '@/config/routes';
import Link from 'next/link';

import { ChevronRightIcon } from '@/components/web2/marketing/icons';
import { LegalList, LegalPage, LegalText, type LegalSection } from '@/components/web2/marketing/LegalPage';
import { SUPPORT_EMAIL } from '@/lib/support-email';
import { t, tList } from '@/i18n';
import { rich } from '@/i18n/rich';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.privacybeleid.title'),
    description: t('pages.privacybeleid.description'),
    alternates: { canonical: localizePath('/privacybeleid') },
  };
}

const strong = (label: string) => <strong className="font-extrabold">{label}</strong>;

function sections(): LegalSection[] {
  return [
    {
      id: 'inleiding',
      title: t('privacyPage.s1.title'),
      content: <LegalText>{t('privacyPage.s1.text')}</LegalText>,
    },
    {
      id: 'gegevens',
      title: t('privacyPage.s2.title'),
      content: (
        <>
          <LegalText>{t('privacyPage.s2.intro')}</LegalText>
          <LegalList
            items={[
              <>{rich(t('privacyPage.s2.i1'), { label: strong(t('privacyPage.s2.l1')) })}</>,
              <>{rich(t('privacyPage.s2.i2'), { label: strong(t('privacyPage.s2.l2')) })}</>,
              <>{rich(t('privacyPage.s2.i3'), { label: strong(t('privacyPage.s2.l3')) })}</>,
            ]}
          />
        </>
      ),
    },
    {
      id: 'gebruik',
      title: t('privacyPage.s3.title'),
      content: (
        <>
          <LegalText>{t('privacyPage.s3.intro')}</LegalText>
          <LegalList items={tList('privacyPage.s3.items')} />
        </>
      ),
    },
    {
      id: 'derden',
      title: t('privacyPage.s4.title'),
      content: <LegalText>{t('privacyPage.s4.text')}</LegalText>,
    },
    {
      id: 'beveiliging',
      title: t('privacyPage.s5.title'),
      content: <LegalText>{t('privacyPage.s5.text')}</LegalText>,
    },
    {
      id: 'rechten',
      title: t('privacyPage.s6.title'),
      content: (
        <>
          <LegalText>{t('privacyPage.s6.text')}</LegalText>
          <Link href="/account-verwijderen" className="flex min-h-8 items-center gap-1 self-start text-base font-bold no-underline">
            {t('privacyPage.s6.link')}
            <ChevronRightIcon size={16} />
          </Link>
        </>
      ),
    },
    {
      id: 'cookies',
      title: t('privacyPage.s7.title'),
      content: <LegalText>{t('privacyPage.s7.text')}</LegalText>,
    },
    {
      id: 'contact',
      title: t('privacyPage.s8.title'),
      content: (
        <LegalText>
          {rich(t('privacyPage.s8.text'), { email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> })}
        </LegalText>
      ),
    },
  ];
}

export default function PrivacyPage() {
  return <LegalPage active="privacy" title={t('privacyPage.title')} meta={t('privacyPage.metaUpdated')} sections={sections()} />;
}
