import { Metadata } from 'next';
import { connectDB, UserProgress, Category } from '@bijbelquiz/database';
import type { PipelineStage } from 'mongoose';
import Breadcrumb from '@/components/Breadcrumb';
import LeaderboardClient from './LeaderboardClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface LeaderboardEntry {
  _id: string;
  totalPoints: number;
  quizzesPlayed: number;
  name: string;
  image?: string;
  isPremium: boolean;
  streak: number;
  avgScore: number;
  bestStreak: number;
  recentActivity: boolean;
}

export interface CategoryOption {
  _id: string;
  title: string;
  slug: string;
}

export const metadata: Metadata = {
  title: 'Ranglijst - BijbelQuiz',
  description: 'Bekijk de topspelers van BijbelQuiz. Verdien punten door quizzen te spelen en stijg in de ranglijst.',
  alternates: {
    canonical: '/leaderboard',
  },
  openGraph: {
    title: 'De BijbelQuiz Ranglijst - Wie heeft de meeste bijbelkennis?',
    description: 'Strijd mee voor de eerste plek! Speel quizzen, verdien punten en word de nummer 1.',
    url: 'https://www.bijbelquiz.com/leaderboard',
  }
};

async function getLeaderboardData(timeFilter: string, categorySlug: string): Promise<LeaderboardEntry[]> {
  await connectDB();

  const now = new Date();
  let startDate = new Date(0); // default all time

  if (timeFilter === 'week') {
    // Get start of current week (Monday)
    startDate = new Date(now);
    const day = startDate.getDay() || 7;
    if (day !== 1) startDate.setHours(-24 * (day - 1));
    startDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Base match for UserProgress
  const matchStage: any = {};
  if (timeFilter !== 'all') {
    matchStage.createdAt = { $gte: startDate };
  }

  // Add category filter if specified
  if (categorySlug !== 'all') {
    const category = await Category.findOne({ slug: categorySlug }).select('_id').lean();
    if (category) {
      matchStage.categoryId = category._id;
    }
  }

  const pipeline: PipelineStage[] = [];

  // If we have filters, we need to match progress records first, then group by user
  if (Object.keys(matchStage).length > 0) {
    pipeline.push(
      { $match: matchStage },
      {
        $group: {
          _id: "$userId",
          totalPoints: { $sum: "$score" },
          quizzesPlayed: { $sum: 1 },
          avgScore: { $avg: "$score" },
          recentActivity: { $max: "$createdAt" }
        }
      }
    );
  } else {
    // For all-time, we can group directly but maybe simpler to just hit User.xp
    // but User.xp is all-time points. Since we want stats per category too,
    // let's stick to aggregating UserProgress for consistency unless performance requires otherwise.
    pipeline.push({
      $group: {
        _id: "$userId",
        totalPoints: { $sum: "$score" },
        quizzesPlayed: { $sum: 1 },
        avgScore: { $avg: "$score" },
        recentActivity: { $max: "$createdAt" }
      }
    });
  }

  // Join with User collection to get name, avatar, premium status
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo"
      }
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        _id: 1,
        totalPoints: 1,
        quizzesPlayed: 1,
        avgScore: 1,
        recentActivity: 1,
        name: "$userInfo.name",
        image: "$userInfo.image",
        isPremium: "$userInfo.isPremium",
        streak: "$userInfo.streak",
        bestStreak: "$userInfo.streak", // Could track historical max in future
      }
    },
    // Sort by total points descending
    { $sort: { totalPoints: -1 } },
    // Top 100
    { $limit: 100 }
  );

  const leaderboard = await UserProgress.aggregate(pipeline);

  // Convert MongoDB ObjectIds to strings for client component
  return leaderboard.map(entry => ({
    ...entry,
    _id: entry._id.toString()
  }));
}

async function getCategories(): Promise<CategoryOption[]> {
  await connectDB();
  const categories = await Category.find({ isActive: true })
    .select('title slug')
    .sort({ sortOrder: 1 })
    .lean();

  return categories.map(cat => ({
    _id: cat._id.toString(),
    title: cat.title,
    slug: cat.slug
  }));
}

interface SearchParams {
  time?: string;
  category?: string;
}

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const timeFilter = params?.time || 'all';
  const categorySlug = params?.category || 'all';

  const [leaderboard, categories] = await Promise.all([
    getLeaderboardData(timeFilter, categorySlug),
    getCategories()
  ]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 max-w-[1400px] 2xl:max-w-[1700px] py-8 md:py-12 pb-8">
        <Breadcrumb
          items={[
            { label: 'Ranglijst' },
          ]}
          className="mb-12"
        />

        <LeaderboardClient
          initialData={leaderboard}
          initialTimeFilter={timeFilter}
          initialCategorySlug={categorySlug}
          categories={categories}
          currentUserId={session?.user?.id || null}
        />
      </div>
    </div>
  );
}
