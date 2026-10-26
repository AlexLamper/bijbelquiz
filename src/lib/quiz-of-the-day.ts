/**
 * Which quiz is the quiz of the day.
 *
 * One free quiz a day, the same for everybody: the day number (UTC) indexes
 * into the free catalogue ordered by id. The app used to download the whole
 * catalogue - every question and explanation of every quiz - to make this
 * pick on the phone. Done here it is a count and a skip over an indexed
 * field, and the answer is a few hundred bytes.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days since the Unix epoch, in UTC. */
export function dayNumber(now: Date = new Date()): number {
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / MS_PER_DAY
  );
}

/** Position of today's quiz in a pool of `poolSize` quizzes ordered by id. */
export function quizOfTheDayIndex(poolSize: number, now: Date = new Date()): number {
  if (!Number.isInteger(poolSize) || poolSize < 1) return 0;
  return dayNumber(now) % poolSize;
}
