import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateAttemptXp, getHighestEarnedAttemptXp } from '@/lib/xp';

test('calculateAttemptXp clamps invalid values safely', () => {
  assert.equal(calculateAttemptXp(50, 7, 10), 35);
  assert.equal(calculateAttemptXp(50, 99, 10), 50);
  assert.equal(calculateAttemptXp(50, -2, 10), 0);
  assert.equal(calculateAttemptXp(50, 5, 0), 50);
});

test('getHighestEarnedAttemptXp returns best historical attempt', () => {
  const bestXp = getHighestEarnedAttemptXp(50, [
    { score: 7, totalQuestions: 10 },
    { score: 6, totalQuestions: 6 },
    { score: 5, totalQuestions: 5 },
  ]);

  assert.equal(bestXp, 50);
});

test('xp delta prevents over-rewarding after quiz edits', () => {
  const baseReward = 50;
  const previousBest = getHighestEarnedAttemptXp(baseReward, [
    { score: 7, totalQuestions: 10 },
    { score: 6, totalQuestions: 6 },
  ]);
  const currentAttemptXp = calculateAttemptXp(baseReward, 6, 6);
  const delta = Math.max(0, currentAttemptXp - previousBest);

  assert.equal(previousBest, 50);
  assert.equal(currentAttemptXp, 50);
  assert.equal(delta, 0);
});
