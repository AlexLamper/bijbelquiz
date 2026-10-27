/**
 * A small sliding-window limiter for the account forms (password reset, and
 * anything else that sends mail or checks a secret).
 *
 * In memory, for the same reason as `lib/multiplayer/rate-limit.ts`: the site
 * runs as one long-lived node process (`server.ts`), so one map is the whole
 * truth. A restart forgives everybody, which is fine for a limit whose job is
 * to stop a loop or a mailbomb, not to be a ledger.
 */
export interface RateLimiter {
  /** Records a hit for `key` and says whether it is still within the limit. */
  hit(key: string, now?: number): boolean;
  /** Seconds until `key` may try again (0 when it may now). */
  retryAfter(key: string, now?: number): number;
  reset(): void;
}

export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();

  const recent = (key: string, now: number): number[] => {
    const kept = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
    if (kept.length === 0) hits.delete(key);
    else hits.set(key, kept);
    return kept;
  };

  const sweep = (now: number) => {
    if (hits.size < 1000) return;
    for (const [key, stamps] of hits) {
      if (stamps.every((at) => now - at >= windowMs)) hits.delete(key);
    }
  };

  return {
    hit(key, now = Date.now()) {
      sweep(now);
      const stamps = recent(key, now);
      if (stamps.length >= max) return false;
      stamps.push(now);
      hits.set(key, stamps);
      return true;
    },
    retryAfter(key, now = Date.now()) {
      const stamps = recent(key, now);
      if (stamps.length < max) return 0;
      return Math.max(1, Math.ceil((stamps[0] + windowMs - now) / 1000));
    },
    reset() {
      hits.clear();
    },
  };
}

/** The caller's address as the proxy in front of `server.ts` reports it. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}
