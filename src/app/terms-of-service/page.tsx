import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden - BijbelQuiz',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-8 text-center">Algemene Voorwaarden</h1>
      <div className="prose prose-lg dark:prose-invert mx-auto bg-white/50 p-8 rounded-2xl shadow-sm border border-secondary/20 font-serif">
        <p>Door gebruik te maken van deze website gaat u akkoord met onze voorwaarden.</p>
        <p>Het materiaal op deze website is auteursrechtelijk beschermd.</p>
      </div>
    </div>
  )
}
