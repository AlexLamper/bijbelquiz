import type mongoose from 'mongoose';

/**
 * Unique indexes from before the payments rework that block valid rows.
 *
 * Both were "sparse" on a compound key with `provider`, which is always set,
 * so the second payment without a Stripe session (or without an external
 * transaction id) failed with a duplicate key. Their partial replacements
 * are declared in models/Payment.ts and built by Mongoose.
 */
export const LEGACY_PAYMENT_INDEXES = ['provider_1_stripeSessionId_1', 'provider_1_externalTransactionId_1'];

/**
 * Drops the legacy indexes when they still exist. Safe to call on every cold
 * start: once they are gone it only lists the indexes. A failure is logged,
 * never thrown, so a connection never fails because of it.
 */
export async function dropLegacyPaymentIndexes(connection: mongoose.Connection): Promise<string[]> {
  const dropped: string[] = [];
  try {
    const collection = connection.collection('payments');
    const existing = await collection.indexes().catch(() => [] as { name?: string }[]);
    const names = new Set(existing.map((index) => index.name));
    for (const name of LEGACY_PAYMENT_INDEXES) {
      if (!names.has(name)) continue;
      await collection.dropIndex(name);
      dropped.push(name);
    }
    if (dropped.length > 0) {
      console.log(`[db] dropped legacy payment indexes: ${dropped.join(', ')}`);
    }
  } catch (error) {
    console.error('[db] could not drop legacy payment indexes', error);
  }
  return dropped;
}
