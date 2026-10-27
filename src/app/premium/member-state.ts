import { Payment } from '@/database';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { hasActiveStripeSubscription, resolvePremiumSubscription } from '@/lib/premium-subscription';

/**
 * What a player who already has Premium sees on /premium instead of the plans.
 *
 * Premium belongs to the account, so it can come from four places: a one-off
 * lifetime purchase, a Stripe subscription bought here, an App Store / Google
 * Play subscription bought in the app (RevenueCat), or a group licence. Each
 * is managed somewhere else, and the page says where.
 */

export interface PremiumMemberUser {
  _id: unknown;
  email?: string | null;
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | string | null;
  groupPremiumUntil?: Date | string | null;
  hasLifetimePremium?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?: string | null;
  stripeSubscriptionPlan?: 'monthly' | 'yearly' | null;
  stripeCurrentPeriodEnd?: Date | string | null;
  stripeCancelAtPeriodEnd?: boolean | null;
}

/** Fields the Premium page selects for `resolvePremiumMemberState`. */
export const PREMIUM_MEMBER_FIELDS =
  'name email isPremium premiumStripe premiumStore storePremiumExpiresAt groupPremiumUntil hasLifetimePremium ' +
  'stripeCustomerId stripeSubscriptionId stripeSubscriptionStatus stripeSubscriptionPlan stripeCurrentPeriodEnd stripeCancelAtPeriodEnd';

export interface PremiumMemberState {
  source: 'lifetime' | 'stripe' | 'store' | 'group' | 'account';
  rows: Array<{ label: string; value: string }>;
  /** Text under the rows: where to manage or cancel. */
  note: string;
  /** Show the Stripe billing portal button. */
  canManageInPortal: boolean;
  /** Link to the group licence page. */
  showGroupLink: boolean;
}

const dateFormat = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Amsterdam',
});

function formatDate(input: Date | string | null | undefined): string | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

export function isPremiumUser(user: PremiumMemberUser): boolean {
  return getPremiumSnapshot(user).isPremium;
}

export async function resolvePremiumMemberState(user: PremiumMemberUser): Promise<PremiumMemberState> {
  const snapshot = getPremiumSnapshot(user);

  if (user.hasLifetimePremium) {
    return {
      source: 'lifetime',
      rows: [
        { label: 'Abonnement', value: 'Levenslang' },
        { label: 'Status', value: 'Actief' },
      ],
      note: 'Eenmalig betaald. Geen abonnement en geen verlenging.',
      canManageInPortal: false,
      showGroupLink: false,
    };
  }

  // Only a subscription that is running now: an old, ended Stripe
  // subscription must not hide Premium bought in the app.
  if (hasActiveStripeSubscription(user)) {
    const [subscription, lastPayment] = await Promise.all([
      resolvePremiumSubscription({ ...user, isPremium: true }),
      Payment.findOne({ user: String(user._id), provider: 'stripe', planType: { $in: ['monthly', 'yearly'] } })
        .sort({ createdAt: -1 })
        .select('planType')
        .lean()
        .catch(() => null),
    ]);

    const planType = subscription.plan ?? (lastPayment as { planType?: string } | null)?.planType;
    // Older purchases carry no plan on their payment row; say where it runs.
    const planLabel = planType === 'yearly' ? 'Jaarlijks' : planType === 'monthly' ? 'Maandelijks' : 'Via de website';
    const trialing = subscription.status === 'trialing';
    const rows = [
      { label: 'Abonnement', value: planLabel },
      { label: 'Status', value: subscription.cancelAtPeriodEnd ? 'Opgezegd' : subscription.statusText },
    ];
    if (subscription.endDateLabel) {
      rows.push({
        label: subscription.cancelAtPeriodEnd ? 'Premium tot' : trialing ? 'Gratis tot' : 'Verlengt op',
        value: subscription.endDateLabel,
      });
    }

    return {
      source: 'stripe',
      rows,
      note: subscription.status === 'past_due'
        ? 'Je laatste betaling is niet gelukt. Werk je betaalmethode bij via Beheer je abonnement; je houdt Premium zolang we het opnieuw proberen.'
        : subscription.cancelAtPeriodEnd
          ? 'Je houdt Premium tot het einde van de periode die je al betaald hebt.'
          : trialing
            ? 'Opzeggen kan wanneer je wilt. Zeg je op in de proefperiode, dan betaal je niets.'
            : 'Opzeggen kan wanneer je wilt. Je houdt Premium tot het einde van de periode die je al betaald hebt.',
      canManageInPortal: true,
      showGroupLink: false,
    };
  }

  if (snapshot.premiumStore) {
    const until = formatDate(snapshot.storePremiumExpiresAt);
    return {
      source: 'store',
      rows: [
        { label: 'Abonnement', value: 'Via de app' },
        { label: 'Status', value: 'Actief' },
        ...(until ? [{ label: 'Loopt tot', value: until }] : []),
      ],
      note: 'Je hebt Premium in de app gekocht. Opzeggen doe je in de App Store of Google Play.',
      canManageInPortal: false,
      showGroupLink: false,
    };
  }

  if (snapshot.premiumGroup) {
    const until = formatDate(snapshot.groupPremiumUntil);
    return {
      source: 'group',
      rows: [
        { label: 'Abonnement', value: 'Groepslicentie' },
        { label: 'Status', value: 'Actief' },
        ...(until ? [{ label: 'Loopt tot', value: until }] : []),
      ],
      note: 'Je hebt Premium via de groepslicentie van je groep.',
      canManageInPortal: false,
      showGroupLink: true,
    };
  }

  // Premium set on the account by hand (support, beheer).
  return {
    source: 'account',
    rows: [{ label: 'Status', value: 'Actief' }],
    note: 'Premium staat aan op je account.',
    canManageInPortal: false,
    showGroupLink: false,
  };
}
