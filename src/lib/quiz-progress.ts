export interface QuizProgressSummary {
  attempts: number;
  bestCorrectAnswers: number;
  lastCorrectAnswers: number;
  lastWrongAnswers: number;
  lastTotalQuestions: number;
  lastCompletedAt: string;
}

interface ProgressLike {
  quizId?: { _id?: unknown } | string | unknown;
  correctAnswers?: unknown;
  wrongAnswers?: unknown;
  totalQuestions?: unknown;
  completedAt?: unknown;
}

function normalizeQuizId(input: ProgressLike['quizId']): string | null {
  if (!input) return null;
  if (typeof input === 'string') return input;
  if (typeof input === 'object' && input && '_id' in input) {
    const value = (input as { _id?: unknown })._id;
    if (value == null) return null;
    return String(value);
  }
  return String(input);
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return new Date(value).toISOString();
  }
  return new Date(0).toISOString();
}

/**
 * Build per-quiz progress summaries from user progress docs.
 * Input should be sorted by completedAt descending for accurate "last*" fields.
 */
export function buildQuizProgressMap(progressDocs: ProgressLike[]): Record<string, QuizProgressSummary> {
  const map: Record<string, QuizProgressSummary> = {};

  for (const doc of progressDocs) {
    const quizId = normalizeQuizId(doc.quizId);
    if (!quizId) continue;

    const correctAnswers = toNumber(doc.correctAnswers);
    const wrongAnswers = toNumber(doc.wrongAnswers);
    const totalQuestions = toNumber(doc.totalQuestions);
    const completedAtIso = toIsoDate(doc.completedAt);

    const existing = map[quizId];
    if (!existing) {
      map[quizId] = {
        attempts: 1,
        bestCorrectAnswers: correctAnswers,
        lastCorrectAnswers: correctAnswers,
        lastWrongAnswers: wrongAnswers,
        lastTotalQuestions: totalQuestions,
        lastCompletedAt: completedAtIso,
      };
      continue;
    }

    existing.attempts += 1;
    existing.bestCorrectAnswers = Math.max(existing.bestCorrectAnswers, correctAnswers);
  }

  return map;
}
