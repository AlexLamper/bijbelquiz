import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB, UserProgress, Quiz, User } from "@bijbelquiz/database";
import { Metadata } from 'next';
import DashboardHomeClient from './DashboardHomeClient';
import { getLevelInfo } from '@/lib/gamification';

export const metadata: Metadata = {
  title: 'Dashboard - BijbelQuiz',
  description: 'Jouw persoonlijke Bijbelquiz dashboard.',
  robots: { index: false, follow: true },
};

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const uniqueDates = Array.from(
    new Set(dates.map((d) => new Date(d).setHours(0, 0, 0, 0)))
  ).sort((a, b) => b - a);
  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 86400000;
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
  let streak = 0;
  let expectedDate = uniqueDates[0];
  for (const d of uniqueDates) {
    if (d === expectedDate) { streak++; expectedDate -= 86400000; }
    else break;
  }
  return streak;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard");

  await connectDB();
  const userId = session.user.id;
  const isPremium = !!session.user.isPremium;

  const user = await User.findById(userId).select('xp streak').lean();
  const xp = user?.xp || 0;

  // Fetch quizzes
  const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
  const quizzesRaw = await Quiz.find(statusFilter)
    .populate('categoryId', 'title')
    .sort({ isPremium: 1, sortOrder: 1 })
    .limit(8)
    .lean();
  const quizzes = JSON.parse(JSON.stringify(quizzesRaw));

  // Fetch user progress
  interface PopulatedProgress {
    _id: string;
    quizId?: { _id: string; title: string; slug?: string; categoryId?: { title: string } };
    score: number;
    totalQuestions: number;
    completedAt: Date;
  }

  const progressDocs = await UserProgress.find({ userId })
    .sort({ completedAt: -1 })
    .populate({
      path: 'quizId',
      select: 'title slug categoryId',
      populate: { path: 'categoryId', select: 'title' },
    })
    .lean() as unknown as PopulatedProgress[];

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
      userName={session.user.name?.split(' ')[0] || 'Bijbelstudent'}
      isPremium={isPremium}
    />
  );
}
