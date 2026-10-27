import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Password reset tokens: the pure part, kept apart from the database so it can
 * be tested on its own.
 *
 * - The token itself (32 random bytes, url-safe) only ever travels in the
 *   e-mail. The user document stores its SHA-256, so a database dump or a log
 *   of the users collection does not contain a usable link.
 * - It expires after `RESET_TOKEN_TTL_MS`, and is single use: the reset sets
 *   the new password and clears the hash in one atomic update (see
 *   `password-reset.ts`).
 * - A new request replaces the old hash, so only the newest link works.
 */

/** One hour: long enough to find the mail, short enough to be useless later. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Same minimum as registration. */
export const PASSWORD_MIN_LENGTH = 6;
/** bcrypt only looks at the first 72 bytes; anything far beyond is a mistake or abuse. */
export const PASSWORD_MAX_LENGTH = 128;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface ResetTokenPair {
  /** Goes in the link. Never stored. */
  token: string;
  /** Goes on the user document. */
  hash: string;
  expiresAt: Date;
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createResetToken(now: Date = new Date()): ResetTokenPair {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    hash: hashResetToken(token),
    expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
  };
}

/** The shape a real token has, so junk never reaches the database. */
export function isWellFormedResetToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value);
}

/**
 * Whether `token` matches a stored hash that has not expired yet. The lookup
 * by hash already does this in the database; this is the same rule for
 * callers (and tests) that hold the stored values.
 */
export function verifyResetToken(
  token: unknown,
  stored: { hash?: string | null; expiresAt?: Date | null },
  now: Date = new Date(),
): boolean {
  if (!isWellFormedResetToken(token)) return false;
  if (!stored.hash || !stored.expiresAt) return false;
  if (stored.expiresAt.getTime() <= now.getTime()) return false;

  const expected = Buffer.from(stored.hash, 'hex');
  const actual = Buffer.from(hashResetToken(token), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 190) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function validateNewPassword(value: unknown): { ok: true; password: string } | { ok: false; error: string } {
  if (typeof value !== 'string' || value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Kies een wachtwoord van minimaal ${PASSWORD_MIN_LENGTH} tekens.` };
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: `Je wachtwoord mag maximaal ${PASSWORD_MAX_LENGTH} tekens zijn.` };
  }
  return { ok: true, password: value };
}

/** The reset link for a token, on the site's own origin. */
export function buildResetUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, '')}/wachtwoord-herstellen?token=${encodeURIComponent(token)}`;
}
