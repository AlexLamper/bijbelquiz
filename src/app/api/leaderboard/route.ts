import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardResult, parseLeaderboardPeriod } from '@/lib/leaderboard';
import { getSession } from '@/lib/get-session';

export async function GET(request: NextRequest) {
  try {
    const period = parseLeaderboardPeriod(request.nextUrl.searchParams.get('period'));
    const session = await getSession(request);
    const result = await getLeaderboardResult(period, 100, session?.user?.id);

    return NextResponse.json({
      period,
      count: result.leaderboard.length,
      leaderboard: result.leaderboard,
      currentUserRank: result.currentUserRank,
    });
  } catch (error) {
    console.error('[LEADERBOARD_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
