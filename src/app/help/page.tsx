import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, LifeBuoy } from 'lucide-react'

import { SimpleAccordion } from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'Hulp & Support | BijbelQuiz Helpdesk',
  description: 'Vind antwoorden voor BijbelQuiz problemen, betalingen en spelregels.',
  alternates: { canonical: '/help' }
}

export default function HelpPage() {
  const faqItems = [
    {
      title: 'Hoe werkt het Premium lidmaatschap?',
      content: 'Na betaling krijg je direct toegang tot alle quizzen, uitgebreide uitleg en Premium functies.',
    },
    {
      title: 'Kan ik mijn abonnement opzeggen?',
      content: 'Als je een maandabonnement hebt, kun je dit beheren via je profiel en het Stripe-portaal.',
    },
    {
      title: 'Waar kan ik een probleem melden?',
      content: 'Je kunt technische problemen direct melden op de bug report pagina.',
    },
    {
      title: 'Waar vind ik extra uitleg over een Bijbelonderwerp?',
      content: 'Voor extra verdieping verwijzen we op meerdere plekken naar Bijbel Studie met achtergrond en context.',
    },
  ]
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.content,
      },
    })),
  };

  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-12 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <div className="rounded-2xl border border-[#d8e1ee] bg-[linear-gradient(140deg,#ffffff,#f3f8ff)] p-6 shadow-sm dark:border-zinc-700 dark:bg-[linear-gradient(140deg,rgba(24,24,27,0.9),rgba(39,39,42,0.85))]">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e9eff8] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#355384] dark:bg-[#6f8ed4] dark:text-white">
            <LifeBuoy className="h-3.5 w-3.5" />
            Support
          </div>
          <h1 className="mt-4 text-4xl text-[#1f2f4b] dark:text-zinc-100">Helpcentrum</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#5f7297] dark:text-zinc-300">
            Snel antwoord op veelgestelde vragen over Premium, betalingen en gebruik van BijbelQuiz.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-md bg-[#6f8ed4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5f81cc] dark:bg-[#6f8ed4] dark:hover:bg-[#5f81cc]">
              Contact opnemen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/bug-report" className="inline-flex items-center gap-2 rounded-md border border-[#d2ddee] bg-white px-4 py-2 text-sm font-semibold text-[#2f466f] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
              Bug report
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
        <div className="max-w-3xl">
          <SimpleAccordion items={faqItems} />
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
        <div className="grid gap-3 md:max-w-3xl md:grid-cols-2">
          <div className="rounded-lg border border-[#d8e1ee] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/70">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#607597] dark:text-zinc-300">Meer leren</p>
            <p className="mt-2 text-sm text-muted-foreground">Verdiep je verder per thema via Bijbel Studie.</p>
            <Link href="https://www.bijbel-studie.com" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium text-[#355384] hover:text-[#243a5e] dark:text-[#9db5dc]">
              Naar Bijbel Studie
            </Link>
          </div>
          <div className="rounded-lg border border-[#d8e1ee] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/70">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#607597] dark:text-zinc-300">Platform</p>
            <p className="mt-2 text-sm text-muted-foreground">BijbelQuiz wordt ontwikkeld met de Nederlandse BijbelAPI.</p>
            <Link href="https://www.bijbelapi.com" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium text-[#355384] hover:text-[#243a5e] dark:text-[#9db5dc]">
              Naar BijbelAPI
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
