import mongoose from 'mongoose';

import { Category, Quiz } from '@/database';
import type { IDuelQuestion, IDuelRound, DuelTopicKind } from '@/database';
import { bookByCode } from '@/lib/bible-books';
import { calculateAttemptXp } from '@/lib/xp';
import { DuelError } from './errors';
import { DUEL_QUESTIONS_PER_ROUND, DUEL_ROUNDS, shuffled } from './rules';

/**
 * Picks the three rounds of a new duel from the existing quiz questions.
 *
 * A round's topic is a Bible book whenever possible - "Richteren" is a topic a
 * player recognises, and every question carries a parsed `refBook` for exactly
 * this kind of lookup. When the library has fewer usable books than rounds the
 * rest are filled from quiz categories, and as a last resort from any question
 * at all, so a duel can always be made while there are questions.
 */

/** Same filter as the public quiz list: approved, or legacy without a status. */
const PLAYABLE_QUIZ = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };

/** A question worth asking: at least two choices, and one of them right. */
const PLAYABLE_QUESTION = {
  'questions.text': { $type: 'string' },
  'questions.answers.1': { $exists: true },
  'questions.answers.isCorrect': true,
};

interface RawAnswer {
  _id?: unknown;
  text?: unknown;
  isCorrect?: unknown;
}

interface RawQuestion {
  _id?: unknown;
  text?: unknown;
  answers?: RawAnswer[];
  explanation?: unknown;
  bibleReference?: unknown;
}

interface SampledRow {
  _id: mongoose.Types.ObjectId;
  rewardXp?: number;
  questionCount?: number;
  question: RawQuestion;
}

interface TopicSeed {
  topic: string;
  topicKind: DuelTopicKind;
  topicKey: string | null;
  /** Narrows the quizzes before unwinding (index-friendly). */
  quizMatch: Record<string, unknown>;
  /** Narrows the unwound questions, fields prefixed `question.`. */
  questionMatch: Record<string, unknown>;
}

/** The playable-question filter, rewritten for the unwound `question` field. */
const PLAYABLE_UNWOUND = Object.fromEntries(
  Object.entries(PLAYABLE_QUESTION).map(([key, value]) => [
    key.replace(/^questions\./, 'question.'),
    value,
  ]),
);

function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

/** Copies one stored question into the duel, answers shuffled once for both. */
function toDuelQuestion(row: SampledRow): IDuelQuestion | null {
  const text = asText(row.question.text);
  if (!text) return null;

  const rawAnswers = Array.isArray(row.question.answers) ? row.question.answers : [];
  const answers = rawAnswers
    .map((answer, index) => {
      const answerText = asText(answer.text);
      if (!answerText) return null;
      return {
        answerId: answer._id != null ? String(answer._id) : `a${index}`,
        text: answerText,
        isCorrect: answer.isCorrect === true,
      };
    })
    .filter((answer): answer is NonNullable<typeof answer> => answer !== null);

  if (answers.length < 2 || !answers.some((answer) => answer.isCorrect)) return null;

  const reference = asText(row.question.bibleReference);
  const questionCount = Math.max(1, row.questionCount ?? 1);
  const rewardXp = typeof row.rewardXp === 'number' ? row.rewardXp : 50;

  return {
    quizId: row._id ?? null,
    questionId: row.question._id != null ? String(row.question._id) : `${String(row._id)}:${text}`,
    text,
    answers: shuffled(answers),
    explanation: asText(row.question.explanation),
    bibleReference: reference && reference !== '-' ? reference : null,
    // One question's share of the quiz reward, exactly what a correct answer
    // is worth in the solo quiz it came from. At least 1 so a long quiz still
    // pays something, but a quiz set to give no XP gives none here either.
    xp: rewardXp > 0 ? Math.max(1, calculateAttemptXp(rewardXp, 1, questionCount)) : 0,
  };
}

/** Samples questions for a topic, skipping duplicates already in the duel. */
async function sampleQuestions(
  seed: Pick<TopicSeed, 'quizMatch' | 'questionMatch'>,
  count: number,
  usedTexts: Set<string>,
): Promise<IDuelQuestion[]> {
  const rows = await Quiz.aggregate<SampledRow>([
    { $match: { ...PLAYABLE_QUIZ, ...seed.quizMatch } },
    {
      $project: {
        rewardXp: 1,
        questionCount: { $size: { $ifNull: ['$questions', []] } },
        question: '$questions',
      },
    },
    { $unwind: '$question' },
    { $match: { ...PLAYABLE_UNWOUND, ...seed.questionMatch } },
    // Over-sample: the same question sometimes appears in two quizzes.
    { $sample: { size: count * 4 } },
  ]);

  const picked: IDuelQuestion[] = [];
  for (const row of rows) {
    if (picked.length >= count) break;
    const question = toDuelQuestion(row);
    if (!question) continue;
    const key = question.text.toLowerCase();
    if (usedTexts.has(key)) continue;
    usedTexts.add(key);
    picked.push(question);
  }
  return picked;
}

async function bookTopics(limit: number): Promise<TopicSeed[]> {
  const rows = await Quiz.aggregate<{ _id: string; count: number }>([
    { $match: { ...PLAYABLE_QUIZ } },
    { $unwind: '$questions' },
    { $match: { ...PLAYABLE_QUESTION, 'questions.refBook': { $type: 'string' } } },
    { $group: { _id: '$questions.refBook', count: { $sum: 1 } } },
    { $match: { count: { $gte: DUEL_QUESTIONS_PER_ROUND } } },
    { $sample: { size: limit * 2 } },
  ]);

  return rows
    .map((row): TopicSeed | null => {
      const book = bookByCode(row._id);
      if (!book) return null;
      return {
        topic: book.title,
        topicKind: 'book',
        topicKey: book.code,
        quizMatch: { 'questions.refBook': row._id },
        questionMatch: { 'question.refBook': row._id },
      };
    })
    .filter((seed): seed is TopicSeed => seed !== null);
}

async function categoryTopics(limit: number): Promise<TopicSeed[]> {
  const rows = await Quiz.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { ...PLAYABLE_QUIZ } },
    { $unwind: '$questions' },
    { $match: { ...PLAYABLE_QUESTION } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    { $match: { count: { $gte: DUEL_QUESTIONS_PER_ROUND } } },
    { $sample: { size: limit * 2 } },
  ]);
  if (rows.length === 0) return [];

  const categories = await Category.find({ _id: { $in: rows.map((row) => row._id) } })
    .select('title')
    .lean();
  const titles = new Map(categories.map((category) => [String(category._id), category.title]));

  return rows
    .map((row): TopicSeed | null => {
      const title = titles.get(String(row._id));
      if (!title) return null;
      return {
        topic: title,
        topicKind: 'category',
        topicKey: String(row._id),
        // `categoryId` lives on the quiz, not on the question.
        quizMatch: { categoryId: row._id },
        questionMatch: {},
      };
    })
    .filter((seed): seed is TopicSeed => seed !== null);
}

/**
 * Builds the rounds of a new duel. Throws `NO_QUESTIONS` when the library is
 * too small for even one full duel, which is a configuration problem rather
 * than something the player did.
 */
export async function pickDuelRounds(
  rounds = DUEL_ROUNDS,
  perRound = DUEL_QUESTIONS_PER_ROUND,
): Promise<IDuelRound[]> {
  const usedTexts = new Set<string>();
  const picked: IDuelRound[] = [];
  const usedTopics = new Set<string>();

  const candidates: TopicSeed[] = [...(await bookTopics(rounds))];
  if (candidates.length < rounds) {
    candidates.push(...(await categoryTopics(rounds)));
  }

  for (const seed of candidates) {
    if (picked.length >= rounds) break;
    const topicId = `${seed.topicKind}:${seed.topicKey}`;
    if (usedTopics.has(topicId)) continue;

    const questions = await sampleQuestions(seed, perRound, usedTexts);
    if (questions.length < perRound) continue;

    usedTopics.add(topicId);
    picked.push({
      topic: seed.topic,
      topicKind: seed.topicKind,
      topicKey: seed.topicKey,
      questions,
    });
  }

  // Too few books and categories: fill up with whatever is left.
  while (picked.length < rounds) {
    const questions = await sampleQuestions({ quizMatch: {}, questionMatch: {} }, perRound, usedTexts);
    if (questions.length < perRound) {
      throw new DuelError(
        'NO_QUESTIONS',
        'Er zijn nu niet genoeg vragen om een duel te maken. Probeer het later opnieuw.',
        503,
      );
    }
    picked.push({ topic: 'Gemengd', topicKind: 'mixed', topicKey: null, questions });
  }

  return picked;
}
