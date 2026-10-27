import * as handlers from '@/app/api/admin/users/route';

/** Same handler as `/api/admin/users`, under the app's `/api/mobile` base. */
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return handlers.GET(req);
}
