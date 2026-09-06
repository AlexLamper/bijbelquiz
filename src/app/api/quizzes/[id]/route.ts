import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Quiz } from '@/database';
import { resolveQuizImageUrl } from '@/lib/quiz-image';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    let quiz = await Quiz.findOne({ slug: id }).populate('categoryId').lean();
    
    if (!quiz && id.match(/^[0-9a-fA-F]{24}$/)) {
      quiz = await Quiz.findById(id).populate('categoryId').lean();
    }

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    const category = (quiz as { categoryId?: { imageUrl?: string } }).categoryId;
    const imageUrl = resolveQuizImageUrl({
      _id: (quiz as { _id?: unknown })._id,
      imageUrl: (quiz as { imageUrl?: unknown }).imageUrl,
      categoryImageUrl:
        category && typeof category === 'object' ? category.imageUrl : undefined,
    });

    return NextResponse.json({ ...quiz, imageUrl, image: imageUrl });
  } catch (error) {
    console.error("[QUIZ_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
