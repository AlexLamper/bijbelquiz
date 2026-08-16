import mongoose from 'mongoose';

import { AnalyticsEvent, User, connectDB } from '@/database';
import {
  AnalyticsEventName,
  AnalyticsPlatform,
  MAX_EVENTS_PER_REQUEST,
  isAnalyticsEventName,
  sanitizeProps,
} from './events';

/**
 * Server-side write path for funnel events.
 *
 * Used by `POST /api/events` for client-fired events and directly by routes
 * that know something a client cannot be trusted with - a completed purchase,
 * a started game - so those land even if the app is killed mid-flow.
 */

interface RecordInput {
  name: string;
  props?: unknown;
  occurredAt?: unknown;
}

function toObjectId(userId: string | null | undefined): mongoose.Types.ObjectId | null {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  return new mongoose.Types.ObjectId(userId);
}

function toDate(value: unknown): Date | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const date = new Date(value);
  // A client clock that is years off would poison any time-based read, so
  // implausible timestamps are dropped rather than stored.
  const drift = Math.abs(date.getTime() - Date.now());
  return drift > 7 * 24 * 60 * 60 * 1000 ? undefined : date;
}

/**
 * Write a batch. Unknown event names are skipped rather than rejected, so an
 * app build that is ahead of the server never fails its whole flush.
 *
 * Returns how many rows were written.
 */
export async function recordEvents(
  events: RecordInput[],
  context: {
    userId?: string | null;
    anonymousId?: string | null;
    platform?: AnalyticsPlatform;
  },
): Promise<number> {
  const accepted = events
    .slice(0, MAX_EVENTS_PER_REQUEST)
    .filter((event) => isAnalyticsEventName(event?.name));

  if (accepted.length === 0) return 0;

  await connectDB();

  const userId = toObjectId(context.userId);
  const anonymousId =
    typeof context.anonymousId === 'string' && context.anonymousId.length > 0
      ? context.anonymousId.slice(0, 64)
      : undefined;

  await AnalyticsEvent.insertMany(
    accepted.map((event) => ({
      name: event.name,
      userId,
      anonymousId,
      platform: context.platform ?? 'web',
      props: sanitizeProps(event.props),
      occurredAt: toDate(event.occurredAt),
    })),
    // One malformed row must not discard the rest of the batch, and analytics
    // must never be the thing that fails a user's request.
    { ordered: false },
  );

  return accepted.length;
}

/**
 * Which paywall this user most recently saw, if it was recent enough to have
 * plausibly caused a purchase.
 *
 * Payment webhooks arrive from Stripe and RevenueCat with no idea which
 * surface produced the sale, and threading a trigger through a hosted checkout
 * and two app stores is far more plumbing than it is worth. Looking back at
 * the last `paywall_shown` for the same account answers the same question:
 * "which of the six journey stages actually carries the revenue".
 *
 * Two hours, because a checkout can sit open through an interruption, but a
 * paywall seen yesterday did not cause today's purchase.
 */
export async function resolveRecentPaywallTrigger(
  userId: string | null | undefined,
  withinMs = 2 * 60 * 60 * 1000,
): Promise<string | null> {
  const objectId = toObjectId(userId);
  if (!objectId) return null;

  try {
    await connectDB();

    const recent = await AnalyticsEvent.findOne({
      name: 'paywall_shown',
      userId: objectId,
      createdAt: { $gte: new Date(Date.now() - withinMs) },
    })
      .sort({ createdAt: -1 })
      .select('props')
      .lean();

    const trigger = (recent?.props as Record<string, unknown> | undefined)?.trigger;
    return typeof trigger === 'string' ? trigger : null;
  } catch (error) {
    console.error('[ANALYTICS_TRIGGER_LOOKUP]', error);
    return null;
  }
}

/** Whole days between sign-up and now, or null when the account is unknown. */
export async function daysSinceSignup(userId: string | null | undefined): Promise<number | null> {
  const objectId = toObjectId(userId);
  if (!objectId) return null;

  try {
    await connectDB();
    const user = await User.findById(objectId).select('createdAt').lean();
    if (!user?.createdAt) return null;

    const elapsed = Date.now() - new Date(user.createdAt).getTime();
    return Math.max(0, Math.floor(elapsed / (24 * 60 * 60 * 1000)));
  } catch {
    return null;
  }
}

/**
 * Records a completed purchase with everything the funnel needs to attribute
 * it. Called from the payment webhooks, which are the only place a purchase is
 * known for certain - a client-side "thanks" screen is reached by people who
 * never paid and missed by people who did.
 */
export async function recordPurchase(input: {
  userId: string;
  plan: string;
  platform: AnalyticsPlatform;
  provider: 'stripe' | 'revenuecat';
  isTrial?: boolean;
  amountCents?: number | null;
  currency?: string | null;
}): Promise<void> {
  const [trigger, ageDays] = await Promise.all([
    resolveRecentPaywallTrigger(input.userId),
    daysSinceSignup(input.userId),
  ]);

  await recordServerEvent(input.isTrial ? 'trial_started' : 'purchase_completed', {
    userId: input.userId,
    platform: input.platform,
    props: {
      plan: input.plan,
      provider: input.provider,
      trigger,
      daysSinceSignup: ageDays,
      amountCents: input.amountCents ?? null,
      currency: input.currency ?? null,
    },
  });
}

/**
 * Fire-and-forget single event from a server route.
 *
 * Deliberately swallows every failure: no user-facing request should fail
 * because a metric could not be written.
 */
export async function recordServerEvent(
  name: AnalyticsEventName,
  context: {
    userId?: string | null;
    platform?: AnalyticsPlatform;
    props?: Record<string, string | number | boolean | null>;
  },
): Promise<void> {
  try {
    await recordEvents([{ name, props: context.props }], {
      userId: context.userId,
      platform: context.platform ?? 'web',
    });
  } catch (error) {
    console.error('[ANALYTICS_RECORD]', name, error);
  }
}
