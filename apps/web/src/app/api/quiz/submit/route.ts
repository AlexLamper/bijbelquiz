import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, UserProgress, User, Quiz } from '@bijbelquiz/database';

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { quizId, score, totalQuestions } = await req.json();

    if (!quizId || typeof score !== 'number' || typeof totalQuestions !== 'number') {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    await connectDB();

    const [quiz, existingCompletion, user] = await Promise.all([
      Quiz.findById(quizId).select('_id rewardXp questions').lean(),
      UserProgress.findOne({ userId: session.user.id, quizId }).select('_id').lean(),
      User.findById(session.user.id).select('_id xp streak lastPlayedAt').lean(),
    ]);

    if (!quiz) {
      return new NextResponse('Quiz not found', { status: 404 });
    }

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const normalizedTotalQuestions = totalQuestions || quiz.questions?.length || 1;
    const percentage = Math.max(0, Math.min(1, score / normalizedTotalQuestions));
    const baseRewardXp = typeof quiz.rewardXp === 'number' ? quiz.rewardXp : 50;
    const calculatedXp = Math.round(baseRewardXp * percentage);
    const xpEarned = existingCompletion ? 0 : calculatedXp;

    await UserProgress.create({
      userId: session.user.id,
      quizId,
      score,
      totalQuestions: normalizedTotalQuestions,
      xpEarned,
    });

    if (xpEarned > 0) {
      const now = new Date();
      const previous = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;

      let nextStreak = 1;
      if (previous) {
        const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const startOfPrevious = Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth(), previous.getUTCDate());
        const diffDays = Math.floor((startOfToday - startOfPrevious) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          nextStreak = user.streak || 1;
        } else if (diffDays === 1) {
          nextStreak = (user.streak || 0) + 1;
        }
      }

      await User.findByIdAndUpdate(session.user.id, {
        $inc: { xp: xpEarned },
        $set: {
          lastPlayedAt: now,
          streak: nextStreak,
        },
      });
    }

    return NextResponse.json({
      success: true,
      xpEarned,
      farmPrevented: !!existingCompletion,
    });
  } catch (error) {
    console.error("[Quiz Submit] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
