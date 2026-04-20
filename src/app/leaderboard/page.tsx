import { Metadata } from 'next';
import { connectDB, User, Category } from '@/database';
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

async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
  await connectDB();
  const users = await User.find({ xp: { $gt: 0 } })
    .sort({ xp: -1 })
    .limit(100)
    .select('name xp image isPremium streak quizzesPlayed averageScore createdAt bestStreak')
    .lean();

  return users.map(user => ({
    _id: user._id.toString(),
    totalPoints: user.xp || 0,
    quizzesPlayed: user.quizzesPlayed || 0,
    avgScore: user.averageScore || 0,
    recentActivity: true,
    name: user.name || 'Speler',
    image: user.image || undefined,
    isPremium: user.isPremium || false,
    streak: user.streak || 0,
    bestStreak: user.bestStreak || 0,
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
    getLeaderboardData(),
    getCategories()
  ]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 2xl:px-32 max-w-[1800px] py-8 md:py-12">
        <Breadcrumb
          items={[
            { label: 'Ranglijst' },
          ]}
          className="mb-8"
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
