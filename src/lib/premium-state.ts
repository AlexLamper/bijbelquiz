import type { QueryFilter } from 'mongoose';

import { User } from '@/database';

/**
 * Premium belongs to the account and can come from several sources at once:
 *
 * - `premiumStripe`: a Stripe subscription bought on the website that is
 *   trialing, active or past_due (Stripe is still retrying the card);
 * - `premiumStore`: an App Store / Google Play purchase (RevenueCat);
 * - `hasLifetimePremium`: a one-off lifetime purchase (Stripe or store);
 * - `groupPremiumUntil`: a seat in a group licence, a lease that lapses by
 *   itself (never folded into `isPremium`);
 * - a manual grant (`premiumGranted`): `isPremium` set by hand (support,
 *   beheer) with none of the flags above explaining it.
 *
 * `isPremium` on the user document is the stored aggregate of the first four
 * kinds, read directly by many queries (leaderboard, counts). Every writer
 * recomputes it from all sources in one atomic update (`recomputeUserPremium`),
 * so a Stripe cancellation can never switch off a store purchase, a lifetime
 * licence or a manual grant, and the other way round.
 */

/** Stripe subscription statuses that keep Premium on. */
export const PREMIUM_SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due'] as const;

/**
 * Whether a Stripe subscription in this status gives Premium.
 *
 * `past_due` keeps access while Stripe retries the payment (Smart Retries,
 * about two weeks); `unpaid`, `canceled`, `incomplete`, `incomplete_expired`
 * and `paused` do not. A subscription that is cancelled at the period end stays
 * `active` until that end, so the member keeps what they paid for.
 */
export function subscriptionStatusGrantsPremium(status?: string | null): boolean {
  return (PREMIUM_SUBSCRIPTION_STATUSES as readonly string[]).includes((status || '').toLowerCase());
}

type UserPremiumLike = {
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | string | null;
  groupPremiumUntil?: Date | string | null;
  hasLifetimePremium?: boolean;
  premiumGranted?: boolean;
};

function parseExpiryDate(input?: Date | string | null) {
  if (!input) {
    return null;
  }

  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getPremiumSnapshot(user: UserPremiumLike) {
  const premiumStripe = Boolean(user.premiumStripe);
  const premiumStore = Boolean(user.premiumStore);
  const premiumLifetime = Boolean(user.hasLifetimePremium);
  const storePremiumExpiresAt = parseExpiryDate(user.storePremiumExpiresAt);

  // Group premium is a lease, not a flag: it lapses on its own date, so a
  // licence that ends takes the access with it without any cleanup pass.
  const groupPremiumUntil = parseExpiryDate(user.groupPremiumUntil);
  const premiumGroup = Boolean(groupPremiumUntil && groupPremiumUntil.getTime() > Date.now());

  const isPremium =
    premiumStripe || premiumStore || premiumLifetime || premiumGroup || Boolean(user.premiumGranted) || Boolean(user.isPremium);

  return {
    premiumStripe,
    premiumStore,
    premiumLifetime,
    storePremiumExpiresAt,
    premiumGroup,
    groupPremiumUntil,
    isPremium,
  };
}

/**
 * A manual grant: `isPremium` with no Stripe, store or lifetime flag behind
 * it, remembered in `premiumGranted` once a recompute has seen it.
 */
export function isManualPremium(user: UserPremiumLike): boolean {
  if (user.premiumGranted === true) return true;
  if (user.premiumGranted === false) return false;
  return Boolean(user.isPremium) && !user.premiumStripe && !user.premiumStore && !user.hasLifetimePremium;
}

export interface PremiumWriteResult {
  userId: string;
  isPremium: boolean;
  premiumStripe: boolean;
  premiumStore: boolean;
  hasLifetimePremium: boolean;
  storePremiumExpiresAt: Date | null;
}

const RESULT_FIELDS = '_id isPremium premiumStripe premiumStore hasLifetimePremium storePremiumExpiresAt';

const isTrue = (field: string) => ({ $eq: [`$${field}`, true] });

/**
 * Write premium-related fields and recompute `isPremium` from every source,
 * in one atomic pipeline update (no read-then-write race with a webhook of
 * the other provider arriving at the same moment).
 *
 * - `set`: plain field values (undefined entries are skipped, null clears).
 * - `deriveStripe`: recompute `premiumStripe` from the stored
 *   `stripeSubscriptionStatus` after `set` is applied.
 * - `filter`: extra conditions; when they do not match nothing is written
 *   and null is returned (used to drop out-of-order Stripe events).
 *
 * A manual grant is judged on the document before this write (and then kept
 * in `premiumGranted`), so switching a Stripe subscription off does not
 * suddenly look like a manual grant, and does not end a real one.
 */
export async function recomputeUserPremium(
  userId: string,
  set: Record<string, unknown>,
  options: { deriveStripe?: boolean; filter?: QueryFilter<unknown> } = {},
): Promise<PremiumWriteResult | null> {
  const literalSet: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(set)) {
    if (value === undefined) continue;
    literalSet[key] = { $literal: value };
  }

  const pipeline: Record<string, unknown>[] = [
    {
      // Judged before this write: a manual grant is remembered in
      // `premiumGranted`, so it survives a purchase that starts and ends.
      $set: {
        premiumGranted: {
          $or: [
            isTrue('premiumGranted'),
            {
              $and: [
                isTrue('isPremium'),
                { $ne: ['$premiumStripe', true] },
                { $ne: ['$premiumStore', true] },
                { $ne: ['$hasLifetimePremium', true] },
                // Explicitly taken away: stays off.
                { $ne: ['$premiumGranted', false] },
              ],
            },
          ],
        },
      },
    },
  ];

  if (Object.keys(literalSet).length > 0) pipeline.push({ $set: literalSet });

  if (options.deriveStripe) {
    pipeline.push({
      $set: {
        premiumStripe: {
          $in: [{ $toLower: { $ifNull: ['$stripeSubscriptionStatus', ''] } }, [...PREMIUM_SUBSCRIPTION_STATUSES]],
        },
      },
    });
  }

  pipeline.push(
    {
      $set: {
        isPremium: {
          $or: [isTrue('premiumStripe'), isTrue('premiumStore'), isTrue('hasLifetimePremium'), isTrue('premiumGranted')],
        },
      },
    },
  );

  const updated = await User.findOneAndUpdate({ ...(options.filter ?? {}), _id: userId }, pipeline, {
    returnDocument: 'after',
    updatePipeline: true,
    projection: RESULT_FIELDS,
  }).lean<{
    _id: unknown;
    isPremium?: boolean;
    premiumStripe?: boolean;
    premiumStore?: boolean;
    hasLifetimePremium?: boolean;
    storePremiumExpiresAt?: Date | null;
  }>();

  if (!updated) return null;

  return {
    userId: String(updated._id),
    isPremium: Boolean(updated.isPremium),
    premiumStripe: Boolean(updated.premiumStripe),
    premiumStore: Boolean(updated.premiumStore),
    hasLifetimePremium: Boolean(updated.hasLifetimePremium),
    storePremiumExpiresAt: updated.storePremiumExpiresAt ?? null,
  };
}

/**
 * Set the Stripe subscription flag (plus any Stripe fields) without touching
 * the other sources. Kept for existing callers; new Stripe code goes through
 * `src/lib/stripe-billing.ts`.
 */
export async function updateUserPremiumFromStripe(userId: string, premiumStripe: boolean, extraFields: Record<string, unknown> = {}) {
  const result = await recomputeUserPremium(userId, { ...extraFields, premiumStripe });
  if (!result) {
    return null;
  }

  return {
    userId: result.userId,
    premiumStripe: result.premiumStripe,
    isPremium: result.isPremium,
  };
}

/** Set the store (RevenueCat) flag without touching Stripe, lifetime or a manual grant. */
export async function updateUserPremiumFromStore(
  userId: string,
  premiumStore: boolean,
  storePremiumExpiresAt: Date | null,
  extraFields: Record<string, unknown> = {}
) {
  const result = await recomputeUserPremium(userId, { ...extraFields, premiumStore, storePremiumExpiresAt });
  if (!result) {
    return null;
  }

  return {
    userId: result.userId,
    premiumStore: result.premiumStore,
    storePremiumExpiresAt: result.storePremiumExpiresAt,
    isPremium: result.isPremium,
  };
}
