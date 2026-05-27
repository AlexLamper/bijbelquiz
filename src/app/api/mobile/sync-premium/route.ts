import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/database';
import { syncStorePremiumForAppUser } from '@/lib/revenuecat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';

  let decoded: { userId?: string };
  try {
    decoded = jwt.verify(token, secret) as { userId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userId = decoded?.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.REVENUECAT_REST_API_KEY) {
    console.error('[SYNC_PREMIUM_CONFIG_ERROR] REVENUECAT_REST_API_KEY is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    await connectDB();
    const result = await syncStorePremiumForAppUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SYNC_PREMIUM_ERROR]', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 502 });
  }
}
