import { NextRequest, NextResponse } from 'next/server';

import { deleteAccount } from '@/lib/account-deletion';
import { getSession } from '@/lib/get-session';

/**
 * DELETE /api/user/account { confirm: true }
 *
 * Deletes the signed-in account (NextAuth cookie or the app's bearer token)
 * and everything that belongs to it; see `lib/account-deletion.ts`.
 *
 * The JSON body is required on purpose: together with the `DELETE` method it
 * means a cross-site form or image tag cannot trigger this, only a script on
 * our own origin (or the app) that has passed the confirm step.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Log in om je account te verwijderen.' }, { status: 401 });
  }

  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as { confirm?: unknown } | null;
  if (body?.confirm !== true) {
    return NextResponse.json({ error: 'Bevestig eerst dat je je account wilt verwijderen.' }, { status: 400 });
  }

  try {
    const result = await deleteAccount(session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.message, code: result.code }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[ACCOUNT_DELETE]', error);
    return NextResponse.json({ error: 'Verwijderen is niet gelukt. Probeer het opnieuw of mail ons.' }, { status: 500 });
  }
}
