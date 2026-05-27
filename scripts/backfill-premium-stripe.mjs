#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-time backfill: set premiumStripe=true for legacy premium users.
 *
 * Why: the premium state was split into premiumStripe / premiumStore, and
 * isPremium is now derived as (premiumStripe || premiumStore). Users who
 * became premium BEFORE that split have isPremium=true but premiumStripe=false.
 * The first time such a user calls /api/mobile/sync-premium (which recomputes
 * isPremium from premiumStripe || premiumStore), they would be downgraded to
 * isPremium=false. This backfill attributes their existing premium to Stripe.
 *
 * Targets only users where isPremium=true AND premiumStripe is not already true
 * AND premiumStore is not true (so store-granted premium is never mis-attributed).
 *
 * USAGE:
 *   $env:MONGODB_URI="<your mongodb uri>"
 *   node scripts/backfill-premium-stripe.mjs          # dry run (reports count)
 *   node scripts/backfill-premium-stripe.mjs --apply  # perform the update
 */
import mongoose from 'mongoose';
import dns from 'node:dns';
import dnsPromises from 'node:dns/promises';

const APPLY = process.argv.includes('--apply');

// Some local resolvers refuse MongoDB SRV/TXT queries (querySrv ECONNREFUSED).
// Point DNS at public resolvers so the mongodb+srv:// lookup can succeed.
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // ignore — fall back to system resolver
}

async function buildNonSrvMongoUri(srvUri) {
  const parsed = new URL(srvUri);
  const hostname = parsed.hostname;
  const databaseName = parsed.pathname?.replace(/^\//, '') || 'test';
  const authPart = parsed.username
    ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ''}@`
    : '';

  const [srvRecords, txtRecords] = await Promise.all([
    dnsPromises.resolveSrv(`_mongodb._tcp.${hostname}`),
    dnsPromises.resolveTxt(hostname).catch(() => []),
  ]);

  if (!srvRecords.length) return null;

  const hosts = srvRecords.map((r) => `${r.name}:${r.port || 27017}`).join(',');
  const params = new URLSearchParams(parsed.searchParams);
  params.set('tls', 'true');

  for (const entry of txtRecords) {
    const txtValue = entry.join('');
    if (!txtValue) continue;
    const txtParams = new URLSearchParams(txtValue);
    txtParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }

  return `mongodb://${authPart}${hosts}/${databaseName}?${params.toString()}`;
}

async function connectWithSrvFallback(uri, opts) {
  try {
    return await mongoose.connect(uri, opts);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isSrvFailure =
      message.includes('querySrv') ||
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED');

    if (!uri.startsWith('mongodb+srv://') || !isSrvFailure) throw error;

    const fallbackUri = await buildNonSrvMongoUri(uri);
    if (!fallbackUri) throw error;

    return mongoose.connect(fallbackUri, opts);
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await connectWithSrvFallback(uri, { bufferCommands: false });
  const coll = mongoose.connection.db.collection('users');

  const filter = {
    isPremium: true,
    premiumStripe: { $ne: true },
    premiumStore: { $ne: true },
  };

  const count = await coll.countDocuments(filter);
  console.log(`Legacy premium users needing premiumStripe backfill: ${count}`);

  if (!APPLY) {
    console.log('Dry run only. Re-run with --apply to perform the update.');
  } else if (count > 0) {
    const res = await coll.updateMany(filter, { $set: { premiumStripe: true } });
    console.log(`Updated ${res.modifiedCount} user(s): premiumStripe -> true`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
