import { NextResponse } from 'next/server';
import { connectDB, Quiz } from '@/database';
import { resolveQuizImageUrl } from '@/lib/quiz-image';

export async function GET(req: Request) {
  try {
    await connectDB();

    // Only return quizzes that are explicitly approved and active.
    const quizzes = await Quiz.find({
      status: 'approved',
      isActive: { $ne: false },
    }).lean();

    // Format the response for Flutter models
    const formattedQuizzes = quizzes.map((quiz: any) => ({
      id: quiz._id.toString(),
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description,
      image: resolveQuizImageUrl(quiz),
      imageUrl: resolveQuizImageUrl(quiz),
      // The schema field is `rewardXp`; `xpReward` is only the wire name.
      xpReward: quiz.rewardXp ?? quiz.xpReward ?? 50,
      categoryId: quiz.categoryId?.toString() || quiz.category?.toString() || null,
      questionCount: quiz.questions?.length || 0,
      isPremium: Boolean(quiz.isPremium),
      isActive: quiz.isActive
    }));

    return NextResponse.json(formattedQuizzes, { status: 200 });
  } catch (error) {
    console.error('Mobile API - Quizzes Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
