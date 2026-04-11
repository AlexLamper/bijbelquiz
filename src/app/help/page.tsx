import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hulp & Support | BijbelQuiz Helpdesk',
  description: 'Vind antwoorden voor BijbelQuiz problemen, betalingen en spelregels.',
  alternates: { canonical: '/help' }
}

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-8 text-center">Veelgestelde Vragen</h1>
      <div className="prose prose-lg dark:prose-invert mx-auto bg-white/50 p-8 rounded-2xl shadow-sm border border-secondary/20 font-serif">
        <h3>Hoe werkt het Premium lidmaatschap?</h3>
        <p>Na betaling krijgt u direct en onbeperkt toegang tot alle quizzen en diepgaande studies.</p>
        
        <h3>Kan ik mijn abonnement opzeggen?</h3>
        <p>Het is een eenmalige betaling voor levenslange toegang, dus er is geen abonnement om op te zeggen.</p>
      </div>
    </div>
  )
}
