import * as handlers from '@/app/api/admin/users/[id]/route';

/** Same handler as `/api/admin/users/[id]`, under the app's `/api/mobile` base. */
export const dynamic = 'force-dynamic';

export function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  return handlers.GET(req, context);
}
