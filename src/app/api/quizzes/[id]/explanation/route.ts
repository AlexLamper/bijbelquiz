import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB, Quiz } from '@/database';

export const dynamic = 'force-dynamic';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

type LeanQuestion = {
  _id?: unknown;
  explanation?: string;
  bibleReference?: string;
};

type LeanQuiz = {
  status?: string;
  isPremium?: boolean;
  questions?: LeanQuestion[];
};

/**
 * One question's explanation, for the free "onthulling".
 *
 * A free player gets a single explanation per quiz, their choice. The quiz
 * page strips explanations out of the HTML for free players, so the one they
 * pick has to be fetched, and fetching one at a time is what keeps the rest
 * off their machine. The one-per-quiz limit lives in the player; this route
 * only answers for a quiz the caller is allowed to play at all.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const questionId = req.nextUrl.searchParams.get('question') || '';

  if (!OBJECT_ID.test(questionId)) {
    return NextResponse.json({ error: 'Onbekende vraag' }, { status: 400 });
  }

  try {
    await connectDB();

    const projection = 'status isPremium questions._id questions.explanation questions.bibleReference';
    let quiz = (await Quiz.findOne({ slug: id }).select(projection).lean()) as LeanQuiz | null;
    if (!quiz && OBJECT_ID.test(id)) {
      quiz = (await Quiz.findById(id).select(projection).lean()) as LeanQuiz | null;
    }

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz niet gevonden' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    // Same rules as the quiz page: unapproved quizzes are invisible to
    // everybody but an admin, and a premium quiz explains nothing to a free
    // player - they cannot open it in the first place.
    if (quiz.status && quiz.status !== 'approved' && !isAdmin) {
      return NextResponse.json({ error: 'Quiz niet gevonden' }, { status: 404 });
    }

    if (quiz.isPremium && !session?.user?.isPremium && !isAdmin) {
      return NextResponse.json({ error: 'Deze quiz is Premium' }, { status: 403 });
    }

    const question = (quiz.questions || []).find((entry) => String(entry._id) === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Onbekende vraag' }, { status: 404 });
    }

    return NextResponse.json({
      explanation: question.explanation || '',
      bibleReference: question.bibleReference || null,
    });
  } catch (error) {
    console.error('[QUIZ_EXPLANATION_GET]', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
