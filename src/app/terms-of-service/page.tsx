import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden - BijbelQuiz',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl animate-float-in">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-8 text-center">Algemene Voorwaarden</h1>
      <div className="prose prose-slate max-w-none bg-white p-8 rounded-xl shadow-sm border border-border/60">
        <h3>1. Algemeen</h3>
        <p>Door gebruik te maken van BijbelQuiz gaat u akkoord met deze algemene voorwaarden. Deze voorwaarden zijn van toepassing op alle diensten die wij aanbieden.</p>
        
        <h3>2. Gebruik van de dienst</h3>
        <p>Het is niet toegestaan om accounts van anderen te gebruiken of de veiligheid van de dienst te compromitteren. Wij behouden ons het recht voor om accounts te blokkeren bij misbruik.</p>
        
        <h3>3. Premium Lidmaatschap</h3>
        <p>Premium lidmaatschap wordt aangegaan via een eenmalige betaling. Er is een herroepingsrecht van 14 dagen (&quot;niet-goed-geld-terug&quot;), mits de dienst nog niet volledig is geconsumeerd (substantial usage).</p>
        
        <h3>4. Intellectueel Eigendom</h3>
        <p>Alle quizvragen, logo&apos;s en software zijn eigendom van BijbelQuiz. Kopiëren zonder toestemming is niet toegestaan.</p>
        
        <h3>5. Aansprakelijkheid</h3>
        <p>Wij streven naar correctheid, maar kunnen fouten in vragen of antwoorden niet volledig uitsluiten. Wij zijn niet aansprakelijk voor schade voortvloeiend uit het gebruik van deze site.</p>
      </div>
    </div>
  )
}
