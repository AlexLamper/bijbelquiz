import test from 'node:test';
import assert from 'node:assert/strict';
import { dayNumber, quizOfTheDayIndex } from '@/lib/quiz-of-the-day';

test('dayNumber counts whole UTC days since the epoch', () => {
  assert.equal(dayNumber(new Date('1970-01-01T00:00:00Z')), 0);
  assert.equal(dayNumber(new Date('1970-01-02T23:59:59Z')), 1);
  assert.equal(dayNumber(new Date('2026-10-26T12:00:00Z')), 20752);
});

test('the pick is stable within a day and moves on the next', () => {
  const morning = quizOfTheDayIndex(30, new Date('2026-10-26T00:01:00Z'));
  const night = quizOfTheDayIndex(30, new Date('2026-10-26T23:59:00Z'));
  const tomorrow = quizOfTheDayIndex(30, new Date('2026-10-27T00:01:00Z'));
  assert.equal(morning, night);
  assert.equal(tomorrow, (morning + 1) % 30);
});

test('an empty or invalid pool falls back to index 0', () => {
  assert.equal(quizOfTheDayIndex(0), 0);
  assert.equal(quizOfTheDayIndex(-3), 0);
});
