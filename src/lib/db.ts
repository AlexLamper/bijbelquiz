import mongoose from 'mongoose';

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

async function connectDB() {
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

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e: Error) {
    cached.promise = null;
    
    // Add helpful debugging info for common production errors
    if (e.message?.includes('buffering timed out') || e.name === 'MongooseServerSelectionError') {
       console.error('\n\n❌ MONGODB CONNECTION ERROR:');
       console.error('It looks like the server cannot reach MongoDB Atlas.');
       console.error('POTENTIAL FIXES:');
       console.error('1. IP WHITELIST: Go to MongoDB Atlas > Network Access > Add IP Address > Allow Access from Anywhere (0.0.0.0/0). Vercel uses dynamic IPs, so this is required.');
       console.error('2. ENV VARS: Ensure MONGODB_URI is set correctly in your Vercel Project Settings (not just local .env).');
       console.error('3. PASSWORD: Check if your database password has special characters that need to be URL encoded.\n\n');
    }

    throw e;
  }
}

export default connectDB;
