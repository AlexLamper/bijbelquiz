import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentTurn,
  nextQuestionIndex,
  opponentMark,
  outcomeFor,
  roundStarter,
  shuffled,
  turnSlots,
  type AnswerLike,
} from '@/lib/duels/rules';

function playRound(round: number, correct: boolean[]): AnswerLike[] {
  return correct.map((isCorrect, question) => ({ round, question, correct: isCorrect }));
}

test('rounds alternate who starts', () => {
  assert.equal(roundStarter(0), 'challenger');
  assert.equal(roundStarter(1), 'opponent');
  assert.equal(roundStarter(2), 'challenger');
});

test('turn order is A1 | B1 B2 | A2 A3 | B3', () => {
  assert.deepEqual(
    turnSlots().map((slot) => `${slot.side === 'challenger' ? 'A' : 'B'}${slot.round + 1}`),
    ['A1', 'B1', 'B2', 'A2', 'A3', 'B3'],
  );
});

test('current turn follows the answers', () => {
  const a: AnswerLike[] = [];
  const b: AnswerLike[] = [];
  assert.deepEqual(currentTurn(a, b), { slot: 0, side: 'challenger', round: 0 });

  // Halfway through a round it is still the same player's turn.
  a.push(...playRound(0, [true, false]));
  assert.deepEqual(currentTurn(a, b), { slot: 0, side: 'challenger', round: 0 });
  assert.equal(nextQuestionIndex(a, 0), 2);

  a.push({ round: 0, question: 2, correct: true });
  assert.deepEqual(currentTurn(a, b), { slot: 1, side: 'opponent', round: 0 });

  b.push(...playRound(0, [true, true, true]));
  assert.deepEqual(currentTurn(a, b), { slot: 2, side: 'opponent', round: 1 });

  b.push(...playRound(1, [false, false, true]));
  assert.deepEqual(currentTurn(a, b), { slot: 3, side: 'challenger', round: 1 });

  a.push(...playRound(1, [true, true, true]));
  a.push(...playRound(2, [true, true, false]));
  assert.deepEqual(currentTurn(a, b), { slot: 5, side: 'opponent', round: 2 });

  b.push(...playRound(2, [true, false, false]));
  assert.deepEqual(currentTurn(a, b), { slot: 6, side: null, round: 3 });
  assert.equal(nextQuestionIndex(b, 2), null);
});

test('outcome per side, ties allowed', () => {
  assert.equal(outcomeFor('challenger', 7, 4), 'won');
  assert.equal(outcomeFor('opponent', 7, 4), 'lost');
  assert.equal(outcomeFor('opponent', 3, 5), 'won');
  assert.equal(outcomeFor('challenger', 5, 5), 'tie');
});

test("the opponent's pick stays hidden until you answered the same question", () => {
  const theirs = { round: 0, question: 0, correct: false };
  assert.equal(opponentMark({ viewerAnswered: false, opponentAnswer: undefined, finished: false }), 'pending');
  assert.equal(opponentMark({ viewerAnswered: false, opponentAnswer: theirs, finished: false }), 'hidden');
  assert.equal(opponentMark({ viewerAnswered: true, opponentAnswer: theirs, finished: false }), 'wrong');
  assert.equal(opponentMark({ viewerAnswered: false, opponentAnswer: theirs, finished: true }), 'wrong');
});

test('shuffle keeps every item', () => {
  const items = ['a', 'b', 'c', 'd'];
  let seed = 0.42;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280 / 233280;
    return seed;
  };
  assert.deepEqual([...shuffled(items, random)].sort(), items);
  assert.deepEqual(items, ['a', 'b', 'c', 'd']);
});
