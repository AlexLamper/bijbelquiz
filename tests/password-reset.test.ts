import assert from 'node:assert/strict';
import test from 'node:test';

import { createRateLimiter } from '@/lib/auth/rate-limit';
import {
  buildResetUrl,
  createResetToken,
  hashResetToken,
  isWellFormedResetToken,
  normalizeEmail,
  RESET_TOKEN_TTL_MS,
  validateNewPassword,
  verifyResetToken,
} from '@/lib/auth/reset-token';
import { subscriptionBlocksDeletion } from '@/lib/account-deletion';

test('a reset token is long, url-safe and stored only as its hash', () => {
  const now = new Date('2026-10-27T12:00:00Z');
  const { token, hash, expiresAt } = createResetToken(now);

  assert.ok(isWellFormedResetToken(token));
  assert.equal(token.length, 43);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(hash, hashResetToken(token));
  assert.equal(expiresAt.getTime(), now.getTime() + RESET_TOKEN_TTL_MS);
});

test('two tokens are never the same', () => {
  const seen = new Set<string>();
  for (let index = 0; index < 200; index += 1) seen.add(createResetToken().token);
  assert.equal(seen.size, 200);
});

test('verifyResetToken accepts the right token before expiry only', () => {
  const now = new Date('2026-10-27T12:00:00Z');
  const { token, hash, expiresAt } = createResetToken(now);
  const stored = { hash, expiresAt };

  assert.equal(verifyResetToken(token, stored, now), true);
  assert.equal(verifyResetToken(token, stored, new Date(expiresAt.getTime() - 1)), true);
  assert.equal(verifyResetToken(token, stored, expiresAt), false, 'expires exactly at expiresAt');
  assert.equal(verifyResetToken(token, stored, new Date(expiresAt.getTime() + 1)), false);
});

test('verifyResetToken rejects other tokens, junk and a used (cleared) token', () => {
  const now = new Date();
  const first = createResetToken(now);
  const second = createResetToken(now);

  assert.equal(verifyResetToken(second.token, { hash: first.hash, expiresAt: first.expiresAt }, now), false);
  assert.equal(verifyResetToken(first.hash, { hash: first.hash, expiresAt: first.expiresAt }, now), false, 'the hash is not a token');
  assert.equal(verifyResetToken('', { hash: first.hash, expiresAt: first.expiresAt }, now), false);
  assert.equal(verifyResetToken(undefined, { hash: first.hash, expiresAt: first.expiresAt }, now), false);
  assert.equal(verifyResetToken(`${first.token.slice(0, 42)}!`, { hash: first.hash, expiresAt: first.expiresAt }, now), false);
  // After a reset the hash and expiry are unset on the user.
  assert.equal(verifyResetToken(first.token, { hash: null, expiresAt: null }, now), false);
});

test('isWellFormedResetToken only takes the token shape', () => {
  assert.equal(isWellFormedResetToken('a'.repeat(43)), true);
  assert.equal(isWellFormedResetToken('a'.repeat(42)), false);
  assert.equal(isWellFormedResetToken('a'.repeat(44)), false);
  assert.equal(isWellFormedResetToken({ $ne: null }), false, 'no query objects');
  assert.equal(isWellFormedResetToken(42), false);
});

test('buildResetUrl points at the reset page on the given origin', () => {
  assert.equal(
    buildResetUrl('abc_DEF-123', 'https://www.bijbelquiz.com/'),
    'https://www.bijbelquiz.com/wachtwoord-herstellen?token=abc_DEF-123',
  );
});

test('normalizeEmail trims, lowercases and rejects junk', () => {
  assert.equal(normalizeEmail('  Alex@Voorbeeld.NL '), 'alex@voorbeeld.nl');
  assert.equal(normalizeEmail('geen-adres'), null);
  assert.equal(normalizeEmail({ $gt: '' }), null);
  assert.equal(normalizeEmail(''), null);
});

test('validateNewPassword enforces the registration minimum and a sane maximum', () => {
  assert.equal(validateNewPassword('12345').ok, false);
  assert.equal(validateNewPassword('123456').ok, true);
  assert.equal(validateNewPassword('x'.repeat(129)).ok, false);
  assert.equal(validateNewPassword(undefined).ok, false);
});

test('the rate limiter allows max hits per window, per key', () => {
  const limiter = createRateLimiter({ max: 3, windowMs: 1000 });
  const t0 = 1_000_000;

  assert.equal(limiter.hit('a', t0), true);
  assert.equal(limiter.hit('a', t0 + 10), true);
  assert.equal(limiter.hit('a', t0 + 20), true);
  assert.equal(limiter.hit('a', t0 + 30), false);
  assert.equal(limiter.hit('b', t0 + 30), true, 'other keys are separate');
  assert.ok(limiter.retryAfter('a', t0 + 30) >= 1);

  // The first hit ages out of the window.
  assert.equal(limiter.hit('a', t0 + 1000), true);
  assert.equal(limiter.hit('a', t0 + 1001), false);
  assert.equal(limiter.retryAfter('b', t0 + 2000), 0);
});

test('a running Stripe subscription blocks account deletion until it is cancelled', () => {
  assert.equal(subscriptionBlocksDeletion('active', false), true);
  assert.equal(subscriptionBlocksDeletion('trialing', false), true);
  assert.equal(subscriptionBlocksDeletion('active', true), false, 'cancelled at period end');
  assert.equal(subscriptionBlocksDeletion('canceled', false), false);
  assert.equal(subscriptionBlocksDeletion(undefined, false), false);
});

test('safeCallbackUrl only keeps paths on this site', async () => {
  const { safeCallbackUrl } = await import('@/lib/auth/callback-url');
  assert.equal(safeCallbackUrl('/quiz/abc/beoordeling?x=1'), '/quiz/abc/beoordeling?x=1');
  assert.equal(safeCallbackUrl(null), '/dashboard');
  assert.equal(safeCallbackUrl('https://evil.example/'), '/dashboard');
  assert.equal(safeCallbackUrl('//evil.example/'), '/dashboard');
  assert.equal(safeCallbackUrl('/\\evil.example'), '/dashboard');
  assert.equal(safeCallbackUrl('/inloggen?callbackUrl=/x'), '/dashboard');
});
