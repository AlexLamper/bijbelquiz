import { randomBytes } from 'node:crypto';

/**
 * Duel invite links.
 *
 * Same idea as the room invites in `lib/multiplayer/invite.ts`: a real URL on
 * the website, so it survives a WhatsApp group and lands somewhere useful for
 * somebody without the app, while the app (once its link files list `/duel/*`)
 * opens it directly. The token is the only secret: whoever holds the link may
 * take the empty seat, which is the point of sharing it.
 */

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://www.bijbelquiz.com'
  ).replace(/\/$/, '');
}

/** 12 url-safe characters, 72 bits: unguessable, still short in a chat. */
export function createInviteToken(): string {
  return randomBytes(9).toString('base64url');
}

export function normalizeInviteToken(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const token = raw.trim();
  return /^[A-Za-z0-9_-]{6,64}$/.test(token) ? token : null;
}

export function buildDuelInviteUrl(token: string, origin?: string): string {
  const base = (origin || siteOrigin()).replace(/\/$/, '');
  return `${base}/duel/${encodeURIComponent(token)}`;
}

export function buildDuelInviteMessage(token: string, challengerName: string, origin?: string): string {
  const name = challengerName.trim() || 'Iemand';
  return [
    `${name} daagt je uit voor een duel op BijbelQuiz!`,
    '3 rondes van 3 vragen, om de beurt. Je speelt dit duel gratis.',
    '',
    buildDuelInviteUrl(token, origin),
  ].join('\n');
}
