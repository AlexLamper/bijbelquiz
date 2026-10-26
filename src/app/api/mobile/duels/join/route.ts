import { NextRequest } from 'next/server';
import { handleJoinDuel } from '@/lib/duels/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleJoinDuel(req);
}
