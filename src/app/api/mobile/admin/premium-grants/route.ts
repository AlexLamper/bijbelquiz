import * as handlers from '@/app/api/admin/premium-grants/route';

/** Same handler as `/api/admin/premium-grants`, under the app's `/api/mobile` base. */
export const dynamic = 'force-dynamic';

export function POST(req: Request) {
  return handlers.POST(req);
}
