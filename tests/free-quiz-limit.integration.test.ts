import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { Quiz, User, connectDB } from '@/database';
import { FREE_QUIZ_LIMIT } from '@/lib/free-quiz-limit';
import { getFreeQuizAllowanceForUser, userCanPlayQuiz } from '@/lib/free-quiz-limit-server';
import { submitQuizAttempt } from '@/lib/quiz-submission';

/**
 * The free tier on the server: the allowance from the account's attempts and
 * the refusal in `submitQuizAttempt`, against a real mongod.
 */

let mongod: MongoMemoryServer;
const quizIds: string[] = [];

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('bijbelquiz-free-limit-test');
  await connectDB();
  const categoryId = new mongoose.Types.ObjectId();
  for (let index = 0; index < 5; index += 1) {
    const quiz = await Quiz.create({
      title: `Quiz ${index + 1}`,
      slug: `quiz-${index + 1}`,
      categoryId,
      questions: [{ text: 'Vraag?', answers: [{ text: 'Goed', isCorrect: true }, { text: 'Fout' }] }],
    });
    quizIds.push(String(quiz._id));
  }
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

async function play(userId: string, quizId: string, enforceFreeLimit = true) {
  return submitQuizAttempt({
    userId,
    quizId,
    score: 1,
    totalQuestions: 1,
    answers: [{ selectedAnswerIndex: 0 }],
    platform: 'web',
    enforceFreeLimit,
  });
}

test('a free account plays three different quizzes, replays them, and is refused a fourth', async () => {
  const user = await User.create({ email: 'gratis@test.local', name: 'Gratis' });
  const userId = String(user._id);

  for (const quizId of quizIds.slice(0, FREE_QUIZ_LIMIT)) {
    const result = await play(userId, quizId);
    assert.equal(result.ok, true);
  }

  const allowance = await getFreeQuizAllowanceForUser({ id: userId, isPremium: false });
  assert.equal(allowance.used, 3);
  assert.equal(allowance.limitReached, true);

  assert.equal((await play(userId, quizIds[0])).ok, true, 'a replay stays free');

  const fourth = await play(userId, quizIds[3]);
  assert.deepEqual(fourth, { ok: false, reason: 'free_limit' });
  assert.equal(await userCanPlayQuiz({ id: userId, isPremium: false }, quizIds[3]), false);
  assert.equal(await userCanPlayQuiz({ id: userId, isPremium: false }, quizIds[1]), true);

  // The app's route does not ask for the check (it enforces the same limit itself).
  assert.equal((await play(userId, quizIds[4], false)).ok, true);
});

test('Premium and admins are never refused', async () => {
  const premium = await User.create({ email: 'premium@test.local', name: 'Premium', isPremium: true });
  const admin = await User.create({ email: 'admin@test.local', name: 'Beheer', role: 'admin' });
  for (const user of [premium, admin]) {
    for (const quizId of quizIds) {
      assert.equal((await play(String(user._id), quizId)).ok, true);
    }
  }
  assert.equal(await userCanPlayQuiz({ id: String(premium._id), isPremium: true }, quizIds[4]), true);
  assert.equal(await userCanPlayQuiz({ id: String(admin._id), role: 'admin' }, quizIds[4]), true);
});
