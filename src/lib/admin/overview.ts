import { connectDB, Quiz, User } from '@/database';
import { isInternalAccount } from '@/lib/analytics/internal-accounts';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { getPremiumStats, type PremiumStats } from '@/lib/premium-stats';

/**
 * Everything `/beheer` (Overzicht) shows, as one loader so it can be tested
 * against a seeded database.
 */

export interface OverviewUser {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
  /** Premium right now, from any source (Stripe, store, lifetime, group, manual). */
  isPremium: boolean;
  /** Developer or app-reviewer account: shown as "Testaccount", never as a customer. */
  isInternal: boolean;
}

export interface OverviewQuiz {
  id: string;
  title: string;
  /** Missing on old documents; those are live, as the public catalogue reads them. */
  status: string;
  category: string | null;
  questionCount: number;
}

export interface AdminOverview {
  premium: PremiumStats;
  totalUsers: number;
  totalQuizzes: number;
  pendingQuizzes: number;
  recentUsers: OverviewUser[];
  recentQuizzes: OverviewQuiz[];
}

type LeanUser = {
  _id: unknown;
  name?: string;
  email?: string;
  createdAt?: Date;
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  hasLifetimePremium?: boolean;
  groupPremiumUntil?: Date | null;
};

type LeanQuiz = {
  _id: unknown;
  title: string;
  status?: string;
  categoryId?: { title?: string } | null;
  questions?: unknown[];
};

export async function getAdminOverview(now: Date = new Date()): Promise<AdminOverview> {
  await connectDB();

  const [premium, totalUsers, totalQuizzes, pendingQuizzes, users, quizzes] = await Promise.all([
    getPremiumStats(now),
    User.countDocuments(),
    Quiz.countDocuments(),
    Quiz.countDocuments({ status: 'pending' }),
    User.find()
      .select('name email createdAt isPremium premiumStripe premiumStore hasLifetimePremium groupPremiumUntil')
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .lean<LeanUser[]>(),
    Quiz.find()
      .select('title status categoryId questions._id createdAt')
      .populate('categoryId', 'title')
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .lean<LeanQuiz[]>(),
  ]);

  return {
    premium,
    totalUsers,
    totalQuizzes,
    pendingQuizzes,
    recentUsers: users.map((user) => ({
      id: String(user._id),
      name: user.name || 'Naamloos',
      email: user.email ?? '',
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      isPremium: getPremiumSnapshot(user).isPremium || Boolean(user.hasLifetimePremium),
      isInternal: isInternalAccount(user.email),
    })),
    recentQuizzes: quizzes.map((quiz) => ({
      id: String(quiz._id),
      title: quiz.title,
      status: quiz.status || 'approved',
      category: quiz.categoryId?.title ?? null,
      questionCount: quiz.questions?.length ?? 0,
    })),
  };
}
