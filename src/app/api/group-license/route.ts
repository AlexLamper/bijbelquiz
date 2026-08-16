import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/get-session';
import {
  GROUP_LICENSE_SEATS,
  joinGroupLicense,
  removeGroupMember,
  renameGroupLicense,
  summarizeLicensesFor,
} from '@/lib/group-license';

/**
 * Group licences, for the buyer and for the people who redeem their code.
 *
 * One route for both the website and the app: `getSession` accepts the
 * NextAuth cookie and a mobile bearer token, and the licence rules live in
 * `lib/group-license.ts` rather than here.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Every licence this user owns or belongs to. */
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const licenses = await summarizeLicensesFor(session.user.id);
    return NextResponse.json({ licenses, defaultSeats: GROUP_LICENSE_SEATS });
  } catch (error) {
    console.error('[GROUP_LICENSE_GET]', error);
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 });
  }
}

/** Redeem a join code. */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body?.joinCode === 'string' ? body.joinCode : '';

    const result = await joinGroupLicense(session.user.id, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ license: result.license });
  } catch (error) {
    console.error('[GROUP_LICENSE_POST]', error);
    return NextResponse.json({ error: 'Deelnemen is niet gelukt.' }, { status: 500 });
  }
}

/** Owner-only: rename the group, or remove a member. */
export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const licenseId = typeof body?.licenseId === 'string' ? body.licenseId : '';

    if (!licenseId) {
      return NextResponse.json({ error: 'Onbekende groep.' }, { status: 400 });
    }

    if (typeof body?.removeMemberId === 'string') {
      const result = await removeGroupMember(session.user.id, licenseId, body.removeMemberId);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
      }
    } else if (typeof body?.name === 'string') {
      const result = await renameGroupLicense(session.user.id, licenseId, body.name);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
      }
    } else {
      return NextResponse.json({ error: 'Niets om bij te werken.' }, { status: 400 });
    }

    const licenses = await summarizeLicensesFor(session.user.id);
    return NextResponse.json({ licenses });
  } catch (error) {
    console.error('[GROUP_LICENSE_PATCH]', error);
    return NextResponse.json({ error: 'Bijwerken is niet gelukt.' }, { status: 500 });
  }
}
