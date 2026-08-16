import mongoose from 'mongoose';
import { connectDB, User } from '@/database';
import {
  MULTIPLAYER_FREE_ROOM_QUOTA,
  MULTIPLAYER_MONTHLY_FREE_ROOMS,
} from '@/lib/premium-benefits';
import { getPremiumSnapshot } from '@/lib/premium-state';
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
  /**
   * True once the one-off discovery pack is spent and the account is running
   * on the monthly allowance instead. Clients say something different then:
   * "nog 1 deze maand" rather than "1 van de 5 over".
   */
  onMonthlyAllowance: boolean;
  /** Monthly games used in the current calendar month. */
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
  multiplayerMonthlyPeriod?: unknown;
  multiplayerMonthlyGamesHosted?: unknown;
}

/**
 * Calendar month key in Europe/Amsterdam, e.g. `2026-08`.
 *
 * Stored as a string rather than a reset timestamp so the refill is a plain
 * comparison with no scheduled job: the month simply changes and the counter
 * that was written under the old key no longer matches.
 */
export function currentMonthlyPeriod(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
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

function toState(
  isPremiumUser: boolean,
  gamesHosted: number,
  monthlyGamesUsed: number,
): MultiplayerQuotaState {
  if (isPremiumUser) {
    return {
      isPremiumUser,
      gamesHosted,
      freeGamesRemaining: null,
      canHost: true,
      onMonthlyAllowance: false,
      monthlyGamesUsed: 0,
    };
  }

  const discoveryRemaining = Math.max(0, MULTIPLAYER_FREE_ROOM_QUOTA - gamesHosted);

  if (discoveryRemaining > 0) {
    return {
      isPremiumUser,
      gamesHosted,
      freeGamesRemaining: discoveryRemaining,
      canHost: true,
      onMonthlyAllowance: false,
      monthlyGamesUsed,
    };
  }

  // Discovery pack spent: the account now lives on the monthly allowance.
  const monthlyRemaining = Math.max(0, MULTIPLAYER_MONTHLY_FREE_ROOMS - monthlyGamesUsed);

  return {
    isPremiumUser,
    gamesHosted,
    freeGamesRemaining: monthlyRemaining,
    canHost: monthlyRemaining > 0,
    onMonthlyAllowance: true,
    monthlyGamesUsed,
  };
}

/**
 * Monthly games used in the *current* month.
 *
 * A stored counter from a previous month reads as zero rather than being
 * rewritten here: the reset happens lazily, on the next reservation, so no
 * scheduled job is needed and a read never mutates.
 */
function monthlyUsedThisPeriod(raw: RawQuotaUser, period: string): number {
  if (raw.multiplayerMonthlyPeriod !== period) return 0;
  return typeof raw.multiplayerMonthlyGamesHosted === 'number'
    ? raw.multiplayerMonthlyGamesHosted
    : 0;
}

/** Read the quota, migrating legacy accounts on the way. */
export async function loadMultiplayerQuota(userId: string): Promise<MultiplayerQuotaState> {
  assertObjectId(userId);

  await connectDB();

  const user = await User.findById(userId)
    .select(
      'isPremium hasLifetimePremium premiumStripe premiumStore storePremiumExpiresAt ' +
        'groupPremiumUntil freeMultiplayerRoomCreated multiplayerGamesHosted ' +
        'multiplayerMonthlyPeriod multiplayerMonthlyGamesHosted',
    )
    .lean() as RawQuotaUser | null;

  if (!user) {
    throw new MultiplayerError('UNAUTHORIZED', 'Unauthorized', 401);
  }

  // Read through the snapshot rather than the stored `isPremium` flag, so a
  // member of a group licence gets unlimited hosting too. The stored flag only
  // reflects personal purchases.
  const isPremiumUser =
    getPremiumSnapshot(user).isPremium || Boolean(user.hasLifetimePremium);
  const gamesHosted = await backfillCounter(userId, user);
  const monthlyGamesUsed = monthlyUsedThisPeriod(user, currentMonthlyPeriod());

  return toState(isPremiumUser, gamesHosted, monthlyGamesUsed);
}

export type HostReservation =
  /** Quota is empty; the caller must not start a game. */
  | { ok: false }
  /**
   * Cleared to start. `metered` is false for Premium, whose counter is
   * untouched. `source` says which allowance paid, so a refund puts the credit
   * back where it came from.
   */
  | { ok: true; metered: boolean; source?: 'discovery' | 'monthly' };

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

  // Discovery pack first, while it lasts.
  const fromDiscovery = await User.findOneAndUpdate(
    { _id: userId, multiplayerGamesHosted: { $lt: MULTIPLAYER_FREE_ROOM_QUOTA } },
    { $inc: { multiplayerGamesHosted: 1 } },
  )
    .select('_id')
    .lean();

  if (fromDiscovery) {
    return { ok: true, metered: true, source: 'discovery' };
  }

  const period = currentMonthlyPeriod();

  // A counter written in an earlier month is stale, so this first claims the
  // month - setting the period and the count in one atomic write. Two
  // concurrent starts cannot both match `multiplayerMonthlyPeriod: { $ne }`,
  // so exactly one of them performs the reset.
  const claimedNewMonth = await User.findOneAndUpdate(
    { _id: userId, multiplayerMonthlyPeriod: { $ne: period } },
    { $set: { multiplayerMonthlyPeriod: period, multiplayerMonthlyGamesHosted: 1 } },
  )
    .select('_id')
    .lean();

  if (claimedNewMonth) {
    await User.updateOne({ _id: userId }, { $inc: { multiplayerGamesHosted: 1 } });
    return { ok: true, metered: true, source: 'monthly' };
  }

  // Same month already claimed: spend from what is left of the allowance.
  const fromMonthly = await User.findOneAndUpdate(
    {
      _id: userId,
      multiplayerMonthlyPeriod: period,
      multiplayerMonthlyGamesHosted: { $lt: MULTIPLAYER_MONTHLY_FREE_ROOMS },
    },
    { $inc: { multiplayerMonthlyGamesHosted: 1, multiplayerGamesHosted: 1 } },
  )
    .select('_id')
    .lean();

  return fromMonthly ? { ok: true, metered: true, source: 'monthly' } : { ok: false };
}

/**
 * Hand the credit back when the game failed to start after all. Only call this
 * for a reservation that was actually `metered`, or it will refund a free game
 * that a Premium start never spent.
 *
 * `source` decides which counter is credited: refunding a monthly game against
 * the discovery pack would silently hand back a game the account already used
 * months ago.
 */
export async function releaseHostedGame(
  userId: string,
  source: 'discovery' | 'monthly' = 'discovery',
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;

  await connectDB();

  await User.updateOne(
    { _id: userId, multiplayerGamesHosted: { $gt: 0 } },
    { $inc: { multiplayerGamesHosted: -1 } },
  );

  if (source === 'monthly') {
    await User.updateOne(
      {
        _id: userId,
        multiplayerMonthlyPeriod: currentMonthlyPeriod(),
        multiplayerMonthlyGamesHosted: { $gt: 0 },
      },
      { $inc: { multiplayerMonthlyGamesHosted: -1 } },
    );
  }
}
