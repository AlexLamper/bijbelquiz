import Link from 'next/link';

import StudieLink from '@/components/StudieLink';
import { BIJBEL_API_BASE_URL } from '@/lib/ecosystem-links';
import type { FaqItem } from './FaqList';

/**
 * The help centre's questions. `text` is the plain answer (search and the
 * FAQPage structured data); `answer` is what the page shows, with links.
 * `featured` questions are the list of the design; the others only show up
 * when a topic is picked or a search finds them.
 */
export type HelpTopic = 'start' | 'quizzen' | 'duels' | 'samen' | 'premium' | 'account';

export interface HelpQuestion extends FaqItem {
  id: string;
  text: string;
  topics: HelpTopic[];
  featured?: boolean;
}

const studieLinkClass = 'font-extrabold no-underline';

export const HELP_QUESTIONS: HelpQuestion[] = [
  {
    id: 'gratis',
    featured: true,
    topics: ['start', 'premium'],
    question: 'Is BijbelQuiz gratis?',
    text: 'Je speelt 3 quizzen gratis, zonder account. Duels en samen spelen zijn altijd gratis. Wil je alle quizzen en de uitleg bij elk antwoord, dan probeer je Premium 7 dagen gratis.',
    answer: (
      <>
        Je speelt 3 quizzen gratis, zonder account. Duels en samen spelen zijn altijd gratis. Wil je alle quizzen en de uitleg
        bij elk antwoord, dan probeer je Premium 7 dagen gratis.
      </>
    ),
  },
  {
    id: 'duel',
    featured: true,
    topics: ['duels'],
    question: 'Hoe werkt een duel?',
    text: 'Je daagt iemand uit met een link, bijvoorbeeld via WhatsApp. Jullie spelen om de beurt 3 rondes van 3 vragen. Wie de meeste vragen goed heeft, wint.',
    answer:
      'Je daagt iemand uit met een link, bijvoorbeeld via WhatsApp. Jullie spelen om de beurt 3 rondes van 3 vragen. Wie de meeste vragen goed heeft, wint.',
  },
  {
    id: 'groep',
    featured: true,
    topics: ['samen'],
    question: 'Hoe start ik een spel voor mijn groep?',
    text: 'Ga naar Samen spelen, kies Kamer maken en kies een quiz. Deel de code van 6 tekens met je groep. Tot 20 spelers doen mee, ieder op een eigen telefoon.',
    answer: (
      <>
        Ga naar Samen spelen, kies Kamer maken en kies een quiz. Deel de code van 6 tekens
        met je groep. Tot 20 spelers doen mee, ieder op een eigen telefoon.
      </>
    ),
  },
  {
    id: 'xp',
    featured: true,
    topics: ['start', 'quizzen'],
    question: 'Hoe werken XP en levels?',
    text: 'Voor elk goed antwoord krijg je XP. Met genoeg XP ga je een level omhoog. Op de ranglijst zie je hoe je het doet, deze maand en sinds je begon.',
    answer: (
      <>
        Voor elk goed antwoord krijg je XP. Met genoeg XP ga je een level omhoog. Op de ranglijst
        zie je hoe je het doet, deze maand en sinds je begon.
      </>
    ),
  },
  {
    id: 'vertaling',
    featured: true,
    topics: ['quizzen'],
    question: 'Welke bijbelvertaling gebruiken jullie?',
    text: 'De vragen gaan uit van de Statenvertaling. Bij elk antwoord staat de bijbelverwijzing, zodat je het zelf kunt nalezen.',
    answer:
      'De vragen gaan uit van de Statenvertaling. Bij elk antwoord staat de bijbelverwijzing, zodat je het zelf kunt nalezen.',
  },
  {
    id: 'premium-opzeggen',
    featured: true,
    topics: ['premium'],
    question: 'Hoe zeg ik Premium op?',
    text: 'Via Profiel en dan Premium. Je houdt Premium tot het einde van de periode die je al betaald hebt. Betaal je via de app, dan zeg je op in de App Store of Google Play.',
    answer: (
      <>
        Via Profiel en dan Premium. Je houdt Premium tot het einde van de periode die je al betaald
        hebt. Betaal je via de app, dan zeg je op in de App Store of Google Play.
      </>
    ),
  },
  {
    id: 'account-verwijderen',
    featured: true,
    topics: ['account'],
    question: 'Hoe verwijder ik mijn account?',
    text: 'In de app via je profiel, of via Account verwijderen. We wissen je profiel, je voortgang en je scores. Dat kun je daarna niet meer terugdraaien.',
    answer: (
      <>
        In de app via je profiel, of via <Link href="/account-verwijderen">Account verwijderen</Link>. We wissen je profiel, je
        voortgang en je scores. Dat kun je daarna niet meer terugdraaien.
      </>
    ),
  },
  {
    id: 'bijbelstudie',
    featured: true,
    topics: ['quizzen'],
    question: 'Waar lees ik meer over een bijbelgedeelte?',
    text: 'Op BijbelStudie, van hetzelfde team. Daar lees je elk hoofdstuk met uitleg erbij.',
    answer: (
      <>
        Op{' '}
        <StudieLink passage={null} surface="help" label="BijbelStudie" icon={false} newTab className={studieLinkClass} />, van
        hetzelfde team. Daar lees je elk hoofdstuk met uitleg erbij. <Link href="/bijbelstudie">Wat is BijbelStudie?</Link>
      </>
    ),
  },
  // Only shown for a topic or a search.
  {
    id: 'account-nodig',
    topics: ['start', 'account'],
    question: 'Heb ik een account nodig?',
    text: 'Niet om te beginnen. Met een account bewaar je je XP, je reeks en je duels. Inloggen kan met Google, Apple of je e-mailadres.',
    answer: (
      <>
        Niet om te beginnen. Met een account bewaar je je XP, je reeks en je duels. <Link href="/registreren">Maak een account</Link>{' '}
        of log in met Google, Apple of je e-mailadres.
      </>
    ),
  },
  {
    id: 'telefoon',
    topics: ['start'],
    question: 'Werkt het op mijn telefoon?',
    text: 'Ja. Je speelt in de browser op elk apparaat, of in de app voor iPhone en Android.',
    answer: 'Ja. Je speelt in de browser op elk apparaat, of in de app voor iPhone en Android.',
  },
  {
    id: 'uitleg',
    topics: ['quizzen', 'premium'],
    question: 'Waarom zie ik de uitleg niet?',
    text: 'De uitleg bij elk antwoord hoort bij Premium. Zonder Premium zie je bij elke vraag wel de bijbelverwijzing, zodat je het zelf kunt nalezen.',
    answer: (
      <>
        De uitleg bij elk antwoord hoort bij <Link href="/premium">Premium</Link>. Zonder Premium zie je bij elke vraag wel de
        bijbelverwijzing, zodat je het zelf kunt nalezen.
      </>
    ),
  },
  {
    id: 'fout-in-vraag',
    topics: ['quizzen'],
    question: 'Ik zie een fout in een vraag. Wat nu?',
    text: 'Meld het via Fout melden. Noem de quiz en de vraag, dan kijken we het na.',
    answer: (
      <>
        Meld het via <Link href="/foutmelding#melden">Fout melden</Link>. Noem de quiz en de vraag, dan kijken we het na.
      </>
    ),
  },
  {
    id: 'klas',
    topics: ['samen', 'premium'],
    question: 'Kan ik spelen met mijn klas of jeugdgroep?',
    text: 'Ja. Met samen spelen doen tot 20 spelers mee met één code. Voor kerken, scholen en jeugdgroepen is er een groepslicentie.',
    answer: (
      <>
        Ja. Met samen spelen doen tot 20 spelers mee met één code. Voor kerken, scholen en jeugdgroepen is er een{' '}
        <Link href="/groepslicentie">groepslicentie</Link>.
      </>
    ),
  },
  {
    id: 'privacy',
    topics: ['account'],
    question: 'Wat doen jullie met mijn gegevens?',
    text: 'We gebruiken je gegevens om je account en je voortgang bij te houden. We verkopen ze nooit aan derden. Alles staat in het privacybeleid.',
    answer: (
      <>
        We gebruiken je gegevens om je account en je voortgang bij te houden. We verkopen ze nooit aan derden. Alles staat in
        het <Link href="/privacybeleid">privacybeleid</Link>.
      </>
    ),
  },
  {
    id: 'bijbelapi',
    topics: ['quizzen'],
    question: 'Wat is BijbelAPI?',
    text: 'BijbelQuiz wordt ontwikkeld met de Nederlandse BijbelAPI.',
    answer: (
      <>
        BijbelQuiz wordt ontwikkeld met de Nederlandse{' '}
        <a href={BIJBEL_API_BASE_URL} target="_blank" rel="noopener noreferrer">
          BijbelAPI
        </a>
        .
      </>
    ),
  },
];

/** Search chips under the search box: each opens one answer. */
export const POPULAR_SEARCHES = [
  { label: 'Premium opzeggen', id: 'premium-opzeggen' },
  { label: 'Een duel starten', id: 'duel' },
  { label: 'Meedoen met een code', id: 'groep' },
];
