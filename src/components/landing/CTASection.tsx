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
          <InkButton href="/quizzen" className="w-full sm:w-auto">
            Speel direct online
          </InkButton>
          <DownloadButtons compactOnMobile />
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-x-6 gap-y-2 border-t border-rule pt-6 text-xs text-ink-muted sm:flex-row">
          <Link
            href="https://www.bijbel-studie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            Verdiep je verder via Bijbel Studie
          </Link>
          <span aria-hidden className="hidden h-3 w-px bg-rule sm:block" />
          <Link
            href="https://www.bijbelapi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            Ontwikkeld met de Nederlandse BijbelAPI
          </Link>
        </div>
      </div>
    </section>
  );
}
