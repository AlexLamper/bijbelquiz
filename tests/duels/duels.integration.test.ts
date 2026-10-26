import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { Category, Duel, PlayerGroup, Quiz, User, connectDB } from '@/database';
import { bookByCode } from '@/lib/bible-books';
import { isDuelError, type DuelErrorCode } from '@/lib/duels/errors';
import { pickDuelRounds } from '@/lib/duels/questions';
import { DUEL_TURN_TIMEOUT_MS, MAX_ACTIVE_DUELS_PER_USER } from '@/lib/duels/rules';
import {
  createDuel,
  declineDuel,
  forfeitDuel,
  getDuel,
  getInvitePreview,
  joinDuelByInvite,
  listDuelPlayers,
  listDuels,
  submitDuelAnswer,
} from '@/lib/duels/service';
import { getLevelInfo } from '@/lib/gamification';
import { calculateAttemptXp } from '@/lib/xp';

/**
 * The duel service against a real mongod (mongodb-memory-server downloads one
 * on first run and caches it). Covers what the pure rule tests cannot: the
 * queries, the indexes, optimistic concurrency and what each player is shown.
 *
 * Part of `npm test`; on its own (with the rule tests) `npm run test:duels`.
 * The first run downloads mongod (~120 MB) into node_modules/.cache.
 */

let mongod: MongoMemoryServer;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('bijbelquiz-duels-test');
  await connectDB();
  // Build the indexes up front: the sparse unique invite token is part of
  // what is being tested.
  await Promise.all([Duel.init(), User.init(), Quiz.init(), Category.init(), PlayerGroup.init()]);
  await seedLibrary();
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let userCounter = 0;

async function makeUser(name: string): Promise<string> {
  userCounter += 1;
  const user = await User.create({ email: `duel-${userCounter}@test.local`, name });
  return String(user._id);
}

function question(text: string, reference: string | null, answers = 3) {
  return {
    text,
    bibleReference: reference ?? undefined,
    explanation: `Uitleg bij ${text}`,
    answers: Array.from({ length: answers }, (_, index) => ({
      text: `${text} - antwoord ${index + 1}`,
      isCorrect: index === 0,
    })),
  };
}

function bookQuestions(prefix: string, book: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    question(`${prefix} vraag ${index + 1}?`, `${book} ${index + 1}:${index + 2}`),
  );
}

let quizCounter = 0;

async function makeQuiz(
  categoryId: mongoose.Types.ObjectId,
  rewardXp: number,
  questions: ReturnType<typeof question>[],
  extra: Record<string, unknown> = {},
) {
  quizCounter += 1;
  // Quiz.create, not insertMany: the pre-save hook fills `refBook`.
  return Quiz.create({
    title: `Quiz ${quizCounter}`,
    slug: `quiz-${quizCounter}`,
    categoryId,
    rewardXp,
    questions,
    ...extra,
  });
}

async function seedLibrary() {
  const [wet, geschiedenis, evangelien] = await Category.create([
    { title: 'De Wet', slug: 'wet' },
    { title: 'Geschiedenis', slug: 'geschiedenis' },
    { title: 'Evangelien', slug: 'evangelien' },
  ]);

  await makeQuiz(wet._id as mongoose.Types.ObjectId, 50, [
    ...bookQuestions('Genesis', 'Genesis', 5),
    // Never playable: one answer, or no right answer.
    { ...question('ONSPEELBAAR een antwoord?', 'Genesis 9:9', 1) },
    {
      ...question('ONSPEELBAAR geen goed antwoord?', 'Genesis 9:10'),
      answers: [
        { text: 'x', isCorrect: false },
        { text: 'y', isCorrect: false },
      ],
    },
  ]);
  await makeQuiz(wet._id as mongoose.Types.ObjectId, 60, bookQuestions('Exodus', 'Exodus', 4));
  await makeQuiz(geschiedenis._id as mongoose.Types.ObjectId, 30, [
    ...bookQuestions('Richteren', 'Richteren', 4),
    ...bookQuestions('Ruth', 'Ruth', 3),
  ]);
  await makeQuiz(evangelien._id as mongoose.Types.ObjectId, 40, [
    ...bookQuestions('Johannes', 'Johannes', 4),
    ...bookQuestions('Handelingen', 'Handelingen', 4),
  ]);
  // Not approved: must never end up in a duel.
  await makeQuiz(wet._id as mongoose.Types.ObjectId, 50, bookQuestions('CONCEPT', 'Genesis', 6), {
    status: 'draft',
  });

  const genesis = await Quiz.findOne({ 'questions.text': 'Genesis vraag 1?' }).lean();
  assert.equal(genesis?.questions[0].refBook, 'GEN', 'seed: refBook is filled by the save hook');
}

/** The stored duel, including the right answers the views keep hidden. */
async function stored(duelId: string) {
  const duel = await Duel.findById(duelId).lean();
  assert.ok(duel, 'duel exists');
  return duel;
}

async function choices(duelId: string, round: number, questionIndex: number) {
  const duel = await stored(duelId);
  const q = duel.rounds[round].questions[questionIndex];
  const right = q.answers.find((answer) => answer.isCorrect);
  const wrong = q.answers.find((answer) => !answer.isCorrect);
  assert.ok(right && wrong);
  return { right: right.answerId, wrong: wrong.answerId, xp: q.xp, text: q.text };
}

async function answer(userId: string, duelId: string, round: number, questionIndex: number, correct: boolean) {
  const ids = await choices(duelId, round, questionIndex);
  return submitDuelAnswer(userId, duelId, {
    roundIndex: round,
    questionIndex,
    answerId: correct ? ids.right : ids.wrong,
  });
}

async function playRound(userId: string, duelId: string, round: number, pattern: boolean[]) {
  const results = [];
  for (let index = 0; index < pattern.length; index += 1) {
    results.push(await answer(userId, duelId, round, index, pattern[index]));
  }
  return results;
}

async function expectDuelError(promise: Promise<unknown>, code: DuelErrorCode) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(isDuelError(error), `expected DuelError ${code}, got ${String(error)}`);
    assert.equal(error.code, code);
    return true;
  });
}

async function xpOf(userId: string) {
  const user = await User.findById(userId).lean();
  assert.ok(user);
  return user;
}

/** Noon yesterday in Amsterdam, which is how the streak counts days. */
function yesterdayInAmsterdam(): Date {
  const [day, month, year] = new Date()
    .toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })
    .split('-')
    .map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1, 11, 0, 0));
}

function allQuestionTexts(duel: Awaited<ReturnType<typeof stored>>, round?: number): string[] {
  return duel.rounds
    .filter((_, index) => round === undefined || index === round)
    .flatMap((r) => r.questions.flatMap((q) => [q.text, ...q.answers.map((a) => a.text)]));
}

/** Pushes the deadline (and last move) of a duel into the past. */
async function expire(duelId: string) {
  const past = new Date(Date.now() - DUEL_TURN_TIMEOUT_MS - 60_000);
  await Duel.updateOne(
    { _id: duelId },
    { $set: { turnDeadline: new Date(Date.now() - 60_000), lastMoveAt: past } },
    { timestamps: false },
  );
}

// ---------------------------------------------------------------------------
// 1. Friend duel, played to the end
// ---------------------------------------------------------------------------

test('friend duel: six turns in order, score, winner, record, XP and streak', async () => {
  const anna = await makeUser('Anna Vriend');
  const bram = await makeUser('Bram Vriend');
  // Anna played yesterday with a streak of 3 and is just under level 2.
  await User.updateOne(
    { _id: anna },
    { $set: { xp: 480, streak: 3, bestStreak: 3, lastPlayedAt: yesterdayInAmsterdam() } },
  );

  const created = await createDuel(anna, { mode: 'friend', opponentId: bram });
  assert.equal(created.created, true);
  assert.equal(created.matched, false);
  assert.equal(created.inviteUrl, null);
  assert.equal(created.inviteToken, null);
  assert.equal(created.inviteMessage, null);
  const view = created.duel;
  const id = view.id;
  assert.equal(view.mode, 'friend');
  assert.equal(view.status, 'active');
  assert.equal(view.isChallenger, true);
  assert.equal(view.opponent?.id, bram);
  assert.equal(view.opponent?.name, 'Bram Vriend');
  assert.equal(view.turn, 'me');
  assert.equal(view.nextQuestionIndex, 0);
  assert.equal(view.currentRound, 1);
  assert.equal(view.totalRounds, 3);
  assert.equal(view.questionsPerRound, 3);
  assert.equal(view.canDecline, false);
  assert.equal(view.canForfeit, true);
  assert.equal(view.rounds.length, 3);
  assert.equal(view.rounds[0].questionsVisible, true);
  assert.equal(view.rounds[0].questions.length, 3);
  assert.deepEqual(
    view.rounds.map((round) => round.starter),
    ['me', 'opponent', 'me'],
  );
  assert.equal(view.rounds[1].questions.length, 0);
  assert.equal(view.rounds[2].questions.length, 0);

  // A friend duel never carries an invite token (sparse unique index), and
  // holds its pair key while it runs.
  const raw = await Duel.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
  assert.ok(raw && !('inviteToken' in raw), 'no inviteToken field on a friend duel');
  assert.equal(raw.runningKey, `pair:${[anna, bram].sort().join(':')}`);

  // Three rounds on three different Bible books, from approved quizzes only,
  // each question worth its share of its quiz reward.
  const doc = await stored(id);
  const keys = new Set<string>();
  for (const round of doc.rounds) {
    assert.equal(round.topicKind, 'book');
    assert.ok(round.topicKey);
    assert.equal(round.topic, bookByCode(round.topicKey)?.title);
    keys.add(round.topicKey);
    assert.equal(round.questions.length, 3);
    for (const q of round.questions) {
      const quiz = await Quiz.findById(q.quizId).lean();
      assert.ok(quiz, 'question keeps its quiz id');
      assert.equal(quiz.status, 'approved');
      const source = (quiz.questions as Array<{ _id?: unknown; refBook?: string | null }>).find(
        (item) => String(item._id) === q.questionId,
      );
      assert.ok(source, 'question keeps its question id');
      assert.equal(source.refBook, round.topicKey);
      assert.equal(
        q.xp,
        quiz.rewardXp > 0 ? Math.max(1, calculateAttemptXp(quiz.rewardXp, 1, quiz.questions.length)) : 0,
      );
      assert.ok(!q.text.startsWith('ONSPEELBAAR') && !q.text.startsWith('CONCEPT'));
    }
  }
  assert.equal(keys.size, 3, 'three different books');
  assert.equal(new Set(allQuestionTexts(doc)).size, allQuestionTexts(doc).length, 'no repeats');

  // Bram cannot open the duel.
  await expectDuelError(answer(bram, id, 0, 0, true), 'NOT_YOUR_TURN');

  // Turn 1: Anna, round 1.
  const annaR1 = await playRound(anna, id, 0, [true, false, true]);
  assert.equal(annaR1[0].result.isCorrect, true);
  assert.equal(annaR1[1].result.isCorrect, false);
  assert.equal(annaR1[0].result.roundComplete, false);
  assert.equal(annaR1[2].result.roundComplete, true);
  assert.equal(annaR1[2].duel.turn, 'opponent');
  await expectDuelError(answer(anna, id, 1, 0, true), 'NOT_YOUR_TURN');

  let bramList = await listDuels(bram);
  assert.deepEqual(bramList.myTurn.map((d) => d.id), [id]);
  assert.equal(bramList.turnCount, 1);
  let annaList = await listDuels(anna);
  assert.deepEqual(annaList.waiting.map((d) => d.id), [id]);
  assert.equal(annaList.turnCount, 0);

  // Turns 2 and 3: Bram, rounds 1 and 2 back to back.
  await playRound(bram, id, 0, [true, true, false]);
  assert.equal((await getDuel(bram, id)).turn, 'me', 'Bram goes straight on to round 2');
  assert.equal((await getDuel(bram, id)).currentRound, 2);
  await expectDuelError(answer(anna, id, 1, 0, true), 'NOT_YOUR_TURN');
  await playRound(bram, id, 1, [true, false, false]);

  // Turns 4 and 5: Anna, rounds 2 and 3.
  await expectDuelError(answer(bram, id, 2, 0, true), 'NOT_YOUR_TURN');
  await playRound(anna, id, 1, [true, true, true]);
  await playRound(anna, id, 2, [false, true, true]);
  annaList = await listDuels(anna);
  assert.equal(annaList.turnCount, 0);
  bramList = await listDuels(bram);
  assert.equal(bramList.turnCount, 1);

  // Turn 6: Bram, round 3.
  const last = await playRound(bram, id, 2, [true, true, true]);
  const final = last[2].duel;
  assert.equal(final.status, 'finished');
  assert.equal(final.endReason, 'completed');
  assert.equal(final.outcome, 'lost');
  assert.equal(final.myScore, 6);
  assert.equal(final.opponentScore, 7);
  assert.equal(final.turn, 'none');
  assert.equal(final.turnDeadline, null);
  assert.ok(final.finishedAt);
  assert.equal(final.canForfeit, false);
  assert.equal(final.canDecline, false);

  const annaView = await getDuel(anna, id);
  assert.equal(annaView.outcome, 'won');
  assert.equal(annaView.myScore, 7);
  assert.equal(annaView.opponentScore, 6);
  // Everything is revealed once the duel is over.
  for (const round of annaView.rounds) {
    assert.equal(round.questionsVisible, true);
    for (const q of round.questions) {
      assert.ok(q.correctAnswerId);
      assert.ok(q.opponentAnswerId);
    }
  }

  const end = await stored(id);
  assert.equal(String(end.winnerId), anna);
  assert.equal(end.challengerScore, 7);
  assert.equal(end.opponentScore, 6);
  assert.equal(end.turnSlot, 6);
  assert.equal(end.turnUserId, null);
  assert.ok(!('runningKey' in end), 'the pair key is removed when the duel ends');

  // Playing on after the end.
  await expectDuelError(answer(bram, id, 2, 0, false), 'ANSWER_ALREADY_SUBMITTED');

  annaList = await listDuels(anna);
  assert.deepEqual(annaList.finished.map((d) => d.id), [id]);
  assert.deepEqual(annaList.record, { wins: 1, losses: 0, ties: 0 });
  assert.equal(annaList.myTurn.length + annaList.waiting.length, 0);
  bramList = await listDuels(bram);
  assert.deepEqual(bramList.record, { wins: 0, losses: 1, ties: 0 });

  // XP: each correct answer's share, on the account and on the duel.
  const annaXp = end.challengerAnswers.reduce((sum, a) => sum + a.xp, 0);
  const bramXp = end.opponentAnswers.reduce((sum, a) => sum + a.xp, 0);
  const expectedAnnaXp = end.challengerAnswers
    .filter((a) => a.correct)
    .reduce((sum, a) => sum + end.rounds[a.round].questions[a.question].xp, 0);
  assert.equal(annaXp, expectedAnnaXp);
  assert.ok(annaXp > 0 && bramXp > 0);
  assert.equal(end.challengerXp, annaXp);
  assert.equal(end.opponentXp, bramXp);
  assert.equal(annaView.xpEarned, annaXp);

  const annaUser = await xpOf(anna);
  const bramUser = await xpOf(bram);
  assert.equal(annaUser.xp, 480 + annaXp);
  assert.equal(bramUser.xp, bramXp);
  assert.equal(annaUser.level, getLevelInfo(480 + annaXp).level);
  assert.equal(annaUser.levelTitle, getLevelInfo(480 + annaXp).title);

  // Streak: yesterday + today = 4 for Anna, a fresh 1 for Bram.
  assert.equal(annaUser.streak, 4);
  assert.equal(annaUser.bestStreak, 4);
  assert.equal(bramUser.streak, 1);
  assert.equal(bramUser.bestStreak, 1);
  assert.ok(bramUser.lastPlayedAt && Date.now() - new Date(bramUser.lastPlayedAt).getTime() < 60_000);

  // The finished duel no longer blocks a new challenge between the two.
  const rematch = await createDuel(bram, { mode: 'friend', opponentName: 'anna vriend' });
  assert.equal(rematch.created, true);
  assert.notEqual(rematch.duel.id, id);
  assert.equal(rematch.duel.opponent?.id, anna);
});

test('friend duel: a tie has no winner and counts as a tie', async () => {
  const a = await makeUser('Gelijk Een');
  const b = await makeUser('Gelijk Twee');
  const { duel } = await createDuel(a, { mode: 'friend', opponentId: b });
  await playRound(a, duel.id, 0, [true, true, true]);
  await playRound(b, duel.id, 0, [true, true, true]);
  await playRound(b, duel.id, 1, [false, false, false]);
  await playRound(a, duel.id, 1, [false, false, false]);
  await playRound(a, duel.id, 2, [true, false, false]);
  const last = await playRound(b, duel.id, 2, [false, false, true]);
  assert.equal(last[2].duel.outcome, 'tie');
  assert.equal((await getDuel(a, duel.id)).outcome, 'tie');
  assert.deepEqual((await listDuels(a)).record, { wins: 0, losses: 0, ties: 1 });
  assert.deepEqual((await listDuels(b)).record, { wins: 0, losses: 0, ties: 1 });
});

// ---------------------------------------------------------------------------
// 2. What each player may see
// ---------------------------------------------------------------------------

test('visibility: picks, right answers and unplayed rounds stay hidden until answered', async () => {
  const cas = await makeUser('Cas Zicht');
  const dirk = await makeUser('Dirk Zicht');
  const { duel } = await createDuel(cas, { mode: 'friend', opponentId: dirk });
  const id = duel.id;
  const doc = await stored(id);

  // Before anyone played: Dirk sees nothing of any round.
  let dirkView = await getDuel(dirk, id);
  assert.equal(dirkView.turn, 'opponent');
  assert.equal(dirkView.canDecline, true);
  assert.ok(dirkView.rounds.every((round) => !round.questionsVisible && round.questions.length === 0));
  for (const text of allQuestionTexts(doc)) {
    assert.ok(!JSON.stringify(dirkView).includes(text), `Dirk must not see "${text}" yet`);
  }

  // Cas sees round 1 to play it, but never which answer is right.
  const casStart = await getDuel(cas, id);
  assert.ok(casStart.rounds[0].questions.every((q) => q.correctAnswerId === null && q.explanation === null));
  assert.ok(!JSON.stringify(casStart).includes('isCorrect'));
  for (const text of allQuestionTexts(doc, 1).concat(allQuestionTexts(doc, 2))) {
    assert.ok(!JSON.stringify(casStart).includes(text), 'later rounds stay hidden');
  }

  const casR1 = await playRound(cas, id, 0, [true, false, true]);
  // Right after answering, the right answer and explanation are shown.
  const first = casR1[0].result;
  assert.equal(first.correctAnswerId, (await choices(id, 0, 0)).right);
  assert.equal(first.explanation, `Uitleg bij ${doc.rounds[0].questions[0].text}`);
  assert.ok(first.bibleReference);
  assert.equal(first.opponentResult, 'pending');
  assert.equal(first.opponentAnswerId, null);
  assert.ok(first.xpEarned > 0);
  assert.equal(casR1[1].result.xpEarned, 0);

  // Dirk's turn: he sees the questions of round 1 but none of Cas's picks.
  dirkView = await getDuel(dirk, id);
  assert.equal(dirkView.turn, 'me');
  assert.equal(dirkView.nextQuestionIndex, 0);
  const r1 = dirkView.rounds[0];
  assert.equal(r1.questionsVisible, true);
  assert.deepEqual(r1.opponentResults, ['hidden', 'hidden', 'hidden']);
  assert.equal(r1.opponentScore, 0);
  assert.equal(dirkView.opponentScore, 0);
  for (const q of r1.questions) {
    assert.equal(q.opponentAnswerId, null);
    assert.equal(q.opponentResult, 'hidden');
    assert.equal(q.correctAnswerId, null);
    assert.equal(q.explanation, null);
    assert.equal(q.bibleReference, null);
    assert.equal(q.myResult, 'pending');
  }
  assert.ok(!JSON.stringify(dirkView).includes('isCorrect'));

  // Cas, waiting: his own marks, Dirk's still pending, rounds 2 and 3 hidden.
  let casView = await getDuel(cas, id);
  assert.deepEqual(casView.rounds[0].myResults, ['correct', 'wrong', 'correct']);
  assert.deepEqual(casView.rounds[0].opponentResults, ['pending', 'pending', 'pending']);
  assert.equal(casView.rounds[1].questionsVisible, false);
  assert.equal(casView.nextQuestionIndex, null);

  // Lists never carry questions at all.
  const casList = JSON.stringify(await listDuels(cas));
  const dirkList = JSON.stringify(await listDuels(dirk));
  for (const text of allQuestionTexts(doc)) {
    assert.ok(!casList.includes(text) && !dirkList.includes(text), 'no question text in a list');
  }

  // Dirk answers question 1: that one is revealed, question 2 is not.
  const casPicks = (await stored(id)).challengerAnswers;
  const d1 = await answer(dirk, id, 0, 0, true);
  assert.equal(d1.result.opponentAnswerId, casPicks[0].answerId);
  assert.equal(d1.result.opponentResult, 'correct');
  assert.equal(d1.result.correctAnswerId, (await choices(id, 0, 0)).right);
  const q2 = d1.duel.rounds[0].questions[1];
  assert.equal(q2.opponentAnswerId, null);
  assert.equal(q2.opponentResult, 'hidden');
  assert.equal(q2.correctAnswerId, null);
  assert.equal(d1.duel.opponentScore, 1, 'only revealed answers count');

  const d2 = await answer(dirk, id, 0, 1, false);
  assert.equal(d2.result.opponentResult, 'wrong');
  assert.equal(d2.result.opponentAnswerId, casPicks[1].answerId);
  await answer(dirk, id, 0, 2, true);

  // Dirk plays on into round 2, which Cas has not seen.
  dirkView = await getDuel(dirk, id);
  assert.equal(dirkView.rounds[1].questionsVisible, true);
  await answer(dirk, id, 1, 0, true);

  casView = await getDuel(cas, id);
  // Round 1 is complete for both: Cas now sees Dirk's picks there.
  assert.deepEqual(casView.rounds[0].opponentResults, ['correct', 'wrong', 'correct']);
  // Round 2: Cas knows Dirk answered one, not how, and sees no questions.
  assert.equal(casView.rounds[1].questionsVisible, false);
  assert.deepEqual(casView.rounds[1].opponentResults, ['hidden', 'pending', 'pending']);
  assert.equal(casView.rounds[1].questions.length, 0);
  for (const text of allQuestionTexts(doc, 1)) {
    assert.ok(!JSON.stringify(casView).includes(text), 'round 2 text stays hidden from Cas');
  }
});

// ---------------------------------------------------------------------------
// 3. Invite links
// ---------------------------------------------------------------------------

test('invite: create, public preview, join by token, play', async () => {
  const eva = await makeUser('Eva Link');
  const fien = await makeUser('Fien Link');
  const gert = await makeUser('Gert Link');

  const created = await createDuel(eva, { mode: 'invite' });
  assert.equal(created.created, true);
  assert.equal(created.matched, false);
  assert.ok(created.inviteToken);
  const token = created.inviteToken;
  assert.ok(created.inviteUrl?.endsWith(`/duel/${token}`));
  assert.ok(created.inviteUrl && created.inviteMessage?.includes(created.inviteUrl));
  assert.ok(created.inviteMessage?.startsWith('Eva Link daagt je uit'));
  assert.equal(created.duel.status, 'open');
  assert.equal(created.duel.opponent, null);
  assert.equal(created.duel.turn, 'me');
  assert.equal(created.duel.inviteToken, token);
  assert.equal(created.duel.inviteUrl, created.inviteUrl);

  // A second invite gets its own token (unique index holds).
  const other = await createDuel(eva, { mode: 'invite' });
  assert.notEqual(other.inviteToken, token);

  const preview = await getInvitePreview(token);
  assert.equal(preview.challenger.id, eva);
  assert.equal(preview.challenger.name, 'Eva Link');
  assert.equal(preview.joinable, true);
  assert.equal(preview.status, 'open');
  await expectDuelError(getInvitePreview('not a token!'), 'INVITE_NOT_FOUND');
  await expectDuelError(getInvitePreview('AAAAAAAAAAAA'), 'INVITE_NOT_FOUND');
  await expectDuelError(joinDuelByInvite(fien, 'AAAAAAAAAAAA'), 'INVITE_NOT_FOUND');
  await expectDuelError(joinDuelByInvite(eva, token), 'OWN_INVITE');

  // Eva plays round 1 while the seat is still empty.
  await playRound(eva, created.duel.id, 0, [true, true, false]);
  const waiting = await getDuel(eva, created.duel.id);
  assert.equal(waiting.turn, 'matching');
  assert.equal(waiting.status, 'open');
  const evaList = await listDuels(eva);
  assert.ok(evaList.waiting.some((d) => d.id === created.duel.id));
  assert.equal(evaList.finished.length, 0);

  const joined = await joinDuelByInvite(fien, ` ${token} `);
  assert.equal(joined.joined, true);
  assert.equal(joined.duel.id, created.duel.id);
  assert.equal(joined.duel.status, 'active');
  assert.equal(joined.duel.isChallenger, false);
  assert.equal(joined.duel.opponent?.id, eva);
  assert.equal(joined.duel.turn, 'me', 'Eva already played, so Fien can start');
  assert.equal(joined.duel.inviteToken, null, 'only the sender sees the link');

  const again = await joinDuelByInvite(fien, token);
  assert.equal(again.joined, false);
  assert.equal(again.duel.id, created.duel.id);
  await expectDuelError(joinDuelByInvite(gert, token), 'DUEL_TAKEN');

  const after = await getInvitePreview(token);
  assert.equal(after.joinable, false);
  assert.equal(after.status, 'active');
  // Once joined, the sender no longer gets the link either.
  assert.equal((await getDuel(eva, created.duel.id)).inviteUrl, null);

  await playRound(fien, created.duel.id, 0, [true, false, false]);
  await playRound(fien, created.duel.id, 1, [true, true, true]);
  await playRound(eva, created.duel.id, 1, [false, false, false]);
  await playRound(eva, created.duel.id, 2, [false, false, false]);
  const end = await playRound(fien, created.duel.id, 2, [false, false, false]);
  assert.equal(end[2].duel.status, 'finished');
  assert.equal(end[2].duel.outcome, 'won');
  assert.equal((await getDuel(eva, created.duel.id)).outcome, 'lost');

  // Cancelled invite: no longer joinable.
  await forfeitDuel(eva, other.duel.id);
  assert.equal((await getInvitePreview(other.inviteToken!)).joinable, false);
  await expectDuelError(joinDuelByInvite(gert, other.inviteToken!), 'DUEL_FINISHED');
});

// ---------------------------------------------------------------------------
// 4. Random matching
// ---------------------------------------------------------------------------

test('random: two searches match into one duel, searching twice returns the same duel', async () => {
  await Duel.deleteMany({ mode: 'random' });
  const hans = await makeUser('Hans Toeval');
  const ilse = await makeUser('Ilse Toeval');

  const first = await createDuel(hans, { mode: 'random' });
  assert.equal(first.created, true);
  assert.equal(first.matched, false);
  assert.equal(first.duel.status, 'open');
  assert.equal(first.duel.turn, 'me');
  assert.equal(first.duel.opponent, null);
  assert.equal(first.inviteUrl, null);

  const twice = await createDuel(hans, { mode: 'random' });
  assert.equal(twice.created, false);
  assert.equal(twice.matched, false);
  assert.equal(twice.duel.id, first.duel.id);

  await playRound(hans, first.duel.id, 0, [true, false, true]);
  assert.equal((await getDuel(hans, first.duel.id)).turn, 'matching');

  const matched = await createDuel(ilse, { mode: 'random' });
  assert.equal(matched.matched, true);
  assert.equal(matched.created, false);
  assert.equal(matched.duel.id, first.duel.id);
  assert.equal(matched.duel.status, 'active');
  assert.equal(matched.duel.opponent?.id, hans);
  assert.equal(matched.duel.turn, 'me');

  const hansView = await getDuel(hans, first.duel.id);
  assert.equal(hansView.turn, 'opponent');
  assert.equal(hansView.opponent?.id, ilse);
  const doc = await stored(first.duel.id);
  assert.deepEqual(doc.participants.map(String).sort(), [hans, ilse].sort());
  assert.equal(String(doc.turnUserId), ilse);

  // They are not matched with each other a second time while this one runs.
  const ilseAgain = await createDuel(ilse, { mode: 'random' });
  assert.equal(ilseAgain.matched, false);
  assert.equal(ilseAgain.created, true);
  const hansAgain = await createDuel(hans, { mode: 'random' });
  assert.equal(hansAgain.matched, false);
  assert.notEqual(hansAgain.duel.id, ilseAgain.duel.id);

  // A third player is matched with the oldest one whose starter already played.
  await playRound(ilse, ilseAgain.duel.id, 0, [true, true, true]);
  const jan = await makeUser('Jan Toeval');
  const janMatch = await createDuel(jan, { mode: 'random' });
  assert.equal(janMatch.matched, true);
  assert.equal(janMatch.duel.id, ilseAgain.duel.id);
});

test('random: two simultaneous searches never take the same seat', async () => {
  await Duel.deleteMany({ mode: 'random' });
  const host = await makeUser('Kees Gelijktijdig');
  const left = await makeUser('Lot Gelijktijdig');
  const right = await makeUser('Mia Gelijktijdig');

  const open = await createDuel(host, { mode: 'random' });
  const [a, b] = await Promise.all([
    createDuel(left, { mode: 'random' }),
    createDuel(right, { mode: 'random' }),
  ]);
  const winners = [a, b].filter((result) => result.matched);
  assert.equal(winners.length, 1, 'exactly one of them got the seat');
  assert.equal(winners[0].duel.id, open.duel.id);
  const loser = [a, b].find((result) => !result.matched)!;
  assert.equal(loser.created, true);
  assert.notEqual(loser.duel.id, open.duel.id);

  const doc = await stored(open.duel.id);
  assert.equal(doc.participants.length, 2);
});

// ---------------------------------------------------------------------------
// 5. Decline and forfeit
// ---------------------------------------------------------------------------

test('decline before playing; forfeit mid-game; forfeit an unjoined duel cancels it', async () => {
  const nina = await makeUser('Nina Stop');
  const otto = await makeUser('Otto Stop');
  const piet = await makeUser('Piet Stop');

  // Decline.
  const { duel } = await createDuel(nina, { mode: 'friend', opponentId: otto });
  await expectDuelError(declineDuel(nina, duel.id), 'NOT_ALLOWED');
  await playRound(nina, duel.id, 0, [true, true, true]);
  const declined = await declineDuel(otto, duel.id);
  assert.equal(declined.status, 'finished');
  assert.equal(declined.endReason, 'declined');
  assert.equal(declined.outcome, null);
  assert.equal((await getDuel(nina, duel.id)).outcome, null);
  await expectDuelError(declineDuel(otto, duel.id), 'DUEL_FINISHED');
  await expectDuelError(answer(otto, duel.id, 0, 0, true), 'DUEL_FINISHED');
  assert.deepEqual((await listDuels(nina)).record, { wins: 0, losses: 0, ties: 0 });
  assert.ok((await listDuels(nina)).finished.some((d) => d.id === duel.id));

  // No declining once you played.
  const second = await createDuel(nina, { mode: 'friend', opponentId: otto });
  assert.equal(second.created, true, 'the declined duel no longer counts as running');
  await playRound(nina, second.duel.id, 0, [true, false, false]);
  await answer(otto, second.duel.id, 0, 0, true);
  const ottoView = await getDuel(otto, second.duel.id);
  assert.equal(ottoView.canDecline, false);
  assert.equal(ottoView.canForfeit, true);
  await expectDuelError(declineDuel(otto, second.duel.id), 'NOT_ALLOWED');

  // Forfeit mid-game: the other player wins.
  const forfeited = await forfeitDuel(otto, second.duel.id);
  assert.equal(forfeited.status, 'finished');
  assert.equal(forfeited.endReason, 'forfeit');
  assert.equal(forfeited.outcome, 'lost');
  assert.equal((await getDuel(nina, second.duel.id)).outcome, 'won');
  const doc = await stored(second.duel.id);
  assert.equal(String(doc.winnerId), nina);
  assert.equal(String(doc.forfeitedBy), otto);
  await expectDuelError(forfeitDuel(nina, second.duel.id), 'DUEL_FINISHED');
  assert.deepEqual((await listDuels(nina)).record, { wins: 1, losses: 0, ties: 0 });
  assert.deepEqual((await listDuels(otto)).record, { wins: 0, losses: 1, ties: 0 });

  // Forfeit by the challenger before anybody played also hands over the win.
  const third = await createDuel(piet, { mode: 'friend', opponentId: nina });
  const gaveUp = await forfeitDuel(piet, third.duel.id);
  assert.equal(gaveUp.endReason, 'forfeit');
  assert.equal((await getDuel(nina, third.duel.id)).outcome, 'won');

  // Forfeit on an unjoined random duel: cancelled, nobody wins, not listed.
  await Duel.deleteMany({ mode: 'random', status: 'open' });
  const lonely = await createDuel(piet, { mode: 'random' });
  await playRound(piet, lonely.duel.id, 0, [true, true, true]);
  const cancelled = await forfeitDuel(piet, lonely.duel.id);
  assert.equal(cancelled.status, 'finished');
  assert.equal(cancelled.endReason, 'cancelled');
  assert.equal(cancelled.outcome, null);
  const pietList = await listDuels(piet);
  assert.ok(!pietList.finished.some((d) => d.id === lonely.duel.id));
  assert.deepEqual(pietList.record, { wins: 0, losses: 1, ties: 0 });

  // Strangers and nonsense ids look like a missing duel.
  await expectDuelError(getDuel(piet, duel.id), 'DUEL_NOT_FOUND');
  await expectDuelError(forfeitDuel(piet, duel.id), 'DUEL_NOT_FOUND');
  await expectDuelError(getDuel(piet, 'nope'), 'DUEL_NOT_FOUND');
  await expectDuelError(getDuel(piet, new mongoose.Types.ObjectId().toHexString()), 'DUEL_NOT_FOUND');
});

// ---------------------------------------------------------------------------
// 6. Double taps and wrong indexes
// ---------------------------------------------------------------------------

test('answers: a double tap is harmless, wrong indexes and answers are rejected', async () => {
  const quinn = await makeUser('Quinn Tik');
  const roos = await makeUser('Roos Tik');
  const { duel } = await createDuel(quinn, { mode: 'friend', opponentId: roos });
  const id = duel.id;
  const q0 = await choices(id, 0, 0);

  await expectDuelError(answer(quinn, id, 0, 1, true), 'QUESTION_MISMATCH');
  await expectDuelError(answer(quinn, id, 1, 0, true), 'QUESTION_MISMATCH');
  await expectDuelError(
    submitDuelAnswer(quinn, id, { roundIndex: 7, questionIndex: 0, answerId: q0.right }),
    'QUESTION_MISMATCH',
  );
  await expectDuelError(
    submitDuelAnswer(quinn, id, { roundIndex: 0, questionIndex: 0, answerId: 'not-an-answer' }),
    'VALIDATION_ERROR',
  );
  // An answer id from another question is not an answer to this one.
  const q1 = await choices(id, 0, 1);
  await expectDuelError(
    submitDuelAnswer(quinn, id, { roundIndex: 0, questionIndex: 0, answerId: q1.right }),
    'VALIDATION_ERROR',
  );

  const first = await submitDuelAnswer(quinn, id, { roundIndex: 0, questionIndex: 0, answerId: q0.right });
  assert.equal(first.result.alreadyRecorded, false);
  assert.equal(first.result.isCorrect, true);
  const xpAfterFirst = (await xpOf(quinn)).xp;
  assert.equal(xpAfterFirst, q0.xp);

  const second = await submitDuelAnswer(quinn, id, { roundIndex: 0, questionIndex: 0, answerId: q0.right });
  assert.equal(second.result.alreadyRecorded, true);
  assert.equal(second.result.isCorrect, true);
  assert.equal((await xpOf(quinn)).xp, xpAfterFirst, 'no XP for the second tap');
  assert.equal((await stored(id)).challengerAnswers.length, 1);

  await expectDuelError(
    submitDuelAnswer(quinn, id, { roundIndex: 0, questionIndex: 0, answerId: q0.wrong }),
    'ANSWER_ALREADY_SUBMITTED',
  );

  // Taps arriving at the same moment: one answer, paid once, and no error for
  // the ones that lost the race (they used to get CONCURRENCY_CONFLICT).
  const taps = await Promise.allSettled(
    Array.from({ length: 4 }, () =>
      submitDuelAnswer(quinn, id, { roundIndex: 0, questionIndex: 1, answerId: q1.right }),
    ),
  );
  for (const outcome of taps) {
    assert.equal(
      outcome.status,
      'fulfilled',
      `simultaneous double tap failed: ${outcome.status === 'rejected' ? String(outcome.reason) : ''}`,
    );
  }
  const recorded = taps.map((outcome) =>
    outcome.status === 'fulfilled' ? outcome.value.result.alreadyRecorded : null,
  );
  assert.equal(recorded.filter((value) => value === false).length, 1, 'exactly one tap counted');
  const doc = await stored(id);
  assert.equal(doc.challengerAnswers.filter((a) => a.round === 0 && a.question === 1).length, 1);
  assert.equal((await xpOf(quinn)).xp, q0.xp + q1.xp, 'paid once');
  assert.equal(doc.challengerXp, q0.xp + q1.xp);
});

// ---------------------------------------------------------------------------
// 7. A week without a move
// ---------------------------------------------------------------------------

test('timeout: a stalled duel is settled on the next read', async () => {
  const saar = await makeUser('Saar Wacht');
  const tom = await makeUser('Tom Wacht');
  const umi = await makeUser('Umi Wacht');

  // Tom never moved at all: expired, nobody wins.
  const neverMoved = await createDuel(saar, { mode: 'friend', opponentId: tom });
  await playRound(saar, neverMoved.duel.id, 0, [true, true, true]);
  await expire(neverMoved.duel.id);
  const expired = await getDuel(saar, neverMoved.duel.id);
  assert.equal(expired.status, 'finished');
  assert.equal(expired.endReason, 'expired');
  assert.equal(expired.outcome, null);
  await expectDuelError(answer(tom, neverMoved.duel.id, 0, 0, true), 'DUEL_FINISHED');

  // Saar stalls halfway: Tom wins on time, settled by the list.
  const halfway = await createDuel(saar, { mode: 'friend', opponentId: tom });
  await playRound(saar, halfway.duel.id, 0, [true, true, true]);
  await playRound(tom, halfway.duel.id, 0, [false, false, false]);
  await playRound(tom, halfway.duel.id, 1, [false, false, false]);
  await expire(halfway.duel.id);
  const tomList = await listDuels(tom);
  const settled = tomList.finished.find((d) => d.id === halfway.duel.id);
  assert.ok(settled, 'settled by the list read');
  assert.equal(settled.endReason, 'timeout');
  assert.equal(settled.outcome, 'won');
  assert.ok(!tomList.waiting.some((d) => d.id === halfway.duel.id));
  const doc = await stored(halfway.duel.id);
  assert.equal(doc.status, 'finished');
  assert.equal(String(doc.winnerId), tom);
  assert.equal(String(doc.forfeitedBy), saar);
  await expectDuelError(answer(saar, halfway.duel.id, 1, 0, true), 'DUEL_FINISHED');

  // An expired open random duel is neither matched nor listed as finished.
  await Duel.deleteMany({ mode: 'random', status: 'open' });
  const stale = await createDuel(umi, { mode: 'random' });
  await expire(stale.duel.id);
  const viktor = await makeUser('Viktor Wacht');
  const fresh = await createDuel(viktor, { mode: 'random' });
  assert.equal(fresh.matched, false, 'expired duels are not offered');
  assert.notEqual(fresh.duel.id, stale.duel.id);
  const umiList = await listDuels(umi);
  assert.equal(umiList.waiting.length, 0);
  assert.ok(!umiList.finished.some((d) => d.id === stale.duel.id));
  assert.equal((await stored(stale.duel.id)).endReason, 'expired');
  // Searching again after expiry starts over (or joins Viktor).
  const umiAgain = await createDuel(umi, { mode: 'random' });
  assert.notEqual(umiAgain.duel.id, stale.duel.id);

  // A friend challenge to someone whose old duel expired starts a new one.
  const tomAgain = await createDuel(tom, { mode: 'friend', opponentId: saar });
  assert.equal(tomAgain.created, true);
});

// ---------------------------------------------------------------------------
// 8. Limits
// ---------------------------------------------------------------------------

test('limits: open duels, running duels, one running duel per pair, creation rate', async () => {
  await Duel.deleteMany({ mode: 'random', status: 'open' });
  const wim = await makeUser('Wim Grens');
  const xena = await makeUser('Xena Grens');

  // One running duel per pair, whoever challenges.
  const first = await createDuel(wim, { mode: 'friend', opponentId: xena });
  const repeat = await createDuel(wim, { mode: 'friend', opponentId: xena });
  assert.equal(repeat.created, false);
  assert.equal(repeat.duel.id, first.duel.id);
  const reverse = await createDuel(xena, { mode: 'friend', opponentName: 'WIM GRENS' });
  assert.equal(reverse.created, false);
  assert.equal(reverse.duel.id, first.duel.id);
  assert.equal(reverse.duel.isChallenger, false);

  await expectDuelError(createDuel(wim, { mode: 'friend', opponentId: wim }), 'CANNOT_CHALLENGE_SELF');
  await expectDuelError(createDuel(wim, { mode: 'friend', opponentName: 'Niemand Bestaat' }), 'PLAYER_NOT_FOUND');
  await expectDuelError(
    createDuel(wim, { mode: 'friend', opponentId: new mongoose.Types.ObjectId().toHexString() }),
    'PLAYER_NOT_FOUND',
  );
  await expectDuelError(createDuel(wim, { mode: 'friend' }), 'VALIDATION_ERROR');
  await makeUser('Dubbel Naam');
  await makeUser('Dubbel Naam');
  await expectDuelError(createDuel(wim, { mode: 'friend', opponentName: 'Dubbel Naam' }), 'AMBIGUOUS_PLAYER');

  // At most 5 duels waiting for an opponent: 4 invites + 1 random search.
  for (let index = 0; index < 4; index += 1) {
    await createDuel(wim, { mode: 'invite' });
  }
  const search = await createDuel(wim, { mode: 'random' });
  assert.equal(search.created, true);
  await expectDuelError(createDuel(wim, { mode: 'invite' }), 'TOO_MANY_OPEN_DUELS');
  // Searching again still hands back the search already running.
  assert.equal((await createDuel(wim, { mode: 'random' })).duel.id, search.duel.id);

  // 5 invites leave no room for a random search.
  const yara = await makeUser('Yara Grens');
  for (let index = 0; index < 5; index += 1) {
    await createDuel(yara, { mode: 'invite' });
  }
  await Duel.deleteMany({ mode: 'random', status: 'open', challengerId: { $ne: yara } });
  await expectDuelError(createDuel(yara, { mode: 'random' }), 'TOO_MANY_OPEN_DUELS');

  // 50 running duels: no new ones, for the challenger or for the challenged.
  const busy = await makeUser('Zeno Druk');
  const filler = await makeUser('Vul Speler');
  const now = new Date();
  await Duel.insertMany(
    Array.from({ length: MAX_ACTIVE_DUELS_PER_USER }, () => ({
      mode: 'friend',
      status: 'active',
      challengerId: busy,
      opponentId: filler,
      participants: [busy, filler],
      turnSide: 'challenger',
      turnUserId: busy,
      lastMoveAt: now,
      turnDeadline: new Date(now.getTime() + DUEL_TURN_TIMEOUT_MS),
    })),
  );
  const free = await makeUser('Vrij Speler');
  await expectDuelError(createDuel(busy, { mode: 'friend', opponentId: free }), 'TOO_MANY_DUELS');
  await expectDuelError(createDuel(busy, { mode: 'invite' }), 'TOO_MANY_DUELS');
  await expectDuelError(createDuel(busy, { mode: 'random' }), 'TOO_MANY_DUELS');
  await expectDuelError(createDuel(free, { mode: 'friend', opponentId: busy }), 'TOO_MANY_DUELS');
  const busyInvite = await createDuel(free, { mode: 'invite' });
  await expectDuelError(joinDuelByInvite(busy, busyInvite.inviteToken!), 'TOO_MANY_DUELS');
  // The list still shows all of them.
  const busyList = await listDuels(busy);
  assert.equal(busyList.myTurn.length, MAX_ACTIVE_DUELS_PER_USER);
  assert.equal(busyList.turnCount, MAX_ACTIVE_DUELS_PER_USER);
  // Duels past their deadline are over, even before anyone reads them.
  await Duel.updateMany(
    { challengerId: busy, opponentId: filler },
    { $set: { turnDeadline: new Date(Date.now() - 60_000) } },
    { timestamps: false },
  );
  assert.equal((await createDuel(free, { mode: 'friend', opponentId: busy })).created, true);

  // 30 new duels an hour.
  const spammer = await makeUser('Snel Speler');
  for (let index = 0; index < 30; index += 1) {
    const target = await makeUser(`Doel ${index}`);
    const result = await createDuel(spammer, { mode: 'friend', opponentId: target });
    assert.equal(result.created, true);
  }
  const target = await makeUser('Doel laatste');
  await expectDuelError(createDuel(spammer, { mode: 'friend', opponentId: target }), 'RATE_LIMITED');
});

// ---------------------------------------------------------------------------
// Requests that arrive at the same moment
// ---------------------------------------------------------------------------

test('races: double taps on challenge, search and join make one duel', async () => {
  await Duel.deleteMany({ mode: 'random', status: 'open' });
  const ada = await makeUser('Ada Tegelijk');
  const ben = await makeUser('Ben Tegelijk');
  const cor = await makeUser('Cor Tegelijk');

  // Ada taps "uitdagen" twice while Ben challenges her back.
  const challenges = await Promise.all([
    createDuel(ada, { mode: 'friend', opponentId: ben }),
    createDuel(ada, { mode: 'friend', opponentId: ben }),
    createDuel(ben, { mode: 'friend', opponentId: ada }),
  ]);
  assert.equal(new Set(challenges.map((result) => result.duel.id)).size, 1, 'one duel for the pair');
  assert.equal(challenges.filter((result) => result.created).length, 1);
  assert.equal(
    await Duel.countDocuments({ participants: { $all: [ada, ben] }, status: { $ne: 'finished' } }),
    1,
  );

  // Cor taps "zoek een tegenstander" twice with nobody waiting.
  const searches = await Promise.all([
    createDuel(cor, { mode: 'random' }),
    createDuel(cor, { mode: 'random' }),
  ]);
  assert.equal(searches[0].duel.id, searches[1].duel.id, 'one search');
  assert.equal(await Duel.countDocuments({ challengerId: cor, mode: 'random', status: 'open' }), 1);
  // Matched, the search key is gone and Cor can look for the next one.
  const dirk = await makeUser('Dirk Tegelijk');
  assert.equal((await createDuel(dirk, { mode: 'random' })).matched, true);
  const next = await createDuel(cor, { mode: 'random' });
  assert.equal(next.created, true);
  assert.notEqual(next.duel.id, searches[0].duel.id);

  // Two people open the same invite at once; one of them double-taps.
  const invite = await createDuel(ada, { mode: 'invite' });
  const ed = await makeUser('Ed Tegelijk');
  const fay = await makeUser('Fay Tegelijk');
  const joins = await Promise.allSettled([
    joinDuelByInvite(ed, invite.inviteToken!),
    joinDuelByInvite(ed, invite.inviteToken!),
    joinDuelByInvite(fay, invite.inviteToken!),
  ]);
  const joinedBy = String((await stored(invite.duel.id)).opponentId);
  assert.ok(joinedBy === ed || joinedBy === fay);
  for (const [index, outcome] of joins.entries()) {
    const who = index < 2 ? ed : fay;
    if (who === joinedBy) {
      assert.equal(outcome.status, 'fulfilled', `the winner never errors: ${outcome.status === 'rejected' ? String(outcome.reason) : ''}`);
    } else {
      assert.equal(outcome.status, 'rejected');
      assert.ok(isDuelError(outcome.reason) && outcome.reason.code === 'DUEL_TAKEN', String(outcome.reason));
    }
  }
  const joinedCount = joins.filter(
    (outcome) => outcome.status === 'fulfilled' && outcome.value.joined,
  ).length;
  assert.equal(joinedCount, 1);
});

// ---------------------------------------------------------------------------
// 9. Who to challenge
// ---------------------------------------------------------------------------

test('players: earlier opponents and group members, or a name search', async () => {
  const me = await makeUser('Zoeker Ik');
  const foe = await makeUser('Zoeker Tegenstander');
  const friend = await makeUser('Groepslid Een');
  const friend2 = await makeUser('Groepslid Twee');
  await makeUser('Zoeker Vreemde');

  await createDuel(me, { mode: 'friend', opponentId: foe });
  await PlayerGroup.create({ name: 'Jeugdclub', ownerId: me, memberIds: [me, friend, friend2] });
  // Somebody else's group is not mine.
  const outsider = await makeUser('Buiten Groep');
  await PlayerGroup.create({ name: 'Anders', ownerId: outsider, memberIds: [outsider, foe] });

  const list = await listDuelPlayers(me, null);
  assert.equal(list.query, null);
  const byId = new Map(list.players.map((player) => [player.id, player]));
  assert.equal(byId.get(foe)?.source, 'duel');
  assert.equal(byId.get(friend)?.source, 'group');
  assert.equal(byId.get(friend2)?.source, 'group');
  assert.ok(!byId.has(me), 'never yourself');
  assert.ok(!byId.has(outsider));
  assert.equal(byId.get(foe)?.name, 'Zoeker Tegenstander');
  assert.equal(typeof byId.get(foe)?.level, 'number');
  assert.ok(byId.get(foe)?.avatar);

  const search = await listDuelPlayers(me, '  zoeker ');
  assert.equal(search.query, 'zoeker');
  const names = search.players.map((player) => player.name).sort();
  assert.deepEqual(names, ['Zoeker Tegenstander', 'Zoeker Vreemde']);
  assert.ok(search.players.every((player) => player.source === 'search'));

  assert.deepEqual((await listDuelPlayers(me, 'z')).players, []);
  assert.deepEqual((await listDuelPlayers(me, '.*(')).players, [], 'regex characters are literal');
  assert.deepEqual((await listDuelPlayers(me, '')).query, null, 'empty query lists the people you know');
});

// ---------------------------------------------------------------------------
// Round topics when the library is small (runs last: replaces the quizzes)
// ---------------------------------------------------------------------------

test('questions: falls back from books to categories to mixed, then gives up', async () => {
  await Quiz.deleteMany({});
  const profeten = await Category.create({ title: 'Profeten', slug: 'profeten' });
  const wet = await Category.findOne({ slug: 'wet' });
  assert.ok(wet);
  // rewardXp 0: a quiz that gives no XP gives none in a duel either.
  await makeQuiz(wet._id as mongoose.Types.ObjectId, 0, bookQuestions('Klein Genesis', 'Genesis', 3));
  await makeQuiz(
    profeten._id as mongoose.Types.ObjectId,
    60,
    Array.from({ length: 6 }, (_, index) => question(`Profeet vraag ${index + 1}?`, null)),
  );

  const rounds = await pickDuelRounds();
  assert.deepEqual(
    rounds.map((round) => round.topicKind),
    ['book', 'category', 'mixed'],
  );
  assert.equal(rounds[0].topic, 'Genesis');
  assert.equal(rounds[1].topic, 'Profeten');
  assert.equal(rounds[2].topic, 'Gemengd');
  assert.deepEqual(rounds[0].questions.map((q) => q.xp), [0, 0, 0]);
  assert.deepEqual(rounds[1].questions.map((q) => q.xp), [10, 10, 10]);
  const texts = rounds.flatMap((round) => round.questions.map((q) => q.text));
  assert.equal(new Set(texts).size, 9);

  await Quiz.deleteMany({ categoryId: profeten._id });
  await expectDuelError(pickDuelRounds(), 'NO_QUESTIONS');
  const someone = await makeUser('Leeg Bieb');
  await expectDuelError(createDuel(someone, { mode: 'invite' }), 'NO_QUESTIONS');
});
