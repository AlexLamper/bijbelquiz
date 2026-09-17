import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { QuizOverviewPage } from '@/components/quiz-overview/QuizOverviewPage';
import { loadQuizIndex } from '@/lib/quiz-index-data';
import { buildOverviewBooks } from '@/lib/quiz-overview-data';

export const metadata: Metadata = {
  title: 'Alle Bijbelquizzen - Kies je Categorie en Niveau | BijbelQuiz',
  description: 'Overzicht van alle beschikbare Bijbelquizzen. Filter op categorie, speel direct en test je kennis van het Oude en Nieuwe Testament.',
  keywords: ['bijbelquizzen', 'quiz overzicht', 'bijbelvragen', 'geloofsquiz', 'online bijbelstudie'],
  alternates: {
    canonical: '/quizzes',
  },
  openGraph: {
    title: 'Alle Bijbelquizzen Spelen - Gratis en Premium',
    description: 'Zoek en speel de beste Bijbelquizzen online. Van beginners tot experts.',
    url: 'https://www.bijbelquiz.com/quizzes',
  },
};

export const dynamic = 'force-dynamic';

export default async function QuizzesPage() {
  const session = await getServerSession(authOptions);
  const userIsPremium = !!session?.user?.isPremium;
  const isAuthenticated = Boolean(session?.user);

  const { quizzes } = await loadQuizIndex(session?.user?.id);
  const books = buildOverviewBooks(quizzes);
  const themeQuizzes = quizzes.filter((quiz) => !quiz.book);
  const totalAvailableChapters = books.reduce((sum, book) => sum + book.avail, 0);
  const totalChapters = books.reduce((sum, book) => sum + book.chapters, 0);

  const itemListJsonLd = {
    '@context':'https://schema.org',
    '@type':'ItemList',
    name: 'BijbelQuiz quizoverzicht',
    itemListElement: quizzes.map((quiz: { slug?: string; _id: string; title: string; description?: string }, index: number) => ({
      '@type':'ListItem',
      position: index + 1,
      url: `https://www.bijbelquiz.com/quiz/${quiz.slug || quiz._id}`,
      item: {
        '@type':'Quiz',
        name: quiz.title,
        description: quiz.description || '',
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Suspense fallback={null}>
        <QuizOverviewPage
          books={books}
          themeQuizzes={themeQuizzes}
          totalAvailableChapters={totalAvailableChapters}
          totalChapters={totalChapters}
          showProgress={isAuthenticated}
          userIsPremium={userIsPremium}
        />
      </Suspense>
    </>
  );
}
