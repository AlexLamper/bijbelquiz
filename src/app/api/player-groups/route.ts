import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/get-session';
import {
  MAX_GROUPS_PER_USER,
  createFromRoom,
  listFor,
  removeMember,
  renameGroup,
} from '@/lib/player-groups';

/**
 * Saved player groups.
 *
 * One route for the website and the app - `getSession` takes both the NextAuth
 * cookie and a mobile bearer token - with every rule living in
 * `lib/player-groups.ts` rather than here.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Every group this user belongs to. */
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const groups = await listFor(session.user.id);
    return NextResponse.json({ groups, maxGroups: MAX_GROUPS_PER_USER });
  } catch (error) {
    console.error('[PLAYER_GROUPS_GET]', error);
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 });
  }
}

/** Save the players of a finished room as a group. */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = typeof body?.roomCode === 'string' ? body.roomCode : '';
    const name = typeof body?.name === 'string' ? body.name : undefined;

    const result = await createFromRoom(session.user.id, roomCode, name);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      { group: result.group, created: result.created },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    console.error('[PLAYER_GROUPS_POST]', error);
    return NextResponse.json({ error: 'Groep bewaren is niet gelukt.' }, { status: 500 });
  }
}

/** Rename a group, or remove a member from it. */
export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const groupId = typeof body?.groupId === 'string' ? body.groupId : '';

    if (!groupId) {
      return NextResponse.json({ error: 'Onbekende groep.' }, { status: 400 });
    }

    if (typeof body?.removeMemberId === 'string') {
      const result = await removeMember(session.user.id, groupId, body.removeMemberId);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
    } else if (typeof body?.name === 'string') {
      const result = await renameGroup(session.user.id, groupId, body.name);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
    } else {
      return NextResponse.json({ error: 'Niets om bij te werken.' }, { status: 400 });
    }

    const groups = await listFor(session.user.id);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('[PLAYER_GROUPS_PATCH]', error);
    return NextResponse.json({ error: 'Bijwerken is niet gelukt.' }, { status: 500 });
  }
}
