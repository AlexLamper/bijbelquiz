import mongoose from 'mongoose';
import { connectDB, User } from '@/database';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { MultiplayerError } from './errors';

/**
 * How many games an account has hosted.
 *
 * This was a quota: five games ever, then one a month, then a paywall. It is
 * now only a counter. Hosting is free and uncapped, because the room is the one
 * place where BijbelQuiz reaches a whole youth group at once - which is exactly
 * the audience worth having, and exactly the audience the cap turned away.
 *
 * The counter itself stays. It costs one `$inc`, it is what the host funnel in
 * `analytics/funnel.ts` reads, and it predates the event stream, so it is the
 * only thing that can answer "how many hosts kept going" for older accounts.
 *
 * Storage is `multiplayerGamesHosted` on the user. Accounts created before that
 * field existed only carry the old `freeMultiplayerRoomCreated` boolean; they
 * are migrated on first touch, with `true` counting as one game.
 */

export interface MultiplayerQuotaState {
  isPremiumUser: boolean;
  /** Games hosted so far. Always accurate, also for migrated accounts. */
  gamesHosted: number;
  /**
   * Remaining free games. Always `null` now: nothing is metered, and `null` is
   * the value every client already reads as "unlimited".
   */
  freeGamesRemaining: number | null;
  canHost: boolean;
  /** Kept so existing clients keep parsing; always false. */
  onMonthlyAllowance: boolean;
  /** Kept so existing clients keep parsing; always zero. */
  monthlyGamesUsed: number;
}

interface RawQuotaUser {
  isPremium?: boolean;
  hasLifetimePremium?: unknown;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | string | null;
  groupPremiumUntil?: Date | string | null;
  freeMultiplayerRoomCreated?: unknown;
  multiplayerGamesHosted?: unknown;
}

/**
 * A token can carry a userId that isn't a Mongo ObjectId (a stale token, or an
 * OAuth `sub` that was never mapped to a user). Querying with it throws a
 * CastError, which used to become a 500. Treat it as "unauthenticated".
 */
function assertObjectId(userId: string): void {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
  }
}

/**
 * Give the account a real counter to increment. Idempotent, and safe under
 * concurrency: the `$exists: false` filter means a second writer simply
 * matches nothing.
 */
async function backfillCounter(userId: string, raw: RawQuotaUser): Promise<number> {
  if (typeof raw.multiplayerGamesHosted === 'number') {
    return raw.multiplayerGamesHosted;
  }

  const legacyUsed = raw.freeMultiplayerRoomCreated === true ? 1 : 0;

  await User.updateOne(
    { _id: userId, multiplayerGamesHosted: { $exists: false } },
    { $set: { multiplayerGamesHosted: legacyUsed } },
  );

  return legacyUsed;
}

/** Read the counter, migrating legacy accounts on the way. */
export async function loadMultiplayerQuota(userId: string): Promise<MultiplayerQuotaState> {
  assertObjectId(userId);

  await connectDB();

  const user = await User.findById(userId)
    .select(
      'isPremium hasLifetimePremium premiumStripe premiumStore storePremiumExpiresAt ' +
        'groupPremiumUntil freeMultiplayerRoomCreated multiplayerGamesHosted',
    )
    .lean() as RawQuotaUser | null;

  if (!user) {
    throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  // Still reported, because a group licence is a real thing an account can
  // have and the admin screens show it. It no longer decides anything here.
  const isPremiumUser =
    getPremiumSnapshot(user).isPremium || Boolean(user.hasLifetimePremium);
  const gamesHosted = await backfillCounter(userId, user);

  return {
    isPremiumUser,
    gamesHosted,
    freeGamesRemaining: null,
    canHost: true,
    onMonthlyAllowance: false,
    monthlyGamesUsed: 0,
  };
}

export type HostReservation = {
  ok: true;
  /**
   * Whether the counter moved, and therefore whether a failed start should put
   * it back. Always true now - nothing is metered, but the statistic is still
   * worth keeping honest.
   */
  metered: boolean;
};

/** Count one hosted game. Never refuses. */
export async function reserveHostedGame(userId: string): Promise<HostReservation> {
  await loadMultiplayerQuota(userId);

  await User.updateOne({ _id: userId }, { $inc: { multiplayerGamesHosted: 1 } });

  return { ok: true, metered: true };
}

/** Take the count back off when the game failed to start after all. */
export async function releaseHostedGame(userId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;

  await connectDB();

  await User.updateOne(
    { _id: userId, multiplayerGamesHosted: { $gt: 0 } },
    { $inc: { multiplayerGamesHosted: -1 } },
  );
}
