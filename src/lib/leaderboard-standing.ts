import mongoose from 'mongoose';

import { connectDB, User, UserProgress } from '@/database';
import type { LeaderboardPeriod } from '@/lib/leaderboard';

/**
 * The signed-in player's own standing on the ranglijst: their XP for the
 * period and how far they are from the place above them ("Nog 71 XP tot
 * plek 4").
 *
 * Separate from `lib/leaderboard.ts` because that module is the contract of
 * `/api/leaderboard`, which the app reads; this is website-only and only adds.
 */

/** Same rolling window as the monthly board (`lib/leaderboard.ts`). */
export const MONTHLY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface StandingEntry {
  _id: string;
  xp: number;
}

export interface NextPlaceGap {
  /** 1-based place to reach. */
  place: number;
  /** XP still needed to pass the player there (at least 1). */
  xp: number;
}

/**
 * The XP a player needs to pass whoever is one row above them. Null for the
 * first row, or when the player is not on the list.
 *
 * Passing means strictly more: on a tie the list keeps the older account
 * first, so 610 vs 540 needs 71, and a tie needs 1.
 */
export function nextPlaceGap(entries: StandingEntry[], userId: string | null | undefined): NextPlaceGap | null {
  if (!userId) return null;
  const index = entries.findIndex((entry) => entry._id === userId);
  if (index <= 0) return null;
  const above = entries[index - 1];
  const mine = entries[index];
  return { place: index, xp: Math.max(1, (Number(above.xp) || 0) - (Number(mine.xp) || 0) + 1) };
}

/**
 * The player's XP for the period, also when they are outside the top 100
 * that the board loads. Monthly counts the same `UserProgress.xpEarned` rows
 * the monthly board sums; all-time is the account total.
 */
export async function getUserPeriodXp(period: LeaderboardPeriod, userId: string | null | undefined): Promise<number> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return 0;
  await connectDB();

  if (period === 'all-time') {
    const user = await User.findById(userId).select('xp').lean();
    return Math.max(0, Number(user?.xp) || 0);
  }

  const rows = await UserProgress.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        completedAt: { $gte: new Date(Date.now() - MONTHLY_WINDOW_MS) },
        xpEarned: { $gt: 0 },
      },
    },
    { $group: { _id: '$userId', xp: { $sum: '$xpEarned' } } },
  ]);
  return Math.max(0, Number(rows[0]?.xp) || 0);
}
