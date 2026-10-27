/**
 * Server side of the quiz browsing pages (`/dashboard`, `/quizzen`,
 * `/bijbelquiz/[slug]`): the library as `BrowseQuiz` cards, with how many
 * people played each quiz so "Populaire quizzen" means something.
 *
 * Built on `loadQuizIndex()`, which never reads question text, so a card list
 * of the whole catalogue (~240 quizzes in production) stays a few hundred
 * bytes per quiz.
 */

import mongoose from 'mongoose';

import { connectDB, UserProgress } from '@/database';
import { hasScene } from '@/components/bq/QuizScene';
import { quizThumbnailUrl } from '@/lib/quiz-image';
import { loadQuizIndex, type LoadQuizIndexOptions, type QuizIndexCategory, type QuizIndexQuiz } from '@/lib/quiz-index-data';
import { browseBook, referenceFor, type BrowseQuiz } from '@/lib/quiz-browse-shape';

/** The numbered placeholder covers, which say nothing about the quiz. */
const PLACEHOLDER_COVER = /^\/images\/quizzes\/img\d+\.png$/i;

/**
 * A cover only when it belongs to this quiz. The designs draw a scene for
 * every quiz; a category picture or a numbered placeholder would put the same
 * image on dozens of tiles, so those fall back to the scene. A quiz with a
 * scene of its own in the approved designs keeps that scene.
 */
function coverOf(quiz: QuizIndexQuiz, categoryImage: string | undefined): string | null {
  if (hasScene(quiz.title)) return null;
  const image = quiz.imageUrl;
  if (!image || PLACEHOLDER_COVER.test(image)) return null;
  if (categoryImage && image === categoryImage) return null;
  return quizThumbnailUrl(image) ?? image;
}

const POPULARITY_TTL_MS = 15 * 60 * 1000;
let popularity: { at: number; players: Map<string, number> } | null = null;

/**
 * Distinct players per quiz, over every finished attempt. One aggregation,
 * kept for a quarter of an hour: the order of a "popular" strip does not need
 * to be live, and the attempts collection is the largest one there is.
 */
export async function quizPlayerCounts(): Promise<Map<string, number>> {
  if (popularity && Date.now() - popularity.at < POPULARITY_TTL_MS) return popularity.players;
  await connectDB();
  const rows = (await UserProgress.aggregate([
    { $group: { _id: { quiz: '$quizId', user: '$userId' } } },
    { $group: { _id: '$_id.quiz', players: { $sum: 1 } } },
  ])) as Array<{ _id: mongoose.Types.ObjectId | string; players: number }>;
  const players = new Map(rows.map((row) => [String(row._id), row.players]));
  popularity = { at: Date.now(), players };
  return players;
}

export function toBrowseQuiz(
  quiz: QuizIndexQuiz,
  categories: Map<string, QuizIndexCategory>,
  players: Map<string, number>,
): BrowseQuiz {
  const category = quiz.categoryId?._id ? categories.get(quiz.categoryId._id) : undefined;
  const book = browseBook(quiz.book);
  const categoryTitle = quiz.categoryId?.title || category?.title || null;
  return {
    id: quiz._id,
    slug: quiz.slug || quiz._id,
    title: quiz.title,
    description: quiz.description?.trim() || null,
    reference: book ? referenceFor(book.title, quiz.chapterFrom, quiz.chapterTo) : categoryTitle,
    questionCount: quiz.questionCount,
    rewardXp: quiz.rewardXp ?? 50,
    cover: coverOf(quiz, category?.imageUrl),
    book,
    chapterFrom: book ? quiz.chapterFrom : null,
    chapterTo: book ? quiz.chapterTo : null,
    category: categoryTitle ? { slug: category?.slug ?? null, title: categoryTitle } : null,
    isPremium: quiz.isPremium,
    players: players.get(quiz._id) ?? 0,
    progress: quiz.progress
      ? {
          attempts: quiz.progress.attempts,
          bestCorrect: quiz.progress.bestCorrectAnswers,
          total: quiz.progress.lastTotalQuestions || quiz.questionCount,
          lastPlayedAt: quiz.progress.lastCompletedAt,
        }
      : null,
  };
}

export interface BrowseCatalogue {
  quizzes: BrowseQuiz[];
  categories: QuizIndexCategory[];
}

/** The library (or the part `options.match` selects) as cards, with the reader's progress. */
export async function loadBrowseCatalogue(userId?: string, options?: LoadQuizIndexOptions): Promise<BrowseCatalogue> {
  const [index, players] = await Promise.all([loadQuizIndex(userId, options), quizPlayerCounts()]);
  const categories = new Map(index.categories.map((category) => [String(category._id), category]));
  return {
    quizzes: index.quizzes.map((quiz) => toBrowseQuiz(quiz, categories, players)),
    categories: index.categories,
  };
}
