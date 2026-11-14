import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { loadLandingData } from '@/components/web2/marketing/landing-data';
import { LANDING_FAQ, LandingPage } from '@/components/web2/marketing/LandingPage';
import { authOptions } from '@/lib/auth';
import { getSiteConfig } from '@/config/site';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.home.title'),
    description: t('pages.home.description'),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: t('pages.home.ogTitle'),
      description: t('pages.home.ogDescription'),
      url: getSiteConfig().baseUrl,
    },
  };
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Signed-in players have their own home.
  if (session?.user) {
    redirect('/dashboard');
  }

  const data = await loadLandingData();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.text },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <LandingPage data={data} />
    </>
  );
}
