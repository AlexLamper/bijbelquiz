import { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { connectDB, User } from '@/database';
import LeaderboardClient from './LeaderboardClient';

interface LeaderboardEntry {
  _id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  badges: string[];
  createdAt: string;
}

export const metadata: Metadata = {
  title: 'Ranglijst - BijbelQuiz',
  description: 'Bekijk de topspelers van BijbelQuiz. Verdien punten door quizzen te spelen en stijg in de ranglijst.',
  alternates: {
    canonical: '/leaderboard',
  },
  openGraph: {
    title: 'De BijbelQuiz Ranglijst - Wie heeft de meeste bijbelkennis?',
    description: 'Strijd mee voor de eerste plek. Speel quizzen, verdien punten en word de nummer 1.',
    url: 'https://www.bijbelquiz.com/leaderboard',
  },
};

async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
  await connectDB();
  const users = await User.find({ xp: { $gt: 0 } })
    .sort({ xp: -1 })
    .limit(100)
    .select('name email xp streak badges createdAt')
    .lean();

  return users.map((user) => ({
    _id: user._id.toString(),
    email: user.email || '',
    name: user.name || 'Speler',
    xp: user.xp || 0,
    streak: user.streak || 0,
    badges: Array.isArray(user.badges) ? user.badges : [],
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date(0).toISOString(),
  }));
}

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const leaderboard = await getLeaderboardData();

  return (
    <LeaderboardClient users={leaderboard} currentUserId={session?.user?.id} />
  );
}
