import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardResult, parseLeaderboardPeriod } from '@/lib/leaderboard';
import { getSession } from '@/lib/get-session';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = parseLeaderboardPeriod(searchParams.get('period'));
    const session = await getSession(req);
    const result = await getLeaderboardResult(period, 100, session?.user?.id);
    const rows = result.leaderboard;

    const leaderboard = rows.map((user) => ({
      id: user._id,
      name: user.name || 'Anonieme Speler',
      xp: user.xp || 0,
      image: user.image || null,
      levelTitle: user.levelTitle || 'Beginner',
      isPremium: user.isPremium || false,
    }));

    return NextResponse.json(
      {
        period,
        count: leaderboard.length,
        leaderboard,
        currentUserRank: result.currentUserRank,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mobile API - Leaderboard Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
