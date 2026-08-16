import { NextResponse } from 'next/server';

import { BADGES, LEVELS } from '@/lib/gamification';

/**
 * GET /api/mobile/badges — the badge catalogue the app renders against.
 *
 * The app used to ship its own hardcoded copy, which drifted from the ids the
 * server actually awards. Serving the catalogue keeps the two in step: the app
 * matches on `id`, and unknown ids simply do not exist anymore.
 */
export async function GET() {
  return NextResponse.json(
    {
      badges: BADGES.map((badge) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      })),
      levels: LEVELS.map((level) => ({
        level: level.level,
        title: level.title,
        minXp: level.minXp,
        description: level.description,
      })),
    },
    { status: 200 }
  );
}
