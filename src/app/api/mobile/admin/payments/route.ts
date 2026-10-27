import * as handlers from '@/app/api/admin/payments/route';

/** Same handler as `/api/admin/payments`, under the app's `/api/mobile` base. */
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return handlers.GET(req);
}
