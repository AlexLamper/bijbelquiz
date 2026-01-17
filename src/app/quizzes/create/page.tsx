import connectDB from '@/lib/db';
import Category from '@/models/Category';
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

  // Check for admin role
  if (session.user.role !== 'admin') {
    redirect('/');
  }

  await connectDB();
  const categories = await Category.find({ isActive: true }).lean();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground">Nieuwe Quiz Toevoegen</h1>
            <p className="text-muted-foreground">Beheer de content van het platform. Nieuwe quizzen zijn direct zichtbaar.</p>
        </div>
        
        <QuizCreatorForm categories={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
