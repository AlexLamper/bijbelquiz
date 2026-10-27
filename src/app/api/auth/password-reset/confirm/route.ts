import { NextRequest, NextResponse } from 'next/server';

import { resetPasswordWithToken } from '@/lib/auth/password-reset';
import { clientIp, createRateLimiter } from '@/lib/auth/rate-limit';
import { isWellFormedResetToken, validateNewPassword } from '@/lib/auth/reset-token';

/**
 * POST /api/auth/password-reset/confirm { token, password }
 *
 * Sets the new password when the token is valid, unexpired and unused. The
 * token is 256 bits, so guessing is not the threat; the limit is there so a
 * script cannot hammer bcrypt on this route.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const perIp = createRateLimiter({ max: 20, windowMs: 15 * 60 * 1000 });

const INVALID_LINK = 'Deze link is ongeldig of verlopen. Vraag een nieuwe link aan.';

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!perIp.hit(ip)) {
    return NextResponse.json(
      { error: 'Je hebt dit vaak geprobeerd. Wacht even en probeer het later opnieuw.' },
      { status: 429, headers: { 'Retry-After': String(perIp.retryAfter(ip)) } },
    );
  }

  const body = (await req.json().catch(() => null)) as { token?: unknown; password?: unknown } | null;

  if (!isWellFormedResetToken(body?.token)) {
    return NextResponse.json({ error: INVALID_LINK, code: 'INVALID_TOKEN' }, { status: 400 });
  }

  const password = validateNewPassword(body?.password);
  if (!password.ok) {
    return NextResponse.json({ error: password.error, code: 'INVALID_PASSWORD' }, { status: 400 });
  }

  try {
    const result = await resetPasswordWithToken(body.token, password.password);
    if (!result.ok) {
      return NextResponse.json({ error: INVALID_LINK, code: 'INVALID_TOKEN' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, email: result.email });
  } catch (error) {
    console.error('[PASSWORD_RESET_CONFIRM]', error);
    return NextResponse.json({ error: 'Er ging iets mis. Probeer het opnieuw.' }, { status: 500 });
  }
}
