import type { Metadata } from 'next';

import { LegalPage, LegalText, type LegalSection } from '@/components/web2/marketing/LegalPage';

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden | BijbelQuiz',
  description: 'Lees onze algemene voorwaarden voor het gebruik van BijbelQuiz services en producten.',
  alternates: { canonical: '/voorwaarden' },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'algemeen',
    title: '1. Algemeen',
    content: (
      <LegalText>
        Door gebruik te maken van BijbelQuiz gaat u akkoord met deze algemene voorwaarden. Deze voorwaarden zijn van
        toepassing op alle diensten die wij aanbieden.
      </LegalText>
    ),
  },
  {
    id: 'gebruik',
    title: '2. Gebruik van de dienst',
    content: (
      <LegalText>
        Het is niet toegestaan accounts van anderen te gebruiken of de veiligheid van de dienst te compromitteren. Wij
        behouden ons het recht voor accounts te blokkeren bij misbruik.
      </LegalText>
    ),
  },
  {
    id: 'premium',
    title: '3. Premium lidmaatschap',
    content: (
      <LegalText>
        Premium lidmaatschap wordt aangegaan via betaling. Eventuele opzegging en voorwaarden voor terugbetaling
        verlopen volgens het gekozen betaalmodel en geldende wetgeving.
      </LegalText>
    ),
  },
  {
    id: 'eigendom',
    title: '4. Intellectueel eigendom',
    content: (
      <LegalText>
        Alle quizvragen, logo&apos;s en software zijn eigendom van BijbelQuiz. Kopiëren zonder toestemming is niet
        toegestaan.
      </LegalText>
    ),
  },
  {
    id: 'aansprakelijkheid',
    title: '5. Aansprakelijkheid',
    content: (
      <LegalText>
        Wij streven naar correctheid, maar kunnen fouten in vragen of antwoorden niet volledig uitsluiten. Wij zijn niet
        aansprakelijk voor schade voortvloeiend uit gebruik van de dienst.
      </LegalText>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      active="voorwaarden"
      title="Algemene voorwaarden"
      meta="Deze voorwaarden zijn van toepassing op het gebruik van BijbelQuiz en bijbehorende diensten."
      sections={SECTIONS}
    />
  );
}
