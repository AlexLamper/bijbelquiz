import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, Quiz } from '@/database';
import { requireServiceCaller } from '@/lib/service-auth';

export const dynamic = 'force-dynamic';

/**
 * Grades answers to questions previously served by /api/service/study-questions.
 *
 * Grading lives here, on the server that owns the questions, because the sibling
 * route deliberately withholds `isCorrect`. If the caller could mark its own
 * answers it would need the correct ones, and then the browser could be handed
 * them too.
 *
 * Stateless on purpose: no user, no attempt record, no XP. The study flow stores
 * its own score in bijbelstudie's StudyLessonState. Writing an attempt here
 * would mean mapping a bijbelstudie user onto a bijbelquiz user, which is a
 * separate problem and not one this feature needs solved.
 */

const MAX_ANSWERS = 20;

interface SubmittedAnswer {
  id: string;
  answerId: string | null;
}

interface AnswerDoc {
  _id: unknown;
  text: string;
  isCorrect: boolean;
}

interface QuestionDoc {
  _id: unknown;
  text: string;
  answers: AnswerDoc[];
  explanation?: string;
  bibleReference?: string;
}

interface QuizDoc {
  _id: unknown;
  questions: QuestionDoc[];
}

function parseSubmitted(input: unknown): SubmittedAnswer[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_ANSWERS) return null;

  const out: SubmittedAnswer[] = [];
  for (const entry of input) {
    const record = entry as { id?: unknown; answerId?: unknown };
    if (typeof record.id !== 'string' || !record.id.includes(':')) return null;
    out.push({
      id: record.id,
      // null is legal: an unanswered question is wrong, not a bad request.
      answerId: typeof record.answerId === 'string' ? record.answerId : null,
    });
  }
  return out;
}

export async function POST(req: NextRequest) {
  const auth = requireServiceCaller(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const submitted = parseSubmitted((body as { answers?: unknown }).answers);

    if (!submitted) {
      return NextResponse.json({ error: 'answers is required' }, { status: 400 });
    }

    await connectDB();

    const quizIds = [
      ...new Set(
        submitted
          .map((answer) => answer.id.split(':')[0])
          .filter((id) => mongoose.isValidObjectId(id)),
      ),
    ];

    const quizzes = (await Quiz.find({ _id: { $in: quizIds } })
      .select('questions')
      .lean()) as unknown as QuizDoc[];

    const questionIndex = new Map<string, QuestionDoc>();
    for (const quiz of quizzes) {
      for (const question of quiz.questions ?? []) {
        questionIndex.set(`${String(quiz._id)}:${String(question._id)}`, question);
      }
    }

    let score = 0;
    const results = submitted.map((answer) => {
      const question = questionIndex.get(answer.id);
      if (!question) {
        return {
          id: answer.id,
          known: false,
          correct: false,
          correctAnswerId: null,
          explanation: null,
        };
      }

      const correctAnswer = (question.answers ?? []).find((option) => option.isCorrect);
      const correct = !!answer.answerId && String(correctAnswer?._id) === answer.answerId;
      if (correct) score++;

      return {
        id: answer.id,
        known: true,
        correct,
        correctAnswerId: correctAnswer ? String(correctAnswer._id) : null,
        // Released only now that the question has been answered.
        explanation: question.explanation ?? null,
        bibleReference: question.bibleReference ?? null,
      };
    });

    return NextResponse.json({ results, score, total: submitted.length });
  } catch (error) {
    console.error('[service/study-questions/grade] Failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
