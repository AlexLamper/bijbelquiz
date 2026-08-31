import Link from 'next/link';

import { InkButton } from '@/components/editorial';
import { DownloadButtons } from '@/components/landing/DownloadButtons';

export function CTASection() {
  return (
    <section className="bg-paper">
      <div className="mx-auto w-full max-w-[760px] px-5 py-14 text-center sm:px-8 lg:py-24">
        <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          <span aria-hidden className="h-px w-6 bg-lapis" />
          Beginnen
        </span>

        <h2 className="mt-5 font-display text-[26px] font-normal leading-[1.12] tracking-[-0.025em] text-ink sm:text-[34px]">
          Klaar om je Bijbelkennis te testen?
        </h2>

        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">
          Download de app of speel direct online. Begin vandaag nog met het ontdekken van de
          Bijbel op een leuke en interactieve manier.
        </p>

        <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          {/* Same height and padding as the App Store button beside it: two
              primary actions of different sizes read as a mistake. */}
          <InkButton
            href="/quizzen"
            className="h-13 w-full px-5 text-[15px] font-medium sm:w-auto"
          >
            Speel direct online
          </InkButton>
          <DownloadButtons compactOnMobile />
        </div>

        {/* The sentence is prose; only the destination is a link, and it is
            underlined so it reads as one. A whole line styled as a link but
            drawn like body text is a link nobody clicks. */}
        <div className="mt-10 flex flex-col items-center justify-center gap-x-6 gap-y-2 border-t border-rule pt-6 text-xs text-ink-muted sm:flex-row">
          <p>
            Verdiep je verder via{' '}
            <Link
              href="https://www.bijbelstudie.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-ink"
            >
              Bijbel Studie
            </Link>
          </p>

          <span aria-hidden className="hidden h-3 w-px bg-rule sm:block" />

          <p>
            Ontwikkeld met de Nederlandse{' '}
            <Link
              href="https://www.bijbelapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-ink"
            >
              BijbelAPI
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
