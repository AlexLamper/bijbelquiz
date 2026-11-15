import type { Metadata } from 'next';
import { pageAlternates } from '@/config/routes';

import { Button, Container } from '@/components/bq';
import { HELP_QUESTIONS } from '@/components/web2/marketing/help-content';
import { HelpCenter } from '@/components/web2/marketing/HelpCenter';
import { AlertIcon, IconTile, MailIcon } from '@/components/web2/marketing/icons';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.hulp.title'),
    description: t('pages.hulp.description'),
    alternates: pageAlternates('/hulp'),
  };
}

export default function HelpPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HELP_QUESTIONS.filter((item) => item.featured).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.text },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <HelpCenter />

      <Container as="section" aria-labelledby="more-help-title" className="pb-20 pt-12 m:pt-[72px]">
        <h2 id="more-help-title" className="m-0 text-[26px] leading-8">
          {t('pagesBody.help.notFound')}
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 m:grid-cols-2">
          <div className="flex items-start gap-4 rounded-[16px] border border-line bg-card p-6">
            <IconTile tone="lapis" size={48}>
              <MailIcon />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <h3 className="m-0 font-sans text-[17px] font-extrabold">{t('pagesBody.help.ask')}</h3>
              <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-muted">{t('pagesBody.help.response')}</p>
              <Button href="/contact" variant="secondary" size="lg" className="mt-3 px-[22px]">
                {t('pagesBody.help.contact')}
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-[16px] border border-line bg-card p-6">
            <IconTile tone="coral" size={48}>
              <AlertIcon />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <h3 className="m-0 font-sans text-[17px] font-extrabold">{t('pagesBody.report.title')}</h3>
              <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-muted">
                {t('pagesBody.help.reportText')}
              </p>
              <Button href="/foutmelding#melden" variant="secondary" size="lg" className="mt-3 px-[22px]">
                {t('pagesBody.help.report')}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
