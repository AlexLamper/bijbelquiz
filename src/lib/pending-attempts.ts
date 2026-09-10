/**
 * Quiz attempts finished without an account.
 *
 * A visitor can play every quiz, and the result screen offers to keep the
 * score if they sign in. For that offer to mean anything the score has to
 * survive the trip through the login or registration form, so it is parked in
 * this browser until a session appears. `PendingAttemptSync` (mounted once,
 * in `Providers`) then writes every parked attempt to the account through the
 * normal `/api/quiz/submit` route, which grades the answers itself.
 *
 * `localStorage`, not a cookie: nothing here is needed on the server before
 * the claim, and a cookie would ship the answers along with every request.
 */

export interface PendingAttemptAnswer {
  questionId: string;
  selectedAnswerId: string | null;
  selectedAnswerIndex: number | null;
}

export interface PendingAttempt {
  quizId: string;
  quizSlug: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  answers: PendingAttemptAnswer[];
  /** What the account would have earned, for the result screen. The server decides for real. */
  xpPreview: number;
  /** Client clock, ms since epoch. Doubles as the attempt's key in this list. */
  completedAt: number;
}

const STORAGE_KEY = 'bq:pending-attempts';

/** More than this and the list is being farmed, not saved. Oldest go first. */
export const MAX_PENDING_ATTEMPTS = 5;

/** A week: long enough to come back tomorrow, short enough not to be a surprise. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function isPendingAttempt(value: unknown): value is PendingAttempt {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.quizId === 'string' &&
    typeof candidate.score === 'number' &&
    typeof candidate.totalQuestions === 'number' &&
    typeof candidate.completedAt === 'number' &&
    Array.isArray(candidate.answers)
  );
}

function read(): PendingAttempt[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cutoff = Date.now() - MAX_AGE_MS;
    return parsed.filter(
      (entry): entry is PendingAttempt => isPendingAttempt(entry) && entry.completedAt >= cutoff
    );
  } catch {
    // Private mode, a full quota, or a value some other code wrote here: the
    // player still gets their result screen, only the parking fails.
    return [];
  }
}

function write(attempts: PendingAttempt[]): void {
  if (typeof window === 'undefined') return;

  try {
    if (attempts.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    }
  } catch {
    // Same reasoning as in `read`.
  }
}

/** Every attempt still waiting for an account, oldest first. */
export function readPendingAttempts(): PendingAttempt[] {
  return read().sort((a, b) => a.completedAt - b.completedAt);
}

/** Park a finished attempt. Returns the stored record. */
export function addPendingAttempt(
  attempt: Omit<PendingAttempt, 'completedAt'>
): PendingAttempt {
  const stored: PendingAttempt = { ...attempt, completedAt: Date.now() };
  const next = [...readPendingAttempts(), stored].slice(-MAX_PENDING_ATTEMPTS);
  write(next);
  return stored;
}

/** Forget one attempt, by its `completedAt` key. */
export function removePendingAttempt(completedAt: number): void {
  write(read().filter((attempt) => attempt.completedAt !== completedAt));
}

export function clearPendingAttempts(): void {
  write([]);
}
