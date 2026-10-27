import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { decode } from 'next-auth/jwt';

import { User, connectDB } from '@/database';
import { authOptions } from '@/lib/auth';
import { getMobileUserId, readBearerToken } from '@/lib/mobile-auth';
import type { GrantActor } from '@/lib/admin/premium-grants';

/**
 * Admin check for the JSON admin routes (`/api/admin/**`, re-exported under
 * `/api/mobile/admin/**`). Accepts the website's next-auth cookie, the app's
 * HS256 bearer token, or a next-auth token sent as a bearer, and then checks
 * the role on the account itself (never on what a token claims), so a demoted
 * admin loses access at once.
 */
export async function requireAdmin(
  req: Request,
): Promise<{ ok: true; actor: GrantActor } | { ok: false; response: NextResponse }> {
  let userId: string | null = null;

  if (!readBearerToken(req)) {
    try {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id ?? null;
    } catch {
      // Outside a request scope (tests): no cookie session.
    }
  }

  if (!userId) userId = getMobileUserId(req);

  if (!userId) {
    const token = readBearerToken(req);
    if (token) {
      try {
        const decoded = await decode({ token, secret: process.env.NEXTAUTH_SECRET || '' });
        if (decoded && typeof decoded.id === 'string') userId = decoded.id;
      } catch {
        // Not a next-auth token either.
      }
    }
  }

  if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  await connectDB();
  const user = await User.findById(userId).select('role email name').lean<{ role?: string; email?: string; name?: string }>();
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role !== 'admin') return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  return { ok: true, actor: { id: userId, email: user.email ?? null, name: user.name ?? null } };
}

/** A JSON body, or `{}` for an empty or broken one. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function serverError(tag: string, error: unknown) {
  console.error(`[${tag}]`, error);
  return NextResponse.json({ error: 'Er ging iets mis op de server.' }, { status: 500 });
}
