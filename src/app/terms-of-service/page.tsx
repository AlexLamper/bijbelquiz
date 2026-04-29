import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden | BijbelQuiz',
  description: 'Lees onze algemene voorwaarden voor het gebruik van BijbelQuiz services en producten.',
  alternates: { canonical: '/terms-of-service' }
}

export default function TermsPage() {
  const sections = [
    {
      title: '1. Algemeen',
      content: 'Door gebruik te maken van BijbelQuiz gaat u akkoord met deze algemene voorwaarden. Deze voorwaarden zijn van toepassing op alle diensten die wij aanbieden.',
    },
    {
      title: '2. Gebruik van de dienst',
      content: 'Het is niet toegestaan accounts van anderen te gebruiken of de veiligheid van de dienst te compromitteren. Wij behouden ons het recht voor accounts te blokkeren bij misbruik.',
    },
    {
      title: '3. Premium lidmaatschap',
      content: 'Premium lidmaatschap wordt aangegaan via betaling. Eventuele opzegging en voorwaarden voor terugbetaling verlopen volgens het gekozen betaalmodel en geldende wetgeving.',
    },
    {
      title: '4. Intellectueel eigendom',
      content: 'Alle quizvragen, logo\'s en software zijn eigendom van BijbelQuiz. Kopiëren zonder toestemming is niet toegestaan.',
    },
    {
      title: '5. Aansprakelijkheid',
      content: 'Wij streven naar correctheid, maar kunnen fouten in vragen of antwoorden niet volledig uitsluiten. Wij zijn niet aansprakelijk voor schade voortvloeiend uit gebruik van de dienst.',
    },
  ]

  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-14 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <h1 className="text-4xl text-[#1f2f4b] dark:text-zinc-100">Algemene voorwaarden</h1>
        <p className="mt-3 text-sm text-[#5f7297] dark:text-zinc-300">
          Deze voorwaarden zijn van toepassing op het gebruik van BijbelQuiz en bijbehorende diensten.
        </p>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
        <article className="max-w-4xl rounded-2xl border border-[#d8e1ee] bg-white/80 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 md:p-8">
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-2xl text-[#1f2f4b] dark:text-zinc-100">{section.title}</h2>
                <p className="text-sm leading-relaxed text-[#30466e] dark:text-zinc-300">{section.content}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
