/** Room codes as the server makes them: 6 characters, letters and digits. */
export const ROOM_CODE_LENGTH = 6;

/** Letters and digits only, upper case: what the server's codes are made of. */
export function cleanRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Pull a room code out of whatever was pasted: the bare code, "Of vul de code
 * in: K7PQ2M", or the invite link itself (/samen-spelen/K7PQ2M/lobby).
 */
export function extractRoomCode(raw: string): string {
  const fromLink = raw.match(/samen-spelen\/([A-Za-z0-9]{4,10})/);
  if (fromLink) return cleanRoomCode(fromLink[1]);
  const fromSentence = raw.match(/code(?: in)?:\s*([A-Za-z0-9]{4,10})/i);
  if (fromSentence) return cleanRoomCode(fromSentence[1]);
  return cleanRoomCode(raw);
}
