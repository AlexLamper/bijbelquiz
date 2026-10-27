'use client';

import * as React from 'react';

import { Button } from '@/components/bq';
import { track } from '@/lib/analytics/client';
import { monthlyEquivalentOfYearly } from '@/lib/premium-benefits';
import {
  premiumCtaLabel,
  premiumPageHref,
  premiumReassurance,
  trialDaysLabel,
  type PremiumPlanId,
  type PremiumPriceLabels,
} from '@/lib/premium-offer';
import { cn } from '@/lib/utils';
import { CheckIcon, ShieldIcon } from './parts';

export interface PlanPickerProps {
  prices: PremiumPriceLabels;
  /** Trial days on the yearly plan; 0 hides every trial claim. */
  trialDays: number;
  /** Plans with a Stripe price; the others are not offered. */
  sellable: PremiumPlanId[];
  initialPlan: PremiumPlanId;
  isLoggedIn: boolean;
  /** The locked paywall: checkout returns there when abandoned. */
  locked: boolean;
  returnPath: string | null;
  /** Analytics trigger (`?reden=`), forwarded to checkout. */
  trigger: string;
  checkoutCancelled: boolean;
}

/**
 * The plan card of P-Premium: Jaarlijks / Maandelijks as a radio pair, the
 * small "Of eenmalig: levenslang Premium" link, and the pay button.
 *
 * Paying is a plain form POST to `/api/stripe/checkout` (which redirects to
 * Stripe), so it works before hydration too. Guests are sent to sign up first
 * and come back to this page with their plan and the way back kept.
 */
export function PlanPicker({
  prices,
  trialDays,
  sellable,
  initialPlan,
  isLoggedIn,
  locked,
  returnPath,
  trigger,
  checkoutCancelled,
}: PlanPickerProps) {
  const offered = React.useMemo(() => new Set(sellable), [sellable]);
  const [plan, setPlan] = React.useState<PremiumPlanId>(() =>
    offered.has(initialPlan) ? initialPlan : (sellable[0] ?? 'yearly'),
  );
  const [submitting, setSubmitting] = React.useState(false);
  const startedCheckout = React.useRef(false);

  // Shown / left without paying, as the old offer page reported it, so the
  // funnel keeps one series across the redesign.
  React.useEffect(() => {
    track('paywall_shown', { trigger, surface: locked ? 'premium_locked' : 'premium_page' });
    const shownAt = Date.now();
    return () => {
      if (startedCheckout.current) return;
      track('paywall_dismissed', {
        trigger,
        surface: locked ? 'premium_locked' : 'premium_page',
        secondsVisible: Math.round((Date.now() - shownAt) / 1000),
      });
    };
  }, [trigger, locked]);

  const yearlyTrial = trialDays > 0;
  const yearlyPerMonth = monthlyEquivalentOfYearly(prices.yearly);
  const cardPlans = (['yearly', 'monthly'] as const).filter((id) => offered.has(id));
  const radioRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // Arrow keys move between the two cards, as a native radio group would.
  const onRadioKey = (event: React.KeyboardEvent, current: PremiumPlanId) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const index = cardPlans.indexOf(current as (typeof cardPlans)[number]);
    const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const next = cardPlans[(index + step + cardPlans.length) % cardPlans.length];
    if (next) {
      setPlan(next);
      radioRefs.current[next]?.focus();
    }
  };

  const ctaLabel = premiumCtaLabel(plan, trialDays);
  const signUpHref = `/registreren?callbackUrl=${encodeURIComponent(premiumPageHref({ locked, returnPath, plan }))}`;

  return (
    <div className="box-border flex flex-col rounded-[20px] border border-line bg-card px-7 pb-[26px] pt-8 max-m:p-5">
      {checkoutCancelled && (
        <p role="status" className="m-0 mb-4 rounded-[12px] bg-chip px-4 py-3 text-center text-[15px] font-bold text-ink-soft">
          Je betaling is niet afgerond. Kies opnieuw wanneer je wilt.
        </p>
      )}

      {cardPlans.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Kies een abonnement"
          className={cn('grid gap-3.5 pt-3', cardPlans.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}
        >
          {cardPlans.map((id) => {
            const selected = plan === id;
            const yearly = id === 'yearly';
            return (
              <button
                key={id}
                ref={(node) => {
                  radioRefs.current[id] = node;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected || (plan === 'lifetime' && id === cardPlans[0]) ? 0 : -1}
                onClick={() => setPlan(id)}
                onKeyDown={(event) => onRadioKey(event, id)}
                className={cn(
                  'relative box-border flex min-h-[150px] flex-col items-center justify-center gap-[3px] rounded-[16px] bg-card px-3 pb-3.5 pt-6 font-sans text-ink',
                  selected ? 'border-2 border-lapis' : 'border border-line hover:border-input-line',
                )}
              >
                {yearly && yearlyTrial && (
                  <span className="absolute -top-[13px] left-1/2 flex h-[26px] -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-lapis px-[11px] text-xs font-extrabold uppercase tracking-[0.04em] text-white">
                    {trialDaysLabel(trialDays)}
                  </span>
                )}
                <span className={cn('text-[15px] font-extrabold', selected ? 'text-lapis' : 'text-ink-muted')}>
                  {yearly ? 'Jaarlijks' : 'Maandelijks'}
                </span>
                <span className="text-2xl font-extrabold">{yearly ? prices.yearly : prices.monthly}</span>
                <span className="text-sm font-bold text-ink-soft">{yearly ? 'per jaar' : 'per maand'}</span>
                <span className="text-[13px] font-semibold text-ink-muted">
                  {yearly ? (yearlyPerMonth ? `= ${yearlyPerMonth} per maand` : ' ') : 'Geen proefperiode'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {offered.has('lifetime') &&
        (plan === 'lifetime' ? (
          <button
            type="button"
            aria-pressed="true"
            onClick={() => cardPlans[0] && setPlan(cardPlans[0])}
            className="mt-4 box-border flex min-h-14 items-center gap-3 rounded-[16px] border-2 border-lapis bg-card px-4 py-2.5 text-left"
          >
            <span className="flex min-w-0 flex-grow flex-col">
              <span className="text-sm font-extrabold text-lapis">Levenslang Premium</span>
              <span className="text-[13px] font-bold text-ink-soft">{prices.lifetime} eenmalig</span>
            </span>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lapis text-white">
              <CheckIcon />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPlan('lifetime')}
            className="mt-4 flex min-h-8 items-center self-center bg-transparent text-[15px] font-bold text-lapis hover:text-lapis-edge"
          >
            Of eenmalig: levenslang Premium
          </button>
        ))}

      {isLoggedIn ? (
        <form
          action="/api/stripe/checkout"
          method="POST"
          className="mt-3.5 flex flex-col"
          onSubmit={() => {
            startedCheckout.current = true;
            setSubmitting(true);
          }}
        >
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="reden" value={trigger} />
          {returnPath && <input type="hidden" name="next" value={returnPath} />}
          {locked && <input type="hidden" name="vergrendeld" value="1" />}
          <Button type="submit" size="hero" block loading={submitting}>
            {ctaLabel}
          </Button>
        </form>
      ) : (
        <Button
          href={signUpHref}
          size="hero"
          block
          className="mt-3.5"
          onClick={() => {
            startedCheckout.current = true;
          }}
        >
          {ctaLabel}
        </Button>
      )}

      <p className="m-0 mt-3.5 text-balance text-center text-sm font-semibold leading-5 text-ink-muted">
        <ShieldIcon />
        {premiumReassurance(plan, trialDays)}
      </p>
    </div>
  );
}
