/**
 * Room invitations.
 *
 * A six-character code typed by hand is friction on both sides: the host reads
 * it out, everyone mistypes it, and somebody without the app has nowhere to go.
 * A link fixes all three - it opens the lobby, it survives being pasted into a
 * WhatsApp group, and it is the only acquisition channel this product has that
 * costs nothing.
 */

/** Marks a join that arrived through a shared link, for the funnel. */
export const INVITE_SOURCE_PARAM = 'bron';
export const INVITE_SOURCE_VALUE = 'uitnodiging';

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://www.bijbelquiz.com'
  ).replace(/\/$/, '');
}

/**
 * The URL to share. Points at the lobby, so somebody who taps it lands in the
 * room rather than on a page asking them for the code they were just sent.
 */
export function buildRoomInviteUrl(roomCode: string, origin?: string): string {
  const base = (origin || siteOrigin()).replace(/\/$/, '');
  const code = roomCode.trim().toUpperCase();
  return `${base}/samen-spelen/${code}/lobby?${INVITE_SOURCE_PARAM}=${INVITE_SOURCE_VALUE}`;
}

/**
 * The message that goes with it.
 *
 * Written to be pasted whole into a group chat: it says what it is, what to do,
 * and leaves the code visible for anyone whose client strips the link.
 */
export function buildRoomInviteMessage(
  roomCode: string,
  quizTitle: string,
  origin?: string,
): string {
  const code = roomCode.trim().toUpperCase();
  const title = quizTitle.trim() || 'een bijbelquiz';

  return [
    `Doe je mee met ${title} op BijbelQuiz?`,
    '',
    buildRoomInviteUrl(code, origin),
    '',
    `Of vul de code in: ${code}`,
  ].join('\n');
}
