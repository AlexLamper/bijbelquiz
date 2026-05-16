import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, Quiz } from '@/database';

interface IncomingAnswer {
  text?: unknown;
  isCorrect?: unknown;
}

interface IncomingQuestion {
  text?: unknown;
  answers?: IncomingAnswer[];
  explanation?: unknown;
  bibleReference?: unknown;
}

interface NormalizedAnswer {
  text: string;
  isCorrect: boolean;
}

interface NormalizedQuestion {
  text: string;
  answers: NormalizedAnswer[];
  explanation?: string;
  bibleReference?: string;
}

function normalizeQuestions(input: unknown): NormalizedQuestion[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((question) => question as IncomingQuestion)
    .map((question) => {
      const normalizedAnswers = Array.isArray(question.answers)
        ? question.answers
            .map((answer) => ({
              text: typeof answer.text === 'string' ? answer.text.trim() : '',
              isCorrect: Boolean(answer.isCorrect),
            }))
            .filter((answer) => answer.text.length > 0)
        : [];

      const normalizedQuestion: NormalizedQuestion = {
        text: typeof question.text === 'string' ? question.text.trim() : '',
        answers: normalizedAnswers,
        explanation:
          typeof question.explanation === 'string' ? question.explanation.trim() : undefined,
        bibleReference:
          typeof question.bibleReference === 'string' ? question.bibleReference.trim() : undefined,
      };
      return normalizedQuestion;
    })
    .filter((question) => question.text.length > 0 && question.answers.length >= 2);
}

export async function GET() {
  try {
    await connectDB();
    // Support both new 'approved' status and legacy quizzes with missing status
    const filter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("[QUIZZES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, categoryId, questions, difficulty, rewardXp } = body;
    const normalizedQuestions = normalizeQuestions(questions);
    const hasInvalidCorrectAnswer = normalizedQuestions.some(
      (question) => !question.answers.some((answer) => answer.isCorrect)
    );

    if (!title || !categoryId || normalizedQuestions.length === 0 || hasInvalidCorrectAnswer) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (normalizedQuestions.length < 5) {
      return new NextResponse("A quiz must contain at least 5 questions", { status: 400 });
    }

    await connectDB();

    const role = session.user.role;
    const initialStatus = role === 'admin' ? 'approved' : 'pending';
    const safeRewardXp =
      role === 'admin' && typeof rewardXp === 'number' ? Math.max(0, rewardXp) : 50;

    // Basic slug generation
    const cleanTitle = String(title).trim();
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    const baseSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    // Check for unique slug
    while (await Quiz.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const quiz = await Quiz.create({
      title: cleanTitle,
      slug,
      description: cleanDescription,
      categoryId,
      rewardXp: safeRewardXp,
      difficulty: difficulty || 'medium',
      isPremium: false, // Default to free
      status: initialStatus,
      createdBy: session.user.id,
      questions: normalizedQuestions
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_CREATE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
