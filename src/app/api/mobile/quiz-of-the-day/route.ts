/**
 * GET /api/mobile/quiz-of-the-day - the one quiz the home screen's daily card
 * needs, and nothing else.
 *
 * The card used to be built from `/api/quizzes`, which returns every quiz with
 * all of its questions, answers and explanations, uncached, just so the phone
 * could pick one. This answers with the card's fields only: one count, one
 * skip over `_id`, one projected read. The result is memoised per day and
 * marked cacheable, so most opens never reach the database at all.
 */

import { NextResponse } from 'next/server';
import { connectDB, Quiz, Category } from '@/database';
import { resolveQuizImageUrl } from '@/lib/quiz-image';
import { resolveQuizPassage } from '@/lib/quiz-passage';
import { dayNumber, quizOfTheDayIndex } from '@/lib/quiz-of-the-day';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 10 * 60 * 1000;

// Approved (or legacy, status-less) and still active - the same quizzes the
// catalogue offers. Free ones first: nobody is offered a quiz of the day they
// cannot play.
const PLAYABLE = {
  $or: [{ status: 'approved' }, { status: { $exists: false } }],
  isActive: { $ne: false },
};
const FREE = { ...PLAYABLE, isPremium: { $ne: true } };

interface CachedPick {
  day: number;
  expiresAt: number;
  body: Record<string, unknown>;
}

let cached: CachedPick | null = null;

function respond(body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      // Same pick for everybody all day: let the CDN and the phone reuse it.
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function pick(filter: Record<string, unknown>, day: Date) {
  const count = await Quiz.countDocuments(filter);
  if (count === 0) return null;

  const [quiz] = await Quiz.find(filter)
    .sort({ _id: 1 })
    .skip(quizOfTheDayIndex(count, day))
    .limit(1)
    .select(
      'title slug description imageUrl rewardXp categoryId difficulty isPremium questions.bibleReference'
    )
    .lean();

  return quiz ?? null;
}

export async function GET() {
  try {
    const now = new Date();
    const today = dayNumber(now);

    if (cached && cached.day === today && cached.expiresAt > Date.now()) {
      return respond(cached.body);
    }

    await connectDB();

    const quiz: any = (await pick(FREE, now)) ?? (await pick(PLAYABLE, now));
    if (!quiz) {
      return NextResponse.json({ error: 'No quiz available' }, { status: 404 });
    }

    const categoryRef = quiz.categoryId ?? quiz.category;
    const category: any = categoryRef ? await Category.findById(categoryRef).lean() : null;
    const questions: any[] = quiz.questions || [];

    const body = {
      id: quiz._id.toString(),
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description || '',
      imageUrl: resolveQuizImageUrl(quiz),
      xpReward: quiz.rewardXp ?? 50,
      difficulty: quiz.difficulty || 'medium',
      categoryId: quiz.categoryId?.toString() || null,
      category: category
        ? {
            id: category._id.toString(),
            name: category.name || category.title || category.slug || null,
            slug: category.slug || null,
          }
        : null,
      questionCount: questions.length,
      isPremium: Boolean(quiz.isPremium),
      passage: resolveQuizPassage(questions.map((q) => ({ bibleReference: q.bibleReference }))),
    };

    cached = { day: today, expiresAt: Date.now() + CACHE_TTL_MS, body };
    return respond(body);
  } catch (error) {
    console.error('Mobile API - Quiz of the day error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
