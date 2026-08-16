import { NextResponse } from 'next/server';
import { connectDB, User, UserProgress } from '@/database';
import jwt from 'jsonwebtoken';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { getLevelInfo } from '@/lib/gamification';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const premium = getPremiumSnapshot(user);

    const levelInfo = getLevelInfo(user.xp || 0);

    // Fetch recent progress to show on the profile (last 5 attempts)
    const recentProgress = await UserProgress.find({ userId: decoded.userId })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate('quizId', 'title imageUrl')
      .lean();

    const formattedProgress = recentProgress.map((p: any) => ({
      quizId: p.quizId?._id?.toString() || p.quizId?.toString() || '',
      quizTitle: p.quizId?.title || 'Quiz',
      quizImage: p.quizId?.imageUrl || null,
      score: p.score || 0,
      totalQuestions: p.totalQuestions || 0,
      xpEarned: p.xpEarned || 0,
      completedAt: p.completedAt
    }));

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name || 'Anonieme Speler',
      email: user.email,
      image: user.image,
      xp: user.xp || 0,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      levelProgress: levelInfo.progressPercentage,
      nextLevelXp: levelInfo.nextLevelXp,
      isPremium: premium.isPremium,
      premiumStripe: premium.premiumStripe,
      premiumStore: premium.premiumStore,
      storePremiumExpiresAt: premium.storePremiumExpiresAt,
      streak: user.streak || 0,
      bestStreak: user.bestStreak || 0,
      badges: user.badges || [],
      // Lifetime totals. The app used to derive these from the last 5 attempts,
      // which capped "quizzen gespeeld" at 5 and skewed the average.
      quizzesPlayed: user.quizzesPlayed || 0,
      averageScore: user.averageScore || 0,
      recentProgress: formattedProgress
    }, { status: 200 });

  } catch (error) {
    console.error('Mobile API - Profile Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
