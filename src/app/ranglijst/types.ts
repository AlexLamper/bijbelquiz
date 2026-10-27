/** One row of the board, the global one or a group's. */
export interface BoardRow {
  id: string;
  name: string;
  xp: number;
}

export function formatXp(xp: number): string {
  return `${new Intl.NumberFormat('nl-NL').format(Math.max(0, Math.round(xp)))} XP`;
}
