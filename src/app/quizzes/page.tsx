import { connectDB, Quiz, Category } from '@/database';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import QuizzesClient from '@/components/QuizzesClient';

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

async function getData() {
  await connectDB();

  const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };

  const quizzes = await Quiz.find(statusFilter)
    .populate('categoryId')
    .sort({ isPremium: 1, title: 1 })
    .lean();

  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

  return {
    quizzes: JSON.parse(JSON.stringify(quizzes)),
    categories: JSON.parse(JSON.stringify(categories)),
  };
}

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const userIsPremium = !!session?.user?.isPremium;

  const { quizzes, categories } = await getData();
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

  return (
    <QuizzesClient
      quizzes={quizzes}
      categories={categories}
      userIsPremium={userIsPremium}
      initialCategoryId={initialCategoryId}
    />
  );
}
