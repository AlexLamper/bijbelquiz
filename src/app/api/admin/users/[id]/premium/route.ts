import { NextResponse } from 'next/server';

import { grantPremium, revokePremiumGrant } from '@/lib/admin/premium-grants';
import { readJsonBody, requireAdmin, serverError } from '@/lib/admin/api-auth';

export const dynamic = 'force-dynamic';

/**
 * POST: give Premium (dated manual grant). DELETE: take the grant back.
 * Contract: docs/setup/admin-api.md (4, 5). Every call is written to the
 * account's `premiumGrantLog` with the admin who made it.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await readJsonBody(req);
    const result = await grantPremium(id, body, auth.actor);
    if (!result.ok) return NextResponse.json({ error: result.error, ...(result.field ? { field: result.field } : {}) }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    return serverError('ADMIN_PREMIUM_GRANT', error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await readJsonBody(req);
    const result = await revokePremiumGrant(id, body, auth.actor);
    if (!result.ok) return NextResponse.json({ error: result.error, ...(result.field ? { field: result.field } : {}) }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    return serverError('ADMIN_PREMIUM_REVOKE', error);
  }
}
