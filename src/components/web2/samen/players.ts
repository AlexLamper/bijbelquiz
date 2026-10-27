import type { RoomPlayerSnapshot } from '@/lib/multiplayer/types';

/** "Jij" for the person looking, the account name for everybody else. */
export function playerName(player: Pick<RoomPlayerSnapshot, 'id' | 'name'>, userId: string | null): string {
  return player.id === userId ? 'Jij' : player.name;
}

/** Highest score first; ties on correct answers, then by name. */
export function standings(players: RoomPlayerSnapshot[]): RoomPlayerSnapshot[] {
  return [...players].sort(
    (a, b) => b.score - a.score || b.correctAnswers - a.correctAnswers || a.name.localeCompare(b.name, 'nl'),
  );
}

/** The host name shown in "bijbelquiz.com/samen-spelen". */
export function siteHost(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bijbelquiz.com';
  return base.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}
