import * as handlers from '@/app/api/admin/users/[id]/premium/route';

/** Same handler as `/api/admin/users/[id]/premium`, under the app's `/api/mobile` base. */
export const dynamic = 'force-dynamic';

export function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  return handlers.POST(req, context);
}

export function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  return handlers.DELETE(req, context);
}
