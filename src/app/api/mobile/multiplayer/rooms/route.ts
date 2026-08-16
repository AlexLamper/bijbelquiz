import { NextRequest } from 'next/server';
import { handleCreateRoom, handleGetCapability } from '@/lib/multiplayer/handlers';

/**
 * Legacy alias for `/api/multiplayer/rooms`, kept so already-shipped mobile
 * builds keep working. New clients (web, Flutter) should use the canonical
 * `/api/multiplayer/*` path - both share one implementation.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleGetCapability(req);
}

export async function POST(req: NextRequest) {
  return handleCreateRoom(req);
}
