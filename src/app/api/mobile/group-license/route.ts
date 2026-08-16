import { NextRequest } from 'next/server';

import {
  GET as handleGet,
  PATCH as handlePatch,
  POST as handlePost,
} from '@/app/api/group-license/route';

/**
 * Alias for `/api/group-license`, so the Flutter client - whose base URL is
 * `/api/mobile` - reaches it without a second origin. Same pattern as the
 * multiplayer and events aliases.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleGet(req);
}

export async function POST(req: NextRequest) {
  return handlePost(req);
}

export async function PATCH(req: NextRequest) {
  return handlePatch(req);
}
