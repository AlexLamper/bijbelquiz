import type { Metadata } from 'next'

import { SUPPORT_EMAIL } from '@/lib/support-email'

export const metadata: Metadata = {
  title: 'Privacybeleid | BijbelQuiz',
  description: 'Hoe wij omgaan met jouw gegevens en privacy bij BijbelQuiz. Lees ons privacy statement.',
  alternates: { canonical: '/privacy-policy' }
}

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Inleiding',
      body: [
        'Welkom bij BijbelQuiz. Wij hechten veel waarde aan uw privacy en de bescherming van uw persoonsgegevens. In dit privacybeleid leggen we uit welke gegevens we verzamelen, waarom we deze verzamelen en hoe we hiermee omgaan wanneer u onze app of website gebruikt.',
      ],
    },
    {
      title: '2. Welke gegevens we verzamelen',
      body: [
        'Wanneer u BijbelQuiz gebruikt, kunnen wij de volgende gegevens verwerken:',
      ],
      list: [
        'Persoonlijke identificatiegegevens: e-mailadres, naam en profielfoto wanneer u inlogt via bijvoorbeeld Google.',
        'App-activiteit en voortgang: scores, voltooide quizzen en voortgang om uw ervaring te verbeteren.',
        'Aankoopgeschiedenis: bij Premium-aankopen verwerken wij statusinformatie via onze betalingsprovider. Wij hebben geen toegang tot uw kaartgegevens.',
      ],
    },
    {
      title: '3. Hoe we uw gegevens gebruiken',
      body: ['Wij gebruiken uw gegevens voor de volgende doeleinden:'],
      list: [
        'Uw account aanmaken en beheren.',
        'Voortgang en resultaten opslaan en synchroniseren.',
        'Premium-functionaliteiten verifiëren.',
        'Stabiliteit en prestaties analyseren en verbeteren.',
      ],
    },
    {
      title: '4. Gegevens delen met derden',
      body: ['Wij verkopen uw persoonsgegevens nooit aan derden.'],
    },
    {
      title: '5. Gegevensbeveiliging',
      body: ['Wij nemen passende technische en organisatorische maatregelen. Alle communicatie met onze servers verloopt versleuteld via HTTPS.'],
    },
    {
      title: '6. Uw rechten en gegevensverwijdering',
      body: ['U heeft het recht om inzage, correctie of verwijdering van uw gegevens aan te vragen. Dit kan via support of via de verwijderoptie in uw accountinstellingen.'],
    },
    {
      title: '7. Cookies',
      body: ['Op onze website gebruiken wij alleen functionele cookies, bijvoorbeeld om ingelogd te blijven tijdens uw sessie.'],
    },
    {
      title: '8. Contact',
      body: [`Heeft u vragen over dit privacybeleid? Neem contact op via ${SUPPORT_EMAIL}.`],
    },
  ]

  return (
    <div className="min-h-screen bg-paper pb-14 pt-10">
      <section className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-5 lg:px-4">
        <h1 className="text-4xl text-ink">Privacybeleid</h1>
        <p className="mt-3 text-sm text-ink-soft">Laatst bijgewerkt: 8 april 2026</p>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-8 sm:px-5 lg:px-4">
        <article className="max-w-4xl rounded-lg border border-rule bg-paper-raised/80 p-6 md:p-8">
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-2xl text-ink">{section.title}</h2>

                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-ink">
                    {paragraph}
                  </p>
                ))}

                {section.list && (
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
