/** Which of the three room screens belongs to a room status. */
export function routeForRoom(roomCode: string, status: string): string {
  const code = roomCode.trim().toUpperCase();
  if (status === 'finished') return `/samen-spelen/${code}/uitslag`;
  if (status === 'lobby') return `/samen-spelen/${code}/lobby`;
  return `/samen-spelen/${code}/spel`;
}

export type RoomView = 'lobby' | 'game' | 'results';

/** True when `status` is shown on `view`, so the page does not need to move. */
export function statusBelongsTo(view: RoomView, status: string): boolean {
  if (view === 'lobby') return status === 'lobby';
  if (view === 'results') return status === 'finished';
  return status !== 'lobby' && status !== 'finished';
}
