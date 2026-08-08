import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { supportEmail } from '@/lib/support-email'
import { AlertTriangle, HelpCircle, Mail } from 'lucide-react'
import { SimpleAccordion } from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'Contact & Veelgestelde Vragen | BijbelQuiz Support',
  description: 'Heb je een vraag over BijbelQuiz? Bekijk onze FAQ of neem contact op. Wij helpen je graag verder.',
  alternates: { canonical: '/contact' },
  openGraph: {
      title: 'Contact - BijbelQuiz',
      description: 'Stel je vraag of bekijk antwoorden op de supportpagina.',
      url: 'https://www.bijbelquiz.com/contact'
  }
}

export default function ContactPage() {
  const email = supportEmail();

  const faqItems = [
      {
          title: "Is BijbelQuiz gratis?",
          content: "Ja, je kunt gratis quizzen spelen en met een code meedoen aan elke multiplayer-room. Voor onbeperkt zelf rooms hosten, uitleg bij elke vraag en alle premium quizzen bieden we een Premium lidmaatschap aan."
      },
      {
          title: "Hoe werkt het Premium lidmaatschap?",
          content: "Je kunt kiezen tussen een maandabonnement en een eenmalige levenslange aankoop. Beide geven toegang tot Premium functies."
      },
      { 
          title: "Kan ik mijn account verwijderen?",
          content: `Ja, dat kan. Stuur een mailtje naar ${email} en wij verwerken je verzoek binnen 5 werkdagen.`
      }
  ];

  return (
    <div className="min-h-screen bg-paper pb-12 pt-10">
      <section className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-5 lg:px-4">
        <h1 className="text-4xl text-ink">Contact & Support</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          Heb je een vraag over je account, betaling of gebruik van de app? Neem contact met ons op en we helpen je verder.
        </p>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-7 sm:px-5 lg:px-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="border-rule bg-paper-raised/80 py-0">
            <CardContent className="p-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper-sunken">
                <Mail className="h-5 w-5 text-ink" />
              </div>
              <h2 className="text-2xl text-ink">Mail ons</h2>
              <p className="mt-2 text-sm text-muted-foreground">We reageren meestal binnen 1-2 werkdagen.</p>

              <a
                href={`mailto:${email}`}
                className="mt-4 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-inverted hover:bg-ink-soft"
              >
                {email}
              </a>
            </CardContent>
          </Card>

          <Card className="border-rule bg-paper-raised/80 py-0">
            <CardContent className="p-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper-sunken">
                <AlertTriangle className="h-5 w-5 text-ink" />
              </div>
              <h2 className="text-2xl text-ink">Bug melden</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Gevonden fout? Meld dit via de speciale bug report pagina.
              </p>

              <Link
                href="/foutmelding"
                className="mt-4 inline-flex rounded-md border border-rule bg-paper-raised px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-sunken"
              >
                Naar bug report
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-8 sm:px-5 lg:px-4">
        <div className="max-w-3xl space-y-6">
          <h2 className="text-2xl text-ink flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            Veelgestelde vragen
          </h2>

          <SimpleAccordion items={faqItems} />
        </div>
      </section>
    </div>
  )
}
