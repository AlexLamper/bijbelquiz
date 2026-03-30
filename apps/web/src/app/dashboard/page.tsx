import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB, UserProgress, Quiz } from "@bijbelquiz/database";
import { Metadata } from 'next';
import DashboardHomeClient from './DashboardHomeClient';

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

  // XP & level
  const totalScore = progressDocs.reduce((acc, p) => acc + p.score, 0);
  const xp = totalScore * 10;
  let level = 1, levelTitle = "Beginner", nextLevelXp = 100;
  if (xp >= 1500) { level = 4; levelTitle = "Wijze"; nextLevelXp = 5000; }
  else if (xp >= 500) { level = 3; levelTitle = "Schriftgeleerde"; nextLevelXp = 1500; }
  else if (xp >= 100) { level = 2; levelTitle = "Onderzoeker"; nextLevelXp = 500; }
  const currentLevelBaseXp = level === 1 ? 0 : level === 2 ? 100 : level === 3 ? 500 : 1500;
  const levelProgress = Math.min(
    100,
    Math.round(((xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100)
  );

  const streak = calculateStreak(progressDocs.map((p) => p.completedAt));
  const recentProgress = JSON.parse(JSON.stringify(progressDocs.slice(0, 5)));

  return (
    <DashboardHomeClient
      quizzes={quizzes}
      recentProgress={recentProgress}
      streak={streak}
      xp={xp}
      level={level}
      levelTitle={levelTitle}
      levelProgress={levelProgress}
      totalQuizzesDone={progressDocs.length}
      userName={session.user.name?.split(' ')[0] || 'Bijbelstudent'}
      isPremium={isPremium}
    />
  );
}
