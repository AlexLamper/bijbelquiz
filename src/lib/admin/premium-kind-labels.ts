/** Client-safe labels for how an account has Premium (see premium-status.ts). */

export type PremiumKind = 'trial' | 'paid' | 'lifetime' | 'group' | 'manual';

export const PREMIUM_KIND_LABELS: Record<PremiumKind, string> = {
  trial: 'Proefperiode',
  paid: 'Betaald abonnement',
  lifetime: 'Levenslang',
  group: 'Groepslicentie',
  manual: 'Gegeven door beheer',
};

export const PREMIUM_KINDS = Object.keys(PREMIUM_KIND_LABELS) as PremiumKind[];
