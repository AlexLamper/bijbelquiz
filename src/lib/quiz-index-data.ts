/**
 * The data behind the quiz index (`/quizzen` and its layout variants).
 *
 * One loader, so every version of the page shows the same library with the
 * same fields: the browse fields a card needs, the reader's own progress, and
 * - new here - where each quiz sits in the Bible. A quiz carries no book of
 * its own; its questions do, as `refBook`/`refChapter`. The loader reads
 * those and tags the quiz with the book most of its questions cite and the
 * chapter span they cover, which is what lets a page lay quizzes out on the
 * canon instead of in one long list.
 *
 * Questions themselves are never sent: with 240 quizzes of ten questions each
 * the payload would scale with question text, not with what the page shows.
 */

import { connectDB, Quiz, Category, UserProgress } from '@/database';
import { BIBLE_BOOKS, bookByCode, type BibleBook } from '@/lib/bible-books';
import { resolveQuizImageUrl } from '@/lib/quiz-image';
import { buildQuizProgressMap, type QuizProgressSummary } from '@/lib/quiz-progress';
import { readSeries } from '@/lib/quiz-series';

export interface QuizIndexCategory {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface QuizIndexQuiz {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  /** Always resolved to a file that exists (drawn cover, category image or fallback). */
  imageUrl: string;
  difficulty: string;
  isPremium: boolean;
  rewardXp?: number;
  createdAt?: string;
  questionCount: number;
  categoryId?: { _id: string; title: string };
  /** Canonical code of the book most questions cite ('MATT'), null for a mixed quiz. */
  book: string | null;
  /** Dutch title for `book`, e.g. "Matteüs". */
  bookTitle: string | null;
  /** Chapter span the questions cover within `book`; both null when `book` is null. */
  chapterFrom: number | null;
  chapterTo: number | null;
  /** "matteus bijbelquiz" for "Matteus bijbelquiz - Deel 3"; the title itself for a standalone quiz. */
  seriesKey: string;
  seriesLabel: string;
  /** 3 for "Deel 3"; 0 for a quiz that is not part of a series. */
  part: number;
  progress?: QuizProgressSummary;
}

export interface QuizIndexBook extends BibleBook {
  quizCount: number;
  /** Chapters at least one quiz covers, ascending. */
  chaptersCovered: number[];
}

export interface QuizIndexData {
  quizzes: QuizIndexQuiz[];
  categories: QuizIndexCategory[];
  /** All 66 books in canonical order, each with its quiz count - zero included. */
  books: QuizIndexBook[];
}

/** At least this share of a quiz's references must agree before it is filed under a book. */
const MIN_BOOK_SHARE = 0.6;

interface RawQuiz {
  _id: unknown;
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  difficulty?: string;
  isPremium?: boolean;
  rewardXp?: number;
  createdAt?: Date;
  questionCount: number;
  categoryImageUrl?: string;
  categoryId?: { _id?: unknown; title?: string };
  refBooks?: Array<string | null>;
  refChapters?: Array<number | null>;
}

function placeInBible(raw: RawQuiz): Pick<QuizIndexQuiz, 'book' | 'bookTitle' | 'chapterFrom' | 'chapterTo'> {
  const books = raw.refBooks ?? [];
  const chapters = raw.refChapters ?? [];

  const counts = new Map<string, number>();
  let cited = 0;
  books.forEach((code) => {
    if (!code) return;
    cited += 1;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  });

  let best: string | null = null;
  let bestCount = 0;
  counts.forEach((count, code) => {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  });

  const book = best && bestCount / Math.max(1, cited) >= MIN_BOOK_SHARE ? bookByCode(best) : null;
  if (!book) return { book: null, bookTitle: null, chapterFrom: null, chapterTo: null };

  let from: number | null = null;
  let to: number | null = null;
  books.forEach((code, index) => {
    const chapter = chapters[index];
    if (code !== book.code || typeof chapter !== 'number' || !Number.isFinite(chapter)) return;
    from = from === null ? chapter : Math.min(from, chapter);
    to = to === null ? chapter : Math.max(to, chapter);
  });

  return { book: book.code, bookTitle: book.title, chapterFrom: from, chapterTo: to };
}

export async function loadQuizIndex(userId?: string): Promise<QuizIndexData> {
  await connectDB();

  const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };

  const rawQuizzes = (await Quiz.aggregate([
    { $match: statusFilter },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        title: 1,
        slug: 1,
        description: 1,
        imageUrl: 1,
        difficulty: 1,
        isPremium: 1,
        rewardXp: 1,
        createdAt: 1,
        questionCount: { $size: { $ifNull: ['$questions', []] } },
        // Only the two reference fields, one short array each - never the
        // questions themselves.
        refBooks: '$questions.refBook',
        refChapters: '$questions.refChapter',
        categoryImageUrl: '$category.imageUrl',
        categoryId: {
          _id: '$category._id',
          title: '$category.title',
        },
      },
    },
    { $sort: { isPremium: 1, title: 1 } },
  ])) as RawQuiz[];

  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

  const progressDocs = userId
    ? await UserProgress.find({ userId })
        .select('quizId correctAnswers wrongAnswers totalQuestions completedAt')
        .sort({ completedAt: -1 })
        .lean()
    : [];
  const progressByQuizId = buildQuizProgressMap(
    progressDocs as unknown as Array<{
      quizId?: unknown;
      correctAnswers?: unknown;
      wrongAnswers?: unknown;
      totalQuestions?: unknown;
      completedAt?: unknown;
    }>
  );

  const quizzes: QuizIndexQuiz[] = rawQuizzes.map((raw) => {
    const id = String(raw._id);
    const series = readSeries(raw.title);
    const { refBooks: _books, refChapters: _chapters, categoryImageUrl: _cover, ...rest } = raw;
    void _books;
    void _chapters;
    void _cover;

    return {
      ...rest,
      _id: id,
      title: raw.title,
      difficulty: raw.difficulty ?? 'medium',
      isPremium: Boolean(raw.isPremium),
      questionCount: raw.questionCount,
      createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
      categoryId:
        raw.categoryId && raw.categoryId._id
          ? { _id: String(raw.categoryId._id), title: raw.categoryId.title ?? '' }
          : undefined,
      imageUrl: resolveQuizImageUrl(raw),
      ...placeInBible(raw),
      seriesKey: series.key,
      seriesLabel: series.label,
      part: series.part,
      progress: progressByQuizId[id],
    };
  });

  const covered = new Map<string, { count: number; chapters: Set<number> }>();
  for (const quiz of quizzes) {
    if (!quiz.book) continue;
    const entry = covered.get(quiz.book) ?? { count: 0, chapters: new Set<number>() };
    entry.count += 1;
    if (quiz.chapterFrom !== null && quiz.chapterTo !== null) {
      for (let chapter = quiz.chapterFrom; chapter <= quiz.chapterTo; chapter += 1) {
        entry.chapters.add(chapter);
      }
    }
    covered.set(quiz.book, entry);
  }

  const books: QuizIndexBook[] = BIBLE_BOOKS.map((book) => {
    const entry = covered.get(book.code);
    return {
      ...book,
      quizCount: entry?.count ?? 0,
      chaptersCovered: entry ? [...entry.chapters].sort((a, b) => a - b) : [],
    };
  });

  return {
    quizzes: JSON.parse(JSON.stringify(quizzes)),
    categories: JSON.parse(JSON.stringify(categories)),
    books,
  };
}
