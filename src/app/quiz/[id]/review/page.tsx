import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { connectDB, Quiz, User, UserProgress } from '@/database';
import { getPremiumSnapshot } from '@/lib/premium-state';
import QuizReviewClient from '@/components/quiz/QuizReviewClient';
import type { QuizReviewQuestion } from '@/lib/quiz-review';

export const metadata: Metadata = {
  title: 'Premium Quiz Overzicht - BijbelQuiz',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ attempt?: string }>;
}

export default async function QuizReviewPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const { id } = await params;
    redirect(`/login?callbackUrl=/quiz/${id}/review`);
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const attemptId = resolvedSearchParams?.attempt;

  if (!attemptId || !attemptId.match(/^[0-9a-fA-F]{24}$/)) {
    notFound();
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .select('isPremium premiumStripe premiumStore storePremiumExpiresAt hasLifetimePremium')
    .lean();

  if (!user) {
    notFound();
  }

  const premium = getPremiumSnapshot(user);
  const hasAccess = premium.isPremium || Boolean((user as any).hasLifetimePremium);

  if (!hasAccess) {
    redirect('/premium');
  }

  const [quiz, attempt] = await Promise.all([
    id.match(/^[0-9a-fA-F]{24}$/)
      ? Quiz.findById(id).select('_id slug title questions status').lean()
      : Quiz.findOne({ slug: id }).select('_id slug title questions status').lean(),
    UserProgress.findOne({ _id: attemptId, userId: session.user.id })
      .select('quizId score totalQuestions xpEarned completedAt answers')
      .lean(),
  ]);

  if (!quiz || !attempt || String(attempt.quizId) !== String(quiz._id)) {
    notFound();
  }

  type StoredAnswer = {
    questionId: string;
    selectedAnswerId: string | null;
    selectedAnswerIndex?: number | null;
    isCorrect: boolean;
  };

  const rawAnswers = Array.isArray(attempt.answers) ? (attempt.answers as StoredAnswer[]) : [];

  const answersByQuestionId = new Map<
    string,
    { selectedAnswerId: string | null; selectedAnswerIndex: number | null; isCorrect: boolean }
  >();

  for (const answer of rawAnswers) {
    answersByQuestionId.set(String(answer.questionId), {
      selectedAnswerId: answer.selectedAnswerId || null,
      selectedAnswerIndex:
        typeof answer.selectedAnswerIndex === 'number' && Number.isFinite(answer.selectedAnswerIndex)
          ? Math.floor(answer.selectedAnswerIndex)
          : null,
      isCorrect: Boolean(answer.isCorrect),
    });
  }

  const reviewQuestions: QuizReviewQuestion[] = (quiz.questions || []).map((question: any, index: number) => {
    const questionId = String(question._id);
    const answerState = answersByQuestionId.get(questionId) ?? rawAnswers[index];

    const choices = Array.isArray(question.answers) ? question.answers : [];

    let selectedAnswer: any = null;
    if (answerState?.selectedAnswerId) {
      selectedAnswer =
        choices.find((answer: any) => String(answer._id) === String(answerState.selectedAnswerId)) || null;
    }
    if (
      !selectedAnswer &&
      typeof answerState?.selectedAnswerIndex === 'number' &&
      choices[answerState.selectedAnswerIndex]
    ) {
      selectedAnswer = choices[answerState.selectedAnswerIndex];
    }

    const correctAnswer = choices.find((answer: any) => Boolean(answer.isCorrect));

    return {
      questionId,
      questionText: question.text || '',
      selectedAnswerText: selectedAnswer?.text ?? null,
      correctAnswerText: correctAnswer?.text || 'Onbekend',
      isCorrect: Boolean(answerState?.isCorrect),
      explanation: question.explanation || '',
      bibleReference: question.bibleReference || '',
    };
  });

  return (
    <QuizReviewClient
      quizIdOrSlug={quiz.slug || String(quiz._id)}
      quizTitle={quiz.title || 'Quiz'}
      score={Number(attempt.score) || 0}
      totalQuestions={Number(attempt.totalQuestions) || reviewQuestions.length}
      xpEarned={Number(attempt.xpEarned) || 0}
      completedAt={attempt.completedAt ? new Date(attempt.completedAt).toISOString() : new Date().toISOString()}
      questions={reviewQuestions}
    />
  );
}
