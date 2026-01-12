import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import QuizPlayer from '@/components/QuizPlayer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { id } = await params;
  await connectDB();
  
  // Try finding by slug first, then ID
  let quiz = await Quiz.findOne({ slug: id }).lean();
  if (!quiz && id.match(/^[0-9a-fA-F]{24}$/)) {
    quiz = await Quiz.findById(id).lean();
  }

  if (!quiz) {
    notFound();
  }

  if (quiz.isPremium) {
    const session = await getServerSession(authOptions);
    if (!session) {
      redirect(`/api/auth/signin?callbackUrl=/quiz/${id}`);
    }
    if (!session.user.isPremium) {
      redirect('/premium');
    }
  }

  // Serialize for Client Component
  const serializableQuiz = JSON.parse(JSON.stringify(quiz));

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-6 font-serif">{quiz.title}</h1>
        <QuizPlayer quiz={serializableQuiz} />
      </div>
    </div>
  );
}
