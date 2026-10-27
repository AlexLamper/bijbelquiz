import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata, ResolvingMetadata } from 'next';
import { authOptions } from '@/lib/auth';
import { connectDB, Quiz, ICategory, UserProgress } from '@/database';
import QuizPlay from '@/components/web2/quiz-play/QuizPlay';
import type { PlayQuiz, PlayQuestion } from '@/components/web2/quiz-play/types';
import { resolveQuizPassage } from '@/lib/quiz-passage';
import { normalizeUserSettings } from '@/lib/user-settings';
import { canPlayQuiz, lockedPaywallHref } from '@/lib/free-quiz-limit';
import { getFreeQuizAllowanceForUser } from '@/lib/free-quiz-limit-server';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface IQuestion {
  _id: unknown;
  text: string;
  answers: Array<{
    _id: unknown;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
  bibleReference?: string;
  refBook?: string | null;
  refChapter?: number | null;
}

async function findQuiz(id: string) {
  await connectDB();
  let quiz = await Quiz.findOne({ slug: id }).populate('categoryId').lean();
  if (!quiz && id.match(/^[0-9a-fA-F]{24}$/)) {
    quiz = await Quiz.findById(id).populate('categoryId').lean();
  }
  return quiz;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const quiz = await findQuiz(id);

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
  const quiz = await findQuiz(id);

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

  const quizId = String(quiz._id);
  const quizSlug = quiz.slug || quizId;

  // The free tier: three different quizzes, replays stay free, Premium is
  // unlimited (src/lib/free-quiz-limit.ts). Signed-in players are checked
  // here; guests in the browser, against the attempts parked there. The
  // submit route checks again, so this cannot be skipped by posting directly.
  if (session?.user?.id) {
    const allowance = await getFreeQuizAllowanceForUser({
      id: session.user.id,
      isPremium: session.user.isPremium,
      role: session.user.role,
    });
    if (!canPlayQuiz(allowance, quizId, quiz.slug)) {
      redirect(lockedPaywallHref(quizSlug));
    }
  }

  // `isPremium` on the quiz is no longer a gate (two of ninety-five quizzes
  // ever carried it). The field stays on the model so old documents keep
  // loading; it decides nothing.

  // Explanations are Premium. A free player sees that there is one (blurred,
  // with a Premium button) but the text itself never leaves the server, so it
  // cannot be read in the page source or the RSC payload either.
  const hasPremium = Boolean(session?.user?.isPremium) || isAdmin;

  const rawQuestions = (quiz.questions || []) as unknown as IQuestion[];
  const questions: PlayQuestion[] = rawQuestions.map((question) => {
    const explanation = (question.explanation || '').trim();
    return {
      _id: String(question._id),
      text: question.text,
      answers: (question.answers || []).map((answer) => ({
        _id: String(answer._id),
        text: answer.text,
        isCorrect: Boolean(answer.isCorrect),
      })),
      hasExplanation: explanation.length > 0,
      explanation: hasPremium ? explanation : '',
      bibleReference: question.bibleReference || '',
      refBook: question.refBook ?? null,
      refChapter: question.refChapter ?? null,
    };
  });

  if (questions.length === 0) {
    notFound();
  }

  const attempts = session?.user?.id
    ? await UserProgress.countDocuments({ userId: session.user.id, quizId: quiz._id })
    : 0;

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
    "hasPart": rawQuestions.map((q) => ({
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
  // carry - for the "lees eerst" reader.
  const passage = resolveQuizPassage(questions);

  const playQuiz: PlayQuiz = {
    _id: quizId,
    slug: quizSlug,
    title: quiz.title,
    rewardXp: typeof quiz.rewardXp === 'number' ? quiz.rewardXp : 50,
    difficulty: quiz.difficulty,
    categoryTitle: (quiz.categoryId as ICategory)?.title ?? null,
    isPremium: Boolean(quiz.isPremium),
    questions,
  };

  const settings = normalizeUserSettings(session?.user?.settings);

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <QuizPlay
        quiz={playQuiz}
        passage={passage}
        viewer={{
          isLoggedIn: Boolean(session?.user?.id),
          hasPremium,
        }}
        isReplay={attempts > 0}
        readPassageFirst={Boolean(session?.user?.id) && settings.readPassageFirst}
      />
    </div>
  );
}
