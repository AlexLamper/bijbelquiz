'use client';

import * as React from 'react';

import { Button } from '@/components/bq';
import { track } from '@/lib/analytics/client';
import {
  formatPricePerWeek,
  lifetimePricePerWeek,
  LIFETIME_HORIZON_YEARS,
  yearlyPricePerWeek,
  yearlySavingsPercent,
} from '@/lib/premium-benefits';
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
  /** Whether the day-5 reminder mail goes out (SMTP set); false drops the promise. Default true. */
  trialReminder?: boolean;
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
 * Every plan leads with what it costs per week - the unit a reader already
 * prices small things in, and the one that shows how little Premium asks. The
 * amount actually charged, in the period it is charged, sits right under it in
 * plain sight, never in the small print. (The app does it the other way round:
 * App Store and Google Play require the billed amount to be the most prominent
 * price there. On the website Stripe bills, and the stores' rule does not apply.)
 *
 * Paying is a plain form POST to `/api/stripe/checkout` (which redirects to
 * Stripe), so it works before hydration too. Guests are sent to sign up first
 * and come back to this page with their plan and the way back kept.
 */
export function PlanPicker({
  prices,
  trialDays,
  trialReminder = true,
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
  const savings = yearlySavingsPercent(prices.monthly, prices.yearly);
  const weekly: Record<PremiumPlanId, string | null> = {
    yearly: yearlyPricePerWeek(prices.yearly),
    monthly: formatPricePerWeek(prices.monthly),
    lifetime: lifetimePricePerWeek(prices.lifetime),
  };
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
            const perWeek = weekly[id];
            const billed = `${yearly ? prices.yearly : prices.monthly} ${yearly ? 'per jaar' : 'per maand'}`;
            const badge = yearly ? (yearlyTrial ? trialDaysLabel(trialDays) : savings ? `Bespaar ${savings}%` : null) : null;
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
                {badge && (
                  <span className="absolute -top-[13px] left-1/2 flex h-[26px] -translate-x-1/2 items-center whitespace-nowrap rounded-full bg-lapis px-[11px] text-xs font-extrabold uppercase tracking-[0.04em] text-white">
                    {badge}
                  </span>
                )}
                <span className={cn('text-[15px] font-extrabold', selected ? 'text-lapis' : 'text-ink-muted')}>
                  {yearly ? 'Jaarlijks' : 'Maandelijks'}
                </span>
                {perWeek ? (
                  <>
                    <span className="mt-0.5 text-[34px] font-extrabold leading-[38px] tracking-[-0.01em] max-m:text-[30px] max-m:leading-[34px]">
                      {perWeek}
                    </span>
                    <span className="text-sm font-bold text-ink-soft">per week</span>
                    <span className="mt-1.5 rounded-full bg-chip px-2.5 py-0.5 text-[13px] font-extrabold text-ink">{billed}</span>
                  </>
                ) : (
                  // A price label that cannot be read as a number gets no derived claim.
                  <>
                    <span className="text-2xl font-extrabold">{yearly ? prices.yearly : prices.monthly}</span>
                    <span className="text-sm font-bold text-ink-soft">{yearly ? 'per jaar' : 'per maand'}</span>
                  </>
                )}
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
              <span className="text-[13px] font-bold text-ink-soft">
                {prices.lifetime} eenmalig
                {weekly.lifetime && ` · ${weekly.lifetime} per week over ${LIFETIME_HORIZON_YEARS} jaar`}
              </span>
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
        {premiumReassurance(plan, trialDays, trialReminder)}
      </p>
    </div>
  );
}
