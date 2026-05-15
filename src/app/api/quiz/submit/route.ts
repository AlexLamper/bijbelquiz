import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, UserProgress, User, Quiz } from '@/database';
import { getLevelInfo, BADGES } from '@/lib/gamification';
import { calculateNextStreak } from '@/lib/streak';
import { calculateAttemptXp, getHighestEarnedAttemptXp } from '@/lib/xp';

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { quizId, score, totalQuestions, answers } = await req.json();

    if (!quizId || typeof score !== 'number' || typeof totalQuestions !== 'number') {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    if (!Number.isFinite(score) || !Number.isFinite(totalQuestions) || score < 0 || totalQuestions <= 0) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    await connectDB();

    const [quiz, previousAttempts, user] = await Promise.all([
      Quiz.findById(quizId).select('_id rewardXp questions').lean(),
      UserProgress.find({ userId: session.user.id, quizId }).select('score totalQuestions').lean(),
      User.findById(session.user.id).select('_id xp streak bestStreak badges lastPlayedAt').lean(),
    ]);

    if (!quiz) {
      return new NextResponse('Quiz not found', { status: 404 });
    }

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const questionList = Array.isArray(quiz.questions) ? quiz.questions : [];

    const normalizedTotalQuestions = Math.max(1, Math.floor(totalQuestions || questionList.length || 1));
    const validatedAnswers = questionList.map((question: any, index: number) => {
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

      let selectedAnswer: any = null;
      if (selectedAnswerId) {
        selectedAnswer =
          answerChoices.find((answer: any) => String(answer._id) === selectedAnswerId) || null;
      }
      if (!selectedAnswer && selectedAnswerIndex !== null && answerChoices[selectedAnswerIndex]) {
        selectedAnswer = answerChoices[selectedAnswerIndex];
        if (selectedAnswer?._id != null) {
          selectedAnswerId = String(selectedAnswer._id);
        }
      }

      const isCorrect = Boolean(selectedAnswer?.isCorrect);
      const persistedAnswerIndex =
        selectedAnswer && answerChoices.length > 0 ? answerChoices.indexOf(selectedAnswer) : selectedAnswerIndex;

      return {
        questionId,
        selectedAnswerId,
        selectedAnswerIndex:
          typeof persistedAnswerIndex === 'number' && persistedAnswerIndex >= 0 ? persistedAnswerIndex : null,
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

    const attempt = await UserProgress.create({
      userId: session.user.id,
      quizId,
      score: normalizedScore,
      totalQuestions: normalizedTotalQuestions,
      xpEarned,
      answers: validatedAnswers,
      correctAnswers: normalizedScore,
      wrongAnswers: Math.max(0, normalizedTotalQuestions - normalizedScore),
    });

    const now = new Date();
    const previous = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;
    const { nextStreak } = calculateNextStreak(previous, user.streak || 0, now);

    const bestStreak = Math.max(user.bestStreak || 0, nextStreak);

    // Recalculate metrics based on all user progress
    const allProgress = await UserProgress.find({ userId: session.user.id }).select('quizId score totalQuestions').lean();
    const totalQuizzes = allProgress.length;
    let totalScoreSum = 0;
    let totalQuestionSum = 0;
    
    // Create uniquely solved quiz array to check diverse categories or perfect scores
    const uniqueQuizzes = Array.from(new Set(allProgress.map(p => p.quizId.toString())));
    
    allProgress.forEach(p => {
      totalScoreSum += p.score;
      totalQuestionSum += p.totalQuestions || 1;
    });

    const averageScore = totalQuestionSum > 0 ? Math.round((totalScoreSum / totalQuestionSum) * 100) : 0;
    const newXp = (user.xp || 0) + xpEarned;
    const levelInfo = getLevelInfo(newXp);

    // Evaluate badges
    const currentBadges = new Set(user.badges || []);
    if (totalQuizzes >= 1) currentBadges.add('first_steps');
    if (uniqueQuizzes.length >= 10) currentBadges.add('knowledge_seeker');
    if (percentage === 1) currentBadges.add('perfect_score');
    if (nextStreak >= 3) currentBadges.add('streak_3');
    if (nextStreak >= 7) currentBadges.add('streak_7');
    if (levelInfo.level >= 5) currentBadges.add('scholar');
    if (levelInfo.level >= 10) currentBadges.add('master');
    // For "all_rounder" badge (assuming you check against category count, simplified here to check if they have done 3 categories, but realistically you would query populated categories)
    // We will add it safely if they played a solid chunk of quizzes
    if (uniqueQuizzes.length > 20) currentBadges.add('all_rounder'); 

    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        xp: newXp,
        level: levelInfo.level,
        levelTitle: levelInfo.title,
        lastPlayedAt: now,
        streak: nextStreak,
        bestStreak: bestStreak,
        quizzesPlayed: totalQuizzes,
        averageScore: averageScore,
        badges: Array.from(currentBadges),
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: String(attempt._id),
      xpEarned,
      farmPrevented: previousAttempts.length > 0 && xpEarned === 0,
      message: 'Quiz submitted successfully',
    });
  } catch (error) {
    console.error("[Quiz Submit] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
