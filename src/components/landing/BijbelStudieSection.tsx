import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { BijbelStudieLogo } from '@/components/BijbelStudieMark';
import StudieLink from '@/components/StudieLink';
import { studiePromo, type StudieLinkSurface } from '@/lib/ecosystem-links';

interface BijbelStudieSectionProps {
  surface?: Extract<StudieLinkSurface, 'landing' | 'dashboard'>;
}

/**
 * Where the quiz stops and the Bible starts.
 *
 * This replaces the Premium block that used to stand here. It is the same slot
 * in the page and the same job - "here is the next step" - except the next step
 * is now a different product rather than a different price. It says what
 * BijbelStudie is in one line and links straight into reading, with the page
 * that explains the tool one step further for whoever wants the feature list.
 */
export function BijbelStudieSection({ surface = 'landing' }: BijbelStudieSectionProps) {
  const promo = studiePromo();

  return (
    /* The sections around this one are `bg-paper` with top padding only, so
       they run together as one column. This is a tinted band and has to read
       as a separate thing: the margin above sets it apart from the section
       before it, and the padding inside has to be generous enough that the
       tint looks deliberate rather than like a box drawn too tight around the
       text. */
    <section className="mt-16 border-y border-rule bg-paper-raised lg:mt-28">
      <div className="mx-auto w-full max-w-[1180px] 2xl:max-w-[1500px] px-5 py-16 sm:px-8 lg:px-10 lg:py-28">
        <div className="max-w-2xl">
          <BijbelStudieLogo />

          <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Van hetzelfde team als BijbelQuiz
          </p>

          <h2 className="mt-5 font-display text-[28px] font-normal leading-[1.12] tracking-[-0.025em] text-ink sm:text-[36px]">
            De quiz stelt de vraag. BijbelStudie geeft het hoofdstuk erbij.
          </h2>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
            Op BijbelStudie lees je het bijbelgedeelte zelf, met uitleg, leesplannen
            en aantekeningen. Gratis te lezen, op je telefoon en in je browser.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 lg:mt-12">
            <StudieLink passage={null} surface={surface} variant="primary" label="Ga naar BijbelStudie" />
            <Link
              href="/bijbelstudie"
              className="group inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Wat is BijbelStudie?
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {promo && (
            <p className="mt-8 border-t border-rule pt-5 text-sm leading-relaxed text-ink-soft">
              BijbelQuiz-spelers krijgen de eerste maand Pro gratis met de code{' '}
              <span className="font-mono font-medium tracking-[0.08em] text-ink">{promo.code}</span>.{' '}
              <Link
                href="/bijbelstudie#pro-code"
                className="font-medium text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-ink"
              >
                Zo werkt het
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
