import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata, ResolvingMetadata } from 'next'; // Added metadata types
import { authOptions } from '@/lib/auth';
import { connectDB, Quiz, ICategory, UserProgress } from '@/database';
import QuizExperience from '@/components/quiz/QuizExperience';
import { resolveQuizPassage } from '@/lib/quiz-passage';
import { normalizeUserSettings } from '@/lib/user-settings';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface IQuestion {
  text: string;
  answers: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
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

  // Playing needs no account. Search visitors land here from the quiz they
  // searched for, and a login form in front of the first question turned most
  // of them into accounts that never played. An account is asked for on the
  // result screen, where there is a score to keep.
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role === 'admin';

  // Status check for non-admins
  // Allow if status is approved OR if status is missing (legacy)
  if (quiz.status && quiz.status !== 'approved' && !isAdmin) {
    notFound();
  }

  // `isPremium` on the quiz is no longer a gate. Two of ninety-five quizzes
  // ever carried it, nobody bought their way past it, and the redirect it
  // caused sent the only readers who wanted those quizzes to a pricing page
  // instead. The field stays on the model so old documents keep loading; it
  // decides nothing.

  // Serialize for Client Component
  const serializableQuiz = JSON.parse(JSON.stringify(quiz));

  const [lastProgressDoc, attempts] = session
    ? await Promise.all([
        UserProgress.findOne({
          userId: session.user.id,
          quizId: quiz._id,
        })
          .select('correctAnswers wrongAnswers totalQuestions completedAt')
          .sort({ completedAt: -1 })
          .lean(),
        UserProgress.countDocuments({
          userId: session.user.id,
          quizId: quiz._id,
        }),
      ])
    : [null, 0];

  // Explanations ship with the quiz, for everybody. They are the reason a quiz
  // teaches anything, they are the text that makes this page worth indexing,
  // and they are where the link to the chapter on BijbelStudie lives.

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

  // Which chapter this quiz is about, derived from the references its questions
  // carry.
  const passage = resolveQuizPassage(serializableQuiz.questions || []);

  const lastResult = lastProgressDoc
    ? {
        correctAnswers: Number(lastProgressDoc.correctAnswers) || 0,
        totalQuestions:
          Number(lastProgressDoc.totalQuestions) || serializableQuiz.questions.length,
        completedAtLabel: new Intl.DateTimeFormat('nl-NL', {
          day: 'numeric',
          month: 'long',
          timeZone: 'Europe/Amsterdam',
        }).format(new Date(lastProgressDoc.completedAt)),
        attempts,
      }
    : null;

  const overview = {
    _id: String(serializableQuiz._id),
    title: serializableQuiz.title,
    description: serializableQuiz.description,
    imageUrl: serializableQuiz.imageUrl,
    difficulty: serializableQuiz.difficulty,
    isPremium: Boolean(serializableQuiz.isPremium),
    rewardXp: serializableQuiz.rewardXp,
    categoryTitle: (quiz.categoryId as ICategory)?.title,
    questionCount: serializableQuiz.questions.length,
  };

  return (
    <div className="bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <QuizExperience
        quiz={serializableQuiz}
        overview={overview}
        passage={passage}
        lastResult={lastResult}
        setupSeen={session ? normalizeUserSettings(session.user.settings).quizSetupSeen : false}
      />
    </div>
  );
}
