import { NextResponse } from 'next/server';

import { grantPremium } from '@/lib/admin/premium-grants';
import { findUserIdByEmail, getAdminUserRow } from '@/lib/admin/users';
import { readJsonBody, requireAdmin, serverError } from '@/lib/admin/api-auth';

export const dynamic = 'force-dynamic';

/** Give Premium to the account with this e-mail. Contract: docs/setup/admin-api.md (4). */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const body = await readJsonBody(req);
    if (typeof body.email !== 'string' || !body.email.trim()) {
      return NextResponse.json({ error: 'Vul een e-mailadres in.', field: 'email' }, { status: 400 });
    }
    const userId = await findUserIdByEmail(body.email);
    if (!userId) return NextResponse.json({ error: 'Geen account met dit e-mailadres.', field: 'email' }, { status: 404 });
    const result = await grantPremium(userId, body, auth.actor);
    if (!result.ok) return NextResponse.json({ error: result.error, ...(result.field ? { field: result.field } : {}) }, { status: result.status });
    return NextResponse.json({ ...result, user: await getAdminUserRow(userId) });
  } catch (error) {
    return serverError('ADMIN_PREMIUM_GRANT_EMAIL', error);
  }
}
