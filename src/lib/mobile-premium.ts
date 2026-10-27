import { User } from '@/database';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { getRevenueCatSecretKey, syncStorePremiumForAppUser } from '@/lib/revenuecat';

/**
 * Where an account's Premium comes from, for the app.
 *
 * The app uses it to stay away from selling Premium to someone who already
 * has it, and to point at the right place to manage it: the App Store / Play
 * subscription settings for `store`, the website for `stripe`.
 */
export type PremiumSource = 'lifetime' | 'stripe' | 'store' | 'group' | 'manual' | null;

type PremiumFields = {
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | string | null;
  hasLifetimePremium?: boolean;
  groupPremiumUntil?: Date | string | null;
};

export const MOBILE_PREMIUM_FIELDS =
  'isPremium premiumStripe premiumStore storePremiumExpiresAt hasLifetimePremium groupPremiumUntil';

/** The Premium part of `/api/mobile/profile` and `/api/mobile/sync-premium`. */
export function mobilePremiumPayload(user: PremiumFields) {
  const snapshot = getPremiumSnapshot(user);
  const lifetime = Boolean(user.hasLifetimePremium);
  const isPremium = snapshot.isPremium || lifetime;

  let premiumSource: PremiumSource = null;
  if (lifetime) premiumSource = 'lifetime';
  else if (snapshot.premiumStripe) premiumSource = 'stripe';
  else if (snapshot.premiumStore) premiumSource = 'store';
  else if (snapshot.premiumGroup) premiumSource = 'group';
  else if (isPremium) premiumSource = 'manual';

  return {
    isPremium,
    premiumSource,
    premiumStripe: snapshot.premiumStripe,
    premiumStore: snapshot.premiumStore,
    premiumGroup: snapshot.premiumGroup,
    hasLifetimePremium: lifetime,
    storePremiumExpiresAt: snapshot.storePremiumExpiresAt ? snapshot.storePremiumExpiresAt.toISOString() : null,
    groupPremiumUntil: snapshot.groupPremiumUntil ? snapshot.groupPremiumUntil.toISOString() : null,
  };
}

/**
 * What `/api/mobile/sync-premium` answers: re-read the subscriber from
 * RevenueCat when a secret key is set, then the account's Premium from every
 * source. Without a key (or when RevenueCat is unreachable) it still answers
 * with the account as it stands, so Premium from the web, a group or a
 * webhook that already landed shows up anyway.
 */
export async function syncMobilePremium(
  userId: string,
  options: Parameters<typeof syncStorePremiumForAppUser>[1] = {},
) {
  let synced: 'revenuecat' | 'skipped' | 'failed' = 'skipped';
  if (getRevenueCatSecretKey()) {
    try {
      await syncStorePremiumForAppUser(userId, options);
      synced = 'revenuecat';
    } catch (error) {
      console.error('[SYNC_PREMIUM_ERROR]', { userId, error });
      synced = 'failed';
    }
  }

  const user = await User.findById(userId).select(MOBILE_PREMIUM_FIELDS).lean<PremiumFields>();
  if (!user) return null;

  return { ...mobilePremiumPayload(user), synced };
}
