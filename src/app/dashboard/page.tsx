import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB, UserProgress, Quiz, User } from "@/database";
import { Metadata } from 'next';
import DashboardHomeClient from '@/app/dashboard/DashboardHomeClient';
import { getLevelInfo } from '@/lib/gamification';

export const metadata: Metadata = {
  title: 'Dashboard - BijbelQuiz',
  description: 'Jouw persoonlijke Bijbelquiz dashboard.',
  robots: { index: false, follow: true },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  await connectDB();
  const userId = session?.user?.id;
  const isPremium = !!session?.user?.isPremium;

  const user = userId ? await User.findById(userId).select('xp streak quizzesPlayed').lean() : null;
  const xp = user?.xp || 0;

  // Fetch quizzes - show all quizzes for both guests and logged users
  const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };

  const quizzesRaw = await Quiz.find(statusFilter)
    .populate('categoryId', 'title')
    .sort({ isPremium: 1, sortOrder: 1 })
    .limit(8)
    .lean();
  const quizzes = JSON.parse(JSON.stringify(quizzesRaw));

  // Fetch user progress only if logged in
  interface PopulatedProgress {
    _id: string;
    quizId?: { _id: string; title: string; slug?: string; categoryId?: { title: string } };
    score: number;
    totalQuestions: number;
    completedAt: Date;
  }

  const progressDocs = userId ? await UserProgress.find({ userId })
    .sort({ completedAt: -1 })
    .populate({
      path: 'quizId',
      select: 'title slug categoryId',
      populate: { path: 'categoryId', select: 'title' },
    })
    .lean() as unknown as PopulatedProgress[] : [];

  const levelInfo = getLevelInfo(xp);

  const streak = user?.streak || 0;
  const recentProgress = JSON.parse(JSON.stringify(progressDocs.slice(0, 5)));

  return (
    <DashboardHomeClient
      quizzes={quizzes}
      recentProgress={recentProgress}
      streak={streak}
      xp={xp}
      level={levelInfo.level}
      levelTitle={levelInfo.title}
      levelProgress={levelInfo.progressPercentage}
      totalQuizzesDone={user?.quizzesPlayed || 0}
      userName={session?.user?.name?.split(' ')[0] || 'Gast'}
      isPremium={isPremium}
    />
  );
}
