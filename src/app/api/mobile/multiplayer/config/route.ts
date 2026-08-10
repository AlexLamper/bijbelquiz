import { handleGetConfig } from '@/lib/multiplayer/handlers';

/**
 * Legacy alias for `/api/multiplayer/config`, added so the mobile tree exposes
 * the same surface as the canonical one. Without it a Flutter client pointed at
 * `/api/mobile/multiplayer` had to hardcode the poll intervals and question
 * timer, which then drifted out of sync with the server whenever they changed.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handleGetConfig();
}
