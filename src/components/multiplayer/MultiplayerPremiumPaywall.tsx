'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Check, Crown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trackEvent } from '@/components/GoogleAnalytics';
import { track } from '@/lib/analytics/client';
import type { PaywallTrigger } from '@/lib/analytics/events';
import {
  PREMIUM_HERO_OUTCOME,
  PREMIUM_TRIGGER_BULLETS,
  premiumPaywallHref,
  yearlyPricePerWeek,
} from '@/lib/premium-benefits';

interface MultiplayerPremiumPaywallProps {
  /** Trigger that surfaced the paywall (used for analytics). */
  placement: 'free_quota_used' | 'player_limit' | 'lobby_after_create';
  /** Optional override for the headline (e.g. trigger-specific). */
  headline?: string;
}

const monthlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || '€5,99';
const yearlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_LABEL || '€39,99';

/** Placement to the closed trigger set the funnel reports on. */
const PLACEMENT_TRIGGERS: Record<MultiplayerPremiumPaywallProps['placement'], PaywallTrigger> = {
  free_quota_used: 'host_quota_exhausted',
  player_limit: 'host_player_cap',
  lobby_after_create: 'host_quota_warning',
};

export default function MultiplayerPremiumPaywall({
  placement,
  headline,
}: MultiplayerPremiumPaywallProps) {
  // Quoted per week off the yearly plan: the smallest true number on the page,
  // and the same anchor the mobile paywall uses.
  const perWeek = yearlyPricePerWeek(yearlyPriceLabel);
  const trigger = PLACEMENT_TRIGGERS[placement];

  // Recorded where the wall is actually raised, not where it is clicked: a
  // paywall nobody clicks is exactly the thing the conversion rate is meant to
  // reveal.
  useEffect(() => {
    track('paywall_shown', { trigger, surface: 'multiplayer_entry' });
  }, [trigger]);

  return (
    <div
      className="rounded-lg border border-lapis/45 bg-paper-raised p-4"
      data-paywall-placement={placement}
    >
      <p className="inline-flex items-center gap-1 rounded-md bg-ink-soft px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-inverted">
        <Crown className="h-3 w-3" />
        Premium
      </p>

      <p className="mt-3 text-sm font-semibold text-ink">
        {headline || PREMIUM_HERO_OUTCOME}
      </p>

      <ul className="mt-3 space-y-1.5">
        {PREMIUM_TRIGGER_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2 text-xs text-ink">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          asChild
          className="h-9 rounded-md bg-ink px-4 text-xs font-semibold text-ink-inverted hover:bg-ink-soft"
          onClick={() =>
            trackEvent('multiplayer_premium_cta_clicked', { placement })
          }
        >
          <Link href={premiumPaywallHref(trigger, '/samen-spelen')}>Upgrade naar Premium</Link>
        </Button>
        <p className="text-[11px] text-muted-foreground">
          {perWeek
            ? `Vanaf ${perWeek} per week met het jaarplan.`
            : `Vanaf ${monthlyPriceLabel} per maand.`}
        </p>
      </div>
    </div>
  );
}
