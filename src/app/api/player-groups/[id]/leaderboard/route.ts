import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/get-session';
import { parseLeaderboardPeriod } from '@/lib/leaderboard';
import { leaderboardFor } from '@/lib/player-groups';

/**
 * One group's standings.
 *
 * Members only, and enforced in the lib rather than here: a group id is
 * guessable enough that "you are in it" has to be part of the query, not a
 * check somebody can forget to write.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const period = parseLeaderboardPeriod(req.nextUrl.searchParams.get('period'));

    const result = await leaderboardFor(session.user.id, id, period);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.leaderboard);
  } catch (error) {
    console.error('[PLAYER_GROUP_LEADERBOARD_GET]', error);
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 });
  }
}
