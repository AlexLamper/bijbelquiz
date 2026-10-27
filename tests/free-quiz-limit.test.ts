import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FREE_QUIZ_LIMIT,
  buildFreeQuizAllowance,
  canPlayQuiz,
  lockedPaywallHref,
  readGuestAllowance,
  readGuestPlayedQuizzes,
  rememberGuestPlayedQuiz,
} from '@/lib/free-quiz-limit';
import { buildReviewQuestionsFromAttempt } from '@/lib/quiz-review';
import { dominantBookChapter, pickNextQuiz } from '@/lib/next-quiz';

/** A minimal localStorage for the guest helpers. */
function withBrowserStorage(run: () => void) {
  const store = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  g.window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  };
  try {
    run();
  } finally {
    delete g.window;
  }
  return store;
}

test('the free tier is three different quizzes', () => {
  assert.equal(FREE_QUIZ_LIMIT, 3);
});

test('a free player can start new quizzes until three are played', () => {
  const none = buildFreeQuizAllowance({ isPremium: false, playedQuizIds: [] });
  assert.equal(none.remaining, 3);
  assert.equal(none.limitReached, false);
  assert.ok(canPlayQuiz(none, 'q1'));

  const two = buildFreeQuizAllowance({ isPremium: false, playedQuizIds: ['q1', 'q2', 'q2'] });
  assert.equal(two.used, 2, 'replays of one quiz count once');
  assert.equal(two.remaining, 1);
  assert.ok(canPlayQuiz(two, 'q3'));

  const three = buildFreeQuizAllowance({ isPremium: false, playedQuizIds: ['q1', 'q2', 'q3'] });
  assert.equal(three.remaining, 0);
  assert.equal(three.limitReached, true);
  assert.equal(canPlayQuiz(three, 'q4'), false, 'a fourth new quiz is locked');
});

test('replays of played quizzes stay free, also past the limit', () => {
  const allowance = buildFreeQuizAllowance({ isPremium: false, playedQuizIds: ['q1', 'q2', 'q3', 'q4', 'q5'] });
  assert.equal(allowance.remaining, 0);
  assert.ok(canPlayQuiz(allowance, 'q5'));
  assert.ok(canPlayQuiz(allowance, 'other-id', 'q1'), 'matched by slug as well');
  assert.equal(canPlayQuiz(allowance, 'q6'), false);
});

test('Premium is never limited', () => {
  const allowance = buildFreeQuizAllowance({ isPremium: true, playedQuizIds: ['q1', 'q2', 'q3', 'q4'] });
  assert.equal(allowance.limitReached, false);
  assert.equal(allowance.remaining, FREE_QUIZ_LIMIT);
  assert.ok(canPlayQuiz(allowance, 'q99'));
});

test('the locked paywall gets the quiz to come back to', () => {
  assert.equal(lockedPaywallHref('johannes-6'), '/premium?vergrendeld=1&terug=%2Fquiz%2Fjohannes-6');
});

test('a guest counts the parked attempts and the remembered quizzes, once each', () => {
  withBrowserStorage(() => {
    const now = Date.now();
    window.localStorage.setItem(
      'bq:pending-attempts',
      JSON.stringify([
        { quizId: 'a', quizSlug: 'quiz-a', quizTitle: 'A', score: 1, totalQuestions: 2, answers: [], xpPreview: 5, completedAt: now - 2 },
        { quizId: 'a', quizSlug: 'quiz-a', quizTitle: 'A', score: 2, totalQuestions: 2, answers: [], xpPreview: 9, completedAt: now - 1 },
      ]),
    );
    rememberGuestPlayedQuiz('a', 'quiz-a');
    rememberGuestPlayedQuiz('b', 'quiz-b');

    assert.equal(readGuestPlayedQuizzes().length, 2);
    const allowance = readGuestAllowance();
    assert.equal(allowance.used, 2);
    assert.equal(allowance.remaining, 1);
    assert.ok(canPlayQuiz(allowance, 'c'));
    assert.ok(canPlayQuiz(allowance, 'unknown-id', 'quiz-b'), 'a played quiz opened by slug is a replay');

    rememberGuestPlayedQuiz('c');
    const full = readGuestAllowance();
    assert.equal(full.limitReached, true);
    assert.equal(canPlayQuiz(full, 'd'), false);
    assert.ok(canPlayQuiz(full, 'a'));
  });
});

test('a guest stays limited after the parked attempts expire', () => {
  withBrowserStorage(() => {
    rememberGuestPlayedQuiz('a');
    rememberGuestPlayedQuiz('b');
    rememberGuestPlayedQuiz('c');
    // No pending attempts at all (claimed, expired or pushed out).
    assert.equal(canPlayQuiz(readGuestAllowance(), 'd'), false);
  });
});

test('without a browser the guest helpers are empty and do not throw', () => {
  assert.deepEqual(readGuestPlayedQuizzes(), []);
  rememberGuestPlayedQuiz('a');
  assert.equal(readGuestAllowance().used, 0);
});

test('a saved attempt is reviewed by question id, falling back to position', () => {
  const questions = [
    { _id: 'q1', text: 'Een', answers: [{ _id: 'a1', text: 'Ja', isCorrect: true }, { _id: 'a2', text: 'Nee' }], explanation: 'Uitleg 1', bibleReference: 'Johannes 6:1' },
    { _id: 'q2', text: 'Twee', answers: [{ _id: 'b1', text: '3' }, { _id: 'b2', text: '5', isCorrect: true }] },
    { _id: 'q3', text: 'Drie', answers: [{ _id: 'c1', text: 'X', isCorrect: true }] },
  ];
  const review = buildReviewQuestionsFromAttempt(questions, [
    { questionId: 'q2', selectedAnswerId: 'b1', isCorrect: false },
    { questionId: 'q1', selectedAnswerId: null, selectedAnswerIndex: 0, isCorrect: true },
  ]);
  assert.equal(review.length, 3);
  assert.deepEqual(
    review.map((item) => [item.questionText, item.selectedAnswerText, item.correctAnswerText, item.isCorrect]),
    [
      ['Een', 'Ja', 'Ja', true],
      ['Twee', '3', '5', false],
      ['Drie', null, 'X', false],
    ],
  );
  assert.equal(review[0].explanation, 'Uitleg 1');
});

test('the next quiz is the next part, then the same book, then the same category', () => {
  const quizzes = [
    { id: '1', title: 'Handelingen 1', categoryId: 'nt', book: 'ACTS', chapter: 1 },
    { id: '2', title: 'Handelingen 2', categoryId: 'nt', book: 'ACTS', chapter: 2 },
    { id: '3', title: 'Handelingen 3', categoryId: 'nt', book: 'ACTS', chapter: 3 },
    { id: 'j6', title: 'Brood voor 5000', categoryId: 'nt', book: 'JOHN', chapter: 6 },
    { id: 'j2', title: 'De bruiloft in Kana', categoryId: 'nt', book: 'JOHN', chapter: 2 },
    { id: 'j9', title: 'De blindgeborene', categoryId: 'nt', book: 'JOHN', chapter: 9 },
    { id: 'g1', title: 'De schepping', categoryId: 'ot', book: 'GEN', chapter: 1 },
    { id: 'ex', title: 'Door de Rode Zee', categoryId: 'ot', book: 'EXOD', chapter: 14 },
  ];
  assert.equal(pickNextQuiz(quizzes[0], quizzes)?.id, '2', 'next part of the series');
  assert.equal(pickNextQuiz(quizzes[0], quizzes, ['2'])?.id, '3', 'a played part is skipped');
  assert.equal(pickNextQuiz(quizzes[3], quizzes)?.id, 'j9', 'same book, the next chapter on');
  assert.equal(pickNextQuiz(quizzes[3], quizzes, ['j9'])?.id, 'j2', 'same book, nearest chapter');
  assert.equal(pickNextQuiz(quizzes[6], quizzes)?.id, 'ex', 'same category');
  assert.equal(
    pickNextQuiz(quizzes[6], quizzes, quizzes.map((quiz) => quiz.id))?.id,
    'ex',
    'everything played: still a real quiz, not nothing',
  );
  assert.equal(pickNextQuiz(quizzes[0], [quizzes[0]]), null);
});

test('a quiz is about the book and chapter most questions cite', () => {
  assert.deepEqual(
    dominantBookChapter([
      { refBook: 'JOHN', refChapter: 6 },
      { refBook: 'JOHN', refChapter: 6 },
      { refBook: 'MATT', refChapter: 14 },
      { refBook: null },
    ]),
    { book: 'JOHN', chapter: 6 },
  );
  assert.deepEqual(dominantBookChapter([]), { book: null, chapter: null });
});
