'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type BillingMode = 'one-time' | 'automatic';
type PlanType = 'monthly' | 'lifetime';

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
      'Met Premium speel je zonder advertenties en krijg je toegang tot alle quizzen, statistieken en uitleg per vraag.',
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
      'Bij het maandabonnement wordt de betaling automatisch verlengd. Je kunt opzeggen wanneer je wilt.',
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

export default function PremiumOfferLayout({
  isPremium,
  isLoggedIn,
  monthlyPriceLabel,
  lifetimePriceLabel,
}: PremiumOfferLayoutProps) {
  const [billingMode, setBillingMode] = useState<BillingMode>('automatic');

  const activePlan: PlanType = billingMode === 'one-time' ? 'lifetime' : 'monthly';

  const modeSummary =
    billingMode === 'one-time'
      ? 'Eenmalig bijdragen • Betaal een keer • Geen automatische verlenging'
      : 'Automatisch bijdragen • Periodieke afschrijving • Eenvoudig opzegbaar';

  const planContent: Record<
    PlanType,
    {
      title: string;
      price: string;
      cadence: string;
      description: string;
      features: string[];
      ctaLabel: string;
      footnote: string;
    }
  > = {
    monthly: {
      title: 'Per maand',
      price: monthlyPriceLabel,
      cadence: '/maand',
      description: 'Voor wie flexibel wil blijven en maandelijks wil ondersteunen.',
      features: ['Alle quizzen beschikbaar', 'Geen advertenties', 'Op elk moment opzegbaar'],
      ctaLabel: 'Maandelijks bijdragen',
      footnote: 'Periodieke afschrijving. Eenvoudig opzegbaar.',
    },
    lifetime: {
      title: 'Levenslang',
      price: lifetimePriceLabel,
      cadence: '/eenmalig',
      description: 'Een eenmalige bijdrage voor blijvende premium toegang.',
      features: ['Alle quizzen beschikbaar', 'Geen advertenties', 'Permanent premium account'],
      ctaLabel: 'Eenmalig bijdragen',
      footnote: 'Eenmalige betaling. Direct geactiveerd.',
    },
  };

  const renderAction = (planType: PlanType, label: string) => {
    if (isPremium) {
      return (
        <Button asChild size="lg" className="h-11 w-full">
          <Link href="/quizzes">Je hebt Premium</Link>
        </Button>
      );
    }

    if (isLoggedIn) {
      return (
        <form action="/api/stripe/checkout" method="POST" className="w-full">
          <input type="hidden" name="plan" value={planType} />
          <Button type="submit" size="lg" className="h-11 w-full gap-2 font-semibold">
            {label}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </form>
      );
    }

    return (
      <Button asChild size="lg" className="h-11 w-full">
        <Link href="/api/auth/signin?callbackUrl=/premium">Log in om te kopen</Link>
      </Button>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">BijbelQuiz Premium</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          Ontgrendel alle quizzen, uitleg en statistieken met Premium
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Kies of je eenmalig of automatisch wilt bijdragen. Jij bepaalt wat het beste past bij jouw gebruik.
        </p>
      </header>

      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-full border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setBillingMode('automatic')}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-medium transition-colors',
              billingMode === 'automatic' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Automatisch
          </button>
          <button
            type="button"
            onClick={() => setBillingMode('one-time')}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-medium transition-colors',
              billingMode === 'one-time' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Eenmalig
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">{modeSummary}</p>

      <div className="mx-auto mt-8 max-w-2xl">
        <Card className="relative flex h-full flex-col border-primary/40 shadow-md">
          {activePlan === 'monthly' && (
            <span className="absolute right-5 top-5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Meest gekozen
            </span>
          )}

          <CardHeader className="space-y-4 pb-3">
            <p className="text-2xl font-semibold text-foreground">{planContent[activePlan].title}</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight text-foreground">{planContent[activePlan].price}</span>
              <span className="pb-1 text-muted-foreground">{planContent[activePlan].cadence}</span>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">{planContent[activePlan].description}</p>
          </CardHeader>

          <CardContent className="pt-2">
            <ul className="space-y-3">
              {planContent[activePlan].features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-base text-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="mt-auto flex-col items-stretch gap-3 border-t pt-6">
            {renderAction(activePlan, planContent[activePlan].ctaLabel)}
            <p className="text-center text-sm text-muted-foreground">{planContent[activePlan].footnote}</p>
          </CardFooter>
        </Card>
      </div>

      <section className="mt-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">Veelgestelde vragen</h2>

        <div className="mx-auto mt-6 max-w-280">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.value} value={item.value} className="rounded-xl border-border/70 shadow-none">
                <AccordionTrigger className="text-base font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}