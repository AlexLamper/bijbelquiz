import { GET as handleGet } from '@/app/api/seasons/current/route';

/** Alias for `/api/seasons/current`, for the app's `/api/mobile` base URL. */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handleGet();
}
