import { connectDB, UserProgress, User, Quiz } from '@/database';
import { getLevelInfo } from '@/lib/gamification';
import { calculateNextStreak } from '@/lib/streak';
import { calculateAttemptXp, getHighestEarnedAttemptXp } from '@/lib/xp';
import { recordServerEvent } from '@/lib/analytics/record';
import type { AnalyticsPlatform } from '@/lib/analytics/events';

/**
 * The one place a quiz attempt turns into XP, a streak, and badges.
 *
 * Web and mobile both write through here, so a player's numbers cannot drift
 * between the two clients: answers are re-graded server-side against the stored
 * quiz, never trusted from the request.
 */

/** Shape of the embedded documents as they come back from Mongoose `.lean()`. */
interface StoredAnswerChoice {
  _id?: unknown;
  isCorrect?: boolean;
}

interface StoredQuestion {
  _id: unknown;
  answers?: StoredAnswerChoice[];
}

export interface SubmittedAnswer {
  selectedAnswerId?: string | null;
  selectedAnswerIndex?: number | null;
}

export interface QuizSubmissionInput {
  userId: string;
  quizId: string;
  /** Client-reported correct count. Only used when no answers[] is supplied. */
  score: number;
  totalQuestions: number;
  answers?: SubmittedAnswer[] | null;
  /** Which client wrote this attempt. Recorded on the funnel event. */
  platform?: AnalyticsPlatform;
  /**
   * The attempt was played without an account and is being written now that
   * one exists. Recorded on the funnel event only: how many visitors' scores
   * turn into accounts is the number the "play first, sign in later" flow is
   * judged on.
   */
  claimed?: boolean;
}

export type QuizSubmissionResult =
  | { ok: false; reason: 'invalid'; message: string }
  | { ok: false; reason: 'quiz_not_found' }
  | { ok: false; reason: 'user_not_found' }
  | {
      ok: true;
      attemptId: string;
      xpEarned: number;
      /** A replay that scored no better than before earns nothing. */
      farmPrevented: boolean;
      score: number;
      totalQuestions: number;
      xp: number;
      level: number;
      levelTitle: string;
      levelProgress: number;
      nextLevelXp: number;
      streak: number;
      bestStreak: number;
      badges: string[];
      /** Badges unlocked by this very attempt, so a client can celebrate them. */
      newBadges: string[];
      quizzesPlayed: number;
      averageScore: number;
    };

export async function submitQuizAttempt(
  input: QuizSubmissionInput
): Promise<QuizSubmissionResult> {
  const { userId, quizId, score, totalQuestions, answers, platform, claimed } = input;

  if (!quizId || typeof score !== 'number' || typeof totalQuestions !== 'number') {
    return { ok: false, reason: 'invalid', message: 'Invalid request data' };
  }

  if (
    !Number.isFinite(score) ||
    !Number.isFinite(totalQuestions) ||
    score < 0 ||
    totalQuestions <= 0
  ) {
    return { ok: false, reason: 'invalid', message: 'Invalid request data' };
  }

  await connectDB();

  const [quiz, previousAttempts, user] = await Promise.all([
    Quiz.findById(quizId).select('_id rewardXp questions').lean(),
    UserProgress.find({ userId, quizId }).select('score totalQuestions').lean(),
    User.findById(userId)
      .select('_id xp streak bestStreak badges lastPlayedAt isPremium')
      .lean(),
  ]);

  if (!quiz) return { ok: false, reason: 'quiz_not_found' };
  if (!user) return { ok: false, reason: 'user_not_found' };

  const questionList: StoredQuestion[] = Array.isArray(quiz.questions)
    ? (quiz.questions as unknown as StoredQuestion[])
    : [];

  const normalizedTotalQuestions = Math.max(
    1,
    Math.floor(totalQuestions || questionList.length || 1)
  );

  const validatedAnswers = questionList.map((question, index) => {
    const questionId = String(question._id);
    const item = Array.isArray(answers) ? answers[index] : undefined;

    let selectedAnswerId: string | null = null;
    let selectedAnswerIndex: number | null = null;

    if (item && typeof item === 'object') {
      if (typeof item.selectedAnswerId === 'string' && item.selectedAnswerId.trim()) {
        selectedAnswerId = String(item.selectedAnswerId);
      }
      if (typeof item.selectedAnswerIndex === 'number' && Number.isFinite(item.selectedAnswerIndex)) {
        selectedAnswerIndex = Math.floor(item.selectedAnswerIndex);
      }
    }

    const answerChoices = Array.isArray(question.answers) ? question.answers : [];

    let selectedAnswer: StoredAnswerChoice | null = null;
    if (selectedAnswerId) {
      selectedAnswer =
        answerChoices.find((answer) => String(answer._id) === selectedAnswerId) || null;
    }
    if (!selectedAnswer && selectedAnswerIndex !== null && answerChoices[selectedAnswerIndex]) {
      selectedAnswer = answerChoices[selectedAnswerIndex];
      if (selectedAnswer?._id != null) {
        selectedAnswerId = String(selectedAnswer._id);
      }
    }

    const isCorrect = Boolean(selectedAnswer?.isCorrect);
    const persistedAnswerIndex =
      selectedAnswer && answerChoices.length > 0
        ? answerChoices.indexOf(selectedAnswer)
        : selectedAnswerIndex;

    return {
      questionId,
      selectedAnswerId,
      selectedAnswerIndex:
        typeof persistedAnswerIndex === 'number' && persistedAnswerIndex >= 0
          ? persistedAnswerIndex
          : null,
      isCorrect,
    };
  });

  const derivedCorrectAnswers = validatedAnswers.filter((answer) => answer.isCorrect).length;
  const fallbackScore = Math.max(0, Math.min(score, normalizedTotalQuestions));
  const hasStructuredAnswers = Array.isArray(answers) && answers.length > 0;
  const normalizedScore = hasStructuredAnswers ? derivedCorrectAnswers : fallbackScore;
  const percentage = Math.max(0, Math.min(1, normalizedScore / normalizedTotalQuestions));
  const baseRewardXp = typeof quiz.rewardXp === 'number' ? quiz.rewardXp : 50;
  const calculatedXp = calculateAttemptXp(baseRewardXp, normalizedScore, normalizedTotalQuestions);
  const previousBestXp = getHighestEarnedAttemptXp(baseRewardXp, previousAttempts);
  const xpEarned = Math.max(0, calculatedXp - previousBestXp);

  // Mongoose casts the id strings at runtime; the generated typings insist on
  // ObjectId, so the payload is handed over untyped.
  const attemptPayload: Record<string, unknown> = {
    userId,
    quizId,
    score: normalizedScore,
    totalQuestions: normalizedTotalQuestions,
    xpEarned,
    answers: validatedAnswers,
    correctAnswers: normalizedScore,
    wrongAnswers: Math.max(0, normalizedTotalQuestions - normalizedScore),
  };
  const attempt = await UserProgress.create(attemptPayload);

  const now = new Date();
  const previous = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;
  const { nextStreak } = calculateNextStreak(previous, user.streak || 0, now);
  const bestStreak = Math.max(user.bestStreak || 0, nextStreak);

  // Recalculate metrics across every attempt, so the denormalized counters on
  // the user document stay true no matter which client wrote the attempt.
  const allProgress = await UserProgress.find({ userId })
    .select('quizId score totalQuestions')
    .lean();
  const totalQuizzes = allProgress.length;
  const uniqueQuizzes = Array.from(new Set(allProgress.map((p) => p.quizId.toString())));

  let totalScoreSum = 0;
  let totalQuestionSum = 0;
  allProgress.forEach((p) => {
    totalScoreSum += p.score;
    totalQuestionSum += p.totalQuestions || 1;
  });

  const averageScore =
    totalQuestionSum > 0 ? Math.round((totalScoreSum / totalQuestionSum) * 100) : 0;
  const newXp = (user.xp || 0) + xpEarned;
  const levelInfo = getLevelInfo(newXp);

  const previousBadges = new Set<string>(user.badges || []);
  const currentBadges = new Set<string>(previousBadges);
  if (totalQuizzes >= 1) currentBadges.add('first_steps');
  if (uniqueQuizzes.length >= 10) currentBadges.add('knowledge_seeker');
  if (percentage === 1) currentBadges.add('perfect_score');
  if (nextStreak >= 3) currentBadges.add('streak_3');
  if (nextStreak >= 7) currentBadges.add('streak_7');
  if (levelInfo.level >= 5) currentBadges.add('scholar');
  if (levelInfo.level >= 10) currentBadges.add('master');
  // Stands in for "a quiz in every category" until categories are tracked here.
  if (uniqueQuizzes.length > 20) currentBadges.add('all_rounder');

  const badges = Array.from(currentBadges);
  const newBadges = badges.filter((badge) => !previousBadges.has(badge));

  await User.findByIdAndUpdate(userId, {
    $set: {
      xp: newXp,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      lastPlayedAt: now,
      streak: nextStreak,
      bestStreak,
      quizzesPlayed: totalQuizzes,
      averageScore,
      badges,
    },
  });

  // Fired here rather than from the clients: this is the only place that knows
  // whether it was the player's first ever attempt, and it fires identically
  // for the website and the app.
  await recordServerEvent('quiz_completed', {
    userId,
    platform,
    props: {
      quizId: String(quizId),
      score: normalizedScore,
      totalQuestions: normalizedTotalQuestions,
      xpEarned,
      isFirst: totalQuizzes === 1,
      isReplay: previousAttempts.length > 0,
      claimed: Boolean(claimed),
    },
  });

  // A streak that was worth something and reset to 1 is the loss-aversion
  // signal the retention work is aimed at, so it is worth its own event.
  const previousStreak = user.streak || 0;
  if (previousStreak >= 2 && nextStreak === 1) {
    await recordServerEvent('streak_broken', {
      userId,
      platform,
      props: { streakLength: previousStreak, wasPremium: Boolean(user.isPremium) },
    });
  }

  return {
    ok: true,
    attemptId: String(attempt._id),
    xpEarned,
    farmPrevented: previousAttempts.length > 0 && xpEarned === 0,
    score: normalizedScore,
    totalQuestions: normalizedTotalQuestions,
    xp: newXp,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    levelProgress: levelInfo.progressPercentage,
    nextLevelXp: levelInfo.nextLevelXp,
    streak: nextStreak,
    bestStreak,
    badges,
    newBadges,
    quizzesPlayed: totalQuizzes,
    averageScore,
  };
}
