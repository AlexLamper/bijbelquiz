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
    title: `${quiz.title} - ${categoryTitle} Quiz | BijbelQuiz`,
    description: quiz.description || `Test je kennis over ${quiz.title}. Een interactieve ${categoryTitle} quiz met vragen over de Bijbel. Gratis spelen op BijbelQuiz.com.`,
    keywords: [`${quiz.title} quiz`, `${categoryTitle} quiz`, 'bijbelquiz', 'online quiz', 'christelijke kennis', 'bijbelstudie'],
    openGraph: {
      title: `${quiz.title} | De Ultieme Bijbelquiz`,
      description: quiz.description || `Doe de ${quiz.title} quiz en zie direct je score!`,
      type: 'website',
      url: `https://www.bijbelquiz.com/quiz/${quiz.slug || quiz._id}`,
      images: previousImages,
      siteName: 'BijbelQuiz',
    },
    twitter: {
      card: 'summary_large_image',
      title: quiz.title,
      description: quiz.description || `Speel de ${quiz.title} quiz nu op BijbelQuiz.com`,
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
    <div className="fixed inset-0 top-16 flex flex-col overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-2 h-full flex flex-col overflow-hidden">
        {/* Server-side rendered content for SEO */}
        <div className="text-center mb-2 md:mb-4 mt-2 md:mt-6 shrink-0">
          <h1 className="text-lg md:text-2xl font-bold mb-0.5 font-serif text-slate-900 truncate">{quiz.title}</h1>
          <p className="text-slate-600 mb-1 text-[10px] md:text-xs line-clamp-1">{quiz.description}</p>
          
          {!session && (
            <div className="inline-block bg-amber-50 border border-amber-200 rounded-lg px-3 py-0.5 text-[10px] text-amber-800">
              💡<strong>Tip:</strong> <Link href="/api/auth/signin" className="underline hover:text-amber-900">Log in</Link> voor scores.
            </div>
          )}
        </div>
        
        <div className="flex-1 min-h-0 w-full flex flex-col pb-4 md:pb-8">
          <QuizPlayer quiz={serializableQuiz} />
        </div>
      </div>
    </div>
  );
}
