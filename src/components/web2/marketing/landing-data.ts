import { connectDB, Quiz } from '@/database';
import { BIBLE_BOOKS, type Testament } from '@/lib/bible-books';
import { loadQuizIndex, type QuizIndexQuiz } from '@/lib/quiz-index-data';

/**
 * Real numbers for the public home page: how many quizzes there are, the four
 * quizzes on show and the books that actually have quizzes. Nothing here is
 * made up; when the database is unreachable the page hides what it cannot
 * back with data.
 */
export interface LandingQuiz {
  id: string;
  href: string;
  title: string;
  reference: string | null;
  questionCount: number;
  imageUrl: string | null;
  slug: string;
}

export interface LandingTestament {
  testament: Testament;
  /** Books in this testament (39 / 27), a fact about the Bible. */
  totalBooks: number;
  /** Books that have at least one quiz, in canonical order. */
  books: { title: string; slug: string }[];
}

export interface LandingData {
  quizCount: number | null;
  featured: LandingQuiz[];
  testaments: LandingTestament[];
}

function referenceOf(quiz: QuizIndexQuiz): string | null {
  if (!quiz.bookTitle) return null;
  if (quiz.chapterFrom === null) return quiz.bookTitle;
  if (quiz.chapterTo === null || quiz.chapterTo === quiz.chapterFrom) return `${quiz.bookTitle} ${quiz.chapterFrom}`;
  return `${quiz.bookTitle} ${quiz.chapterFrom}-${quiz.chapterTo}`;
}

function toLandingQuiz(quiz: QuizIndexQuiz): LandingQuiz {
  const slug = quiz.slug || quiz._id;
  return {
    id: quiz._id,
    href: `/bijbelquiz/${slug}`,
    title: quiz.title,
    reference: referenceOf(quiz),
    questionCount: quiz.questionCount,
    imageUrl: quiz.imageUrl || null,
    slug,
  };
}

export async function loadLandingData(): Promise<LandingData> {
  try {
    const { quizzes, books } = await loadQuizIndex();

    // The same pick as the old "populaire quizzen" block: free quizzes first,
    // in the editors' sort order.
    await connectDB();
    const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
    const top = (await Quiz.find(statusFilter).select('_id').sort({ isPremium: 1, sortOrder: 1 }).limit(4).lean()) as Array<{
      _id: unknown;
    }>;
    const byId = new Map(quizzes.map((quiz) => [quiz._id, quiz]));
    const featured = top
      .map((doc) => byId.get(String(doc._id)))
      .filter((quiz): quiz is QuizIndexQuiz => Boolean(quiz))
      .map(toLandingQuiz);

    const testaments = (['OT', 'NT'] as const).map((testament) => ({
      testament,
      totalBooks: BIBLE_BOOKS.filter((book) => book.testament === testament).length,
      books: books
        .filter((book) => book.testament === testament && book.quizCount > 0)
        .map((book) => ({ title: book.title, slug: book.slug })),
    }));

    return { quizCount: quizzes.length || null, featured, testaments };
  } catch (error) {
    console.error('Landing data could not be loaded', error);
    return { quizCount: null, featured: [], testaments: [] };
  }
}
