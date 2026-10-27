import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { LEGACY_PAYMENT_INDEXES, dropLegacyPaymentIndexes } from '@/database/legacy-indexes';

/**
 * Production still carries the old sparse compound indexes; the server drops
 * them itself so nobody has to run anything by hand after the deploy.
 */

let mongod: MongoMemoryServer;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('drops the old payment indexes once, keeps the others, and lets a second row in', async () => {
  const payments = mongoose.connection.collection('payments');
  await payments.createIndex({ provider: 1, stripeSessionId: 1 }, { unique: true, sparse: true });
  await payments.createIndex({ provider: 1, externalTransactionId: 1 }, { unique: true, sparse: true });
  await payments.createIndex({ user: 1 });

  // The bug: a second row without a session id collides on the "sparse" index.
  await payments.insertOne({ provider: 'revenuecat', externalTransactionId: 'a' });
  await assert.rejects(payments.insertOne({ provider: 'revenuecat', externalTransactionId: 'b' }), /E11000/);

  assert.deepEqual(await dropLegacyPaymentIndexes(mongoose.connection), LEGACY_PAYMENT_INDEXES);
  const names = (await payments.indexes()).map((index) => index.name);
  for (const legacy of LEGACY_PAYMENT_INDEXES) assert.ok(!names.includes(legacy));
  assert.ok(names.includes('user_1'));

  await payments.insertOne({ provider: 'revenuecat', externalTransactionId: 'b' });
  assert.deepEqual(await dropLegacyPaymentIndexes(mongoose.connection), [], 'second run does nothing');
});
