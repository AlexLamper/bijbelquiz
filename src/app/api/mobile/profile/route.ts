import { NextResponse } from 'next/server';
import { connectDB, User, UserProgress } from '@/database';
import jwt from 'jsonwebtoken';

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

    // Fetch recent progress to show on the profile (last 5 attempts)
    const recentProgress = await UserProgress.find({ userId: decoded.userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('quizId', 'title image')
      .lean();

    const formattedProgress = recentProgress.map((p: any) => ({
      quizId: p.quizId?._id?.toString() || p.quizId?.toString() || '',
      quizTitle: p.quizId?.title || 'Quiz',
      quizImage: p.quizId?.image || null,
      score: p.score || 0,
      isCompleted: p.isCompleted || false,
      updatedAt: p.updatedAt
    }));

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name || 'Anonieme Speler',
      email: user.email,
      image: user.image,
      xp: user.xp || 0,
      level: user.level || 1,
      levelTitle: user.levelTitle || 'Beginner',
      isPremium: user.isPremium || false,
      streak: user.streak || 0,
      bestStreak: user.bestStreak || 0,
      badges: user.badges || [],
      recentProgress: formattedProgress
    }, { status: 200 });

  } catch (error) {
    console.error('Mobile API - Profile Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
