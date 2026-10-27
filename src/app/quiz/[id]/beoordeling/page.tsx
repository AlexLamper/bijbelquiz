import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth';
import { connectDB, Quiz, User, UserProgress, type ICategory } from '@/database';
import type { Crumb } from '@/components/bq';
import GuestResult from '@/components/web2/quiz-result/GuestResult';
import ReviewLock from '@/components/web2/quiz-result/ReviewLock';
import {
  AnswerList,
  NextQuizButton,
  ProgressCard,
  ResultActions,
  ResultLayout,
  ScoreCard,
  StudieCard,
} from '@/components/web2/quiz-result/ResultView';
import { dominantPassage } from '@/lib/ecosystem-links';
import { getLevelInfo } from '@/lib/gamification';
import { dominantBookChapter, pickNextQuiz, type NextQuizCandidate } from '@/lib/next-quiz';
import { buildReviewQuestionsFromAttempt, type StoredAttemptAnswer } from '@/lib/quiz-review';
import { calculateNextStreak } from '@/lib/streak';

export const metadata: Metadata = {
  title: 'Quizoverzicht - BijbelQuiz',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ attempt?: string; gast?: string }>;
}

interface StoredQuestion {
  _id: unknown;
  text?: string;
  answers?: Array<{ _id?: unknown; text?: string; isCorrect?: boolean }>;
  explanation?: string;
  bibleReference?: string;
  refBook?: string | null;
  refChapter?: number | null;
}

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function playedOnLabel(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }).format(date);
}

/** The quiz behind "Volgende quiz": next in the series, else the same book, else the same category. */
async function nextQuizHref(
  current: { _id: unknown; title: string; categoryId?: unknown; questions: StoredQuestion[] },
  playedQuizIds: string[],
): Promise<string> {
  const docs = await Quiz.find({ $or: [{ status: 'approved' }, { status: { $exists: false } }] })
    .select('_id slug title categoryId questions.refBook questions.refChapter')
    .lean();

  const toCandidate = (quiz: { _id: unknown; slug?: string; title: string; categoryId?: unknown; questions?: StoredQuestion[] }): NextQuizCandidate => {
    const { book, chapter } = dominantBookChapter(quiz.questions || []);
    const category = quiz.categoryId as { _id?: unknown } | undefined;
    return {
      id: String(quiz._id),
      slug: quiz.slug,
      title: quiz.title,
      categoryId: category ? String(category._id ?? category) : null,
      book,
      chapter,
    };
  };

  const next = pickNextQuiz(toCandidate(current), docs.map((doc) => toCandidate(doc as never)), playedQuizIds);
  return next ? `/quiz/${next.slug || next.id}` : '/quizzen';
}

export default async function QuizBeoordelingPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;

  await connectDB();

  const quiz = await (OBJECT_ID.test(id) ? Quiz.findById(id) : Quiz.findOne({ slug: id }))
    .select('_id slug title questions status categoryId')
    .populate('categoryId', 'title')
    .lean();

  if (!quiz) {
    notFound();
  }

  const quizId = String(quiz._id);
  const quizSlug = quiz.slug || quizId;
  const questions = (quiz.questions || []) as unknown as StoredQuestion[];
  const categoryTitle = (quiz.categoryId as ICategory | undefined)?.title;

  const crumbs: Crumb[] = [
    { label: 'Quizzen', href: '/quizzen' },
    ...(categoryTitle ? [{ label: categoryTitle, href: '/quizzen' }] : []),
    { label: quiz.title, href: `/bijbelquiz/${quizSlug}` },
    { label: 'Resultaat' },
  ];

  const quizPassage = dominantPassage(questions);

  /* ── Guest: the attempt is parked in the browser ─────────────────────── */

  if (!session?.user?.id) {
    const key = Number(query?.gast);
    return (
      <GuestResult
        quizId={quizId}
        quizSlug={quizSlug}
        quizTitle={quiz.title}
        crumbs={crumbs}
        nextQuizHref={await nextQuizHref(quiz as never, [quizId])}
        passage={quizPassage}
        attemptKey={Number.isFinite(key) && key > 0 ? key : null}
      />
    );
  }

  /* ── Signed in: this account's attempt ───────────────────────────────── */

  const userId = session.user.id;
  const attemptId = query?.attempt;
  const attemptSelect = 'quizId score totalQuestions xpEarned completedAt answers';

  const attempt = attemptId
    ? OBJECT_ID.test(attemptId)
      ? await UserProgress.findOne({ _id: attemptId, userId }).select(attemptSelect).lean()
      : null
    : await UserProgress.findOne({ userId, quizId: quiz._id }).sort({ completedAt: -1 }).select(attemptSelect).lean();

  if (!attempt) {
    // No attempt asked for and none played yet: the quiz itself is the place.
    if (!attemptId) redirect(`/quiz/${quizSlug}`);
    notFound();
  }
  if (String(attempt.quizId) !== quizId) {
    notFound();
  }

  const completedAt = attempt.completedAt ? new Date(attempt.completedAt) : new Date();
  const score = Number(attempt.score) || 0;
  const total = Number(attempt.totalQuestions) || questions.length;

  const [earlier, user, playedQuizIds] = await Promise.all([
    UserProgress.find({ userId, quizId: quiz._id, completedAt: { $lt: completedAt } }).select('score').lean(),
    User.findById(userId).select('name xp streak lastPlayedAt').lean(),
    UserProgress.distinct('quizId', { userId }) as Promise<unknown[]>,
  ]);

  const isNewBest = earlier.length > 0 && score > Math.max(...earlier.map((entry) => Number(entry.score) || 0));

  // Reviewing answers is Premium: a free player's page carries the score and
  // nothing about the individual questions.
  const hasPremium = Boolean(session.user.isPremium) || session.user.role === 'admin';
  const review = hasPremium
    ? buildReviewQuestionsFromAttempt(questions, attempt.answers as StoredAttemptAnswer[] | undefined)
    : null;

  // The chapter to read: for a Premium player the one most mistakes came from.
  const wrongPassage = review
    ? dominantPassage(questions.filter((_, index) => review[index] && !review[index].isCorrect)) ?? quizPassage
    : quizPassage;

  const xp = Number(user?.xp) || 0;
  const level = getLevelInfo(xp);
  const levelSpan = Math.max(1, level.nextLevelXp - level.minXp);

  // The reeks as it stands now: played today keeps it until tomorrow, played
  // yesterday needs a quiz today, older means it is gone.
  let streak: { days: number; hint: string } | null = null;
  const streakDays = Number(user?.streak) || 0;
  if (user?.lastPlayedAt && streakDays > 0) {
    const next = calculateNextStreak(new Date(user.lastPlayedAt), streakDays).nextStreak;
    if (next === streakDays) streak = { days: streakDays, hint: 'Speel morgen om je reeks te houden' };
    else if (next === streakDays + 1) streak = { days: streakDays, hint: 'Speel vandaag om je reeks te houden' };
  }

  const firstName = (user?.name || session.user.name || '').trim().split(/\s+/)[0] || null;

  // The BijbelStudie handover is the "Lees ... met uitleg" card in the side
  // column (the old pop-up over the result is gone in the 2.0 design).
  return (
    <ResultLayout
      crumbs={crumbs}
      main={
        <>
          <ScoreCard
            score={score}
            total={total}
            quizTitle={quiz.title}
            firstName={firstName}
            isNewBest={isNewBest}
            playedOnLabel={playedOnLabel(completedAt)}
            canReview={Boolean(review)}
          />
          <NextQuizButton href={await nextQuizHref(quiz as never, playedQuizIds.map(String))} />
          {review ? (
            <AnswerList questions={review} score={score} total={total} quizSlug={quizSlug} />
          ) : (
            <ReviewLock score={score} total={total} quizSlug={quizSlug} guest={false} />
          )}
        </>
      }
      aside={
        <>
          <ProgressCard
            xpEarned={Number(attempt.xpEarned) || 0}
            xpToNext={level.isMaxLevel ? null : Math.max(0, level.nextLevelXp - xp)}
            nextLevel={level.isMaxLevel ? null : level.level + 1}
            levelProgress={(xp - level.minXp) / levelSpan}
            streak={streak}
          />
          <ResultActions replayHref={`/quiz/${quizSlug}`} duelHref="/duels" />
          <StudieCard passage={wrongPassage} quizSlug={quizSlug} hadWrongAnswers={score < total} />
        </>
      }
    />
  );
}
