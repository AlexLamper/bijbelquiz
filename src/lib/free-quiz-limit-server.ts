import { connectDB, UserProgress } from '@/database';
import { buildFreeQuizAllowance, canPlayQuiz, type FreeQuizAllowance } from '@/lib/free-quiz-limit';

/**
 * The free-quiz allowance of a signed-in player, from their attempts.
 *
 * Server only (reads the database). The pure rule lives in
 * `free-quiz-limit.ts`; this only supplies the played quizzes: every distinct
 * quiz the account has finished at least once.
 */
export async function getFreeQuizAllowanceForUser(user: {
  id: string;
  isPremium?: boolean | null;
  role?: string | null;
}): Promise<FreeQuizAllowance> {
  const unlimited = Boolean(user.isPremium) || user.role === 'admin';
  if (unlimited) {
    return buildFreeQuizAllowance({ isPremium: true, playedQuizIds: [] });
  }

  await connectDB();
  const quizIds = (await UserProgress.distinct('quizId', { userId: user.id })) as unknown[];
  return buildFreeQuizAllowance({ isPremium: false, playedQuizIds: quizIds.map((id) => String(id)) });
}

/** Whether this signed-in player may open (or submit) this quiz. */
export async function userCanPlayQuiz(
  user: { id: string; isPremium?: boolean | null; role?: string | null },
  quizId: string,
): Promise<boolean> {
  const allowance = await getFreeQuizAllowanceForUser(user);
  return canPlayQuiz(allowance, quizId);
}
