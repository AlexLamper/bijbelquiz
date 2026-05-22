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
    redirect('/login?callbackUrl=/quizzes/create');
  }

  await connectDB();
  const categories = await Category.find({ isActive: true }).lean();

  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-12 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <h1 className="text-4xl text-[#1f2f4b] dark:text-zinc-100">Nieuwe Quiz Maken</h1>
        <p className="mt-3 max-w-3xl text-sm text-[#5f7297] dark:text-zinc-300">
          Deel jouw kennis. Je quiz wordt na indiening beoordeeld door een moderator.
        </p>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-7 sm:px-5 lg:px-4">
        <QuizCreatorForm categories={JSON.parse(JSON.stringify(categories))} />
      </section>
    </div>
  );
}
