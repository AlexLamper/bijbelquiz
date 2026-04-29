import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import MultiplayerEntryClient from '@/components/multiplayer/MultiplayerEntryClient';
import { authOptions } from '@/lib/auth';
import { connectDB, Quiz, User } from '@/database';

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
    redirect('/login?callbackUrl=/multiplayer');
  }

  await connectDB();

  const rawUser = await User.findById(session.user.id)
    .select('isPremium hasLifetimePremium freeMultiplayerRoomCreated')
    .lean() as RawUserDocument | null;

  const isPremiumUser = Boolean(rawUser?.isPremium || rawUser?.hasLifetimePremium || session.user.isPremium);
  const hasUsedFreeRoomCreation = Boolean(rawUser?.freeMultiplayerRoomCreated);

  const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
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

  return (
    <MultiplayerEntryClient
      quizzes={quizzes}
      isPremiumUser={isPremiumUser}
      hasUsedFreeRoomCreation={hasUsedFreeRoomCreation}
    />
  );
}
