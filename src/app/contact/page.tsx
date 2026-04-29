import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
  const supportEmail = process.env.NEXT_PUBLIC_BUG_REPORT_EMAIL || 'devlamper06@gmail.com';

  const faqItems = [
      {
          title: "Is BijbelQuiz gratis?",
          content: "Ja, je kunt gratis quizzen spelen. Voor toegang tot gedetailleerde statistieken, uitleg bij antwoorden en exclusieve badges bieden we een Premium lidmaatschap aan."
      },
      {
          title: "Hoe werkt het Premium lidmaatschap?",
          content: "Je kunt kiezen tussen een maandabonnement en een eenmalige levenslange aankoop. Beide geven toegang tot Premium functies."
      },
      { 
          title: "Kan ik mijn account verwijderen?",
          content: `Ja, dat kan. Stuur een mailtje naar ${supportEmail} en wij verwerken je verzoek binnen 5 werkdagen.`
      }
  ];

  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-12 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <h1 className="text-4xl text-[#1f2f4b] dark:text-zinc-100">Contact & Support</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#5f7297] dark:text-zinc-300">
          Heb je een vraag over je account, betaling of gebruik van de app? Neem contact met ons op en we helpen je verder.
        </p>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-7 sm:px-5 lg:px-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="border-[#d8e1ee] bg-white/80 py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e9eff8] dark:bg-[#1f3356]">
                <Mail className="h-5 w-5 text-[#355384] dark:text-[#9db5dc]" />
              </div>
              <h2 className="text-2xl text-[#1f2f4b] dark:text-zinc-100">Mail ons</h2>
              <p className="mt-2 text-sm text-muted-foreground">We reageren meestal binnen 1-2 werkdagen.</p>

              <a
                href={`mailto:${supportEmail}`}
                className="mt-4 inline-flex rounded-md bg-[#6f8ed4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5f81cc] dark:bg-[#6f8ed4] dark:hover:bg-[#5f81cc]"
              >
                {supportEmail}
              </a>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] bg-white/80 py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4ff] dark:bg-[#1f3356]">
                <AlertTriangle className="h-5 w-5 text-[#355384] dark:text-[#9db5dc]" />
              </div>
              <h2 className="text-2xl text-[#1f2f4b] dark:text-zinc-100">Bug melden</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Gevonden fout? Meld dit via de speciale bug report pagina.
              </p>

              <Link
                href="/bug-report"
                className="mt-4 inline-flex rounded-md border border-[#d2ddee] bg-white px-4 py-2 text-sm font-semibold text-[#2f466f] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Naar bug report
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
        <div className="max-w-3xl space-y-6">
          <h2 className="text-2xl text-[#1f2f4b] dark:text-zinc-100 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground dark:text-[#9db5dc]" />
            Veelgestelde vragen
          </h2>

          <SimpleAccordion items={faqItems} />
        </div>
      </section>
    </div>
  )
}
