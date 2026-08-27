import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Quiz } from '@/database';
import { requireServiceCaller } from '@/lib/service-auth';
import { toBookCode } from '@/lib/book-canon';

export const dynamic = 'force-dynamic';

/**
 * Quiz questions for a bible passage, for bijbelstudie's guided study flow.
 *
 * Two things this route must never do, both of which the existing
 * `GET /api/quizzes` does:
 *
 *  - return `isCorrect`. That route returns whole quiz documents, so the right
 *    answer is in the payload. Here the answers are stripped to `{ id, text }`
 *    and grading happens on the server, at /api/service/study-questions/grade.
 *  - return `explanation` before the question has been answered. An explanation
 *    routinely gives the answer away.
 */

const DEFAULT_COUNT = 5;
const MAX_COUNT = 10;

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
  refBook?: string | null;
  refChapter?: number | null;
  refVerse?: number | null;
  refVerseEnd?: number | null;
}

interface QuizDoc {
  _id: unknown;
  title: string;
  slug: string;
  difficulty: string;
  questions: QuestionDoc[];
}

/** Deterministic 32-bit hash, so the same seed returns the same questions. */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Seeded shuffle.
 *
 * Seeded rather than random on purpose: reloading a lesson must return the SAME
 * questions, or a half-finished quiz silently changes under the reader. Two
 * different users still get different sets, because the seed carries their id.
 */
function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let state = hashSeed(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type MatchTier = 'slug' | 'verse' | 'chapter' | 'book';

interface Candidate {
  tier: MatchTier;
  quiz: QuizDoc;
  question: QuestionDoc;
}

/** Do [aStart,aEnd] and [bStart,bEnd] overlap at all? */
function versesOverlap(
  aStart: number | null | undefined,
  aEnd: number | null | undefined,
  bStart: number | null,
  bEnd: number | null,
): boolean {
  if (aStart == null || bStart == null) return false;
  const a2 = aEnd ?? aStart;
  const b2 = bEnd ?? bStart;
  return aStart <= b2 && a2 >= bStart;
}

export async function GET(req: NextRequest) {
  const auth = requireServiceCaller(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(req.url);
    const book = url.searchParams.get('book') ?? '';
    const chapter = Number(url.searchParams.get('chapter'));
    const verseStart = url.searchParams.get('verseStart')
      ? Number(url.searchParams.get('verseStart'))
      : null;
    const verseEnd = url.searchParams.get('verseEnd')
      ? Number(url.searchParams.get('verseEnd'))
      : null;
    const count = Math.min(Number(url.searchParams.get('count')) || DEFAULT_COUNT, MAX_COUNT);
    const seed = url.searchParams.get('seed') ?? `${book}:${chapter}`;
    const slugs = (url.searchParams.get('quizSlugs') ?? '')
      .split(',')
      .map((slug) => slug.trim())
      .filter(Boolean);

    if (!book || !Number.isInteger(chapter)) {
      return NextResponse.json({ error: 'book and chapter are required' }, { status: 400 });
    }

    const bookCode = toBookCode(book);
    if (!bookCode && slugs.length === 0) {
      // An unknown book name is a caller mistake, not an empty passage. Saying
      // so beats returning an empty list that looks like "no questions yet".
      return NextResponse.json(
        { error: `Unknown book name: ${book}`, questions: [], total: 0, matchedBy: 'none' },
        { status: 400 },
      );
    }

    await connectDB();

    const approved = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
    const candidates: Candidate[] = [];

    // 1. Explicitly named quizzes. Exact, and the path the authored lessons use.
    if (slugs.length > 0) {
      const bySlug = (await Quiz.find({ slug: { $in: slugs } }).lean()) as unknown as QuizDoc[];
      for (const quiz of bySlug) {
        for (const question of quiz.questions ?? []) {
          candidates.push({ tier: 'slug', quiz, question });
        }
      }
    }

    // 2. Derived reference index. Only consulted when no slugs were given, so a
    //    lesson that names its quiz never gets unrelated questions mixed in.
    if (candidates.length === 0 && bookCode) {
      const byBook = (await Quiz.find({
        ...approved,
        'questions.refBook': bookCode,
      }).lean()) as unknown as QuizDoc[];

      for (const quiz of byBook) {
        for (const question of quiz.questions ?? []) {
          if (question.refBook !== bookCode) continue;

          if (question.refChapter === chapter) {
            const overlaps = versesOverlap(
              question.refVerse,
              question.refVerseEnd,
              verseStart,
              verseEnd,
            );
            // No verse range asked for means the whole chapter counts as a match.
            candidates.push({
              tier: overlaps || verseStart == null ? 'verse' : 'chapter',
              quiz,
              question,
            });
          } else {
            candidates.push({ tier: 'book', quiz, question });
          }
        }
      }
    }

    const tierOrder: MatchTier[] = ['slug', 'verse', 'chapter', 'book'];
    const picked: Candidate[] = [];

    for (const tier of tierOrder) {
      if (picked.length >= count) break;
      const inTier = candidates.filter((candidate) => candidate.tier === tier);
      // Shuffle within a tier only, so a closer match always outranks a looser one.
      picked.push(...seededShuffle(inTier, `${seed}:${tier}`).slice(0, count - picked.length));
    }

    const questions = picked.map(({ quiz, question }) => ({
      id: `${String(quiz._id)}:${String(question._id)}`,
      quizId: String(quiz._id),
      quizSlug: quiz.slug,
      quizTitle: quiz.title,
      text: question.text,
      // Answers carry an id and text only. The correct one is not in this payload.
      answers: (question.answers ?? []).map((answer) => ({
        id: String(answer._id),
        text: answer.text,
      })),
      bibleReference: question.bibleReference ?? null,
      difficulty: quiz.difficulty,
    }));

    return NextResponse.json({
      questions,
      total: questions.length,
      matchedBy: picked[0]?.tier ?? 'none',
    });
  } catch (error) {
    console.error('[service/study-questions] Failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
