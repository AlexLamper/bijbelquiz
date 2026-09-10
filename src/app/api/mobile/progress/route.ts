import { NextResponse } from 'next/server';

import { getMobileUserId } from '@/lib/mobile-auth';
import { submitQuizAttempt, type SubmittedAnswer } from '@/lib/quiz-submission';

/**
 * POST /api/mobile/progress - the mobile counterpart of `/api/quiz/submit`.
 *
 * Both run the same `submitQuizAttempt`, so XP, streak, and badges come out
 * identical no matter which client the player used. The app may send either a
 * full `answers[]` (which is re-graded here) or just a correct count.
 */
export async function POST(req: Request) {
  const userId = getMobileUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const quizId = String(body?.quizId || '');
    const totalQuestions = Number(body?.totalQuestions);
    // Older builds send `correctAnswers`; newer ones send `score`.
    const score = Number(
      body?.correctAnswers ?? body?.score ?? Number.NaN
    );

    const answers: SubmittedAnswer[] | null = Array.isArray(body?.answers)
      ? (body.answers as unknown[]).map((entry) => {
          const answer = (entry ?? {}) as Record<string, unknown>;
          const id = answer.selectedAnswerId ?? answer.answerId;
          const index = answer.selectedAnswerIndex ?? answer.answerIndex;

          return {
            selectedAnswerId: typeof id === 'string' ? id : null,
            selectedAnswerIndex: typeof index === 'number' ? index : null,
          };
        })
      : null;

    const result = await submitQuizAttempt({
      userId,
      quizId,
      score,
      totalQuestions,
      answers,
      // The app posts its own platform so the funnel can tell an iOS attempt
      // from an Android one without guessing from the user agent.
      platform: body?.platform === 'android' ? 'android' : 'ios',
      // Played before signing in, kept on the device, written now.
      claimed: body?.claimed === true,
    });

    if (!result.ok) {
      if (result.reason === 'invalid') {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      if (result.reason === 'quiz_not_found') {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        attemptId: result.attemptId,
        xpEarned: result.xpEarned,
        farmPrevented: result.farmPrevented,
        score: result.score,
        totalQuestions: result.totalQuestions,
        // The refreshed profile, so the app does not need a second round trip.
        xp: result.xp,
        level: result.level,
        levelTitle: result.levelTitle,
        levelProgress: result.levelProgress,
        nextLevelXp: result.nextLevelXp,
        streak: result.streak,
        bestStreak: result.bestStreak,
        badges: result.badges,
        newBadges: result.newBadges,
        quizzesPlayed: result.quizzesPlayed,
        averageScore: result.averageScore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mobile API - Progress Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
