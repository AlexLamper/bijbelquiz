import { NextRequest } from 'next/server';
import { handleCreateDuel, handleListDuels } from '@/lib/duels/handlers';

/**
 * Alias of `/api/duels` for the Flutter client, whose base URL is `/api/mobile`.
 * Same pattern as the player-groups and multiplayer aliases.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleListDuels(req);
}

export async function POST(req: NextRequest) {
  return handleCreateDuel(req);
}
