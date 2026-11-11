import mongoose from 'mongoose';
import dns from 'node:dns/promises';

import { dropLegacyPaymentIndexes } from './legacy-indexes';

// Import models here to ensure they are registered with Mongoose on connection
import './models/User';
import './models/Quiz';
import './models/Category';
import './models/Payment';
import './models/UserProgress';
import './models/MultiplayerRoom';
import './models/WebhookEvent';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global scope to persist connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
       // In production runtime, we still want to throw
       throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }
    // During build or dev, we just log to avoid crashing the build worker
    console.warn('MONGODB_URI is missing. Database connection skipped.');
    return;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = connectWithSrvFallback(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
    // Once per process, in the background: it must not slow the first request.
    void dropLegacyPaymentIndexes(cached.conn.connection);
    void clearPremiumQuizzes(cached.conn.connection);
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    
    const err = e as Error;
    if (err.message?.includes('buffering timed out') || err.name === 'MongooseServerSelectionError') {
       console.error('It looks like the server cannot reach MongoDB Atlas.');
    }

    throw e;
  }
}

/**
 * There are no Premium quizzes: free players get 3 quizzes and Premium opens
 * all of them, so a quiz locked behind Premium on top of that only confused
 * people. The flag stays in the schema (older app builds read it) but is
 * cleared on any quiz that still has it - once per process, a no-op after the
 * first run. The Quiz model refuses to set it again.
 */
async function clearPremiumQuizzes(connection: mongoose.Connection) {
  try {
    await connection.collection('quizzes').updateMany({ isPremium: true }, { $set: { isPremium: false } });
  } catch (error) {
    console.error('[CLEAR_PREMIUM_QUIZZES]', error);
  }
}

async function connectWithSrvFallback(uri: string, opts: mongoose.ConnectOptions) {
  try {
    return await mongoose.connect(uri, opts);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isSrvFailure =
      message.includes('querySrv') ||
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED');

    if (!uri.startsWith('mongodb+srv://') || !isSrvFailure) {
      throw error;
    }

    const fallbackUri = await buildNonSrvMongoUri(uri);
    if (!fallbackUri) {
      throw error;
    }

    return mongoose.connect(fallbackUri, opts);
  }
}

async function buildNonSrvMongoUri(srvUri: string) {
  try {
    const parsed = new URL(srvUri);
    const hostname = parsed.hostname;
    const databaseName = parsed.pathname?.replace(/^\//, '') || 'test';
    const authPart = parsed.username
      ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ''}@`
      : '';

    const [srvRecords, txtRecords] = await Promise.all([
      dns.resolveSrv(`_mongodb._tcp.${hostname}`),
      dns.resolveTxt(hostname).catch(() => [] as string[][]),
    ]);

    if (!srvRecords.length) {
      return null;
    }

    const hosts = srvRecords
      .map((record) => `${record.name}:${record.port || 27017}`)
      .join(',');

    const params = new URLSearchParams(parsed.searchParams);
    params.set('tls', 'true');

    for (const entry of txtRecords) {
      const txtValue = entry.join('');
      if (!txtValue) continue;
      const txtParams = new URLSearchParams(txtValue);
      txtParams.forEach((value, key) => {
        if (!params.has(key)) {
          params.set(key, value);
        }
      });
    }

    return `mongodb://${authPart}${hosts}/${databaseName}?${params.toString()}`;
  } catch {
    return null;
  }
}

export default connectDB;
