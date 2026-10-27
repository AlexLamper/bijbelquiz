import { NextResponse } from 'next/server';

import { listAdminUsers, readUserListQuery } from '@/lib/admin/users';
import { requireAdmin, serverError } from '@/lib/admin/api-auth';

export const dynamic = 'force-dynamic';

/** Searchable, filterable, paged user list. Contract: docs/setup/admin-api.md (2). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await listAdminUsers(readUserListQuery(new URL(req.url).searchParams)));
  } catch (error) {
    return serverError('ADMIN_USERS', error);
  }
}
