/**
 * The database half of the quiz of the day, shared by the app's
 * `/api/mobile/quiz-of-the-day` and the website dashboard so both show the
 * same quiz on the same day. The rule itself (day number into the catalogue
 * ordered by id) is in `quiz-of-the-day.ts`.
 */

import { Quiz } from '@/database';
import { quizOfTheDayIndex } from '@/lib/quiz-of-the-day';

// Approved (or legacy, status-less) and still active - the same quizzes the
// catalogue offers. Free ones first: nobody is offered a quiz of the day they
// cannot play.
export const QUIZ_OF_THE_DAY_PLAYABLE = {
  $or: [{ status: 'approved' }, { status: { $exists: false } }],
  isActive: { $ne: false },
};
export const QUIZ_OF_THE_DAY_FREE = { ...QUIZ_OF_THE_DAY_PLAYABLE, isPremium: { $ne: true } };

const FIELDS = 'title slug description imageUrl rewardXp categoryId difficulty isPremium questions.bibleReference';

/** One quiz of `filter` for the day of `now`: a count, a skip over `_id`, one projected read. */
export async function pickQuizOfTheDayFrom(filter: Record<string, unknown>, now: Date = new Date()) {
  const count = await Quiz.countDocuments(filter);
  if (count === 0) return null;

  const [quiz] = await Quiz.find(filter)
    .sort({ _id: 1 })
    .skip(quizOfTheDayIndex(count, now))
    .limit(1)
    .select(FIELDS)
    .lean();

  return quiz ?? null;
}

/** Today's quiz: a free one, or any playable quiz when there is no free one. Expects a connected DB. */
export async function pickQuizOfTheDay(now: Date = new Date()) {
  return (await pickQuizOfTheDayFrom(QUIZ_OF_THE_DAY_FREE, now)) ?? (await pickQuizOfTheDayFrom(QUIZ_OF_THE_DAY_PLAYABLE, now));
}
