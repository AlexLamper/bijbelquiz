import { getMultiplayerAuthToken, isUnauthorized } from './client';

/**
 * Owns the short-lived multiplayer bearer token for the browser tab.
 *
 * `/api/multiplayer/token` mints a 2-hour JWT from the NextAuth session. A
 * lobby that sits open longer than that - or a tab restored from sleep - used
 * to start 401-ing forever, because the token was fetched exactly once and
 * cached in a ref. This store instead:
 *
 *  - de-duplicates concurrent fetches (one in-flight request, many awaiters),
 *  - proactively re-mints shortly before expiry,
 *  - and exposes `run()`, which retries a call once with a fresh token when
 *    the server rejects the current one.
 *
 * The only way out is a genuinely signed-out session, which surfaces as a
 * real 401 to the caller.
 */

/** Re-mint this long before the JWT's own expiry to absorb clock skew. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
/** Fallback lifetime if the token has no readable `exp` claim. */
const ASSUMED_LIFETIME_MS = 2 * 60 * 60 * 1000;

function decodeExpiryMs(token: string): number | null {
  const segments = token.split('.');
  if (segments.length < 2) return null;

  try {
    const payloadJson = atob(segments[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp?: unknown };
    if (typeof payload.exp === 'number' && Number.isFinite(payload.exp)) {
      return payload.exp * 1000;
    }
  } catch {
    return null;
  }

  return null;
}

export class MultiplayerTokenStore {
  private token: string | null = null;
  private expiresAtMs = 0;
  private inFlight: Promise<string> | null = null;

  /** Current token, minting or refreshing one if needed. */
  async get(signal?: AbortSignal): Promise<string> {
    if (this.token && Date.now() < this.expiresAtMs - REFRESH_MARGIN_MS) {
      return this.token;
    }

    return this.refresh(signal);
  }

  /** Force a new token, collapsing concurrent callers onto one request. */
  async refresh(signal?: AbortSignal): Promise<string> {
    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = (async () => {
      try {
        const token = await getMultiplayerAuthToken(signal);
        this.token = token;
        this.expiresAtMs = decodeExpiryMs(token) ?? Date.now() + ASSUMED_LIFETIME_MS;
        return token;
      } finally {
        this.inFlight = null;
      }
    })();

    return this.inFlight;
  }

  /** Drop the cached token (e.g. after signing out). */
  clear(): void {
    this.token = null;
    this.expiresAtMs = 0;
  }

  /**
   * Run an authenticated call. On a 401 the token is re-minted once and the
   * call is retried, so a stale JWT never turns into a stuck screen.
   */
  async run<T>(call: (token: string) => Promise<T>, signal?: AbortSignal): Promise<T> {
    const token = await this.get(signal);

    try {
      return await call(token);
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error;
      }

      this.clear();
      const freshToken = await this.refresh(signal);
      return call(freshToken);
    }
  }
}
