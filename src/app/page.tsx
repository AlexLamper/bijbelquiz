import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { loadLandingData } from '@/components/web2/marketing/landing-data';
import { LANDING_FAQ, LandingPage } from '@/components/web2/marketing/LandingPage';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'BijbelQuiz - Gratis Online Bijbelquizzen',
  description: 'Test je kennis van de Bijbel met honderden gratis vragen. Van makkelijke quizzen voor beginners tot diepgaande studies voor gevorderden. Begin direct!',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'BijbelQuiz - Gratis Online Bijbelkennis Testen',
    description: 'Hoe goed ken jij de Bijbel? Doe de gratis test en leer meer over het geloof via interactieve quizzen.',
    url: 'https://www.bijbelquiz.com',
  },
};

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
