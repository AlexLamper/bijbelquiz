import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Quiz } from '@/database';
import { getSession } from '@/lib/get-session';
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

    // Explanations are Premium on every surface. The quiz page already strips
    // them for free players; this route used to hand the full set to anyone
    // who asked, which made that wall decorative. Same rule here, for the
    // web session and for a mobile bearer token alike.
    const session = await getSession(req);
    const canReadExplanations =
      Boolean(session?.user?.isPremium) || session?.user?.role === 'admin';

    const questions = (Array.isArray(quiz.questions) ? quiz.questions : []) as unknown as Array<
      Record<string, unknown>
    >;
    const visibleQuestions = canReadExplanations
      ? questions
      : questions.map((question) => {
          const copy = { ...question };
          delete copy.explanation;
          return copy;
        });

    return NextResponse.json({ ...quiz, questions: visibleQuestions, imageUrl, image: imageUrl });
  } catch (error) {
    console.error("[QUIZ_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
