import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { loadQuizIndex } from '@/lib/quiz-index-data';
import BibleOverviewClient from '@/components/quiz-index/versie-1/BibleOverviewClient';

export const metadata: Metadata = {
  title: 'Quizzen',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function QuizzenVersie1Page() {
  const session = await getServerSession(authOptions);
  const { quizzes, books } = await loadQuizIndex(session?.user?.id);

  return <BibleOverviewClient quizzes={quizzes} books={books} isSignedIn={Boolean(session?.user)} />;
}
