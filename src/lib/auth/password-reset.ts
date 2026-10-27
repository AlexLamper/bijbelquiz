import bcrypt from 'bcryptjs';

import { connectDB, User } from '@/database';
import { sendAccountMail } from './mail';
import { buildResetUrl, createResetToken, hashResetToken, isWellFormedResetToken, RESET_TOKEN_TTL_MS } from './reset-token';

/**
 * "Wachtwoord vergeten" and "wachtwoord herstellen", the database side. The
 * token rules live in `reset-token.ts`.
 *
 * Neither function tells the caller whether an account exists: the request
 * route answers the same thing for every address, and the reset only says
 * "this link is not valid (any more)".
 */

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://www.bijbelquiz.com').replace(/\/$/, '');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
}

/**
 * Store a fresh token for `email` (when it belongs to an account) and mail
 * the link. Resolves quietly for unknown addresses.
 */
export async function requestPasswordReset(email: string, now: Date = new Date()): Promise<void> {
  await connectDB();
  const user = await User.findOne({ email }).select('_id email name').lean();
  if (!user) return;

  const { token, hash, expiresAt } = createResetToken(now);
  await User.updateOne(
    { _id: user._id },
    { $set: { passwordResetTokenHash: hash, passwordResetExpiresAt: expiresAt } },
  );

  const link = buildResetUrl(token, siteOrigin());
  const minutes = Math.round(RESET_TOKEN_TTL_MS / 60000);
  const greeting = user.name?.trim() ? `Hoi ${user.name.trim()},` : 'Hoi,';

  await sendAccountMail({
    to: user.email,
    subject: 'Je wachtwoord herstellen - BijbelQuiz',
    text: [
      greeting,
      '',
      'Je hebt gevraagd om een nieuw wachtwoord voor je BijbelQuiz-account. Kies er een via deze link:',
      '',
      link,
      '',
      `De link werkt ${minutes} minuten en maar een keer.`,
      'Heb je dit niet gevraagd? Dan kun je deze mail negeren; je wachtwoord blijft hetzelfde.',
      '',
      'BijbelQuiz',
    ].join('\n'),
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      '<p>Je hebt gevraagd om een nieuw wachtwoord voor je BijbelQuiz-account.</p>',
      `<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#35548C;color:#ffffff;font-weight:800;text-decoration:none">Nieuw wachtwoord kiezen</a></p>`,
      `<p>De link werkt ${minutes} minuten en maar een keer.<br>Heb je dit niet gevraagd? Dan kun je deze mail negeren; je wachtwoord blijft hetzelfde.</p>`,
      '<p>BijbelQuiz</p>',
    ].join(''),
  });
}

export type ResetResult = { ok: true; email: string } | { ok: false };

/**
 * Set a new password with a token from the mail. One atomic update finds the
 * user by the token's hash, checks the expiry, writes the password and clears
 * the token, so a link can be used once even when it is opened twice at once.
 */
export async function resetPasswordWithToken(token: string, password: string, now: Date = new Date()): Promise<ResetResult> {
  if (!isWellFormedResetToken(token)) return { ok: false };

  await connectDB();
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    { passwordResetTokenHash: hashResetToken(token), passwordResetExpiresAt: { $gt: now } },
    { $set: { password: hashedPassword }, $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 } },
    { new: true, projection: { email: 1 } },
  ).lean();

  return user ? { ok: true, email: user.email } : { ok: false };
}

/** Whether a link is still worth showing the form for. Read-only. */
export async function isResetTokenUsable(token: unknown, now: Date = new Date()): Promise<boolean> {
  if (!isWellFormedResetToken(token)) return false;
  await connectDB();
  const found = await User.exists({ passwordResetTokenHash: hashResetToken(token), passwordResetExpiresAt: { $gt: now } });
  return Boolean(found);
}
