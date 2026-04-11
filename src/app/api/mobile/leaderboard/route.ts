import { NextResponse } from 'next/server';
import { connectDB, User } from '@/database';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Fetch top users by XP, limit to 100
    const topUsers = await User.find({ xp: { $gt: 0 } })
      .sort({ xp: -1 })
      .limit(100)
      .select('name xp image levelTitle isPremium')
      .lean();
    
    // Format for the mobile app
    const leaderboard = topUsers.map((user: any) => ({
      id: user._id.toString(),
      name: user.name || 'Anonieme Speler',
      xp: user.xp || 0,
      image: user.image || null,
      levelTitle: user.levelTitle || 'Beginner',
      isPremium: user.isPremium || false
    }));

    return NextResponse.json(leaderboard, { status: 200 });
  } catch (error) {
    console.error('Mobile API - Leaderboard Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
