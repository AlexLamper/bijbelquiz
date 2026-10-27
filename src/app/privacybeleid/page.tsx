import type { Metadata } from 'next';
import Link from 'next/link';

import { ChevronRightIcon } from '@/components/web2/marketing/icons';
import { LegalList, LegalPage, LegalText, type LegalSection } from '@/components/web2/marketing/LegalPage';
import { SUPPORT_EMAIL } from '@/lib/support-email';

export const metadata: Metadata = {
  title: 'Privacybeleid | BijbelQuiz',
  description: 'Hoe wij omgaan met jouw gegevens en privacy bij BijbelQuiz. Lees ons privacy statement.',
  alternates: { canonical: '/privacybeleid' },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'inleiding',
    title: '1. Inleiding',
    content: (
      <LegalText>
        Welkom bij BijbelQuiz. Wij hechten veel waarde aan uw privacy en de bescherming van uw persoonsgegevens. In dit
        privacybeleid leggen we uit welke gegevens we verzamelen, waarom we deze verzamelen en hoe we hiermee omgaan
        wanneer u onze app of website gebruikt.
      </LegalText>
    ),
  },
  {
    id: 'gegevens',
    title: '2. Welke gegevens we verzamelen',
    content: (
      <>
        <LegalText>Wanneer u BijbelQuiz gebruikt, kunnen wij de volgende gegevens verwerken:</LegalText>
        <LegalList
          items={[
            <>
              <strong className="font-extrabold">Persoonlijke identificatiegegevens:</strong> e-mailadres, naam en
              profielfoto wanneer u inlogt via bijvoorbeeld Google.
            </>,
            <>
              <strong className="font-extrabold">App-activiteit en voortgang:</strong> scores, voltooide quizzen en
              voortgang om uw ervaring te verbeteren.
            </>,
            <>
              <strong className="font-extrabold">Aankoopgeschiedenis:</strong> bij Premium-aankopen verwerken wij
              statusinformatie via onze betalingsprovider. Wij hebben geen toegang tot uw kaartgegevens.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'gebruik',
    title: '3. Hoe we uw gegevens gebruiken',
    content: (
      <>
        <LegalText>Wij gebruiken uw gegevens voor de volgende doeleinden:</LegalText>
        <LegalList
          items={[
            'Uw account aanmaken en beheren.',
            'Voortgang en resultaten opslaan en synchroniseren.',
            'Premium-functionaliteiten verifiëren.',
            'Stabiliteit en prestaties analyseren en verbeteren.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'derden',
    title: '4. Gegevens delen met derden',
    content: <LegalText>Wij verkopen uw persoonsgegevens nooit aan derden.</LegalText>,
  },
  {
    id: 'beveiliging',
    title: '5. Gegevensbeveiliging',
    content: (
      <LegalText>
        Wij nemen passende technische en organisatorische maatregelen. Alle communicatie met onze servers verloopt
        versleuteld via HTTPS.
      </LegalText>
    ),
  },
  {
    id: 'rechten',
    title: '6. Uw rechten en gegevensverwijdering',
    content: (
      <>
        <LegalText>
          U heeft het recht om inzage, correctie of verwijdering van uw gegevens aan te vragen. Dit kan via support of
          via de verwijderoptie in uw accountinstellingen.
        </LegalText>
        <Link href="/account-verwijderen" className="flex min-h-8 items-center gap-1 self-start text-base font-bold no-underline">
          Account verwijderen
          <ChevronRightIcon size={16} />
        </Link>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '7. Cookies',
    content: (
      <LegalText>
        Op onze website gebruiken wij alleen functionele cookies, bijvoorbeeld om ingelogd te blijven tijdens uw sessie.
      </LegalText>
    ),
  },
  {
    id: 'contact',
    title: '8. Contact',
    content: (
      <LegalText>
        Heeft u vragen over dit privacybeleid? Neem contact op via <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </LegalText>
    ),
  },
];

export default function PrivacyPage() {
  return <LegalPage active="privacy" title="Privacybeleid" meta="Laatst bijgewerkt: 8 april 2026" sections={SECTIONS} />;
}
