/**
 * The rules of a duel, as pure functions.
 *
 * 1-tegen-1, om de beurt: three rounds of three questions, every round on its
 * own topic. Whoever starts a round alternates - the challenger opens round 1,
 * the opponent round 2, the challenger round 3 - and the other player answers
 * the same three questions after them. Laid out as turns that is
 *
 *   challenger R1 | opponent R1, R2 | challenger R2, R3 | opponent R3
 *
 * so after the first move each player plays two rounds in a row, exactly like
 * the duel games people already know. Score is the number of correct answers;
 * the higher total after three rounds wins, and a tie is a tie.
 *
 * Nothing here touches the database, so the turn order can be tested on its
 * own (`tests/duels.test.ts`).
 */

export const DUEL_ROUNDS = 3;
export const DUEL_QUESTIONS_PER_ROUND = 3;

/** A duel nobody moves in for a week is settled on the next read. */
export const DUEL_TURN_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

/** Random and invite duels still waiting for a second player, per account. */
export const MAX_OPEN_DUELS_PER_USER = 5;

/** Unfinished duels per account, so the list stays a list. */
export const MAX_ACTIVE_DUELS_PER_USER = 50;

/** Finished duels shown under "Afgelopen". */
export const FINISHED_DUELS_LISTED = 20;

export type Side = 'challenger' | 'opponent';

export interface AnswerLike {
  round: number;
  question: number;
  correct: boolean;
}

export interface TurnSlot {
  side: Side;
  round: number;
}

export function otherSide(side: Side): Side {
  return side === 'challenger' ? 'opponent' : 'challenger';
}

/** Who answers a round's questions first. */
export function roundStarter(round: number): Side {
  return round % 2 === 0 ? 'challenger' : 'opponent';
}

/** Every (player, round) pair in the order they are played. */
export function turnSlots(rounds = DUEL_ROUNDS): TurnSlot[] {
  const slots: TurnSlot[] = [];
  for (let round = 0; round < rounds; round += 1) {
    const starter = roundStarter(round);
    slots.push({ side: starter, round });
    slots.push({ side: otherSide(starter), round });
  }
  return slots;
}

export function answersInRound<T extends AnswerLike>(answers: T[], round: number): T[] {
  return answers.filter((answer) => answer.round === round);
}

export function hasAnswered(answers: AnswerLike[], round: number, question: number): boolean {
  return answers.some((answer) => answer.round === round && answer.question === question);
}

export function isRoundDone(
  answers: AnswerLike[],
  round: number,
  questionsPerRound = DUEL_QUESTIONS_PER_ROUND,
): boolean {
  return answersInRound(answers, round).length >= questionsPerRound;
}

/** The next question a player has to answer in a round, or null when done. */
export function nextQuestionIndex(
  answers: AnswerLike[],
  round: number,
  questionsPerRound = DUEL_QUESTIONS_PER_ROUND,
): number | null {
  for (let question = 0; question < questionsPerRound; question += 1) {
    if (!hasAnswered(answers, round, question)) return question;
  }
  return null;
}

export interface CurrentTurn {
  /** Index into `turnSlots()`; equals the slot count when everything is played. */
  slot: number;
  side: Side | null;
  round: number;
}

/** Whose move it is, derived from what both players have answered so far. */
export function currentTurn(
  challengerAnswers: AnswerLike[],
  opponentAnswers: AnswerLike[],
  rounds = DUEL_ROUNDS,
  questionsPerRound = DUEL_QUESTIONS_PER_ROUND,
): CurrentTurn {
  const slots = turnSlots(rounds);
  for (let index = 0; index < slots.length; index += 1) {
    const { side, round } = slots[index];
    const answers = side === 'challenger' ? challengerAnswers : opponentAnswers;
    if (!isRoundDone(answers, round, questionsPerRound)) {
      return { slot: index, side, round };
    }
  }
  return { slot: slots.length, side: null, round: rounds };
}

export function scoreOf(answers: AnswerLike[]): number {
  return answers.filter((answer) => answer.correct).length;
}

export type Outcome = 'won' | 'lost' | 'tie';

/** The result from one side's point of view, once every round is played. */
export function outcomeFor(side: Side, challengerScore: number, opponentScore: number): Outcome {
  if (challengerScore === opponentScore) return 'tie';
  const challengerWon = challengerScore > opponentScore;
  if (side === 'challenger') return challengerWon ? 'won' : 'lost';
  return challengerWon ? 'lost' : 'won';
}

export type ResultMark = 'correct' | 'wrong' | 'pending' | 'hidden';

/**
 * What a viewer may see of the other player's answer to one question.
 *
 * The opponent's pick is shown once the viewer has answered that question
 * too (or the duel is over). Before that it is `hidden` when they already
 * played it and `pending` when they have not - knowing that they did is fine,
 * knowing what they chose would give the answer away.
 */
export function opponentMark(params: {
  viewerAnswered: boolean;
  opponentAnswer: AnswerLike | undefined;
  finished: boolean;
}): ResultMark {
  const { viewerAnswered, opponentAnswer, finished } = params;
  if (!opponentAnswer) return 'pending';
  if (!viewerAnswered && !finished) return 'hidden';
  return opponentAnswer.correct ? 'correct' : 'wrong';
}

export function ownMark(answer: AnswerLike | undefined): ResultMark {
  if (!answer) return 'pending';
  return answer.correct ? 'correct' : 'wrong';
}

/** Fisher-Yates, with an injectable random source for tests. */
export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}
