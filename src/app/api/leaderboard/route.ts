import { NextRequest, NextResponse } from 'next/server';
import { connectDB, User } from '@/database';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get top 100 users by XP
    const users = await User.find({ xp: { $gt: 0 } })
      .sort({ xp: -1 })
      .limit(100)
      .select('name xp image isPremium streak quizzesPlayed averageScore createdAt bestStreak')
      .lean();

    const leaderboard = users.map(user => ({
      _id: user._id.toString(),
      totalPoints: user.xp || 0,
      quizzesPlayed: user.quizzesPlayed || 0,
      avgScore: user.averageScore || 0,
      recentActivity: !!user.createdAt, // Placeholder, can be improved
      name: user.name || 'Speler',
      image: user.image || null,
      isPremium: user.isPremium || false,
      streak: user.streak || 0,
      bestStreak: user.bestStreak || 0,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('[LEADERBOARD_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
