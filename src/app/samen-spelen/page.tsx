import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import MultiplayerEntryClient from '@/components/multiplayer/MultiplayerEntryClient';
import { authOptions } from '@/lib/auth';
import { connectDB, Category, Quiz, User } from '@/database';
import {
  MULTIPLAYER_FREE_MAX_PLAYERS,
  MULTIPLAYER_FREE_ROOM_QUOTA,
  MULTIPLAYER_PREMIUM_MAX_PLAYERS,
} from '@/lib/premium-benefits';

interface QuizOption {
  id: string;
  title: string;
  questionCount: number;
  isPremium: boolean;
  categorySlug: string | null;
  categoryTitle: string | null;
}

interface CategoryOption {
  slug: string;
  title: string;
}

interface RawUserDocument {
  isPremium?: unknown;
  hasLifetimePremium?: unknown;
  freeMultiplayerRoomCreated?: unknown;
  multiplayerGamesHosted?: unknown;
}

/**
 * Same rule as `lib/multiplayer/quota.ts`: accounts predating the counter are
 * read through the legacy boolean, where "used" means one game spent. This is
 * only the first paint - the client re-checks against the API on mount.
 */
function readGamesHosted(rawUser: RawUserDocument | null): number {
  if (typeof rawUser?.multiplayerGamesHosted === 'number') {
    return rawUser.multiplayerGamesHosted;
  }
  return rawUser?.freeMultiplayerRoomCreated === true ? 1 : 0;
}

interface RawQuizDocument {
  _id: unknown;
  title: unknown;
  questionCount?: unknown;
  questions?: unknown;
  isPremium?: unknown;
  categoryId?: unknown;
}

interface RawCategoryDocument {
  _id: unknown;
  slug: unknown;
  title: unknown;
}

export default async function MultiplayerPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/inloggen?callbackUrl=/samen-spelen');
  }

  await connectDB();

  const rawUser = await User.findById(session.user.id)
    .select('isPremium hasLifetimePremium freeMultiplayerRoomCreated multiplayerGamesHosted')
    .lean() as RawUserDocument | null;

  const isPremiumUser = Boolean(rawUser?.isPremium || rawUser?.hasLifetimePremium || session.user.isPremium);
  const freeGamesRemaining = isPremiumUser
    ? null
    : Math.max(0, MULTIPLAYER_FREE_ROOM_QUOTA - readGamesHosted(rawUser));

  const statusFilter = { status: 'approved' };
  const [rawQuizzes, rawCategories] = await Promise.all([
    Quiz.find(statusFilter)
      .select('_id title questions questionCount isPremium categoryId')
      .sort({ isPremium: 1, sortOrder: 1, createdAt: -1 })
      // Every approved quiz must be reachable from the picker - the client
      // does its own search/filtering, so nothing is truncated here.
      .lean() as unknown as RawQuizDocument[],
    Category.find().select('_id slug title').lean() as unknown as RawCategoryDocument[],
  ]);

  const categoriesById = new Map(
    rawCategories.map((category) => [String(category._id), category]),
  );

  const categories: CategoryOption[] = rawCategories
    .map((category) => ({ slug: String(category.slug), title: String(category.title) }))
    .sort((a, b) => a.title.localeCompare(b.title, 'nl'));

  const quizzes: QuizOption[] = rawQuizzes.map((quiz) => {
    const questionCount = typeof quiz.questionCount === 'number'
      ? quiz.questionCount
      : Array.isArray(quiz.questions)
        ? quiz.questions.length
        : 0;

    const category = quiz.categoryId ? categoriesById.get(String(quiz.categoryId)) : undefined;

    return {
      id: String(quiz._id),
      title: String(quiz.title),
      questionCount,
      isPremium: Boolean(quiz.isPremium),
      categorySlug: category ? String(category.slug) : null,
      categoryTitle: category ? String(category.title) : null,
    };
  });

  const maxPlayersForUser = isPremiumUser
    ? MULTIPLAYER_PREMIUM_MAX_PLAYERS
    : MULTIPLAYER_FREE_MAX_PLAYERS;

  return (
    <MultiplayerEntryClient
      quizzes={quizzes}
      categories={categories}
      isPremiumUser={isPremiumUser}
      freeGamesRemaining={freeGamesRemaining}
      maxPlayersForUser={maxPlayersForUser}
    />
  );
}
