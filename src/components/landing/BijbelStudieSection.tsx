import StudieLink from '@/components/StudieLink';
import type { StudieLinkSurface } from '@/lib/ecosystem-links';

interface BijbelStudieSectionProps {
  surface?: Extract<StudieLinkSurface, 'landing' | 'dashboard'>;
}

/**
 * Where the quiz stops and the Bible starts.
 *
 * This replaces the Premium block that used to stand here. It is the same slot
 * in the page and the same job - "here is the next step" - except the next step
 * is now a different product rather than a different price. It says what
 * BijbelStudie is in one line and links straight into reading, because a
 * visitor who has just answered ten questions about Genesis does not need a
 * feature list.
 */
export function BijbelStudieSection({ surface = 'landing' }: BijbelStudieSectionProps) {
  return (
    <section className="border-t border-rule bg-paper-raised">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Verder dan de quiz
          </p>

          <h2 className="mt-3 font-display text-[28px] font-normal leading-[1.1] tracking-[-0.025em] text-ink sm:text-[36px]">
            De quiz stelt de vraag. BijbelStudie geeft het hoofdstuk erbij.
          </h2>

          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            Op BijbelStudie lees je het bijbelgedeelte zelf, met uitleg, leesplannen
            en aantekeningen. Gratis te lezen, op je telefoon en in je browser.
          </p>

          <div className="mt-7">
            <StudieLink passage={null} surface={surface} variant="primary" label="Ga naar BijbelStudie" />
          </div>
        </div>
      </div>
    </section>
  );
}
