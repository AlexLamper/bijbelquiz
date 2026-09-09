import { MultiplayerError } from './errors';

/**
 * A ceiling on how many rooms one account can open in an hour.
 *
 * The hosting quota used to do this by accident: an account that could only
 * ever host five games could not open five hundred lobbies either. Now that
 * hosting is free, something has to stand between a script and an unbounded
 * number of rooms, each of which holds state and a websocket fan-out.
 *
 * Deliberately far above what a real host does. A youth leader running an
 * evening opens two or three rooms; twenty in an hour is not a use case, it is
 * a loop.
 */
const MAX_ROOMS_PER_HOUR = 20;
const WINDOW_MS = 60 * 60 * 1000;

/**
 * In-memory, and that is the right trade here: the site runs as one long-lived
 * node process (`server.ts`), which is also what holds the websocket
 * connections, so there is exactly one map to consult and no round trip. A
 * restart forgives everybody, which is acceptable for a limit whose only job is
 * to stop a runaway loop.
 */
const attempts = new Map<string, number[]>();

/** Drop timestamps that have aged out, and the key with them when it empties. */
function recent(userId: string, now: number): number[] {
  const kept = (attempts.get(userId) ?? []).filter((at) => now - at < WINDOW_MS);

  if (kept.length === 0) {
    attempts.delete(userId);
  } else {
    attempts.set(userId, kept);
  }

  return kept;
}

/**
 * Occasionally sweep the whole map, so a process that has served thousands of
 * one-off hosts does not hold their keys forever.
 */
function maybeSweep(now: number): void {
  if (attempts.size < 500) return;

  for (const [userId, timestamps] of attempts) {
    if (timestamps.every((at) => now - at >= WINDOW_MS)) {
      attempts.delete(userId);
    }
  }
}

/** Record one room creation, or throw when this account is looping. */
export function assertRoomCreationAllowed(userId: string): void {
  const now = Date.now();
  maybeSweep(now);

  const timestamps = recent(userId, now);

  if (timestamps.length >= MAX_ROOMS_PER_HOUR) {
    throw new MultiplayerError(
      'RATE_LIMITED',
      'Je hebt in korte tijd veel spellen aangemaakt. Probeer het over een uurtje opnieuw.',
      429,
    );
  }

  timestamps.push(now);
  attempts.set(userId, timestamps);
}

/** Test seam: forget everything. */
export function resetRoomCreationLimit(): void {
  attempts.clear();
}
