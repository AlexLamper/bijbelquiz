import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import SamenSpelenClient, {
  type SamenCategory,
  type SamenQuiz,
} from '@/components/web2/samen/SamenSpelenClient';
import { authOptions } from '@/lib/auth';
import { connectDB, Category, Quiz, User } from '@/database';
import { MULTIPLAYER_MAX_PLAYERS } from '@/lib/premium-benefits';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { resolveQuizPassage } from '@/lib/quiz-passage';

export const metadata: Metadata = {
  title: 'Samen spelen',
  description: 'Speel met je groep tegelijk dezelfde bijbelquiz, ieder op een eigen telefoon. Gratis, tot 20 spelers.',
};

interface RawUserDocument {
  isPremium?: boolean;
  hasLifetimePremium?: boolean;
  premiumGrantedUntil?: Date | null;
}

interface RawQuizDocument {
  _id: unknown;
  title: unknown;
  questionCount?: unknown;
  questions?: Array<{ bibleReference?: string }>;
  isPremium?: unknown;
  categoryId?: unknown;
}

interface RawCategoryDocument {
  _id: unknown;
  slug: unknown;
  title: unknown;
}

interface PageProps {
  searchParams: Promise<{ quiz?: string | string[] }>;
}

export default async function SamenSpelenPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/inloggen?callbackUrl=/samen-spelen');
  }

  const { quiz: quizParam } = await searchParams;
  const preselectedQuizId = typeof quizParam === 'string' ? quizParam : null;

  await connectDB();

  const rawUser = await User.findById(session.user.id)
    .select('isPremium hasLifetimePremium premiumGrantedUntil')
    .lean() as RawUserDocument | null;

  // Only reported to analytics: hosting and room size are the same for
  // everybody, Premium or not.
  const isPremiumUser = Boolean(session.user.isPremium || rawUser?.hasLifetimePremium || (rawUser && getPremiumSnapshot(rawUser).isPremium));

  const [rawQuizzes, rawCategories] = await Promise.all([
    Quiz.find({ status: 'approved' })
      // Only the references are needed (for the chapter); the question count
      // falls out of the array length.
      .select('_id title questions.bibleReference questionCount isPremium categoryId')
      .sort({ isPremium: 1, sortOrder: 1, createdAt: -1 })
      // Every approved quiz must be reachable from the picker - the client
      // does its own search/filtering, so nothing is truncated here.
      .lean() as unknown as RawQuizDocument[],
    Category.find().select('_id slug title').lean() as unknown as RawCategoryDocument[],
  ]);

  const categoriesById = new Map(rawCategories.map((category) => [String(category._id), category]));

  const categories: SamenCategory[] = rawCategories
    .map((category) => ({ slug: String(category.slug), title: String(category.title) }))
    .sort((a, b) => a.title.localeCompare(b.title, 'nl'));

  const quizzes: SamenQuiz[] = rawQuizzes.map((quiz) => {
    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    const questionCount = typeof quiz.questionCount === 'number' ? quiz.questionCount : questions.length;
    const category = quiz.categoryId ? categoriesById.get(String(quiz.categoryId)) : undefined;
    const passage = resolveQuizPassage(questions);

    return {
      id: String(quiz._id),
      title: String(quiz.title),
      questionCount,
      isPremium: Boolean(quiz.isPremium),
      categorySlug: category ? String(category.slug) : null,
      categoryTitle: category ? String(category.title) : null,
      passageLabel: passage?.label ?? null,
    };
  });

  return (
    <SamenSpelenClient
      quizzes={quizzes}
      categories={categories}
      isPremiumUser={isPremiumUser}
      maxPlayers={MULTIPLAYER_MAX_PLAYERS}
      initialQuizId={preselectedQuizId && quizzes.some((quiz) => quiz.id === preselectedQuizId) ? preselectedQuizId : null}
    />
  );
}
