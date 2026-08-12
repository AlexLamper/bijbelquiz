import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import MultiplayerEntryClient from '@/components/multiplayer/MultiplayerEntryClient';
import { authOptions } from '@/lib/auth';
import { connectDB, Quiz, User } from '@/database';
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
  const rawQuizzes = await Quiz.find(statusFilter)
    .select('_id title questions questionCount isPremium')
    .sort({ isPremium: 1, sortOrder: 1, createdAt: -1 })
    .limit(40)
    .lean() as RawQuizDocument[];

  const quizzes: QuizOption[] = rawQuizzes.map((quiz) => {
    const questionCount = typeof quiz.questionCount === 'number'
      ? quiz.questionCount
      : Array.isArray(quiz.questions)
        ? quiz.questions.length
        : 0;

    return {
      id: String(quiz._id),
      title: String(quiz.title),
      questionCount,
      isPremium: Boolean(quiz.isPremium),
    };
  });

  const maxPlayersForUser = isPremiumUser
    ? MULTIPLAYER_PREMIUM_MAX_PLAYERS
    : MULTIPLAYER_FREE_MAX_PLAYERS;

  return (
    <MultiplayerEntryClient
      quizzes={quizzes}
      isPremiumUser={isPremiumUser}
      freeGamesRemaining={freeGamesRemaining}
      maxPlayersForUser={maxPlayersForUser}
    />
  );
}
