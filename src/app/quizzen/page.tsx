import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import QuizzesClient from '@/components/QuizzesClient';
import { loadQuizIndex } from '@/lib/quiz-index-data';

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

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const userIsPremium = !!session?.user?.isPremium;

  const { quizzes, categories } = await loadQuizIndex(session?.user?.id);
  const currentCategory = params.category || 'all';

  let initialCategoryId = 'all';
  if (currentCategory !== 'all') {
    const matchedCategory = categories.find(
      (category: { _id: string; slug?: string }) =>
        category.slug === currentCategory || category._id === currentCategory
    );

    if (matchedCategory?._id) {
      initialCategoryId = matchedCategory._id;
    }
  }

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
      <QuizzesClient
        quizzes={quizzes}
        categories={categories}
        userIsPremium={userIsPremium}
        canCreateQuiz={Boolean(session?.user)}
        initialCategoryId={initialCategoryId}
      />
    </>
  );
}
