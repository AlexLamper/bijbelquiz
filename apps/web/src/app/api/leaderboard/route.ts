import { NextResponse } from 'next/server';
import { connectDB, User } from '@bijbelquiz/database';

export async function GET() {
  try {
    await connectDB();

    const topUsers = await User.find({ xp: { $gt: 0 } })
      .sort({ xp: -1, updatedAt: 1 })
      .limit(50)
      .select('name image xp streak')
      .lean();

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name || 'Anonieme speler',
      image: user.image || null,
      xp: user.xp || 0,
      streak: user.streak || 0,
    }));

    return NextResponse.json({
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error('[LEADERBOARD_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
