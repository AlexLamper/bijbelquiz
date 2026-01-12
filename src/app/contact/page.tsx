import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact - BijbelQuiz',
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-8 text-center">Contact</h1>
      <div className="prose prose-lg dark:prose-invert mx-auto bg-white/50 p-8 rounded-2xl shadow-sm border border-secondary/20 font-serif">
        <p>Heeft u vragen of opmerkingen? Wij horen graag van u.</p>
        <p>U kunt ons bereiken via email: info@bijbelquiz.com</p>
      </div>
    </div>
  )
}
