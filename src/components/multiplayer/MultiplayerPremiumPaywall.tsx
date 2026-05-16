'use client';

import Link from 'next/link';
import { Check, Crown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trackEvent } from '@/components/GoogleAnalytics';
import {
  PREMIUM_HERO_OUTCOME,
  PREMIUM_TRIGGER_BULLETS,
  formatPricePerWeek,
} from '@/lib/premium-benefits';

interface MultiplayerPremiumPaywallProps {
  /** Trigger that surfaced the paywall (used for analytics). */
  placement: 'free_quota_used' | 'player_limit' | 'lobby_after_create';
  /** Optional override for the headline (e.g. trigger-specific). */
  headline?: string;
}

const monthlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || '€5,99';

export default function MultiplayerPremiumPaywall({
  placement,
  headline,
}: MultiplayerPremiumPaywallProps) {
  const perWeek = formatPricePerWeek(monthlyPriceLabel);

  return (
    <div
      className="rounded-xl border border-[#c8d7ee] bg-[linear-gradient(140deg,#f6faff,#edf3ff)] p-4 shadow-sm dark:border-zinc-700 dark:bg-[linear-gradient(140deg,rgba(24,24,27,0.95),rgba(39,39,42,0.92))]"
      data-paywall-placement={placement}
    >
      <p className="inline-flex items-center gap-1 rounded-full bg-[#4f74c7] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white dark:bg-[#6f8ed4]">
        <Crown className="h-3 w-3" />
        Premium
      </p>

      <p className="mt-3 text-sm font-semibold text-[#1f2f4b] dark:text-zinc-100">
        {headline || PREMIUM_HERO_OUTCOME}
      </p>

      <ul className="mt-3 space-y-1.5">
        {PREMIUM_TRIGGER_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2 text-xs text-[#30466e] dark:text-zinc-300">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4f74c7] dark:text-[#9db5dc]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          asChild
          className="h-9 rounded-md bg-[#6f8ed4] px-4 text-xs font-semibold text-white hover:bg-[#5f81cc] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          onClick={() =>
            trackEvent('multiplayer_premium_cta_clicked', { placement })
          }
        >
          <Link href="/premium">Upgrade naar Premium</Link>
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Vanaf {monthlyPriceLabel} per maand{perWeek ? ` (~${perWeek}/week)` : ''}.
        </p>
      </div>
    </div>
  );
}
