import mongoose from 'mongoose';

import { Payment } from '@/database';
import { getPremiumSnapshot, manualGrantActive } from '@/lib/premium-state';
import { PREMIUM_KIND_LABELS, PREMIUM_KINDS, type PremiumKind } from '@/lib/admin/premium-kind-labels';

export { PREMIUM_KIND_LABELS, PREMIUM_KINDS, type PremiumKind };

/**
 * One plain answer for beheer: HOW does this account have Premium, has money
 * come in, and what happens next?
 *
 *   trial     free trial (website or store); nothing paid yet for it
 *   paid      a subscription that has been charged
 *   lifetime  bought once (levenslang)
 *   group     through a group licence
 *   manual    given by beheer
 *
 * The flags on the account say WHICH channel gives Premium (Stripe, store,
 * ...); they do not say whether that channel is a trial. That comes from the
 * Stripe status (`trialing`), the store period type RevenueCat reports
 * (`storePeriodType`), and - for store subscriptions from before that field -
 * whether any real store charge was ever recorded.
 */

export type PremiumChannel = 'website' | 'app_store' | 'play_store' | 'app';
export type PremiumPlan = 'yearly' | 'monthly' | 'lifetime';

export interface PremiumStatus {
  kind: PremiumKind;
  label: string;
  channel: PremiumChannel | null;
  plan: PremiumPlan | null;
  /** Subscriptions: whether it renews (or, in a trial, turns into a paid one). Null when unknown or not a subscription. */
  renews: boolean | null;
  /** When the trial, the paid period, the group licence or the grant ends; null for lifetime / open-ended. */
  endsAt: string | null;
  /** The next charge, when one is coming; amount null when not known. */
  nextCharge: { at: string; amount: number | null; currency: string } | null;
  /** One Dutch sentence for the page. */
  summary: string;
}

/** Real money from this account (production, completed, not refunded). */
export interface PaidSummary {
  count: number;
  /** Euro cents; other currencies are counted in `count` but not summed. */
  totalCents: number;
  lastAt: string | null;
  lastAmount: number | null;
  lastCurrency: string | null;
  lastPlan: string | null;
  /** Any real store (App Store / Play) charge. */
  store: boolean;
  /** Any real Stripe charge. */
  stripe: boolean;
  /** Amount of the latest charge per plan, for the next-charge estimate. */
  lastAmountByPlan: Partial<Record<string, { amount: number; currency: string }>>;
}

export const EMPTY_PAID: PaidSummary = {
  count: 0,
  totalCents: 0,
  lastAt: null,
  lastAmount: null,
  lastCurrency: null,
  lastPlan: null,
  store: false,
  stripe: false,
  lastAmountByPlan: {},
};

/** The account fields `premiumStatus` reads. */
export const PREMIUM_STATUS_FIELDS =
  'isPremium premiumStripe premiumStore storePremiumExpiresAt storeWillRenew storePeriodType storePlan storeName hasLifetimePremium groupPremiumUntil premiumGranted premiumGrantedUntil stripeSubscriptionStatus stripeSubscriptionPlan stripeCurrentPeriodEnd stripeCancelAtPeriodEnd stripeTrialEnd stripePriceAmount stripePriceCurrency';

export interface PremiumStatusUser {
  isPremium?: boolean;
  premiumStripe?: boolean;
  premiumStore?: boolean;
  storePremiumExpiresAt?: Date | string | null;
  storeWillRenew?: boolean | null;
  storePeriodType?: string | null;
  storePlan?: string | null;
  storeName?: string | null;
  hasLifetimePremium?: boolean;
  groupPremiumUntil?: Date | string | null;
  premiumGranted?: boolean;
  premiumGrantedUntil?: Date | string | null;
  stripeSubscriptionStatus?: string | null;
  stripeSubscriptionPlan?: string | null;
  stripeCurrentPeriodEnd?: Date | string | null;
  stripeCancelAtPeriodEnd?: boolean;
  stripeTrialEnd?: Date | string | null;
  stripePriceAmount?: number | null;
  stripePriceCurrency?: string | null;
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
/** "18 nov 2026", in Amsterdam time. */
export function dayLabel(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(new Date(value));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return `${get('day')} ${MONTHS[get('month') - 1]} ${get('year')}`;
}

/** "€ 29,99"; other currencies with their code. */
export function moneyLabel(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2).replace('.', ',');
  return currency.toLowerCase() === 'eur' ? `€ ${amount}` : `${amount} ${currency.toUpperCase()}`;
}

function planFrom(value: string | null | undefined): PremiumPlan | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes('life')) return 'lifetime';
  if (lower.includes('year') || lower.includes('annual') || lower.includes('jaar')) return 'yearly';
  if (lower.includes('month') || lower.includes('maand')) return 'monthly';
  return null;
}

function storeChannel(name: string | null | undefined): PremiumChannel {
  const lower = (name ?? '').toLowerCase();
  if (lower.includes('app_store') || lower === 'ios' || lower.includes('mac')) return 'app_store';
  if (lower.includes('play')) return 'play_store';
  return 'app';
}

const CHANNEL_WORDS: Record<PremiumChannel, string> = {
  website: 'via de website',
  app_store: 'via de App Store',
  play_store: 'via Google Play',
  app: 'via de app',
};
const PLAN_WORDS: Record<PremiumPlan, string> = { yearly: 'jaarabonnement', monthly: 'maandabonnement', lifetime: 'levenslang' };

/**
 * Pure: the status from the account, its charges, and the clock. Null when the
 * account has no Premium now.
 */
export function premiumStatus(user: PremiumStatusUser, paid: PaidSummary, now: Date = new Date()): PremiumStatus | null {
  const nowMs = now.getTime();
  const snapshot = getPremiumSnapshot(user);
  const paidLine = paid.count > 0 && paid.lastAt && paid.lastAmount !== null && paid.lastCurrency
    ? ` Totaal betaald: ${moneyLabel(paid.totalCents, 'eur')}${paid.count > 1 ? ` (${paid.count} betalingen)` : ''}, laatst ${moneyLabel(paid.lastAmount, paid.lastCurrency)} op ${dayLabel(paid.lastAt)}.`
    : '';

  // 1. Lifetime.
  if (snapshot.premiumLifetime) {
    return {
      kind: 'lifetime',
      label: PREMIUM_KIND_LABELS.lifetime,
      channel: paid.stripe ? 'website' : paid.store ? 'app' : null,
      plan: 'lifetime',
      renews: null,
      endsAt: null,
      nextCharge: null,
      summary: `Levenslang Premium, eenmalig gekocht.${paidLine || ' Geen betaling gevonden.'}`,
    };
  }

  // 2. Website subscription (Stripe).
  if (snapshot.premiumStripe) {
    const plan = planFrom(user.stripeSubscriptionPlan) ?? null;
    const trialEnd = iso(user.stripeTrialEnd);
    const inTrial = user.stripeSubscriptionStatus === 'trialing' || Boolean(trialEnd && new Date(trialEnd).getTime() > nowMs);
    const periodEnd = iso(user.stripeCurrentPeriodEnd);
    const renews = !user.stripeCancelAtPeriodEnd;
    const amount = typeof user.stripePriceAmount === 'number' ? user.stripePriceAmount : null;
    const currency = user.stripePriceCurrency ?? 'eur';
    const endsAt = inTrial ? trialEnd ?? periodEnd : periodEnd;
    const planWord = plan ? PLAN_WORDS[plan] : 'abonnement';
    const price = amount !== null ? moneyLabel(amount, currency) : 'het abonnementsbedrag';
    if (inTrial) {
      return {
        kind: 'trial',
        label: PREMIUM_KIND_LABELS.trial,
        channel: 'website',
        plan,
        renews,
        endsAt,
        nextCharge: renews && endsAt ? { at: endsAt, amount, currency } : null,
        summary: endsAt
          ? renews
            ? `Gratis proefperiode (${planWord}, via de website) tot ${dayLabel(endsAt)}. Er is nog niets betaald. Op ${dayLabel(endsAt)} wordt automatisch ${price} afgeschreven, tenzij die opzegt.`
            : `Gratis proefperiode (${planWord}, via de website) tot ${dayLabel(endsAt)}, maar opgezegd: Premium stopt dan en er wordt niets betaald.`
          : `Gratis proefperiode (${planWord}, via de website). Er is nog niets betaald.`,
      };
    }
    return {
      kind: 'paid',
      label: PREMIUM_KIND_LABELS.paid,
      channel: 'website',
      plan,
      renews,
      endsAt,
      nextCharge: renews && endsAt ? { at: endsAt, amount, currency } : null,
      summary: `Betaald ${planWord} via de website.${paidLine}${
        endsAt ? (renews ? ` Volgende afschrijving: ${price} op ${dayLabel(endsAt)}.` : ` Opgezegd: Premium stopt op ${dayLabel(endsAt)}.`) : ''
      }`,
    };
  }

  // 3. Store subscription (App Store / Google Play, through RevenueCat).
  if (snapshot.premiumStore) {
    const channel = storeChannel(user.storeName);
    const plan = planFrom(user.storePlan) ?? (paid.lastPlan ? planFrom(paid.lastPlan) : null);
    const endsAt = iso(snapshot.storePremiumExpiresAt);
    const renews = typeof user.storeWillRenew === 'boolean' ? user.storeWillRenew : null;
    const period = (user.storePeriodType ?? '').toLowerCase();
    // Store accounts from before `storePeriodType`: no real store charge yet means the trial.
    const inTrial = period === 'trial' || (!period && !paid.store);
    const known = plan ? paid.lastAmountByPlan[plan] : undefined;
    const amount = known?.amount ?? null;
    const currency = known?.currency ?? 'eur';
    const planWord = plan ? PLAN_WORDS[plan] : 'abonnement';
    const via = CHANNEL_WORDS[channel];
    const price = amount !== null ? moneyLabel(amount, currency) : 'het abonnementsbedrag';
    if (inTrial && endsAt && new Date(endsAt).getTime() <= nowMs) {
      // The trial date has passed but no charge arrived and access was not
      // taken away: the store's next event is missing or late.
      return {
        kind: 'trial',
        label: PREMIUM_KIND_LABELS.trial,
        channel,
        plan,
        renews,
        endsAt,
        nextCharge: null,
        summary: `Proefperiode (${planWord}, ${via}) liep tot ${dayLabel(endsAt)}, maar er is nog geen betaling binnengekomen en Premium staat nog aan. Waarschijnlijk mist er een melding van de store; open dit account opnieuw of kijk in RevenueCat.`,
      };
    }
    if (inTrial) {
      return {
        kind: 'trial',
        label: PREMIUM_KIND_LABELS.trial,
        channel,
        plan,
        renews,
        endsAt,
        nextCharge: renews !== false && endsAt ? { at: endsAt, amount, currency } : null,
        summary: endsAt
          ? renews === false
            ? `Gratis proefperiode (${planWord}, ${via}) tot ${dayLabel(endsAt)}, maar opgezegd: Premium stopt dan en er wordt niets betaald.`
            : `Gratis proefperiode (${planWord}, ${via}) tot ${dayLabel(endsAt)}. Er is nog niets betaald. Op ${dayLabel(endsAt)} rekent ${
                channel === 'play_store' ? 'Google Play' : channel === 'app_store' ? 'Apple' : 'de App Store of Google Play'
              } automatisch ${price} af, tenzij die opzegt.`
          : `Gratis proefperiode (${planWord}, ${via}). Er is nog niets betaald.`,
      };
    }
    return {
      kind: 'paid',
      label: PREMIUM_KIND_LABELS.paid,
      channel,
      plan,
      renews,
      endsAt,
      nextCharge: renews !== false && endsAt ? { at: endsAt, amount, currency } : null,
      summary: `Betaald ${planWord} ${via}.${paidLine}${
        endsAt ? (renews === false ? ` Opgezegd: Premium stopt op ${dayLabel(endsAt)}.` : ` Wordt verlengd op ${dayLabel(endsAt)}${amount !== null ? ` (${price})` : ''}.`) : ''
      }`,
    };
  }

  // 4. Group licence.
  if (snapshot.premiumGroup) {
    const endsAt = iso(snapshot.groupPremiumUntil);
    return {
      kind: 'group',
      label: PREMIUM_KIND_LABELS.group,
      channel: null,
      plan: null,
      renews: null,
      endsAt,
      nextCharge: null,
      summary: `Premium via een groepslicentie${endsAt ? ` tot ${dayLabel(endsAt)}` : ''}. Dit account betaalt zelf niets.`,
    };
  }

  // 5. Given by beheer (or a flag nothing else explains).
  if (manualGrantActive(user, nowMs) || snapshot.isPremium) {
    const endsAt = iso(user.premiumGrantedUntil);
    return {
      kind: 'manual',
      label: PREMIUM_KIND_LABELS.manual,
      channel: null,
      plan: null,
      renews: null,
      endsAt,
      nextCharge: null,
      summary: `Premium gegeven door beheer${endsAt ? ` tot ${dayLabel(endsAt)}` : ', zonder einddatum'}. Er is niet voor betaald.`,
    };
  }

  return null;
}

type PaymentAggregate = {
  _id: unknown;
  count: number;
  totalEur: number;
  last: { at: Date; amount: number; currency: string; plan?: string | null; provider?: string };
  store: number;
  stripe: number;
  byPlan: Array<{ plan?: string | null; at: Date; amount: number; currency: string }>;
};

/** Real charges per account, for `premiumStatus`. */
export async function paidSummaries(userIds: string[]): Promise<Map<string, PaidSummary>> {
  const ids = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
  const out = new Map<string, PaidSummary>();
  if (ids.length === 0) return out;
  const rows = await Payment.aggregate<PaymentAggregate>([
    {
      $match: {
        user: { $in: ids },
        status: 'completed',
        amount: { $gt: 0 },
        environment: { $ne: 'sandbox' },
      },
    },
    { $addFields: { _at: { $ifNull: ['$paidAt', { $ifNull: ['$purchasedAt', '$createdAt'] }] } } },
    { $sort: { _at: -1 } },
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 },
        totalEur: { $sum: { $cond: [{ $eq: [{ $toLower: '$currency' }, 'eur'] }, '$amount', 0] } },
        last: { $first: { at: '$_at', amount: '$amount', currency: '$currency', plan: '$planType', provider: '$provider' } },
        store: { $sum: { $cond: [{ $eq: ['$provider', 'revenuecat'] }, 1, 0] } },
        stripe: { $sum: { $cond: [{ $eq: ['$provider', 'stripe'] }, 1, 0] } },
        byPlan: { $push: { plan: '$planType', at: '$_at', amount: '$amount', currency: '$currency' } },
      },
    },
  ]);
  for (const row of rows) {
    const lastAmountByPlan: PaidSummary['lastAmountByPlan'] = {};
    for (const item of row.byPlan) {
      // Sorted newest first: the first per plan is the latest.
      if (item.plan && !lastAmountByPlan[item.plan]) lastAmountByPlan[item.plan] = { amount: item.amount, currency: (item.currency || 'eur').toLowerCase() };
    }
    out.set(String(row._id), {
      count: row.count,
      totalCents: row.totalEur,
      lastAt: row.last?.at ? new Date(row.last.at).toISOString() : null,
      lastAmount: row.last?.amount ?? null,
      lastCurrency: row.last?.currency ? row.last.currency.toLowerCase() : null,
      lastPlan: row.last?.plan ?? null,
      store: row.store > 0,
      stripe: row.stripe > 0,
      lastAmountByPlan,
    });
  }
  return out;
}

export interface PremiumBreakdown {
  /** Accounts with Premium now, test accounts left out. */
  total: number;
  trial: { total: number; renews: number; cancelled: number };
  paid: { total: number; yearly: number; monthly: number; other: number; cancelled: number };
  lifetime: number;
  group: number;
  manual: number;
}

/**
 * Every account with Premium now, sorted by how it has it. Test accounts
 * (`internalIds`) are left out, as in every other Premium figure.
 */
export async function premiumBreakdown(
  users: Array<PremiumStatusUser & { _id: unknown }>,
  internalIds: ReadonlySet<string>,
  now: Date = new Date(),
): Promise<PremiumBreakdown> {
  const real = users.filter((user) => !internalIds.has(String(user._id)));
  const paid = await paidSummaries(real.map((user) => String(user._id)));
  const out: PremiumBreakdown = {
    total: 0,
    trial: { total: 0, renews: 0, cancelled: 0 },
    paid: { total: 0, yearly: 0, monthly: 0, other: 0, cancelled: 0 },
    lifetime: 0,
    group: 0,
    manual: 0,
  };
  for (const user of real) {
    const status = premiumStatus(user, paid.get(String(user._id)) ?? EMPTY_PAID, now);
    if (!status) continue;
    out.total += 1;
    if (status.kind === 'trial') {
      out.trial.total += 1;
      if (status.renews === false) out.trial.cancelled += 1;
      else out.trial.renews += 1;
    } else if (status.kind === 'paid') {
      out.paid.total += 1;
      if (status.plan === 'yearly') out.paid.yearly += 1;
      else if (status.plan === 'monthly') out.paid.monthly += 1;
      else out.paid.other += 1;
      if (status.renews === false) out.paid.cancelled += 1;
    } else {
      out[status.kind] += 1;
    }
  }
  return out;
}
