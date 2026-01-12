import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import { ICategory } from '@/models/Category';
import QuizPlayer from '@/components/QuizPlayer';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface IQuestion {
  text: string;
  answers: Array<{
    text: string;
    isCorrect: boolean;
  }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { id } = await params;
  await connectDB();
  
  // Try finding by slug first, then ID
  let quiz = await Quiz.findOne({ slug: id }).populate('categoryId').lean();
  if (!quiz && id.match(/^[0-9a-fA-F]{24}$/)) {
    quiz = await Quiz.findById(id).populate('categoryId').lean();
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

  // JSON-LD for Quiz
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": quiz.title,
    "description": quiz.description || `Test je kennis over ${quiz.title} in deze interactieve bijbelquiz.`,
    "about": {
      "@type": "Thing",
      "name": (quiz.categoryId as ICategory)?.title || "Bijbel"
    },
    "educationalLevel": quiz.difficulty || "beginner",
    "learningResourceType": "Assessment",
    "hasPart": quiz.questions.map((q: IQuestion) => ({
      "@type": "Question",
      "name": q.text,
      "suggestedAnswer": q.answers.map((a) => ({
        "@type": "Answer",
        "text": a.text,
        "position": a.isCorrect ? 0 : 1 // Not perfect mapping but indicates distinction
      }))
    }))
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-6 font-serif">{quiz.title}</h1>
        <QuizPlayer quiz={serializableQuiz} />
      </div>
    </div>
  );
}
