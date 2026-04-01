import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, User, UserProgress } from '@bijbelquiz/database';

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();

    const [user, progressData] = await Promise.all([
      User.findById(session.user.id).select('xp streak').lean(),
      UserProgress.find({ userId: session.user.id }).select('score totalQuestions').lean(),
    ]);

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Calculate level based on XP (each level requires 500 more XP than the previous)
    const xpThresholds = [0, 500, 1200, 2100, 3200, 4500, 6000, 7700, 9600, 11700];
    let level = 1;
    let nextLevelXp = 500;

    for (let i = 1; i < xpThresholds.length; i++) {
      if (user.xp >= xpThresholds[i]) {
        level = i + 1;
        nextLevelXp = xpThresholds[i + 1] || xpThresholds[i] + 2100;
      } else {
        nextLevelXp = xpThresholds[i];
        break;
      }
    }

    const currentLevelXp = xpThresholds[level - 1] || 0;
    const levelProgress = Math.round(
      ((user.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    );

    // Level titles
    const levelTitles: { [key: number]: string } = {
      1: 'Nieuweling',
      2: 'Scholier',
      3: 'Student',
      4: 'Meester',
      5: 'Gids',
      6: 'Leraar',
      7: 'Professor',
      8: 'Wijze',
      9: 'Geleerde',
      10: 'Deskundige',
    };

    // Calculate stats
    const totalQuizzes = progressData.length;
    const totalScore = progressData.reduce((sum, p) => sum + p.score, 0);
    const totalQuestions = progressData.reduce((sum, p) => sum + p.totalQuestions, 0);
    const avgScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

    return NextResponse.json({
      xp: user.xp,
      level,
      levelTitle: levelTitles[level] || 'Deskundige',
      levelProgress: Math.max(0, Math.min(100, levelProgress)),
      nextLevelXp,
      streak: user.streak || 0,
      totalQuizzes,
      avgScore,
    });
  } catch (error) {
    console.error('[USER_STATS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
