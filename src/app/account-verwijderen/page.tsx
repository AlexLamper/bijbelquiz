import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Account Verwijderen | BijbelQuiz',
  description: 'Dien een verzoek in om je BijbelQuiz account en bijbehorende gegevens te verwijderen.',
  alternates: { canonical: '/account-verwijderen' }
}

export default function DeleteAccountPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-8 text-center">Account en Gegevens Verwijderen</h1>
      <div className="prose prose-lg dark:prose-invert mx-auto bg-white/50 p-8 rounded-2xl shadow-sm border border-secondary/20 font-serif">
        <p>
          Bij <strong>BijbelQuiz</strong> respecteren we uw privacy. Als u uw account en alle bijbehorende persoonlijke gegevens wilt verwijderen, kunt u dit op twee manieren eenvoudig doen.
        </p>

        <h2>Hoe kunt u uw gegevens verwijderen?</h2>
        
        <h3>Optie 1: Direct in de BijbelQuiz app (Aanbevolen)</h3>
        <ol>
          <li>Open de BijbelQuiz app op uw apparaat.</li>
          <li>Ga naar het tabblad of scherm <strong>Instellingen</strong> of <strong>Profiel</strong>.</li>
          <li>Selecteer de optie <strong>Account verwijderen</strong> (rode knop).</li>
          <li>Bevestig uw keuze.</li>
        </ol>
        <p>Uw account en bijbehorende gegevens worden hiermee direct en permanent uit onze actieve database verwijderd.</p>

        <h3>Optie 2: Via een e-mailverzoek</h3>
        <p>
          U kunt ook een verzoek tot gegevensverwijdering indienen via e-mail. Dit is handig als u de app al heeft verwijderd van uw telefoon.
        </p>
        <ul>
          <li>Stuur een e-mail naar: <a href="mailto:devlamper06@gmail.com">devlamper06@gmail.com</a></li>
          <li>Gebruik als onderwerp: <strong>Verzoek tot accountverwijdering</strong>.</li>
          <li>Belangrijk: Stuur de e-mail vanaf het e-mailadres waarmee u bent ingelogd in de app, zodat wij kunnen verifiëren dat het account van u is.</li>
        </ul>
        <p>Wij zullen uw account en gegevens binnen maximaal 14 dagen na uw verzoek handmatig verwijderen en u hiervan een bevestiging sturen.</p>

        <h2>Welke gegevens worden verwijderd?</h2>
        <p>Bij het verwijderen van uw account wissen wij de volgende gegevens permanent:</p>
        <ul>
          <li>Uw persoonlijke profielgegevens (zoals naam, e-mailadres en profielfoto).</li>
          <li>Uw authenticatiegegevens (de koppeling met Google).</li>
          <li>Uw app-activiteit, quizvoortgang, scores en opgeslagen instellingen.</li>
        </ul>

        <h2>Welke gegevens worden bewaard?</h2>
        <p>
          Om te voldoen aan wettelijke en fiscale verplichtingen worden anonieme transactiegegevens van in-app aankopen (zoals een Premium abonnement via RevenueCat) of app-store aankoopbewijzen bewaard volgens de wettelijke bewaartermijn. Deze gegevens zijn na accountverwijdering niet meer herleidbaar of gekoppeld aan uw persoonlijke BijbelQuiz-identiteit.
        </p>
        
        <hr className="my-8" />
        
        <p>
          Heeft u verdere vragen over hoe wij met uw gegevens omgaan? Lees dan ons volledige <Link href="/privacy-policy" className="text-secondary hover:underline">Privacybeleid</Link>.
        </p>
      </div>
    </div>
  )
}
