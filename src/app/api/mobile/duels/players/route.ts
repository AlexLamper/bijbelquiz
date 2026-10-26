import { NextRequest } from 'next/server';
import { handleListPlayers } from '@/lib/duels/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleListPlayers(req);
}
