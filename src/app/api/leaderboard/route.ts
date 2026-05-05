import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, parseLeaderboardPeriod } from '@/lib/leaderboard';

export async function GET(request: NextRequest) {
  try {
    const period = parseLeaderboardPeriod(request.nextUrl.searchParams.get('period'));
    const leaderboard = await getLeaderboard(period, 100);

    return NextResponse.json({
      period,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error('[LEADERBOARD_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
