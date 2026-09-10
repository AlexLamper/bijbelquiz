import { connectDB, Category } from '@/database';
import QuizCreatorForm from './QuizCreatorForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nieuwe Quiz Maken - BijbelQuiz',
    robots: { index: false }
}

export default async function CreateQuizPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/inloggen?callbackUrl=/quizzen/aanmaken');
  }

  await connectDB();
  const categories = await Category.find({ isActive: true }).lean();

  return (
    <div className="min-h-screen bg-paper pb-12 pt-10">
      <section className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-5 lg:px-4">
        <h1 className="text-4xl text-ink">Nieuwe Quiz Maken</h1>
        <p className="mt-3 max-w-3xl text-sm text-ink-soft">
          Deel jouw kennis. Je quiz wordt na indiening beoordeeld door een moderator.
        </p>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-7 sm:px-5 lg:px-4">
        <QuizCreatorForm categories={JSON.parse(JSON.stringify(categories))} />
      </section>
    </div>
  );
}
