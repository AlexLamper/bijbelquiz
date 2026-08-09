import { NextRequest } from 'next/server';
import { handleCreateRoom, handleGetCapability } from '@/lib/multiplayer/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleGetCapability(req);
}

export async function POST(req: NextRequest) {
  return handleCreateRoom(req);
}
