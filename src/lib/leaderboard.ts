import { connectDB, User, UserProgress } from '@/database';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

export interface LeaderboardEntry {
  _id: string;
  name: string;
  xp: number;
  streak: number;
  badges: string[];
  image?: string | null;
  levelTitle?: string;
  isPremium?: boolean;
  createdAt?: string;
}

function getPeriodStartDate(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  if (period === 'weekly') {
    return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  }

  if (period === 'monthly') {
    return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  }

  return null;
}

export function parseLeaderboardPeriod(value: string | null | undefined): LeaderboardPeriod {
  if (value === 'weekly' || value === 'monthly' || value === 'all-time') {
    return value;
  }

  return 'all-time';
}

export async function getLeaderboard(period: LeaderboardPeriod, limit = 100): Promise<LeaderboardEntry[]> {
  await connectDB();

  if (period === 'all-time') {
    const users = await User.find({ xp: { $gt: 0 } })
      .sort({ xp: -1 })
      .limit(limit)
      .select('name email xp streak badges image levelTitle isPremium createdAt')
      .lean();

    return users.map((user) => ({
      _id: String(user._id),
      name: user.name || 'Speler',
      xp: user.xp || 0,
      streak: user.streak || 0,
      badges: Array.isArray(user.badges) ? user.badges : [],
      image: user.image || null,
      levelTitle: user.levelTitle || 'Beginner',
      isPremium: Boolean(user.isPremium),
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date(0).toISOString(),
    }));
  }

  const periodStart = getPeriodStartDate(period);
  if (!periodStart) {
    return [];
  }

  const leaderboardRows = await UserProgress.aggregate([
    { $match: { completedAt: { $gte: periodStart }, xpEarned: { $gt: 0 } } },
    {
      $group: {
        _id: '$userId',
        xp: { $sum: '$xpEarned' },
      },
    },
    { $sort: { xp: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: { $toString: '$_id' },
        xp: 1,
        name: { $ifNull: ['$user.name', 'Speler'] },
        streak: { $ifNull: ['$user.streak', 0] },
        badges: { $ifNull: ['$user.badges', []] },
        image: { $ifNull: ['$user.image', null] },
        levelTitle: { $ifNull: ['$user.levelTitle', 'Beginner'] },
        isPremium: { $ifNull: ['$user.isPremium', false] },
        createdAt: '$user.createdAt',
      },
    },
  ]);

  return leaderboardRows.map((row) => ({
    _id: String(row._id),
    name: row.name || 'Speler',
    xp: Number(row.xp) || 0,
    streak: Number(row.streak) || 0,
    badges: Array.isArray(row.badges) ? row.badges : [],
    image: row.image || null,
    levelTitle: row.levelTitle || 'Beginner',
    isPremium: Boolean(row.isPremium),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date(0).toISOString(),
  }));
}
