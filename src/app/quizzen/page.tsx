import { Suspense } from 'react';
import type { Metadata } from 'next';

import { QuizzenBrowser } from '@/components/web2/browsing/QuizzenBrowser';
import { loadBrowseCatalogue } from '@/lib/quiz-browse';
import { getSiteBaseUrl } from '@/lib/sitemap';

export const metadata: Metadata = {
  title: 'Alle Bijbelquizzen - Kies je Categorie en Niveau | BijbelQuiz',
  description:
    'Overzicht van alle beschikbare Bijbelquizzen. Filter op categorie, speel direct en test je kennis van het Oude en Nieuwe Testament.',
  keywords: ['bijbelquizzen', 'quiz overzicht', 'bijbelvragen', 'geloofsquiz', 'online bijbelstudie'],
  alternates: {
    canonical: '/quizzen',
  },
  openGraph: {
    title: 'Alle Bijbelquizzen Spelen - Gratis en Premium',
    description: 'Zoek en speel de beste Bijbelquizzen online. Van beginners tot experts.',
    url: 'https://www.bijbelquiz.com/quizzen',
  },
};

export const dynamic = 'force-dynamic';

/** Long descriptions only feed the search; the cards never show them. */
const SEARCH_DESCRIPTION_LENGTH = 160;

export default async function QuizzesPage() {
  // The library is the same for everybody: no per-reader progress on these cards.
  const { quizzes } = await loadBrowseCatalogue();
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
