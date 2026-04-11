import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, UserProgress } from '@/database';

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();

    const progress = await UserProgress.find({ userId: session.user.id })
      .populate('quizId', 'title slug imageUrl categoryId')
      .populate('quizId.categoryId', 'title')
      .sort({ completedAt: -1 })
      .lean();

    // Format the response
    const formattedProgress = progress.map((item: any) => ({
      _id: item._id.toString(),
      quizId: item.quizId ? {
        _id: item.quizId._id.toString(),
        title: item.quizId.title,
        slug: item.quizId.slug,
        imageUrl: item.quizId.imageUrl,
        categoryId: item.quizId.categoryId,
      } : null,
      score: item.score,
      totalQuestions: item.totalQuestions,
      completedAt: item.completedAt,
    }));

    return NextResponse.json(formattedProgress);
  } catch (error) {
    console.error('[USER_PROGRESS_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
