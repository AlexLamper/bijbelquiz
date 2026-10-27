import { NextResponse } from 'next/server';

import { buildAdminOverviewPayload } from '@/lib/admin/api-overview';
import { requireAdmin, serverError } from '@/lib/admin/api-auth';

export const dynamic = 'force-dynamic';

/** Overview numbers for the admin screens. Contract: docs/setup/admin-api.md (1). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const deep = new URL(req.url).searchParams.get('deep') === '1';
    return NextResponse.json(await buildAdminOverviewPayload({ deep }));
  } catch (error) {
    return serverError('ADMIN_OVERVIEW', error);
  }
}
