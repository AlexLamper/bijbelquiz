import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import BookshelfClient from '@/components/quiz-index/versie-2/BookshelfClient';
import { loadQuizIndex } from '@/lib/quiz-index-data';

export const metadata: Metadata = {
  title: 'Quizzen',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function QuizzenBoekenplankPage() {
  const session = await getServerSession(authOptions);
  const { quizzes, categories, books } = await loadQuizIndex(session?.user?.id);

  return (
    <BookshelfClient
      quizzes={quizzes}
      categories={categories}
      books={books}
      isSignedIn={Boolean(session?.user)}
    />
  );
}
