import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nextPlaceGap } from '@/lib/leaderboard-standing';

const board = [
  { _id: 'sanne', xp: 860 },
  { _id: 'lotte', xp: 745 },
  { _id: 'jonas', xp: 690 },
  { _id: 'daan', xp: 610 },
  { _id: 'alex', xp: 540 },
  { _id: 'noor', xp: 540 },
];

test('the gap to the place above is the difference plus one', () => {
  assert.deepEqual(nextPlaceGap(board, 'alex'), { place: 4, xp: 71 });
});

test('a tie with the row above needs one XP', () => {
  assert.deepEqual(nextPlaceGap(board, 'noor'), { place: 5, xp: 1 });
});

test('no gap for the leader, a missing player or a guest', () => {
  assert.equal(nextPlaceGap(board, 'sanne'), null);
  assert.equal(nextPlaceGap(board, 'ruben'), null);
  assert.equal(nextPlaceGap(board, null), null);
  assert.equal(nextPlaceGap([], 'alex'), null);
});
