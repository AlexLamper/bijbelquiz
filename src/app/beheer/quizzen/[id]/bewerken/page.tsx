import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { isValidObjectId } from 'mongoose';

import { authOptions } from '@/lib/auth';
import { connectDB, Quiz } from '@/database';
import QuizEditor from '@/components/web2/beheer/QuizEditor';
import { loadEditorCategories, toEditorQuiz } from '@/components/web2/beheer/quiz-editor-data';

export const metadata: Metadata = {
  title: 'Quiz bewerken - Beheer',
  robots: { index: false, follow: false },
};

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    redirect('/');
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    redirect('/beheer/quizzen');
  }

  await connectDB();
  const [quiz, categories] = await Promise.all([Quiz.findById(id).lean(), loadEditorCategories()]);
  if (!quiz) {
    redirect('/beheer/quizzen');
  }

  return <QuizEditor categories={categories} initial={toEditorQuiz(JSON.parse(JSON.stringify(quiz)))} />;
}
