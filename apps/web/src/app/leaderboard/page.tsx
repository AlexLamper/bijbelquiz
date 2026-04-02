import { Metadata } from 'next';
import { connectDB, UserProgress, Category } from '@bijbelquiz/database';
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

export const dynamic = 'force-dynamic';

async function getLeaderboardData(timeFilter: string = 'all', categorySlug: string = 'all') {
  await connectDB();
  
  // Build date filter
  let dateFilter = {};
  const now = new Date();
  if (timeFilter === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = { completedAt: { $gte: weekAgo } };
  } else if (timeFilter === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilter = { completedAt: { $gte: monthAgo } };
  }

  // Build category filter pipeline
  const categoryPipeline: Record<string, unknown>[] = [];
  if (categorySlug !== 'all') {
    const category = await Category.findOne({ slug: categorySlug }).lean();
    if (category) {
      categoryPipeline.push(
        {
          $lookup: {
            from: "quizzes",
            localField: "quizId",
            foreignField: "_id",
            as: "quizInfo"
          }
        },
        { $unwind: "$quizInfo" },
        { $match: { "quizInfo.categoryId": category._id } }
      );
    }
  }

  // Recent activity threshold (played in last 7 days)
  const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const leaderboard = await UserProgress.aggregate([
    // Apply date filter first
    ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
    // Apply category filter
    ...categoryPipeline,
    // Sort by score desc
    { $sort: { score: -1 } },
    // Group by User and Quiz to get the best score for each unique quiz
    {
      $group: {
        _id: { userId: "$userId", quizId: "$quizId" },
        bestScore: { $max: "$score" },
        totalQuestions: { $first: "$totalQuestions" },
        lastPlayed: { $max: "$completedAt" }
      }
    },
    // Group by User to sum all their best scores
    {
      $group: {
        _id: "$_id.userId",
        totalPoints: { $sum: "$bestScore" },
        quizzesPlayed: { $sum: 1 },
        totalQuestions: { $sum: "$totalQuestions" },
        lastActivity: { $max: "$lastPlayed" }
      }
    },
    // Calculate average score percentage
    {
      $addFields: {
        avgScore: {
          $cond: {
            if: { $gt: ["$totalQuestions", 0] },
            then: { $round: [{ $multiply: [{ $divide: ["$totalPoints", "$totalQuestions"] }, 100] }, 0] },
            else: 0
          }
        },
        recentActivity: { $gte: ["$lastActivity", recentThreshold] }
      }
    },
    // Join with Users collection to get profile info
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo"
      }
    },
    // Remove entries where user doesn't exist
    { $unwind: "$userInfo" },
    // Select only needed fields
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
  ]);

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
      <div className="container px-4 py-8 md:py-12 mx-auto max-w-5xl">
        <Breadcrumb
          items={[
            { label: 'Ranglijst' },
          ]}
          className="mb-6"
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
