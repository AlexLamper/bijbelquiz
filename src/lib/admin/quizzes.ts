import mongoose from 'mongoose';

import { Quiz, UserProgress, connectDB } from '@/database';
import { amsterdamWindowStart } from '@/lib/admin/time';

/**
 * Quiz moderation for the app's admin screen (`/api/mobile/admin/quizzes`).
 * The website's list reads `/api/admin/quizzes?view=summary` and writes with
 * PATCH/PUT on `/api/admin/quizzes/{id}`; the actions here make the same
 * changes (status, the Premium flag).
 */

export const QUIZ_STATUSES = ['pending', 'approved', 'rejected', 'draft'] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

export const QUIZ_ACTIONS = ['approve', 'reject', 'publish', 'unpublish', 'premium'] as const;
export type QuizAction = (typeof QUIZ_ACTIONS)[number];

export interface AdminQuizRow {
  id: string;
  title: string;
  slug: string | null;
  status: QuizStatus;
  isPremium: boolean;
  category: string | null;
  questionCount: number;
  createdBy: string | null;
  createdAt: string | null;
  /** Finished attempts in the last 30 days (Amsterdam calendar). */
  plays30d: number;
}

type LeanQuiz = {
  _id: unknown;
  title: string;
  slug?: string;
  status?: string;
  isPremium?: boolean;
  categoryId?: { title?: string } | null;
  createdBy?: { name?: string } | null;
  questions?: unknown[];
  createdAt?: Date;
};

function readStatus(value: unknown): QuizStatus {
  // Old documents have no status; the catalogue treats them as live.
  return (QUIZ_STATUSES as readonly string[]).includes(String(value)) ? (value as QuizStatus) : 'approved';
}

function toRow(quiz: LeanQuiz, plays: Map<string, number>): AdminQuizRow {
  const id = String(quiz._id);
  return {
    id,
    title: quiz.title,
    slug: quiz.slug ?? null,
    status: readStatus(quiz.status),
    isPremium: Boolean(quiz.isPremium),
    category: quiz.categoryId?.title ?? null,
    questionCount: quiz.questions?.length ?? 0,
    createdBy: quiz.createdBy?.name ?? null,
    createdAt: quiz.createdAt ? new Date(quiz.createdAt).toISOString() : null,
    plays30d: plays.get(id) ?? 0,
  };
}

function fold(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export async function listAdminQuizzes(options: { status?: string | null; q?: string | null } = {}, now: Date = new Date()) {
  await connectDB();
  const [quizzes, playRows] = await Promise.all([
    Quiz.find()
      .select('title slug status isPremium categoryId createdBy createdAt questions._id')
      .populate('categoryId', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean<LeanQuiz[]>(),
    UserProgress.aggregate<{ _id: unknown; count: number }>([
      { $match: { completedAt: { $gte: amsterdamWindowStart(30, now) } } },
      { $group: { _id: '$quizId', count: { $sum: 1 } } },
    ]),
  ]);
  const plays = new Map(playRows.map((row) => [String(row._id), row.count]));
  const rows = quizzes.map((quiz) => toRow(quiz, plays));

  const counts: Record<QuizStatus, number> = { pending: 0, approved: 0, rejected: 0, draft: 0 };
  for (const row of rows) counts[row.status] += 1;

  const status = (QUIZ_STATUSES as readonly string[]).includes(String(options.status)) ? (options.status as QuizStatus) : null;
  const needle = fold((options.q ?? '').trim());
  const filtered = rows.filter(
    (row) => (!status || row.status === status) && (!needle || fold(`${row.title} ${row.category ?? ''}`).includes(needle)),
  );

  return { counts, quizzes: filtered };
}

export type QuizActionResult = { ok: true; quiz: AdminQuizRow } | { ok: false; status: number; error: string };

export async function applyQuizAction(id: string, body: { action?: unknown; isPremium?: unknown }): Promise<QuizActionResult> {
  if (!mongoose.Types.ObjectId.isValid(id)) return { ok: false, status: 404, error: 'Quiz niet gevonden.' };
  const action = body.action;
  if (!(QUIZ_ACTIONS as readonly string[]).includes(String(action))) {
    return { ok: false, status: 400, error: 'Onbekende actie.' };
  }

  let update: Record<string, unknown>;
  switch (action as QuizAction) {
    case 'approve':
    case 'publish':
      update = { status: 'approved' };
      break;
    case 'reject':
      update = { status: 'rejected' };
      break;
    case 'unpublish':
      update = { status: 'draft' };
      break;
    case 'premium':
      if (typeof body.isPremium !== 'boolean') return { ok: false, status: 400, error: 'Geef aan of de quiz Premium is.' };
      update = { isPremium: body.isPremium };
      break;
  }

  await connectDB();
  const quiz = await Quiz.findByIdAndUpdate(id, { $set: update }, { new: true })
    .select('title slug status isPremium categoryId createdBy createdAt questions._id')
    .populate('categoryId', 'title')
    .populate('createdBy', 'name')
    .lean<LeanQuiz>();
  if (!quiz) return { ok: false, status: 404, error: 'Quiz niet gevonden.' };

  const plays = await UserProgress.countDocuments({ quizId: quiz._id, completedAt: { $gte: amsterdamWindowStart(30) } });
  return { ok: true, quiz: toRow(quiz, new Map([[String(quiz._id), plays]])) };
}
