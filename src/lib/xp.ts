interface ProgressLike {
  score?: number | null;
  totalQuestions?: number | null;
}

function toSafeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function calculateAttemptXp(baseRewardXp: number, score: number, totalQuestions: number): number {
  const safeReward = Math.max(0, toSafeNumber(baseRewardXp, 0));
  const safeScore = Math.max(0, toSafeNumber(score, 0));
  const safeTotalQuestions = Math.max(1, Math.floor(toSafeNumber(totalQuestions, 1)));
  const ratio = Math.max(0, Math.min(1, safeScore / safeTotalQuestions));

  return Math.round(safeReward * ratio);
}

export function getHighestEarnedAttemptXp(baseRewardXp: number, attempts: ProgressLike[]): number {
  let highest = 0;

  for (const attempt of attempts) {
    const earnedForAttempt = calculateAttemptXp(baseRewardXp, attempt.score ?? 0, attempt.totalQuestions ?? 1);
    if (earnedForAttempt > highest) {
      highest = earnedForAttempt;
    }
  }

  return highest;
}
