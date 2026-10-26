import { NextRequest } from 'next/server';
import { handleCreateDuel, handleListDuels } from '@/lib/duels/handlers';

/**
 * Duels for the website and any client on the canonical tree. One implementation
 * in `lib/duels/handlers.ts`, shared with the app's `/api/mobile/duels` alias.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleListDuels(req);
}

export async function POST(req: NextRequest) {
  return handleCreateDuel(req);
}
