/**
 * The free tier: three different quizzes, then Premium.
 *
 * Same rule as the app (`free_quiz_limit.dart`): a player without Premium may
 * finish {@link FREE_QUIZ_LIMIT} different quizzes. Replays of a quiz already
 * played stay free, so those three can be played as often as you like. The
 * fourth *new* quiz opens the locked paywall
 * (`/premium?vergrendeld=1&terug=/quiz/<id>`). Premium players and admins are
 * never limited.
 *
 * Where the played quizzes come from:
 * - signed in: the distinct quizzes in the account's attempts
 *   (`getFreeQuizAllowanceForUser` in `free-quiz-limit-server.ts`, which reads
 *   the database and is enforced on `/quiz/[id]` and in `/api/quiz/submit`);
 * - guest: the quizzes in this browser's parked attempts
 *   (`pending-attempts.ts`) plus a small list of played quiz ids kept next to
 *   them, because parked attempts expire after a week and only the last five
 *   are kept - without the list a guest could replay one quiz until the others
 *   fell out and then start a fourth.
 *
 * This file is safe to import from client and server components: the guest
 * helpers only touch `localStorage` in a browser and the rest is pure.
 */

import { readPendingAttempts } from '@/lib/pending-attempts';

/** How many different quizzes a player without Premium may play. */
export const FREE_QUIZ_LIMIT = 3;

export interface FreeQuizAllowance {
  /** Premium (or admin): never limited. */
  isPremium: boolean;
  /** Quiz ids (and slugs, for guests) already played. */
  playedQuizIds: string[];
  /** Different quizzes played so far (0 for Premium). Older accounts can be above the limit. */
  used: number;
  /** Free quizzes left, for the "Nog N gratis quizzen" line. */
  remaining: number;
  /** No new quiz can be started without Premium. */
  limitReached: boolean;
}

/** Build the allowance from what the player has played. */
export function buildFreeQuizAllowance(input: {
  isPremium: boolean;
  playedQuizIds: Iterable<string>;
}): FreeQuizAllowance {
  // One entry per quiz: pass ids only (the guest helper adds slugs afterwards,
  // for matching, so a quiz is never counted twice).
  const played = Array.from(new Set(Array.from(input.playedQuizIds).filter(Boolean).map(String)));
  const used = input.isPremium ? 0 : played.length;
  return {
    isPremium: input.isPremium,
    playedQuizIds: played,
    used,
    remaining: input.isPremium ? FREE_QUIZ_LIMIT : Math.max(0, FREE_QUIZ_LIMIT - used),
    limitReached: !input.isPremium && used >= FREE_QUIZ_LIMIT,
  };
}

/**
 * Whether this quiz may be opened: Premium always, a quiz already played
 * always (replays are free), a new quiz only while a free slot is left.
 */
export function canPlayQuiz(
  allowance: Pick<FreeQuizAllowance, 'isPremium' | 'playedQuizIds' | 'used'>,
  quizId: string,
  slug?: string | null,
): boolean {
  if (allowance.isPremium) return true;
  if (allowance.playedQuizIds.includes(String(quizId))) return true;
  if (slug && allowance.playedQuizIds.includes(slug)) return true;
  return allowance.used < FREE_QUIZ_LIMIT;
}

/** Where a player goes when the fourth new quiz is opened. */
export function lockedPaywallHref(quizSlugOrId: string): string {
  return `/premium?vergrendeld=1&terug=${encodeURIComponent(`/quiz/${quizSlugOrId}`)}`;
}

/* ── Guests ─────────────────────────────────────────────────────────────── */

const GUEST_PLAYED_KEY = 'bq:free-quizzes';

interface GuestPlayedQuiz {
  id: string;
  slug?: string;
}

function readGuestList(): GuestPlayedQuiz[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_PLAYED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is GuestPlayedQuiz =>
        Boolean(entry) && typeof entry === 'object' && typeof (entry as GuestPlayedQuiz).id === 'string',
      )
      .map((entry) => ({ id: entry.id, slug: typeof entry.slug === 'string' ? entry.slug : undefined }));
  } catch {
    return [];
  }
}

/**
 * The quizzes a guest has played in this browser: the parked attempts plus
 * the remembered list. One entry per quiz.
 */
export function readGuestPlayedQuizzes(): GuestPlayedQuiz[] {
  const byId = new Map<string, GuestPlayedQuiz>();
  for (const entry of readGuestList()) byId.set(entry.id, entry);
  for (const attempt of readPendingAttempts()) {
    if (!byId.has(attempt.quizId)) byId.set(attempt.quizId, { id: attempt.quizId, slug: attempt.quizSlug || undefined });
  }
  return Array.from(byId.values());
}

/** Remember that a guest finished this quiz, so it stays a free replay. */
export function rememberGuestPlayedQuiz(quizId: string, slug?: string | null): void {
  if (typeof window === 'undefined') return;
  const list = readGuestList().filter((entry) => entry.id !== quizId);
  list.push({ id: quizId, slug: slug || undefined });
  try {
    window.localStorage.setItem(GUEST_PLAYED_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    // Private mode or a full quota: the parked attempts still count.
  }
}

/** The allowance of a guest in this browser. Call from the client only. */
export function readGuestAllowance(): FreeQuizAllowance {
  const played = readGuestPlayedQuizzes();
  const allowance = buildFreeQuizAllowance({ isPremium: false, playedQuizIds: played.map((entry) => entry.id) });
  // Slugs make `canPlayQuiz` match a quiz opened by slug, without counting
  // the same quiz twice.
  return {
    ...allowance,
    playedQuizIds: [
      ...allowance.playedQuizIds,
      ...played.map((entry) => entry.slug).filter((slug): slug is string => Boolean(slug)),
    ],
  };
}
