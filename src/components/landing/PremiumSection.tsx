import { Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  PREMIUM_TRIGGER_BULLETS,
  MULTIPLAYER_PREMIUM_MAX_PLAYERS,
} from '@/lib/premium-benefits';

const benefits = [
  ...PREMIUM_TRIGGER_BULLETS,
  'Toegang tot nieuwe seizoenspakketten en thema-quizzen',
];

/**
 * The single inverted band on the page. It gives the landing page a spine and
 * marks Premium as the one place the paper turns to ink. Accents stay achromatic
 * here so contrast holds in both themes.
 */
export function PremiumSection() {
  const monthlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || '€5,99';
  const lifetimePriceLabel = process.env.NEXT_PUBLIC_PREMIUM_LIFETIME_PRICE_LABEL || '€74,99';

  return (
    <section id="premium" className="mt-12 bg-ink lg:mt-20">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-12 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-inverted/70">
              <span aria-hidden className="h-px w-6 bg-ink-inverted/50" />
              Premium
            </span>

            <h2 className="mt-5 font-display text-[26px] font-normal leading-[1.12] tracking-[-0.025em] text-ink-inverted sm:text-[34px]">
              Speel onbeperkt samen - en verdiep je kennis bij elke vraag.
            </h2>

            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-inverted/70">
              Met Premium host je multiplayer-rooms tot {MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers,
              krijg je uitleg en bijbelverwijzingen bij elke vraag, en volg je je voortgang per
              boek.
            </p>

            <ul className="mt-7 space-y-3 border-t border-ink-inverted/15 pt-6">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-ink-inverted/85">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-inverted/60" />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-x-8 gap-y-5 border-t border-ink-inverted/15 pt-6 sm:flex-row sm:items-center">
              <Link
                href="/premium"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-ink-inverted px-6 text-sm font-medium text-ink transition-opacity hover:opacity-85 sm:w-auto"
              >
                Bekijk Premium
              </Link>

              <div>
                <p className="font-display text-2xl font-normal tabular-nums text-ink-inverted">
                  {monthlyPriceLabel}
                  <span className="ml-2 font-sans text-xs text-ink-inverted/60">per maand</span>
                </p>
                <p className="mt-1 text-xs text-ink-inverted/60">
                  Of levenslang voor {lifetimePriceLabel} eenmalig.
                </p>
              </div>
            </div>
          </div>

          <figure className="min-w-0">
            <figcaption className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-inverted/50">
              Samen spelen
            </figcaption>
            {/* The screenshot has a light ground, so it is mounted on a paper mat
                rather than floating as a white block on the ink band. */}
            <div className="rounded-lg bg-paper-raised p-2.5">
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-md border border-rule">
                <Image
                  src="/images/multiplayer1.png"
                  alt="Samen spelen in BijbelQuiz"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
