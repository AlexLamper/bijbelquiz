import { NextResponse } from 'next/server';
import { connectDB, Quiz, Category } from '@/database';
import { quizThumbnailUrl, resolveQuizImageUrl } from '@/lib/quiz-image';
import { resolveQuizPassage } from '@/lib/quiz-passage';
import { bookByName } from '@/lib/bible-books';
import { bookCodeFromSlug, sortQuizzes } from '@/lib/quiz-order';

/**
 * GET /api/mobile/quizzes - the catalogue the app's library, home screen and
 * room setup list from.
 *
 * Cards only: no questions, answers or explanations. The app used to read
 * `/api/quizzes` for this, which ships every quiz as a complete document,
 * uncached - most of that payload was never shown. The chapter each quiz is
 * about is worked out here from the question references, so the library can
 * offer its "per bijbelboek" view and search without downloading the questions.
 *
 * The list is the same for everybody, so it is memoised briefly and marked
 * cacheable for the CDN.
 */

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 60 * 1000;

let cached: { expiresAt: number; body: unknown[] } | null = null;

export async function GET() {
  try {
    if (cached && cached.expiresAt > Date.now()) {
      return respond(cached.body);
    }

    await connectDB();

    // Approved (or legacy, status-less) and still active: what the website
    // lists, and nothing a player cannot start.
    const [rows, categories] = await Promise.all([
      Quiz.aggregate([
        {
          $match: {
            $or: [{ status: 'approved' }, { status: { $exists: false } }],
            isActive: { $ne: false },
          },
        },
        {
          $project: {
            title: 1,
            slug: 1,
            description: 1,
            imageUrl: 1,
            rewardXp: 1,
            difficulty: 1,
            categoryId: 1,
            category: 1,
            isPremium: 1,
            createdAt: 1,
            questionCount: { $size: { $ifNull: ['$questions', []] } },
            references: { $ifNull: ['$questions.bibleReference', []] },
          },
        },
      ]),
      Category.find({}).lean(),
    ]);

    const categoryById = new Map<string, { id: string; name: string | null; slug: string | null }>();
    for (const category of categories as any[]) {
      categoryById.set(String(category._id), {
        id: String(category._id),
        name: category.name || category.title || category.slug || null,
        slug: category.slug || null,
      });
    }

    const body = rows.map((quiz: any) => {
      const categoryRef = quiz.categoryId ?? quiz.category;
      const categoryId = categoryRef ? String(categoryRef) : null;
      const image = resolveQuizImageUrl(quiz);

      return {
        id: String(quiz._id),
        title: quiz.title,
        slug: quiz.slug,
        description: quiz.description || '',
        image,
        imageUrl: image,
        thumbnailUrl: quizThumbnailUrl(image),
        // The schema field is `rewardXp`; `xpReward` is only the wire name.
        xpReward: quiz.rewardXp ?? quiz.xpReward ?? 50,
        difficulty: quiz.difficulty || 'medium',
        categoryId,
        category: categoryId ? categoryById.get(categoryId) ?? null : null,
        questionCount: quiz.questionCount ?? 0,
        isPremium: Boolean(quiz.isPremium),
        isActive: true,
        createdAt: quiz.createdAt ? new Date(quiz.createdAt).toISOString() : '',
        passage: resolveQuizPassage(
          (quiz.references || []).map((reference: unknown) => ({
            bibleReference: typeof reference === 'string' ? reference : undefined,
          }))
        ),
      };
    });

    // Bible order - Genesis 1, 2, 3 ... Openbaring, then the themes - so every
    // list in the app (library, room setup) reads in order, including builds
    // that show the catalogue as it arrives.
    const ordered = sortQuizzes(body, (quiz) => ({
      title: quiz.title,
      slug: quiz.slug,
      book: bookCodeFromSlug(quiz.slug) ?? bookByName(quiz.passage?.book)?.code ?? null,
      chapter: quiz.passage?.chapter ?? null,
    }));

    cached = { expiresAt: Date.now() + CACHE_TTL_MS, body: ordered };
    return respond(ordered);
  } catch (error) {
    console.error('Mobile API - Quizzes Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function respond(body: unknown[]) {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
