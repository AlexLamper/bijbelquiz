import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { loadQuizIndex } from '@/lib/quiz-index-data';
import InhoudsopgaveClient from '@/components/quiz-index/versie-3/InhoudsopgaveClient';

export const metadata: Metadata = { title: 'Quizzen', robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

export default async function QuizzenInhoudsopgavePage() {
  const session = await getServerSession(authOptions);
  const data = await loadQuizIndex(session?.user?.id);

  return <InhoudsopgaveClient {...data} isSignedIn={Boolean(session?.user)} />;
}
