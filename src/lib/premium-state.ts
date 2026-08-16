import { User } from '@/database';

type UserPremiumLike = {
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | string | null;
  groupPremiumUntil?: Date | string | null;
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
  const storePremiumExpiresAt = parseExpiryDate(user.storePremiumExpiresAt);

  // Group premium is a lease, not a flag: it lapses on its own date, so a
  // licence that ends takes the access with it without any cleanup pass.
  const groupPremiumUntil = parseExpiryDate(user.groupPremiumUntil);
  const premiumGroup = Boolean(groupPremiumUntil && groupPremiumUntil.getTime() > Date.now());

  const isPremium = premiumStripe || premiumStore || premiumGroup || Boolean(user.isPremium);

  return {
    premiumStripe,
    premiumStore,
    storePremiumExpiresAt,
    premiumGroup,
    groupPremiumUntil,
    isPremium,
  };
}

export async function updateUserPremiumFromStripe(userId: string, premiumStripe: boolean, extraFields: Record<string, unknown> = {}) {
  const user = await User.findById(userId).select('_id premiumStore premiumStripe');
  if (!user) {
    return null;
  }

  const effectivePremium = premiumStripe || Boolean(user.premiumStore);

  await User.findByIdAndUpdate(user._id, {
    ...extraFields,
    premiumStripe,
    isPremium: effectivePremium,
  });

  return {
    userId: user._id.toString(),
    premiumStripe,
    isPremium: effectivePremium,
  };
}

export async function updateUserPremiumFromStore(
  userId: string,
  premiumStore: boolean,
  storePremiumExpiresAt: Date | null,
  extraFields: Record<string, unknown> = {}
) {
  const user = await User.findById(userId).select('_id premiumStripe');
  if (!user) {
    return null;
  }

  const effectivePremium = Boolean(user.premiumStripe) || premiumStore;

  await User.findByIdAndUpdate(user._id, {
    ...extraFields,
    premiumStore,
    storePremiumExpiresAt,
    isPremium: effectivePremium,
  });

  return {
    userId: user._id.toString(),
    premiumStore,
    storePremiumExpiresAt,
    isPremium: effectivePremium,
  };
}
