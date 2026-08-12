import mongoose from 'mongoose';
import { connectDB, User } from '@/database';
import { MULTIPLAYER_FREE_ROOM_QUOTA } from '@/lib/premium-benefits';
import { MultiplayerError } from './errors';

/**
 * Free-tier hosting quota.
 *
 * A free account may host `MULTIPLAYER_FREE_ROOM_QUOTA` games in total. The
 * credit is spent when the host actually *starts* a game, not when the room is
 * created, so an abandoned lobby (wrong quiz, nobody showed up, mis-click)
 * never costs anything.
 *
 * Storage is a counter on the user, `multiplayerGamesHosted`. Accounts created
 * before this feature only carry the old `freeMultiplayerRoomCreated` boolean;
 * they are migrated on first touch, with `true` counting as one game used.
 */

export interface MultiplayerQuotaState {
  isPremiumUser: boolean;
  /** Games hosted so far. Always accurate, also for migrated accounts. */
  gamesHosted: number;
  /** Remaining free games. `null` for Premium, which is unlimited. */
  freeGamesRemaining: number | null;
  canHost: boolean;
}

interface RawQuotaUser {
  isPremium?: unknown;
  hasLifetimePremium?: unknown;
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
 * Give the account a real counter so the atomic `$lt` reservation below can
 * match it. Idempotent, and safe under concurrency: the `$exists: false`
 * filter means a second writer simply matches nothing.
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

function toState(isPremiumUser: boolean, gamesHosted: number): MultiplayerQuotaState {
  if (isPremiumUser) {
    return { isPremiumUser, gamesHosted, freeGamesRemaining: null, canHost: true };
  }

  const freeGamesRemaining = Math.max(0, MULTIPLAYER_FREE_ROOM_QUOTA - gamesHosted);
  return { isPremiumUser, gamesHosted, freeGamesRemaining, canHost: freeGamesRemaining > 0 };
}

/** Read the quota, migrating legacy accounts on the way. */
export async function loadMultiplayerQuota(userId: string): Promise<MultiplayerQuotaState> {
  assertObjectId(userId);

  await connectDB();

  const user = await User.findById(userId)
    .select('isPremium hasLifetimePremium freeMultiplayerRoomCreated multiplayerGamesHosted')
    .lean() as RawQuotaUser | null;

  if (!user) {
    throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  const isPremiumUser = Boolean(user.isPremium || user.hasLifetimePremium);
  const gamesHosted = await backfillCounter(userId, user);

  return toState(isPremiumUser, gamesHosted);
}

export type HostReservation =
  /** Quota is empty; the caller must not start a game. */
  | { ok: false }
  /** Cleared to start. `metered` is false for Premium, whose counter is untouched. */
  | { ok: true; metered: boolean };

/**
 * Atomically spend one free game. Two concurrent starts can never both slip
 * through, because the `$lt` filter and the `$inc` are one operation.
 *
 * Premium hosting is not counted at all. A subscriber who later cancels then
 * still has their untouched free games, which is the friendlier way round: the
 * quota exists to introduce the feature, not to punish a lapsed subscription.
 */
export async function reserveHostedGame(userId: string): Promise<HostReservation> {
  const state = await loadMultiplayerQuota(userId);

  if (state.isPremiumUser) {
    return { ok: true, metered: false };
  }

  const reserved = await User.findOneAndUpdate(
    { _id: userId, multiplayerGamesHosted: { $lt: MULTIPLAYER_FREE_ROOM_QUOTA } },
    { $inc: { multiplayerGamesHosted: 1 } },
  )
    .select('_id')
    .lean();

  return reserved ? { ok: true, metered: true } : { ok: false };
}

/**
 * Hand the credit back when the game failed to start after all. Only call this
 * for a reservation that was actually `metered`, or it will refund a free game
 * that a Premium start never spent.
 */
export async function releaseHostedGame(userId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;

  await connectDB();
  await User.updateOne(
    { _id: userId, multiplayerGamesHosted: { $gt: 0 } },
    { $inc: { multiplayerGamesHosted: -1 } },
  );
}
