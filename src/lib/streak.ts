export interface StreakUpdateResult {
  nextStreak: number;
}

function toAmsterdamDayStart(date: Date): number {
  const localString = date.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' });
  const [day, month, year] = localString.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function calculateNextStreak(previousDate: Date | null | undefined, currentStreak: number, now = new Date()): StreakUpdateResult {
  const normalizedCurrent = Math.max(0, currentStreak || 0);

  if (!previousDate) {
    return { nextStreak: 1 };
  }

  const startOfToday = toAmsterdamDayStart(now);
  const startOfPrevious = toAmsterdamDayStart(previousDate);
  const diffDays = Math.round((startOfToday - startOfPrevious) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { nextStreak: normalizedCurrent };
  }

  if (diffDays === 1) {
    return { nextStreak: normalizedCurrent + 1 };
  }

  return { nextStreak: 1 };
}
