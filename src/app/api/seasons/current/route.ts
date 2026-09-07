import { NextResponse } from 'next/server';

import { Category, Quiz, connectDB } from '@/database';
import { currentSeason, daysRemaining } from '@/lib/seasons';
import { normalizeQuizImagePath } from '@/lib/quiz-image';

/**
 * The seasonal pack that is live right now, if any.
 *
 * Answers `{ season: null }` rather than a 404 when nothing is running: for
 * most of the year that is the normal state, and a client should not have to
 * treat "no Advent in July" as an error.
 *
 * The countdown is computed here rather than on the client so a phone with a
 * wrong clock does not show a pack as expired.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const season = currentSeason();
    if (!season) {
      return NextResponse.json({ season: null });
    }

    await connectDB();

    // A pack is either a whole category or a hand-picked list. Neither being
    // set is the un-tagged state: the pack is real, it just has nothing behind
    // it yet, and the client hides the card rather than linking to an empty
    // page.
    const filter: Record<string, unknown> = {
      status: 'approved',
      isActive: { $ne: false },
    };

    if (season.quizIds?.length) {
      filter._id = { $in: season.quizIds };
    } else if (season.categorySlug) {
      const category = await Category.findOne({ slug: season.categorySlug })
        .select('_id')
        .lean();

      if (!category) {
        return NextResponse.json({
          season: serializeSeason(season),
          quizzes: [],
        });
      }

      filter.categoryId = category._id;
    } else {
      return NextResponse.json({ season: serializeSeason(season), quizzes: [] });
    }

    const quizzes = await Quiz.find(filter).limit(12).lean();

    return NextResponse.json({
      season: serializeSeason(season),
      quizzes: quizzes.map((quiz) => ({
        id: String(quiz._id),
        title: quiz.title,
        slug: quiz.slug,
        description: quiz.description,
        image: normalizeQuizImagePath(quiz.imageUrl),
        imageUrl: normalizeQuizImagePath(quiz.imageUrl),
        xpReward: quiz.rewardXp ?? 50,
        questionCount: quiz.questions?.length || 0,
        isPremium: Boolean(quiz.isPremium),
      })),
    });
  } catch (error) {
    console.error('[SEASONS_CURRENT_GET]', error);
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 });
  }
}

function serializeSeason(season: NonNullable<ReturnType<typeof currentSeason>>) {
  return {
    slug: season.slug,
    title: season.title,
    description: season.description,
    startsAt: season.startsAt.toISOString(),
    endsAt: season.endsAt.toISOString(),
    daysRemaining: daysRemaining(season),
    categorySlug: season.categorySlug ?? null,
  };
}
