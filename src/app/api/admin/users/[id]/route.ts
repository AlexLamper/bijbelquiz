import { NextResponse } from 'next/server';

import { getAdminUserDetail } from '@/lib/admin/users';
import { requireAdmin, serverError } from '@/lib/admin/api-auth';

export const dynamic = 'force-dynamic';

/** Everything known about one account. Contract: docs/setup/admin-api.md (3). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const detail = await getAdminUserDetail(id);
    if (!detail) return NextResponse.json({ error: 'Gebruiker niet gevonden.' }, { status: 404 });
    return NextResponse.json(detail);
  } catch (error) {
    return serverError('ADMIN_USER_DETAIL', error);
  }
}
