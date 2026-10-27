import { after, NextRequest, NextResponse } from 'next/server';

import { requestPasswordReset } from '@/lib/auth/password-reset';
import { clientIp, createRateLimiter } from '@/lib/auth/rate-limit';
import { normalizeEmail } from '@/lib/auth/reset-token';

/**
 * POST /api/auth/password-reset/request { email }
 *
 * Always the same answer for a valid address, whether or not it has an
 * account: the lookup and the mail run after the response (`after`), so
 * neither the body nor the timing tells an outsider which addresses exist.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Per address: enough to retry after a typo or a slow mailbox, not a mailbomb.
const perEmail = createRateLimiter({ max: 3, windowMs: 60 * 60 * 1000 });
// Per caller: one household or school network asking for a few accounts.
const perIp = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 });

const SENT_MESSAGE =
  'Als er een account bij dit e-mailadres hoort, hebben we een link gestuurd om een nieuw wachtwoord te kiezen. Kijk ook in je spam.';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const email = normalizeEmail(body?.email);

  if (!email) {
    return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 });
  }

  const ip = clientIp(req);
  if (!perIp.hit(ip)) {
    return NextResponse.json(
      { error: 'Je hebt dit vaak geprobeerd. Wacht even en probeer het later opnieuw.' },
      { status: 429, headers: { 'Retry-After': String(perIp.retryAfter(ip)) } },
    );
  }

  // Over the per-address limit the answer stays "sent": a 429 here would only
  // say that somebody has been asking for this address.
  if (perEmail.hit(email)) {
    after(async () => {
      try {
        await requestPasswordReset(email);
      } catch (error) {
        console.error('[PASSWORD_RESET_REQUEST]', error);
      }
    });
  }

  return NextResponse.json({ ok: true, message: SENT_MESSAGE });
}
