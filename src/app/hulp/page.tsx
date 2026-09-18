import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, LifeBuoy } from 'lucide-react'

import StudieLink from '@/components/StudieLink'
import { SimpleAccordion } from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'Hulp & Support | BijbelQuiz Helpdesk',
  description: 'Vind antwoorden voor BijbelQuiz problemen, betalingen en spelregels.',
  alternates: { canonical: '/help' }
}

export default function HelpPage() {
  const faqItems = [
    {
      title: 'Is BijbelQuiz gratis?',
      content: 'Ja. Alle quizzen, de uitleg bij de vragen en samen spelen zijn gratis. Voor jeugdgroepen, gemeentes en scholen is er een groepslicentie.',
    },
    {
      title: 'Kan ik mijn abonnement opzeggen?',
      content: 'Heb je nog een Premium-abonnement van vroeger, dan beheer en beëindig je het via Lidmaatschap in je account.',
    },
    {
      title: 'Waar kan ik een probleem melden?',
      content: 'Je kunt technische problemen direct melden op de bug report pagina.',
    },
    {
      title: 'Waar vind ik extra uitleg over een Bijbelonderwerp?',
      content: 'Op BijbelStudie, gemaakt door hetzelfde team als BijbelQuiz. Daar lees je elk hoofdstuk met commentaar en begeleide studies. Bij elke vraag in een quiz staat een link naar het hoofdstuk waar hij over gaat.',
    },
  ]
  const faqJsonLd = {
    '@context':'https://schema.org',
    '@type':'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type':'Question',
      name: item.title,
      acceptedAnswer: {
        '@type':'Answer',
        text: item.content,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-paper pb-12 pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="mx-auto max-w-[1180px] 2xl:max-w-[1500px] px-4 pt-10 sm:px-5 lg:px-4">
        <div className="rounded-lg border border-rule bg-paper-raised p-6">
          <div className="inline-flex items-center gap-2 rounded-md bg-paper-sunken px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink dark:text-ink-inverted">
            <LifeBuoy className="h-3.5 w-3.5" />
            Support
          </div>
          <h1 className="mt-4 text-4xl text-ink">Helpcentrum</h1>
          <p className="mt-3 max-w-2xl text-sm text-ink-soft">
            Snel antwoord op veelgestelde vragen over BijbelQuiz, groepslicenties en BijbelStudie.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-inverted hover:bg-ink-soft">
              Contact opnemen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/foutmelding" className="inline-flex items-center gap-2 rounded-md border border-rule bg-paper-raised px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-sunken">
              Bug report
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] 2xl:max-w-[1500px] px-4 pt-8 sm:px-5 lg:px-4">
        <div className="max-w-3xl">
          <SimpleAccordion items={faqItems} />
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] 2xl:max-w-[1500px] px-4 pt-8 sm:px-5 lg:px-4">
        <div className="grid gap-3 md:max-w-3xl md:grid-cols-2">
          <div className="rounded-lg border border-rule bg-paper-raised p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Meer leren</p>
            <p className="mt-2 text-sm text-muted-foreground">Verdiep je verder per thema via BijbelStudie, van hetzelfde team.</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <StudieLink
                passage={null}
                surface="help"
                label="Naar BijbelStudie"
                className="inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-ink"
              />
              <Link href="/bijbelstudie" className="inline-flex text-sm font-medium text-ink-soft hover:text-ink">
                Wat is BijbelStudie?
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-rule bg-paper-raised p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Platform</p>
            <p className="mt-2 text-sm text-muted-foreground">BijbelQuiz wordt ontwikkeld met de Nederlandse BijbelAPI.</p>
            <Link href="https://www.bijbelapi.com" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium text-ink hover:text-ink">
              Naar BijbelAPI
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
