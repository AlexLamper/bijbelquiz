'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Minus, X } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Eyebrow, SectionHead } from '@/components/editorial';
import { trackEvent } from '@/components/GoogleAnalytics';
import { track } from '@/lib/analytics/client';
import type { PaywallTrigger } from '@/lib/analytics/events';
import { GROUP_LICENSE_SEATS } from '@/lib/group-license-constants';
import {
  MULTIPLAYER_FREE_MAX_PLAYERS,
  MULTIPLAYER_FREE_ROOM_QUOTA,
  MULTIPLAYER_PREMIUM_MAX_PLAYERS,
  formatTrialLabel,
  lifetimePricePerWeek,
  LIFETIME_HORIZON_YEARS,
  monthlyEquivalentOfYearly,
  formatPricePerWeek,
  yearlyPricePerWeek,
  yearlySavingsPercent,
} from '@/lib/premium-benefits';
import { cn } from '@/lib/utils';

type PlanId = 'yearly' | 'monthly' | 'lifetime';

interface PremiumOfferLayoutProps {
  isPremium: boolean;
  isLoggedIn: boolean;
  monthlyPriceLabel: string;
  yearlyPriceLabel: string;
  /** False until a Stripe yearly price exists; the row is hidden until then. */
  yearlyAvailable: boolean;
  lifetimePriceLabel: string;
  groupPriceLabel: string;
  /** Free trial length in days; 0 means no trial is configured. */
  trialDays: number;
  /** Which surface sent the user here. Recorded on the funnel event. */
  trigger: PaywallTrigger;
  /** Where to return after checkout, so a host lands back in their lobby. */
  returnPath: string;
  /** True when the reader just came back from an abandoned Stripe checkout. */
  checkoutCancelled: boolean;
}

/** Headline that names what the reader was just stopped from doing. */
const TRIGGER_HEADLINES: Record<PaywallTrigger, string> = {
  host_quota_exhausted: 'Speel onbeperkt samen verder',
  host_quota_warning: 'Speel onbeperkt samen verder',
  host_player_cap: 'Speel met je hele groep',
  explanation_locked: 'Lees bij elke vraag waarom',
  premium_quiz_locked: 'Ontgrendel alle quizzen',
  review_locked: 'Zie precies welke vragen je fout had',
  direct: 'Speel onbeperkt samen - en verdiep je kennis bij elke vraag',
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
    'Deze quiz hoort bij de premium collectie. Met Premium speel je alle quizzen, nu en in de toekomst.',
  review_locked:
    'Je score staat vast, maar welke vragen je miste en waarom is Premium. Met Premium krijg je na elke quiz per vraag het goede antwoord, de uitleg en de bijbelverwijzing.',
  direct:
    'Met Premium host je multiplayer-rooms tot 20 spelers, krijg je uitleg en bijbelverwijzingen bij elke vraag, en volg je je voortgang per boek.',
};

/** The inverted panel's promise list. Multiplayer first: strongest paying intent. */
const HERO_BENEFITS = [
  `Onbeperkt rooms hosten en tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers samen spelen`,
  'Uitleg en bijbelverwijzing bij elke vraag, ook na de game',
  'Voortgangsinzichten per boek, streakbescherming en alle premium quizzen',
  'Toegang tot nieuwe seizoenspakketten en thema-quizzen',
];

/** Free versus Premium, in the terms the product actually enforces. */
const COMPARISON: { feature: string; free: string | false; premium: string }[] = [
  {
    feature: 'Quizzen spelen',
    free: 'Alle gratis quizzen',
    premium: 'Alle quizzen, ook de premium collectie',
  },
  {
    feature: 'Zelf een spel hosten',
    free: `${MULTIPLAYER_FREE_ROOM_QUOTA} spellen, daarna 1 per maand`,
    premium: 'Onbeperkt',
  },
  {
    feature: 'Spelers per kamer',
    free: `${MULTIPLAYER_FREE_MAX_PLAYERS} spelers`,
    premium: `${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers`,
  },
  {
    feature: 'Meedoen met andermans spel',
    free: 'Onbeperkt',
    premium: 'Onbeperkt',
  },
  {
    feature: 'Uitleg en bijbelverwijzing',
    free: false,
    premium: 'Bij elke vraag, ook na afloop',
  },
  {
    feature: 'Voortgang per bijbelboek',
    free: false,
    premium: 'Volledig inzicht',
  },
  {
    feature: 'Seizoenspakketten',
    free: false,
    premium: 'Advent, veertigdagentijd en meer',
  },
];

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
      'Inhoudelijk niets: je krijgt exact dezelfde functies. Bij het jaarplan betaal je een keer per jaar en is de prijs per week lager. Beide zijn op elk moment opzegbaar.',
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
      'Via je profielpagina of deze pagina open je het abonnementsportaal van Stripe. Daar zeg je met een klik op. Je houdt toegang tot het einde van de periode die je al betaald hebt.',
  },
  {
    value: 'item-5',
    question: 'Kan ik later wisselen van plan?',
    answer:
      'Ja. Je kunt van maandelijks naar jaarlijks wisselen, en vanuit beide een eenmalige levenslange aankoop doen.',
  },
  {
    value: 'item-6',
    question: 'Ik heb Premium in de app gekocht. Werkt dat hier ook?',
    answer:
      'Ja. Web en app gebruiken hetzelfde account, dus een aankoop in de App Store of Play Store ontgrendelt Premium ook op de website. Log in met hetzelfde account.',
  },
  {
    value: 'item-7',
    question: 'Welke betaalmethoden zijn beschikbaar?',
    answer:
      'De checkout verloopt via Stripe, met onder andere iDEAL, creditcard en Apple Pay. Beschikbare methoden hangen af van je land en browser.',
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

export default function PremiumOfferLayout({
  isPremium,
  isLoggedIn,
  monthlyPriceLabel,
  yearlyPriceLabel,
  yearlyAvailable,
  lifetimePriceLabel,
  groupPriceLabel,
  trialDays,
  trigger,
  returnPath,
  checkoutCancelled,
}: PremiumOfferLayoutProps) {
  // Year leads: it is the rung that catches the reader who is convinced but not
  // ready to commit for life. Monthly leads only when there is no year price.
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(yearlyAvailable ? 'yearly' : 'monthly');

  const monthlyPerWeek = formatPricePerWeek(monthlyPriceLabel);
  const yearlyPerWeek = yearlyPricePerWeek(yearlyPriceLabel);
  const lifetimePerWeek = lifetimePricePerWeek(lifetimePriceLabel);
  const yearlyPerMonth = monthlyEquivalentOfYearly(yearlyPriceLabel);
  const savings = yearlySavingsPercent(monthlyPriceLabel, yearlyPriceLabel);

  // The masthead quotes the cheapest honest number on the page, and says which
  // plan produces it in the same breath.
  const leadPriceLine =
    yearlyAvailable && yearlyPerWeek
      ? { amount: yearlyPerWeek, suffix: `per week met het jaarplan - ${yearlyPriceLabel} per jaar` }
      : monthlyPerWeek
        ? { amount: monthlyPerWeek, suffix: `per week - ${monthlyPriceLabel} per maand` }
        : null;

  const isSubscription = selectedPlan !== 'lifetime';
  const hasTrial = trialDays > 0 && isSubscription;
  const trialLabel = formatTrialLabel(trialDays);

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

  /**
   * The per-week figure leads on every row and the billed amount follows it.
   *
   * Three plans that bill on three different rhythms cannot be compared at a
   * glance any other way, and the week is the unit a reader already prices
   * things in. The real charge is never hidden - it sits directly underneath, in
   * the period it is actually taken.
   */
  const planRows: {
    id: PlanId;
    title: string;
    subtitle: string;
    price: string;
    billing: string;
    perWeek: string | null;
    perWeekNote: string;
    badge?: { label: string; tone: 'loud' | 'quiet' };
    available: boolean;
  }[] = [
    {
      id: 'yearly',
      title: 'Jaarlijks',
      subtitle: yearlyPerMonth
        ? `${yearlyPriceLabel} per jaar - dat is ${yearlyPerMonth} per maand`
        : `${yearlyPriceLabel} per jaar`,
      price: yearlyPriceLabel,
      billing: 'per jaar',
      perWeek: yearlyPerWeek,
      perWeekNote: 'per week',
      badge: savings
        ? { label: `Bespaar ${savings}%`, tone: 'loud' }
        : { label: 'Meest gekozen', tone: 'loud' },
      available: yearlyAvailable,
    },
    {
      id: 'monthly',
      title: 'Maandelijks',
      subtitle: `${monthlyPriceLabel} per maand - elk moment opzegbaar`,
      price: monthlyPriceLabel,
      billing: 'per maand',
      perWeek: monthlyPerWeek,
      perWeekNote: 'per week',
      available: true,
    },
    {
      id: 'lifetime',
      title: 'Levenslang',
      subtitle: `${lifetimePriceLabel} eenmalig - daarna nooit meer iets`,
      price: lifetimePriceLabel,
      billing: 'eenmalig',
      perWeek: lifetimePerWeek,
      perWeekNote: `per week over ${LIFETIME_HORIZON_YEARS} jaar`,
      badge: { label: 'Geen abonnement', tone: 'quiet' },
      available: true,
    },
  ];

  const selectedRow = planRows.find((row) => row.id === selectedPlan) ?? planRows[1];

  const ctaLabel = hasTrial
    ? `Start ${trialLabel}`
    : selectedPlan === 'lifetime'
      ? 'Koop levenslang'
      : `Ga verder met ${selectedRow.title}`;

  const billingNote = isSubscription
    ? 'Abonnementen verlengen automatisch en zijn op elk moment opzegbaar via het Stripe-portaal. Je houdt toegang tot het einde van de periode die je al betaald hebt.'
    : 'Levenslang is een eenmalige betaling. Er wordt daarna nooit meer iets afgeschreven.';

  const trialNote = hasTrial
    ? `De eerste ${trialLabel.replace(' gratis', '')} zijn gratis. Daarna ${selectedRow.price} ${selectedRow.billing}, tenzij je voor het einde van de proefperiode opzegt.`
    : null;

  return (
    <div className="pb-4">
      {/* ── Masthead: the promise, before any price ───────────────────────
          Paper rather than an inverted panel. The weight comes from the display
          serif and the hairlines, which is how every other page in the product
          opens - a black block here read as an advert bolted onto the site. */}
      <section className="border-b border-rule pb-9">
        <Eyebrow>Premium</Eyebrow>

        <div className="mt-6 grid gap-x-14 gap-y-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <h1 className="font-display text-[30px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[42px]">
              {TRIGGER_HEADLINES[trigger]}
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
              {TRIGGER_LEADS[trigger]}
            </p>

            {leadPriceLine && (
              <p className="mt-6 inline-flex flex-wrap items-baseline gap-x-2 border-t border-rule pt-5 text-sm text-ink-soft">
                <span className="font-display text-2xl font-normal tabular-nums text-ink">
                  {leadPriceLine.amount}
                </span>
                <span>{leadPriceLine.suffix}</span>
              </p>
            )}
          </div>

          {/* The promise as a numbered register: the same four lines the app
              paywall makes, set as an index rather than a bullet list. */}
          <ol className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-paper-raised">
            {HERO_BENEFITS.map((benefit, index) => (
              <li key={benefit} className="flex items-start gap-4 px-5 py-4">
                <span className="mt-0.5 font-display text-sm tabular-nums text-lapis">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm leading-relaxed text-ink">{benefit}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {checkoutCancelled && (
        <p className="mt-8 rounded-lg border border-rule bg-paper-sunken px-5 py-4 text-sm text-ink-soft">
          De betaling is afgebroken - er is niets afgeschreven. Je plan staat hieronder nog klaar.
        </p>
      )}

      {/* ── The plan ladder ──────────────────────────────────────────────── */}
      <section className="mt-12 lg:mt-16">
        <SectionHead
          eyebrow="Kies je plan"
          title="Een prijs. Alles erin."
          lead="Alle plannen geven volledige toegang tot elke premium functie. Het enige verschil is hoe vaak je betaalt."
        />

        {/* The saving is the single most persuasive number here, so it is stated
            once at full volume rather than only as a chip on one row. */}
        {savings !== null && yearlyAvailable && (
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-lapis/30 bg-lapis-tint px-5 py-3.5 text-sm text-ink">
            <span className="rounded-sm bg-lapis px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-inverted">
              Bespaar {savings}%
            </span>
            <span>
              Het jaarplan kost {yearlyPriceLabel} in plaats van {monthlyPriceLabel} per maand
              {yearlyPerWeek ? ` - ${yearlyPerWeek} per week` : ''}.
            </span>
          </p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <div className="divide-y divide-rule overflow-hidden rounded-lg border border-rule">
              {planRows
                .filter((row) => row.available)
                .map((row) => {
                  const selected = row.id === selectedPlan;

                  return (
                    <button
                      key={row.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedPlan(row.id)}
                      className={cn(
                        'relative flex w-full items-center gap-4 px-5 py-5 text-left transition-colors sm:gap-5 sm:px-6',
                        selected
                          ? 'bg-paper-sunken ring-2 ring-inset ring-lapis'
                          : 'bg-paper-raised hover:bg-paper-sunken/60'
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          selected ? 'border-lapis bg-lapis' : 'border-rule-strong bg-paper-raised'
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5 text-ink-inverted" strokeWidth={3} />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className="font-display text-lg font-normal text-ink">{row.title}</span>
                          {row.badge && (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]',
                                row.badge.tone === 'loud'
                                  ? 'bg-lapis text-ink-inverted'
                                  : 'border border-rule-strong bg-paper text-ink-soft'
                              )}
                            >
                              {row.badge.label}
                            </span>
                          )}
                        </span>

                        <span className="mt-1.5 block text-sm text-ink-muted">{row.subtitle}</span>
                      </span>

                      {/* Per week leads; the amount actually charged sits under it. */}
                      <span className="shrink-0 text-right">
                        {row.perWeek ? (
                          <>
                            <span className="block font-display text-[26px] font-normal leading-none tabular-nums text-ink sm:text-[30px]">
                              {row.perWeek}
                            </span>
                            <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-lapis">
                              {row.perWeekNote}
                            </span>
                            <span className="mt-1 block text-[11px] tabular-nums text-ink-muted">
                              {row.price} {row.billing}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block font-display text-2xl font-normal tabular-nums text-ink">
                              {row.price}
                            </span>
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                              {row.billing}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
            </div>

            {/* ── Single action for the selected plan ─────────────────────── */}
            <div className="mt-6">
              {isPremium ? (
                <Link
                  href="/quizzen"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
                >
                  Je hebt Premium - start een quiz
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : isLoggedIn ? (
                <form
                  action="/api/stripe/checkout"
                  method="POST"
                  onSubmit={() => {
                    startedCheckout.current = true;
                    trackEvent('premium_checkout_started', {
                      placement: 'premium_page',
                      plan: selectedPlan,
                    });
                  }}
                >
                  <input type="hidden" name="plan" value={selectedPlan} />
                  <input type="hidden" name="next" value={returnPath} />
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
                  >
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <Link
                  href={`/inloggen?callbackUrl=${encodeURIComponent('/premium')}`}
                  onClick={() => {
                    startedCheckout.current = true;
                    trackEvent('premium_login_required', {
                      placement: 'premium_page',
                      plan: selectedPlan,
                    });
                  }}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
                >
                  Inloggen om verder te gaan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}

              <p className="mt-3 text-center text-xs leading-relaxed text-ink-muted">
                {hasTrial
                  ? trialNote
                  : isSubscription
                    ? `${selectedRow.price} ${selectedRow.billing}, op elk moment opzegbaar.`
                    : `${selectedRow.price} eenmalig, direct geactiveerd.`}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/groepslicentie"
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-rule-strong bg-paper-raised px-4 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-paper-sunken"
                >
                  Ik koop voor een groep
                </Link>
                <Link
                  href="/profiel"
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-rule bg-paper px-4 text-sm text-ink-soft transition-colors hover:border-rule-strong hover:text-ink"
                >
                  Al betaald? Beheer hier
                </Link>
              </div>
            </div>
          </div>

          {/* ── What you are about to buy ──────────────────────────────────
              A summary, not a second copy of the promise list above it: the
              reader has already read what Premium does, and what they need
              here is the number, when it is taken, and how to stop it. */}
          <aside className="rounded-lg border border-lapis/45 bg-paper-raised p-6">
            <Eyebrow>Jouw keuze</Eyebrow>
            <p className="mt-3 font-display text-lg font-normal leading-snug text-ink">
              Premium {selectedRow.title.toLowerCase()}
            </p>

            <dl className="mt-5 space-y-3.5 border-t border-rule pt-5 text-sm">
              {selectedRow.perWeek && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">Per week</dt>
                  <dd className="font-display text-lg tabular-nums text-ink">{selectedRow.perWeek}</dd>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">
                  {hasTrial ? 'Na de proefperiode' : 'Je betaalt'}
                </dt>
                <dd className="tabular-nums text-ink">
                  {selectedRow.price} {selectedRow.billing}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">Vandaag</dt>
                <dd className="text-ink">
                  {hasTrial ? `${trialLabel}` : `${selectedRow.price}`}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">Verlenging</dt>
                <dd className="text-right text-ink">
                  {isSubscription ? `Automatisch, ${selectedRow.billing}` : 'Geen'}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">Opzeggen</dt>
                <dd className="text-right text-ink">
                  {isSubscription ? 'Wanneer je wilt' : 'Niet nodig'}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-rule pt-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Betalen met
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {['iDEAL', 'Creditcard', 'Apple Pay', 'Google Pay'].map((method) => (
                  <span
                    key={method}
                    className="rounded-sm border border-rule bg-paper px-2 py-1 text-[11px] font-medium text-ink-soft"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-5 border-t border-rule pt-4 text-xs leading-relaxed text-ink-muted">
              {billingNote}
            </p>
          </aside>
        </div>
      </section>

      {/* ── Free versus Premium ──────────────────────────────────────────── */}
      <section className="mt-14 lg:mt-20">
        <SectionHead
          eyebrow="Vergelijk"
          title="Gratis en Premium naast elkaar"
          lead="Gratis blijft gratis: meedoen met een spel van iemand anders kost nooit iets."
        />

        {/* Phone layout: the table's Premium column would sit off-screen behind
            a horizontal scroll, which hides the only column that sells. */}
        <div className="mt-7 space-y-3 sm:hidden">
          {COMPARISON.map((row) => (
            <div key={row.feature} className="overflow-hidden rounded-lg border border-rule">
              <p className="border-b border-rule bg-paper-sunken px-4 py-2.5 text-sm font-medium text-ink">
                {row.feature}
              </p>

              <div className="flex items-start gap-2 px-4 py-3">
                <span className="w-16 shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Gratis
                </span>
                {row.free === false ? (
                  <span className="flex items-center gap-2 text-sm text-ink-muted">
                    <span
                      aria-hidden
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-vermilion/15"
                    >
                      <X className="h-3 w-3 text-vermilion" strokeWidth={3} />
                    </span>
                    Niet inbegrepen
                  </span>
                ) : (
                  <span className="text-sm text-ink-muted">{row.free}</span>
                )}
              </div>

              <div className="flex items-start gap-2 border-t border-rule bg-lapis-tint/40 px-4 py-3">
                <span className="w-16 shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-lapis">
                  Premium
                </span>
                <span className="flex items-start gap-2 text-sm font-medium text-ink">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive"
                  >
                    <Check className="h-3 w-3 text-ink-inverted" strokeWidth={3} />
                  </span>
                  {row.premium}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule-strong text-left">
                <th className="py-3 pr-4 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                  Functie
                </th>
                <th className="w-[30%] py-3 pr-4 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                  Gratis
                </th>
                <th className="w-[34%] py-3 pl-3">
                  <span className="inline-flex items-center rounded-sm bg-lapis px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-inverted">
                    Premium
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-rule align-top">
                  <td className="py-3.5 pr-4 font-medium text-ink">{row.feature}</td>

                  {/* Included or not has to be readable without reading: a
                      filled mark in its own pigment, not a hairline glyph. */}
                  <td className="py-3.5 pr-4 text-ink-muted">
                    {row.free === false ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-vermilion/15"
                        >
                          <X className="h-3 w-3 text-vermilion" strokeWidth={3} />
                        </span>
                        <span className="text-ink-muted">Niet inbegrepen</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-start gap-2">
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rule"
                        >
                          <Minus className="h-3 w-3 text-ink-soft" strokeWidth={3} />
                        </span>
                        <span>{row.free}</span>
                      </span>
                    )}
                  </td>

                  <td className="bg-lapis-tint/40 py-3.5 pl-3 text-ink">
                    <span className="inline-flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive"
                      >
                        <Check className="h-3 w-3 text-ink-inverted" strokeWidth={3} />
                      </span>
                      <span className="font-medium">{row.premium}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Group licence: the highest-value visitor on this page ─────────── */}
      <section className="mt-12 rounded-lg border border-rule bg-paper-sunken p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <Eyebrow pigment="vermilion">Voor groepen</Eyebrow>
            <h2 className="mt-3 font-display text-xl font-normal tracking-[-0.015em] text-ink sm:text-2xl">
              Een licentie voor je jeugdgroep, gemeente of klas
            </h2>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-muted">
              {GROUP_LICENSE_SEATS} plekken Premium voor {groupPriceLabel} per jaar, via een code die je
              gewoon voorleest. Iedereen die de code invult heeft direct alles open - geen losse
              accounts, geen losse betalingen.
            </p>
          </div>

          <Link
            href="/groepslicentie"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
          >
            Bekijk de groepslicentie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────────── */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { title: 'Betaling via Stripe', body: 'iDEAL, creditcard en Apple Pay. Geen kaartgegevens bij BijbelQuiz.' },
          { title: 'Werkt op web en app', body: 'Een account, dezelfde Premium op iOS, Android en de website.' },
          { title: 'Altijd opzegbaar', body: 'Een klik in het Stripe-portaal. Je houdt de betaalde periode.' },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-rule bg-paper-raised p-4">
            <p className="text-sm font-medium text-ink">{item.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{item.body}</p>
          </div>
        ))}
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="mt-14 lg:mt-20">
        <SectionHead eyebrow="Vragen" title="Veelgestelde vragen" />

        <div className="mt-6 max-w-2xl">
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                className="rounded-lg border border-rule px-1 shadow-none"
              >
                <AccordionTrigger className="px-4 text-sm font-medium text-ink">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 text-sm leading-relaxed text-ink-muted">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Terms ────────────────────────────────────────────────────────── */}
      <section className="mt-12 border-t border-rule pt-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Voorwaarden</p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-ink-muted">
          {billingNote}
          {trialNote ? ` ${trialNote}` : ''} Prijzen zijn in euro en inclusief btw. Door verder te gaan
          ga je akkoord met de{' '}
          <Link href="/voorwaarden" className="text-ink underline underline-offset-2">
            gebruiksvoorwaarden
          </Link>{' '}
          en het{' '}
          <Link href="/privacybeleid" className="text-ink underline underline-offset-2">
            privacybeleid
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
