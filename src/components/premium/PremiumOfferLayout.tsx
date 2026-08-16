'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Check, ChevronRight, Crown, Infinity, Sparkles, Zap } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/components/GoogleAnalytics';
import { track } from '@/lib/analytics/client';
import type { PaywallTrigger } from '@/lib/analytics/events';
import {
  PREMIUM_TRIGGER_BULLETS,
  formatPricePerWeek,
  monthlyEquivalentOfYearly,
  yearlySavingsPercent,
} from '@/lib/premium-benefits';
import { cn } from '@/lib/utils';

interface PremiumOfferLayoutProps {
  isPremium: boolean;
  isLoggedIn: boolean;
  monthlyPriceLabel: string;
  yearlyPriceLabel: string;
  /** False until a Stripe yearly price exists; the card is hidden until then. */
  yearlyAvailable: boolean;
  lifetimePriceLabel: string;
  /** Which surface sent the user here. Recorded on the funnel event. */
  trigger: PaywallTrigger;
}

const FAQ_ITEMS = [
  {
    value: 'item-1',
    question: 'Wat is Premium precies?',
    answer:
      'Met Premium host je onbeperkt multiplayer-spellen tot 20 spelers, krijg je uitleg en bijbelverwijzingen bij elke vraag, en zie je gedetailleerde voortgang per boek. Ook alle premium quizzen worden ontgrendeld.',
  },
  {
    value: 'item-2',
    question: 'Wat is het verschil tussen jaarlijks en maandelijks?',
    answer:
      'Inhoudelijk niets: je krijgt exact dezelfde functies. Bij het jaarplan betaal je een keer per jaar en is de prijs per maand lager. Beide zijn op elk moment opzegbaar.',
  },
  {
    value: 'item-3',
    question: 'Hoe werkt een eenmalige aankoop?',
    answer:
      'Je betaalt een keer via Stripe en de premium rechten worden direct aan je account gekoppeld. Er wordt daarna nooit meer iets afgeschreven.',
  },
  {
    value: 'item-4',
    question: 'Hoe zeg ik op?',
    answer:
      'Via je profielpagina open je het abonnementsportaal van Stripe. Daar zeg je met een klik op. Je houdt toegang tot het einde van de periode die je al betaald hebt.',
  },
  {
    value: 'item-5',
    question: 'Kan ik later wisselen van plan?',
    answer:
      'Ja. Je kunt van maandelijks naar jaarlijks wisselen, en vanuit beide een eenmalige levenslange aankoop doen.',
  },
  {
    value: 'item-6',
    question: 'Welke betaalmethoden zijn beschikbaar?',
    answer:
      'De checkout verloopt via Stripe. Beschikbare methoden hangen af van je land en browser.',
  },
  {
    value: 'item-7',
    question: 'Wanneer wordt Premium geactiveerd?',
    answer:
      'In de meeste gevallen direct na een succesvolle betaling. Daarna kun je meteen alle premium functies gebruiken.',
  },
  {
    value: 'item-8',
    question: 'Worden mijn gegevens veilig verwerkt?',
    answer:
      'Ja. Betalingsgegevens worden door Stripe verwerkt. BijbelQuiz slaat geen volledige kaartgegevens op.',
  },
  {
    value: 'item-9',
    question: 'Waar wordt mijn bijdrage voor gebruikt?',
    answer:
      'Je bijdrage helpt met onderhoud, verbetering van de app, nieuwe quizinhoud en infrastructuurkosten.',
  },
];

type PlanType = 'monthly' | 'yearly' | 'lifetime';

/** Headline that names what the user was just stopped from doing. */
const TRIGGER_HEADLINES: Record<PaywallTrigger, string> = {
  host_quota_exhausted: 'Speel onbeperkt samen verder',
  host_quota_warning: 'Speel onbeperkt samen verder',
  host_player_cap: 'Speel met je hele groep',
  explanation_locked: 'Lees bij elke vraag waarom',
  premium_quiz_locked: 'Ontgrendel alle quizzen',
  direct: 'Kies jouw Premium plan',
};

const TRIGGER_LEADS: Record<PaywallTrigger, string> = {
  host_quota_exhausted:
    'Je gratis spellen zijn op. Met Premium host je zoveel spellen als je wilt, met tot 20 spelers tegelijk. Meedoen met andermans spel blijft altijd gratis.',
  host_quota_warning:
    'Je hebt bijna geen gratis spellen meer. Met Premium host je zoveel spellen als je wilt, met tot 20 spelers tegelijk.',
  host_player_cap:
    'Gratis spelen jullie met vier. Met Premium passen er 20 spelers in een kamer, genoeg voor een hele jeugdgroep of klas.',
  explanation_locked:
    'Bij elke vraag hoort een uitleg en een bijbelverwijzing. Met Premium lees je ze allemaal, ook nadat het spel is afgelopen.',
  premium_quiz_locked:
    'Deze quiz hoort bij de premium collectie. Met Premium spelen je alle quizzen, nu en in de toekomst.',
  direct:
    'Een prijs. Alles erin. Kies of je maandelijks bijdraagt, een jaar vooruit betaalt, of eenmalig voor blijvende toegang.',
};

export default function PremiumOfferLayout({
  isPremium,
  isLoggedIn,
  monthlyPriceLabel,
  yearlyPriceLabel,
  yearlyAvailable,
  lifetimePriceLabel,
  trigger,
}: PremiumOfferLayoutProps) {
  const perWeekLabel = formatPricePerWeek(monthlyPriceLabel);
  const perMonthOfYearly = monthlyEquivalentOfYearly(yearlyPriceLabel);
  const savings = yearlySavingsPercent(monthlyPriceLabel, yearlyPriceLabel);

  // A dismissal is "left without starting checkout". Tracked with a ref so the
  // cleanup below reads the value at unmount rather than at first render.
  const startedCheckout = useRef(false);

  useEffect(() => {
    if (isPremium) return;

    track('paywall_shown', { trigger, surface: 'premium_page' });
    const shownAt = Date.now();

    return () => {
      if (startedCheckout.current) return;
      track('paywall_dismissed', {
        trigger,
        surface: 'premium_page',
        secondsVisible: Math.round((Date.now() - shownAt) / 1000),
      });
    };
  }, [isPremium, trigger]);

  const renderAction = (planType: PlanType, label: string, variant: 'primary' | 'default' = 'default') => {
    const baseClass = cn(
      'h-12 w-full text-base font-semibold',
      variant === 'primary'
        ? 'bg-ink text-ink-inverted hover:bg-ink-soft  '
        : ' dark:text-ink-inverted '
    );

    if (isPremium) {
      return (
        <Button asChild size="lg" className={baseClass}>
          <Link href="/quizzen">Je hebt Premium</Link>
        </Button>
      );
    }

    if (isLoggedIn) {
      return (
        <form
          action="/api/stripe/checkout"
          method="POST"
          className="w-full"
          onSubmit={() => {
            startedCheckout.current = true;
            trackEvent('premium_checkout_started', {
              placement: 'premium_page',
              plan: planType,
            });
          }}
        >
          <input type="hidden" name="plan" value={planType} />
          <Button type="submit" size="lg" className={cn(baseClass, 'gap-2')}>
            {label}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </form>
      );
    }

    return (
      <Button
        asChild
        size="lg"
        className={baseClass}
        onClick={() => {
          startedCheckout.current = true;
          trackEvent('premium_login_required', {
            placement: 'premium_page',
            plan: planType,
          });
        }}
      >
        <Link href="/api/auth/signin?callbackUrl=/premium">Inloggen om te kopen</Link>
      </Button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header - names what the user was stopped from doing, not the product */}
      <header className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-lapis/10 px-4 py-1.5 text-sm font-semibold text-ink">
          <Crown className="h-4 w-4" />
          BijbelQuiz Premium
        </div>
        <h1 className="font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
          {TRIGGER_HEADLINES[trigger]}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {TRIGGER_LEADS[trigger]}
        </p>
      </header>

      {/* Pricing ladder. Year sits in the middle and carries the emphasis: it
          is the rung that catches the person who is convinced but not ready to
          commit for life. */}
      <div className={cn('mt-10 grid gap-5', yearlyAvailable ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>

        {/* Monthly */}
        <div className="flex flex-col rounded-lg border border-rule bg-paper-raised">
          <div className="flex flex-col gap-4 p-6 pb-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lapis/10">
                <Zap className="h-5 w-5 text-ink-soft" />
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg font-normal text-ink">Per maand</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Flexibel, elk moment opzegbaar</p>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-semibold tracking-tight text-foreground">{monthlyPriceLabel}</span>
              <span className="pb-1 text-muted-foreground">/maand</span>
            </div>

            {perWeekLabel && (
              <p className="text-sm text-muted-foreground">
                Ongeveer <span className="font-medium text-foreground">{perWeekLabel} per week</span>
              </p>
            )}
          </div>

          <div className="border-t border-rule px-6 py-5">
            <ul className="space-y-3">
              {[...PREMIUM_TRIGGER_BULLETS, 'Op elk moment opzegbaar'].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto p-6 pt-4">
            {renderAction('monthly', 'Start maandelijks', 'default')}
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              Periodieke afschrijving. Eenvoudig opzegbaar.
            </p>
          </div>
        </div>

        {/* Yearly - the default */}
        {yearlyAvailable && (
        <div className="relative flex flex-col rounded-lg border-2 border-lapis bg-paper-raised lg:-mt-3 lg:mb-[-0.75rem]">
          <div className="flex flex-col gap-4 p-6 pb-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lapis/15">
                <Sparkles className="h-5 w-5 text-ink-soft" />
              </div>
              <Badge className="bg-ink text-ink-inverted hover:bg-ink-soft">
                {savings ? `Bespaar ${savings}%` : 'Beste keuze'}
              </Badge>
            </div>

            <div>
              <h2 className="font-display text-lg font-normal text-ink">Per jaar</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Een keer per jaar, laagste maandprijs</p>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-semibold tracking-tight text-foreground">{yearlyPriceLabel}</span>
              <span className="pb-1 text-muted-foreground">/jaar</span>
            </div>

            {perMonthOfYearly && (
              <p className="text-sm text-muted-foreground">
                Dat is{' '}
                {/* Built as one string so the sentence stays a single text
                    node: React otherwise splits adjacent expressions, which
                    breaks copy-paste and screen-reader phrasing. */}
                <span className="font-medium text-foreground">
                  {`${perMonthOfYearly} per maand${savings ? `, ${savings}% onder de maandprijs` : ''}`}
                </span>
              </p>
            )}
          </div>

          <div className="border-t border-lapis/35 px-6 py-5">
            <ul className="space-y-3">
              {[...PREMIUM_TRIGGER_BULLETS, 'Een keer per jaar betalen, elk moment opzegbaar'].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto p-6 pt-4">
            {renderAction('yearly', 'Start jaarabonnement', 'primary')}
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              Jaarlijkse afschrijving. Eenvoudig opzegbaar.
            </p>
          </div>
        </div>
        )}

        {/* Lifetime */}
        <div className="flex flex-col rounded-lg border border-rule bg-paper-raised">
          <div className="flex flex-col gap-4 p-6 pb-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lapis/10">
                <Infinity className="h-5 w-5 text-ink-soft" />
              </div>
              <Badge className="bg-lapis/10 text-ink hover:bg-ink-soft/10">
                Eenmalig
              </Badge>
            </div>

            <div>
              <h2 className="font-display text-lg font-normal text-ink">Levenslang</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Eenmalig betalen, voor altijd toegang</p>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-semibold tracking-tight text-foreground">{lifetimePriceLabel}</span>
              <span className="pb-1 text-muted-foreground">eenmalig</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Geen terugkerend bedrag. <span className="font-medium text-foreground">Betaal een keer.</span>
            </p>
          </div>

          <div className="border-t border-rule px-6 py-5">
            <ul className="space-y-3">
              {[...PREMIUM_TRIGGER_BULLETS, 'Permanent Premium account - geen verloopdatum'].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto p-6 pt-4">
            {renderAction('lifetime', 'Koop levenslang', 'default')}
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              Eenmalige betaling. Direct geactiveerd.
            </p>
          </div>
        </div>
      </div>

      {/* A leader buying for thirty people is not served by a per-person plan,
          and is the most valuable visitor this page gets. */}
      <div className="mt-6 rounded-lg border border-rule bg-paper-raised p-5 text-center">
        <p className="text-sm text-ink">
          Koop je voor een jeugdgroep, gemeente of klas?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Met een groepslicentie heeft iedereen Premium via een code die je gewoon voorleest.
        </p>
        <Button asChild variant="outline" className="mt-3 h-10 border-rule bg-paper px-4">
          <Link href="/groepslicentie">Bekijk de groepslicentie</Link>
        </Button>
      </div>

      {/* Trust line */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Betaling via{' '}
        <span className="font-medium text-foreground">Stripe</span>
        {' '}- veilig en versleuteld. Geen creditcard opgeslagen bij BijbelQuiz.
      </p>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-center font-display text-[26px] font-normal tracking-[-0.02em] text-ink sm:text-[30px]">Veelgestelde vragen</h2>

        <div className="mx-auto mt-6 max-w-2xl">
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.value} value={item.value} className="rounded-lg border border-rule px-1 shadow-none">
                <AccordionTrigger className="px-4 text-sm font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="px-4 text-sm leading-relaxed text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
