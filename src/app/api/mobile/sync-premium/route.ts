import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/database';
import { getMobileUserId } from '@/lib/mobile-auth';
import { syncMobilePremium } from '@/lib/mobile-premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Called by the app right after a purchase or restore, and on launch.
 * Re-reads the subscriber from RevenueCat (when `REVENUECAT_SECRET_KEY` is
 * set) so Premium shows at once instead of when the webhook arrives, then
 * returns the account's Premium from every source.
 */
export async function POST(req: Request) {
  const userId = getMobileUserId(req);
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const result = await syncMobilePremium(userId);
    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('[SYNC_PREMIUM_ERROR]', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 502 });
  }
}
