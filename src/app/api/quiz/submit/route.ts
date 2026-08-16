import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { submitQuizAttempt } from '@/lib/quiz-submission';

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { quizId, score, totalQuestions, answers } = await req.json();

    const result = await submitQuizAttempt({
      userId: session.user.id,
      quizId,
      score,
      totalQuestions,
      answers,
      platform: 'web',
    });

    if (!result.ok) {
      if (result.reason === 'invalid') {
        return new NextResponse(result.message, { status: 400 });
      }
      if (result.reason === 'quiz_not_found') {
        return new NextResponse('Quiz not found', { status: 404 });
      }
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      success: true,
      attemptId: result.attemptId,
      xpEarned: result.xpEarned,
      farmPrevented: result.farmPrevented,
      message: 'Quiz submitted successfully',
    });
  } catch (error) {
    console.error("[Quiz Submit] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
