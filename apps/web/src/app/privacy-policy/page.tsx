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
        <p><strong>Laatst bijgewerkt:</strong> 8 april 2026</p>
        
        <h2>1. Inleiding</h2>
        <p>Welkom bij BijbelQuiz. Wij hechten veel waarde aan uw privacy en de bescherming van uw persoonsgegevens. In dit privacybeleid leggen we uit welke gegevens we verzamelen, waarom we deze verzamelen en hoe we hiermee omgaan wanneer u onze app of website gebruikt.</p>
        
        <h2>2. Welke gegevens we verzamelen</h2>
        <p>Wanneer u BijbelQuiz gebruikt, kunnen wij de volgende gegevens verzamelen:</p>
        <ul>
          <li><strong>Persoonlijke identificatiegegevens:</strong> E-mailadres, naam en profielfoto (uitsluitend wanneer u inlogt via een dienst zoals Google).</li>
          <li><strong>App-activiteit en voortgang:</strong> Uw behaalde scores, voltooide quizzen en app-voortgang om uw persoonlijke ervaring te verbeteren.</li>
          <li><strong>Aankoopgeschiedenis:</strong> Indien u een Premium-abonnement aanschaft, verwerken we deze status via onze betalingsprovider. Wij hebben <strong>geen</strong> toegang tot uw creditcardgegevens.</li>
        </ul>

        <h2>3. Hoe we uw gegevens gebruiken</h2>
        <p>Wij gebruiken uw gegevens voor de volgende doeleinden:</p>
        <ul>
          <li>Om uw account aan te maken en te beheren.</li>
          <li>Om uw spelvoortgang en resultaten op te slaan en te synchroniseren over meerdere apparaten.</li>
          <li>Om Premium-functionaliteiten te verifiëren.</li>
          <li>Om de stabiliteit en prestaties van de app en website te analyseren en verbeteren.</li>
        </ul>

        <h2>4. Gegevens delen met derden</h2>
        <p>Wij verkopen uw persoonsgegevens nooit aan derden.</p>

        <h2>5. Gegevensbeveiliging</h2>
        <p>Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen. Alle communicatie tussen de app en onze servers is versleuteld (via HTTPS).</p>

        <h2>6. Uw Rechten en Gegevensverwijdering</h2>
        <p>U heeft op elk moment het recht om inzicht te vragen in uw opgeslagen gegevens, deze aan te passen, of een verzoek in te dienen om uw account en alle bijbehorende gegevens <strong>volledig te laten verwijderen</strong>. U kunt dit doen door contact met ons op te nemen op het e-mailadres hieronder, of via de verwijder-optie binnen de instellingen van de app.</p>

        <h2>7. Cookies</h2>
        <p>Op onze website gebruiken wij uitsluitend functionele cookies, bijvoorbeeld om er voor te zorgen dat u ingelogd blijft tijdens uw sessie. Wij gebruiken geen tracking- of advertentiecookies om u te profileren.</p>

        <h2>8. Contact</h2>
        <p>Heeft u vragen over dit privacybeleid of uw gegevens? Neem dan contact met ons op via info@bijbelquiz.com.</p>
      </div>
    </div>
  )
}
