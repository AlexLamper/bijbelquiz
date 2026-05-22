import { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getLeaderboardResult, LeaderboardPeriod, parseLeaderboardPeriod } from '@/lib/leaderboard';
import LeaderboardClient from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'Ranglijst - BijbelQuiz',
  description: 'Bekijk de topspelers van BijbelQuiz. Verdien punten door quizzen te spelen en stijg in de ranglijst.',
  alternates: {
    canonical: '/ranglijst',
  },
  openGraph: {
    title: 'De BijbelQuiz Ranglijst - Wie heeft de meeste bijbelkennis?',
    description: 'Strijd mee voor de eerste plek. Speel quizzen, verdien punten en word de nummer 1.',
    url: 'https://www.bijbelquiz.com/ranglijst',
  },
};

interface LeaderboardPageProps {
  searchParams?: Promise<{ period?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const session = await getServerSession(authOptions);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const period = parseLeaderboardPeriod(resolvedSearchParams?.period) as LeaderboardPeriod;
  const leaderboardResult = await getLeaderboardResult(period, 100, session?.user?.id);

  return (
    <LeaderboardClient
      users={leaderboardResult.leaderboard}
      currentUserId={session?.user?.id}
      initialCurrentUserRank={leaderboardResult.currentUserRank}
      initialPeriod={period}
    />
  );
}
