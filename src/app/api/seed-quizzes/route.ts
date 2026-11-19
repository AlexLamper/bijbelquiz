// TEMPORARY - lives only on branch tmp/seed, never merged. Writes quizzes posted
// in the request body into the database of the deployment it runs on, the same way
// scripts/import-quiz-json.mts does (match on slug, never touch _id or createdAt).
// Exists because the build sandbox cannot reach Atlas directly.
// Guarded by SEED_TOKEN; refuses the Dutch database.
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface QuizFile {
  title: string;
  description?: string;
  slug: string;
  categorySlug?: string;
  rewardXp: number;
  difficulty: string;
  isPremium: boolean;
  status: string;
  questions: Array<{
    text: string;
    explanation?: string;
    bibleReference?: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
  }>;
}

function storageErrors(quiz: QuizFile): string[] {
  const errors: string[] = [];
  if (!quiz.title) errors.push('title missing');
  if (!quiz.slug) errors.push('slug missing');
  if (!quiz.categorySlug) errors.push('categorySlug missing');
  if (!['easy', 'medium', 'hard'].includes(String(quiz.difficulty))) errors.push('difficulty invalid');
  if (!['draft', 'pending', 'approved', 'rejected'].includes(String(quiz.status))) errors.push('status invalid');
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) errors.push('no questions');
  (quiz.questions ?? []).forEach((question, i) => {
    if (!question.text) errors.push(`question ${i + 1}: text missing`);
    const correct = (question.answers ?? []).filter((a) => a.isCorrect === true).length;
    if (correct !== 1) errors.push(`question ${i + 1}: ${correct} correct answers`);
  });
  return errors;
}

export async function POST(request: NextRequest) {
  const token = process.env.SEED_TOKEN;
  if (!token || request.nextUrl.searchParams.get('token') !== token) {
    return NextResponse.json({ error: 'nope' }, { status: 404 });
  }
  const lang = process.env.SITE_LOCALE ?? '';
  if (!lang || lang === 'nl') return NextResponse.json({ error: 'not an intl deployment' }, { status: 400 });

  const apply = request.nextUrl.searchParams.get('apply') === '1';
  const body = (await request.json()) as { quizzes?: QuizFile[] };
  const quizzes = body.quizzes ?? [];
  if (quizzes.length === 0) return NextResponse.json({ error: 'no quizzes in body' }, { status: 400 });

  const { connectDB, Quiz, Category } = await import('@/database');
  await connectDB();
  const dutch = await Category.countDocuments({ slug: { $in: ['oude-testament', 'nieuwe-testament'] } });
  if (dutch > 0) return NextResponse.json({ error: 'Dutch database, stopped' }, { status: 409 });

  const categoryIdBySlug = new Map<string, string>();
  for (const category of await Category.find({}, { slug: 1 }).lean()) {
    if (category.slug) categoryIdBySlug.set(String(category.slug), String(category._id));
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const quiz of quizzes) {
    if (quiz.status === 'draft') {
      skipped += 1;
      continue;
    }
    const errors = storageErrors(quiz);
    if (errors.length > 0) {
      failures.push(`${quiz.slug}: ${errors.join('; ')}`);
      continue;
    }
    const categoryId = categoryIdBySlug.get(String(quiz.categorySlug));
    if (!categoryId) {
      failures.push(`${quiz.slug}: category ${String(quiz.categorySlug)} not in database`);
      continue;
    }
    const document = {
      title: quiz.title,
      slug: quiz.slug,
      description: quiz.description,
      categoryId: new mongoose.Types.ObjectId(categoryId),
      lang,
      rewardXp: quiz.rewardXp,
      difficulty: quiz.difficulty,
      isPremium: quiz.isPremium,
      status: quiz.status,
      questions: quiz.questions.map((question) => ({
        text: question.text,
        explanation: question.explanation,
        bibleReference: question.bibleReference,
        answers: question.answers.map((answer) => ({ text: answer.text, isCorrect: Boolean(answer.isCorrect) })),
      })),
    };
    if (!apply) {
      (await Quiz.exists({ slug: quiz.slug })) ? (updated += 1) : (inserted += 1);
      continue;
    }
    const existing = await Quiz.findOne({ slug: quiz.slug });
    if (existing) {
      existing.set(document);
      await existing.save();
      updated += 1;
    } else {
      await Quiz.create(document);
      inserted += 1;
    }
  }

  const total = await Quiz.countDocuments({});
  return NextResponse.json({ lang, apply, inserted, updated, skipped, failures, totalInDatabase: total });
}
