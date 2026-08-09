import { NextRequest } from 'next/server';
import { handleGetActiveRoom } from '@/lib/multiplayer/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleGetActiveRoom(req);
}
