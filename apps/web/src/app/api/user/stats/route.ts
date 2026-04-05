import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, User, UserProgress } from '@bijbelquiz/database';
import { getLevelInfo } from '@/lib/gamification';

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();

    const [user, progressData] = await Promise.all([
      User.findById(session.user.id).select('xp streak badges').lean(),
      UserProgress.find({ userId: session.user.id }).select('score totalQuestions').lean(),
    ]);

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Gamification level helper
    const levelInfo = getLevelInfo(user.xp || 0);

    // Calculate stats
    const totalQuizzes = progressData.length;
    const totalScore = progressData.reduce((sum, p) => sum + p.score, 0);
    const totalQuestions = progressData.reduce((sum, p) => sum + p.totalQuestions, 0);
    const avgScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

    return NextResponse.json({
      xp: user.xp,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      levelProgress: levelInfo.progressPercentage,
      nextLevelXp: levelInfo.nextLevelXp,
      streak: user.streak || 0,
      totalQuizzes,
      avgScore,
      badges: user.badges || [],
    });
  } catch (error) {
    console.error('[USER_STATS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
