import Link from 'next/link';
import { Check, Crown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLink, Panel } from '@/components/editorial';
import { PREMIUM_TRIGGER_BULLETS } from '@/lib/premium-benefits';

interface PremiumMemberLayoutProps {
  /** Lifetime members have nothing recurring to manage, so no portal button. */
  isLifetime: boolean;
  /** Human label for the current subscription state, e.g. "Actief". */
  statusLabel: string;
  /** Renewal or end date, already formatted. Null when unknown or lifetime. */
  renewalLabel: string | null;
  /** True when the subscription is cancelled but still running out its term. */
  cancelAtPeriodEnd: boolean;
}

/**
 * What a paying member sees at /premium. No prices, no plan cards, no checkout:
 * the page turns into a receipt plus the door to Stripe's billing portal.
 */
export default function PremiumMemberLayout({
  isLifetime,
  statusLabel,
  renewalLabel,
  cancelAtPeriodEnd,
}: PremiumMemberLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-lapis/10 px-4 py-1.5 text-sm font-semibold text-ink">
          <Crown className="h-4 w-4" />
          BijbelQuiz Premium
        </div>
        <h1 className="font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
          Je Premium is actief
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
          Alles is ontgrendeld. Hieronder beheer je je lidmaatschap.
        </p>
      </header>

      {/* Membership status */}
      <section className="mt-10 rounded-lg border border-lapis/45 bg-paper-raised p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-normal text-ink">
              {isLifetime ? 'Levenslang lidmaatschap' : 'Maandabonnement'}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {isLifetime
                ? 'Eenmalig betaald en permanent aan je account gekoppeld.'
                : cancelAtPeriodEnd
                  ? `Opgezegd. Je houdt toegang tot ${renewalLabel || 'het einde van de huidige periode'}.`
                  : renewalLabel
                    ? `Verlengt automatisch op ${renewalLabel}.`
                    : 'Je abonnement is actief.'}
            </p>
          </div>

          <Badge variant="secondary" className="bg-paper-sunken text-ink-soft">
            {isLifetime ? 'Levenslang' : statusLabel}
          </Badge>
        </div>

        {!isLifetime && (
          <form action="/api/stripe/portal" method="POST" className="mt-5">
            <Button type="submit" className="h-10 rounded-md bg-ink px-5 text-ink-inverted hover:bg-ink-soft">
              Beheer abonnement via Stripe
            </Button>
          </form>
        )}
      </section>

      {/* What's unlocked - a reminder, not a pitch */}
      <section className="mt-6 rounded-lg border border-rule bg-paper-raised p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
          Wat je hebt
        </p>
        <ul className="mt-4 space-y-3">
          {PREMIUM_TRIGGER_BULLETS.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Doors to the unlocked features */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Panel tone="lapis">
          <h3 className="font-display text-lg font-normal leading-snug text-ink">
            Host een groot spel
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Open een kamer voor maximaal 20 spelers, zonder limiet op het aantal spellen.
          </p>
          <div className="mt-5">
            <ArrowLink href="/samen-spelen">Naar samen spelen</ArrowLink>
          </div>
        </Panel>

        <Panel>
          <h3 className="font-display text-lg font-normal leading-snug text-ink">
            Alle quizzen open
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Ook de premium quizzen, inclusief uitleg en bijbelverwijzing bij elke vraag.
          </p>
          <div className="mt-5">
            <ArrowLink href="/quizzen">Bekijk alle quizzen</ArrowLink>
          </div>
        </Panel>
      </div>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Facturen en betaalgegevens vind je ook terug op je{' '}
        <Link href="/profiel" className="font-medium text-ink underline underline-offset-4">
          profielpagina
        </Link>
        .
      </p>
    </div>
  );
}
