import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacybeleid | BijbelQuiz',
  description: 'Hoe wij omgaan met jouw gegevens en privacy bij BijbelQuiz. Lees ons privacy statement.',
  alternates: { canonical: '/privacy-policy' }
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-8 text-center">Privacybeleid</h1>
      <div className="prose prose-lg dark:prose-invert mx-auto bg-white/50 p-8 rounded-2xl shadow-sm border border-secondary/20 font-serif">
        <p>Wij hechten veel waarde aan uw privacy. Uw gegevens worden veilig opgeslagen en nooit gedeeld met derden zonder uw toestemming.</p>
        <p>Wij gebruiken cookies alleen voor de functionaliteit van de site (zoals ingelogd blijven).</p>
      </div>
    </div>
  )
}
