import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { loadQuizIndex } from '@/lib/quiz-index-data';
import Verkenner from '@/components/quiz-index/versie-4/Verkenner';

export const metadata: Metadata = {
  title: 'Quizzen',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function QuizExplorerPage() {
  const session = await getServerSession(authOptions);
  const data = await loadQuizIndex(session?.user?.id);

  return <Verkenner {...data} isSignedIn={Boolean(session?.user)} />;
}
