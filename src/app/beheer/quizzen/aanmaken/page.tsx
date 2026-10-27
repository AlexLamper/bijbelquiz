import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import QuizEditor from '@/components/web2/beheer/QuizEditor';
import { loadEditorCategories } from '@/components/web2/beheer/quiz-editor-data';

export const metadata: Metadata = {
  title: 'Nieuwe quiz - Beheer',
  robots: { index: false, follow: false },
};

export default async function CreateQuizPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const categories = await loadEditorCategories();
  return <QuizEditor categories={categories} />;
}
