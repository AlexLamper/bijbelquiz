'use client';

import Link from 'next/link';
import { Check, ChevronRight, Crown, Infinity, Zap } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/components/GoogleAnalytics';
import {
  PREMIUM_TRIGGER_BULLETS,
  formatPricePerWeek,
} from '@/lib/premium-benefits';
import { cn } from '@/lib/utils';

interface PremiumOfferLayoutProps {
  isPremium: boolean;
  isLoggedIn: boolean;
  monthlyPriceLabel: string;
  lifetimePriceLabel: string;
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
    question: 'Hoe werkt een eenmalige aankoop?',
    answer:
      'Je betaalt een keer via Stripe en de premium rechten worden direct aan je account gekoppeld.',
  },
  {
    value: 'item-3',
    question: 'Hoe werkt het maandabonnement?',
    answer:
      'Bij het maandabonnement wordt de betaling automatisch verlengd. Je kunt opzeggen wanneer je wilt via je profielpagina.',
  },
  {
    value: 'item-4',
    question: 'Kan ik later wisselen van plan?',
    answer:
      'Ja. Je kunt altijd van maandelijks naar levenslang wisselen door een eenmalige aankoop te doen.',
  },
  {
    value: 'item-5',
    question: 'Welke betaalmethoden zijn beschikbaar?',
    answer:
      'De checkout verloopt via Stripe. Beschikbare methoden hangen af van je land en browser.',
  },
  {
    value: 'item-6',
    question: 'Wanneer wordt Premium geactiveerd?',
    answer:
      'In de meeste gevallen direct na een succesvolle betaling. Daarna kun je meteen alle premium functies gebruiken.',
  },
  {
    value: 'item-7',
    question: 'Worden mijn gegevens veilig verwerkt?',
    answer:
      'Ja. Betalingsgegevens worden door Stripe verwerkt. BijbelQuiz slaat geen volledige kaartgegevens op.',
  },
  {
    value: 'item-8',
    question: 'Waar wordt mijn bijdrage voor gebruikt?',
    answer:
      'Je bijdrage helpt met onderhoud, verbetering van de app, nieuwe quizinhoud en infrastructuurkosten.',
  },
];

type PlanType = 'monthly' | 'lifetime';

export default function PremiumOfferLayout({
  isPremium,
  isLoggedIn,
  monthlyPriceLabel,
  lifetimePriceLabel,
}: PremiumOfferLayoutProps) {
  const perWeekLabel = formatPricePerWeek(monthlyPriceLabel);

  const renderAction = (planType: PlanType, label: string, variant: 'primary' | 'default' = 'default') => {
    const baseClass = cn(
      'h-12 w-full text-base font-semibold',
      variant === 'primary'
        ? 'bg-[#6f8ed4] text-white hover:bg-[#5f81cc] dark:bg-[#6f8ed4] dark:hover:bg-[#5f81cc]'
        : 'dark:bg-[#6f8ed4] dark:text-white dark:hover:bg-[#5f81cc]'
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
          onSubmit={() =>
            trackEvent('premium_checkout_started', {
              placement: 'premium_page',
              plan: planType,
            })
          }
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
        onClick={() =>
          trackEvent('premium_login_required', {
            placement: 'premium_page',
            plan: planType,
          })
        }
      >
        <Link href="/api/auth/signin?callbackUrl=/premium">Inloggen om te kopen</Link>
      </Button>
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <header className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#6f8ed4]/10 px-4 py-1.5 text-sm font-semibold text-[#355384] dark:bg-[#1a2b47] dark:text-[#9db5dc]">
          <Crown className="h-4 w-4" />
          BijbelQuiz Premium
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Kies jouw Premium plan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Eén prijs. Alles erin. Kies of je maandelijks wilt bijdragen of liever eenmalig betaalt voor blijvende toegang.
        </p>
      </header>

      {/* Pricing cards */}
      <div className="mt-10 grid gap-5 lg:grid-cols-2">

        {/* Monthly plan - highlighted as best value */}
        <div className={cn(
          'flex flex-col rounded-2xl border-2 border-[#6f8ed4] bg-gradient-to-b from-[#f0f5ff] to-white shadow-md dark:border-[#6f8ed4]/60 dark:from-[#1a2b47]/50 dark:to-zinc-900/70',
        )}>
          <div className="flex flex-col gap-4 p-6 pb-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f8ed4]/15 dark:bg-[#1a2b47]">
                <Zap className="h-5 w-5 text-[#5f81cc] dark:text-[#9db5dc]" />
              </div>
              <Badge className="bg-[#6f8ed4] text-white hover:bg-[#6f8ed4] dark:bg-[#6f8ed4]">
                Beste keuze
              </Badge>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Per maand</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Flexibel, op elk moment opzegbaar</p>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-foreground">{monthlyPriceLabel}</span>
              <span className="pb-1 text-muted-foreground">/maand</span>
            </div>

            {perWeekLabel && (
              <p className="text-sm text-muted-foreground">
                Ongeveer <span className="font-medium text-foreground">{perWeekLabel} per week</span>
              </p>
            )}
          </div>

          <div className="border-t border-[#6f8ed4]/30 px-6 py-5 dark:border-[#6f8ed4]/20">
            <ul className="space-y-3">
              {[...PREMIUM_TRIGGER_BULLETS, 'Op elk moment opzegbaar'].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6f8ed4] dark:text-[#9db5dc]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto p-6 pt-4">
            {renderAction('monthly', 'Start abonnement', 'primary')}
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              Periodieke afschrijving. Eenvoudig opzegbaar.
            </p>
          </div>
        </div>

        {/* Lifetime plan */}
        <div className={cn(
          'flex flex-col rounded-2xl border border-[#d8e1ee] bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70',
        )}>
          <div className="flex flex-col gap-4 p-6 pb-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f8ed4]/10 dark:bg-[#1a2b47]">
                <Infinity className="h-5 w-5 text-[#5f81cc] dark:text-[#9db5dc]" />
              </div>
              <Badge className="bg-[#6f8ed4]/10 text-[#355384] dark:bg-[#1a2b47] dark:text-[#9db5dc] hover:bg-[#6f8ed4]/10">
                Eenmalig
              </Badge>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Levenslang</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Eenmalig betalen, voor altijd toegang</p>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-foreground">{lifetimePriceLabel}</span>
              <span className="pb-1 text-muted-foreground">eenmalig</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Geen terugkerend bedrag. <span className="font-medium text-foreground">Betaal één keer.</span>
            </p>
          </div>

          <div className="border-t border-[#d8e1ee] px-6 py-5 dark:border-zinc-700">
            <ul className="space-y-3">
              {[...PREMIUM_TRIGGER_BULLETS, 'Permanent Premium account - geen verloopdatum'].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6f8ed4] dark:text-[#9db5dc]" />
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

      {/* Trust line */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Betaling via{' '}
        <span className="font-medium text-foreground">Stripe</span>
        {' '}- veilig en versleuteld. Geen creditcard opgeslagen bij BijbelQuiz.
      </p>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">Veelgestelde vragen</h2>

        <div className="mx-auto mt-6 max-w-2xl">
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.value} value={item.value} className="rounded-xl border border-[#d8e1ee] px-1 shadow-none dark:border-zinc-700">
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
