import crypto from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Server-to-server authentication for the `/api/service/*` routes.
 *
 * bijbelstudie.io calls this app to borrow quiz questions for its guided study
 * flow. That is a *server* calling a server: the existing `getSession` helper
 * authenticates a person (NextAuth cookie, or a mobile bearer token) and has
 * nothing to say about a trusted peer, so this is a separate mechanism rather
 * than a special case bolted onto it.
 *
 * Deliberately a shared secret and not OAuth client-credentials or mTLS: there
 * are two servers, owned by one person, and a token endpoint plus rotation
 * plumbing would be more moving parts than the thing it protects.
 */

const CLIENT_HEADER = 'x-service-client';
const KEY_HEADER = 'x-service-key';
const TIMESTAMP_HEADER = 'x-service-timestamp';
const SIGNATURE_HEADER = 'x-service-signature';

/** How far a signed request's clock may drift, in seconds. */
const SIGNATURE_WINDOW_SECONDS = 300;

export type ServiceAuthResult =
  | { ok: true; client: string }
  | { ok: false; status: number; error: string };

/** Length-safe comparison, so a wrong key cannot be found one byte at a time. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Authenticates a peer service.
 *
 * Fails CLOSED when no key is configured: an unset environment variable must
 * never mean "let everyone in", which is how a staging deploy quietly becomes a
 * public question bank.
 */
export function requireServiceCaller(req: NextRequest): ServiceAuthResult {
  const expected = process.env.BIJBELSTUDIE_SERVICE_KEY;

  if (!expected) {
    console.error('[service-auth] BIJBELSTUDIE_SERVICE_KEY is not set');
    return { ok: false, status: 500, error: 'Service authentication not configured' };
  }

  const presented = req.headers.get(KEY_HEADER) ?? '';
  if (!presented || !safeEqual(presented, expected)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  // Not a security control - it makes the access log say who called.
  const client = req.headers.get(CLIENT_HEADER) ?? 'unknown';

  return { ok: true, client };
}

/**
 * The same check plus a signature over the body, for routes that WRITE.
 *
 * A bare bearer key is fine for reading public quiz questions. It is not fine
 * for a route that asserts "this user scored 4/5", because a leaked access log
 * or a replayed proxy request would be enough to forge one. The timestamp
 * window is what stops a captured request being replayed later.
 */
export function requireSignedServiceCaller(req: NextRequest, rawBody: string): ServiceAuthResult {
  const base = requireServiceCaller(req);
  if (!base.ok) return base;

  const secret = process.env.BIJBELSTUDIE_SERVICE_KEY as string;
  const timestamp = req.headers.get(TIMESTAMP_HEADER) ?? '';
  const signature = req.headers.get(SIGNATURE_HEADER) ?? '';

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) {
    return { ok: false, status: 401, error: 'Missing or invalid timestamp' };
  }

  const drift = Math.abs(Date.now() / 1000 - seconds);
  if (drift > SIGNATURE_WINDOW_SECONDS) {
    return { ok: false, status: 401, error: 'Request timestamp outside the accepted window' };
  }

  const expectedSignature =
    'sha256=' +
    crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  if (!signature || !safeEqual(signature, expectedSignature)) {
    return { ok: false, status: 401, error: 'Bad signature' };
  }

  return base;
}
