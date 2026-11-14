import { Suspense } from 'react';
import type { Metadata } from 'next';

import { getServerSession } from 'next-auth';

import { QuizzenBrowser } from '@/components/web2/browsing/QuizzenBrowser';
import { authOptions } from '@/lib/auth';
import { loadBrowseCatalogue } from '@/lib/quiz-browse';
import { getSiteBaseUrl } from '@/lib/sitemap';
import { getSiteConfig } from '@/config/site';
import { t, tList } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.quizzen.title'),
    description:
    t('pages.quizzen.description'),
    keywords: tList('pages.quizzen.keywords'),
    alternates: {
      canonical: '/quizzen',
    },
    openGraph: {
      title: t('pages.quizzen.ogTitle'),
      description: t('pages.quizzen.ogDescription'),
      url: `${getSiteConfig().baseUrl}/quizzen`,
    },
  };
}

export const dynamic = 'force-dynamic';

/** Long descriptions only feed the search; the cards never show them. */
const SEARCH_DESCRIPTION_LENGTH = 160;

export default async function QuizzesPage() {
  // A signed-in reader sees which quizzes they already played; a guest gets
  // the same library without marks.
  const session = await getServerSession(authOptions).catch(() => null);
  const { quizzes } = await loadBrowseCatalogue(session?.user?.id);
  const cards = quizzes.map((quiz) => ({
    ...quiz,
    description: quiz.description ? quiz.description.slice(0, SEARCH_DESCRIPTION_LENGTH) : null,
  }));

  const baseUrl = getSiteBaseUrl();
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'BijbelQuiz quizoverzicht',
    itemListElement: quizzes.map((quiz, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/bijbelquiz/${quiz.slug}`,
      item: {
        '@type': 'Quiz',
        name: quiz.title,
        description: quiz.description || '',
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <Suspense fallback={null}>
        <QuizzenBrowser quizzes={cards} />
      </Suspense>
    </>
  );
}
