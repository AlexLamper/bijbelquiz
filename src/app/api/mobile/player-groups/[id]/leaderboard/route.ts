import { NextRequest } from 'next/server';

import { GET as handleGet } from '@/app/api/player-groups/[id]/leaderboard/route';

/** Alias for `/api/player-groups/:id/leaderboard`. */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handleGet(req, ctx);
}
