import * as handlers from '@/app/api/admin/payments/health/route';

/** Same handler as `/api/admin/payments/health`, under the app's `/api/mobile` base. */
export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return handlers.GET(req);
}
