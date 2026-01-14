import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata, ResolvingMetadata } from 'next'; // Added metadata types
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

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  await connectDB();

  let quiz = await Quiz.findOne({ slug: id }).populate('categoryId').lean();
  if (!quiz && id.match(/^[0-9a-fA-F]{24}$/)) {
    quiz = await Quiz.findById(id).populate('categoryId').lean();
  }

  if (!quiz) {
    return {
      title: 'Quiz niet gevonden',
    };
  }

  const categoryTitle = (quiz.categoryId as ICategory)?.title || 'Bijbel';
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: quiz.title,
    description: quiz.description || `Test je kennis over ${quiz.title}. Een interactieve ${categoryTitle} quiz op BijbelQuiz.com.`,
    openGraph: {
      title: `${quiz.title} | BijbelQuiz`,
      description: quiz.description || `Doe de ${quiz.title} quiz!`,
      type: 'website', // or 'article' could fit
      images: previousImages,
    },
    alternates: {
      canonical: `/quiz/${quiz.slug || quiz._id}`,
    },
  };
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

  const session = await getServerSession(authOptions);

  if (quiz.isPremium) {
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
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-4 max-w-4xl h-full flex flex-col">
        {/* Server-side rendered content for SEO */}
        <div className="max-w-3xl mx-auto text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 font-serif text-slate-900">{quiz.title}</h1>
          <p className="text-slate-600 mb-4 text-sm">{quiz.description}</p>
          
          {!session && (
            <div className="inline-block bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 mb-4">
              💡<strong>Tip:</strong> <Link href="/api/auth/signin" className="underline hover:text-amber-900">Log in</Link> om je scores bij te houden en je voortgang te zien.
            </div>
          )}
        </div>
        
        <QuizPlayer quiz={serializableQuiz} />
      </div>
    </div>
  );
}
