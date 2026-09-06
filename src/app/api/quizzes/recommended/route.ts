import { NextRequest, NextResponse } from 'next/server';

import { connectDB, Quiz, User, UserProgress } from '@/database';
import { getSession } from '@/lib/get-session';
import { buildQuizProgressMap } from '@/lib/quiz-progress';
import {
  describeRecommendationProfile,
  hasRecommendationProfile,
  recommendQuizzes,
} from '@/lib/quiz-recommendations';
import { normalizeOnboardingSettings } from '@/lib/user-settings';
import { resolveQuizImageUrl } from '@/lib/quiz-image';

export const dynamic = 'force-dynamic';

/**
 * The recommendation list, for whichever client asks.
 *
 * Shared by the website and the Flutter app through `getSession`, which accepts
 * both the web cookie and a mobile bearer token, so both platforms recommend
 * the same quizzes in the same order from the same stored preferences.
 *
 * `?limit=` caps the list; questions are deliberately not included - this is a
 * list to choose from, and shipping every question of every candidate would
 * make it many times larger than the screen that renders it.
 */
export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const requestedLimit = Number.parseInt(req.nextUrl.searchParams.get('limit') || '', 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 20)
    : 6;

  try {
    await connectDB();

    const [user, quizzes, progressDocs] = await Promise.all([
      User.findById(session.user.id).select('onboarding').lean(),
      Quiz.find({ $or: [{ status: 'approved' }, { status: { $exists: false } }] })
        .populate('categoryId', 'title slug')
        .select('title slug description imageUrl difficulty isPremium categoryId questions')
        .limit(96)
        .lean(),
      UserProgress.find({ userId: session.user.id })
        .select('quizId correctAnswers wrongAnswers totalQuestions completedAt')
        .sort({ completedAt: -1 })
        .lean(),
    ]);

    const progressByQuizId = buildQuizProgressMap(
      progressDocs as unknown as Array<{
        quizId?: unknown;
        correctAnswers?: unknown;
        wrongAnswers?: unknown;
        totalQuestions?: unknown;
        completedAt?: unknown;
      }>
    );

    const candidates = quizzes.map((quiz) => {
      const id = String((quiz as { _id: unknown })._id);
      return {
        _id: id,
        title: String((quiz as { title?: unknown }).title || ''),
        slug: (quiz as { slug?: string }).slug,
        description: (quiz as { description?: string }).description,
        imageUrl: resolveQuizImageUrl(quiz),
        difficulty: (quiz as { difficulty?: string }).difficulty,
        isPremium: Boolean((quiz as { isPremium?: boolean }).isPremium),
        categoryId: (quiz as { categoryId?: unknown }).categoryId as
          | { _id?: string; title?: string; slug?: string }
          | string
          | undefined,
        // Only the count is used by the ranking, so the questions themselves
        // never leave the server here.
        questionCount: ((quiz as { questions?: unknown[] }).questions || []).length,
        questions: (quiz as { questions?: unknown[] }).questions || [],
        progress: progressByQuizId[id],
      };
    });

    const onboarding = normalizeOnboardingSettings(
      (user as { onboarding?: Record<string, unknown> } | null)?.onboarding
    );

    const recommendations = recommendQuizzes(candidates, onboarding, {
      limit,
      isPremiumUser: Boolean(session.user.isPremium),
    });

    return NextResponse.json({
      hasProfile: hasRecommendationProfile(onboarding),
      profileSummary: describeRecommendationProfile(onboarding),
      onboarding,
      recommendations: recommendations.map(({ quiz, score, reasons }) => ({
        score,
        reasons,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          slug: quiz.slug,
          description: quiz.description,
          imageUrl: quiz.imageUrl,
          difficulty: quiz.difficulty,
          isPremium: quiz.isPremium,
          category: typeof quiz.categoryId === 'object' && quiz.categoryId
            ? { title: quiz.categoryId.title, slug: quiz.categoryId.slug }
            : null,
          questionCount: quiz.questionCount,
          attempts: quiz.progress?.attempts ?? 0,
        },
      })),
    });
  } catch (error) {
    console.error('[QUIZZES_RECOMMENDED_GET]', error);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
