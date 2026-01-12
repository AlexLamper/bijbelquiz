import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, HelpCircle } from 'lucide-react'
import { SimpleAccordion } from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'Contact & FAQ - BijbelQuiz',
}

export default function ContactPage() {
  const faqItems = [
      {
          title: "Is BijbelQuiz gratis?",
          content: "Ja, je kunt gratis quizzen spelen. Voor toegang tot gedetailleerde statistieken, onbeperkte historie en exclusieve badges bieden we een Premium lidmaatschap aan."
      },
      {
          title: "Hoe werkt het Premium lidmaatschap?",
          content: "Het is een eenmalige betaling. Je betaalt één keer en behoudt voor altijd toegang tot alle Premium functionaliteiten. Geen abonnementen."
      },
      {
          title: "Kan ik mijn account verwijderen?",
          content: "Ja, dat kan. Stuur een mailtje naar devlamper06@gmail.com en wij verwerken je verzoek binnen 5 werkdagen."
      }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl animate-float-in">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-8 text-center">Contact & Veelgestelde Vragen</h1>
      
      <div className="flex justify-center mb-12">
         <Card className="w-full max-w-md">
            <CardContent className="pt-6 flex flex-col items-center text-center h-full justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Email Ons</h2>
                <p className="text-muted-foreground mb-4">Heeft u specifieke vragen of suggesties?</p>
                <a href="mailto:devlamper06@gmail.com" className="text-primary font-semibold hover:underline bg-primary/5 px-4 py-2 rounded-full">
                    devlamper06@gmail.com
                </a>
            </CardContent>
         </Card>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold font-serif text-center flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-muted-foreground" />
            Veelgestelde Vragen
        </h2>
        
        <SimpleAccordion items={faqItems} />
      </div>
    </div>
  )
}
