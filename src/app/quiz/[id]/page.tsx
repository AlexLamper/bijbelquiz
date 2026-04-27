import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata, ResolvingMetadata } from 'next'; // Added metadata types
import { authOptions } from '@/lib/auth';
import { connectDB, Quiz, ICategory } from '@/database';
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

  if (!session) {
    redirect(`/login?callbackUrl=/quiz/${id}`);
  }

  // Status check for non-admins
  // Allow if status is approved OR if status is missing (legacy)
  if (quiz.status && quiz.status !== 'approved') {
    if (!session || session.user.role !== 'admin') {
       notFound();
    }
  }

  if (quiz.isPremium) {
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
    <div className="-mt-24 min-h-screen bg-background pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <QuizPlayer quiz={serializableQuiz} />
    </div>
  );
}
