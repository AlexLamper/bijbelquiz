import type { Metadata } from 'next';
import Image from 'next/image';
import {
  BookOpen,
  GraduationCap,
  Languages,
  MessageSquareText,
  NotebookPen,
  Sparkles,
} from 'lucide-react';

import { BijbelStudieLogo } from '@/components/BijbelStudieMark';
import { Eyebrow, SectionHead } from '@/components/editorial';
import StudieLink from '@/components/StudieLink';
import StudiePromoCode from '@/components/StudiePromoCode';
import { studiePromo } from '@/lib/ecosystem-links';

export const metadata: Metadata = {
  title: 'BijbelStudie: de Bijbel lezen met uitleg erbij',
  description:
    'BijbelStudie is gemaakt door het team achter BijbelQuiz. Lees elk hoofdstuk met commentaar, volg begeleide studies en stel je vragen aan een AI-assistent. Gratis te gebruiken.',
  alternates: { canonical: '/bijbelstudie' },
  openGraph: {
    title: 'BijbelStudie, van het team achter BijbelQuiz',
    description: 'De quiz stelt de vraag. BijbelStudie geeft het hoofdstuk erbij.',
    url: 'https://www.bijbelquiz.com/bijbelstudie',
  },
};

// Re-rendered hourly so the offer disappears on its own once it expires,
// without waiting for the next deploy.
export const revalidate = 3600;

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Vier Nederlandse vertalingen',
    text: 'Lees hoofdstuk voor hoofdstuk, onder andere in de Statenvertaling.',
  },
  {
    icon: MessageSquareText,
    title: 'Commentaar bij elk hoofdstuk',
    text: 'Klassiek commentaar, zoals dat van Matthew Henry, naast de tekst die je leest.',
  },
  {
    icon: GraduationCap,
    title: 'Begeleide studies',
    text: 'Per bijbelboek, in korte lessen met vragen om over na te denken.',
  },
  {
    icon: NotebookPen,
    title: 'Notities en markeringen',
    text: 'Markeer verzen en schrijf je aantekeningen bij het hoofdstuk zelf.',
  },
  {
    icon: Sparkles,
    title: 'AI-assistent',
    text: 'Stel een vraag over wat je leest en krijg direct uitleg.',
  },
  {
    icon: Languages,
    title: 'Grondtekst',
    text: 'Het Hebreeuws en Grieks achter de vertaling, woord voor woord. Met Pro.',
  },
];

const STEPS = [
  { title: 'Speel een quiz', text: 'Op BijbelQuiz, zoals je gewend bent.' },
  {
    title: 'Zie wat je nog niet wist',
    text: 'Bij elke vraag staat het hoofdstuk waar hij over gaat.',
  },
  {
    title: 'Lees dat hoofdstuk',
    text: 'Op BijbelStudie, met de uitleg ernaast. Eén klik vanaf de vraag.',
  },
];

const PRO_FEATURES = [
  'Het commentaar van Matthew Henry, Calvijn en Dachsel volledig',
  '200 vragen per dag aan de AI-assistent, in plaats van 5',
  'De grondtekst: Hebreeuws en Grieks',
];

/**
 * What BijbelStudie is, for a BijbelQuiz player.
 *
 * The popup after a quiz and the band on the home page both say it in one
 * line. This is where "Meer over BijbelStudie" goes: the same team, what the
 * tool does, how it follows on from a quiz, and the welcome code. Indexable on
 * purpose, since "bijbelstudie" is already one of this site's keywords.
 */
export default function BijbelStudiePage() {
  const promo = studiePromo();

  return (
    <div className="min-h-screen bg-paper pb-20">
      <section className="mx-auto w-full max-w-[1180px] 2xl:max-w-[1500px] px-5 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <BijbelStudieLogo size="lg" />

            <Eyebrow className="mt-8 flex">Van hetzelfde team als BijbelQuiz</Eyebrow>

            <h1 className="mt-4 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[44px]">
              De quiz stelt de vraag. BijbelStudie geeft het hoofdstuk erbij.
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
              BijbelQuiz en BijbelStudie worden gemaakt door hetzelfde team. Na een quiz weet je
              wat je nog niet weet. Op BijbelStudie lees je dat hoofdstuk zelf, met uitleg ernaast.
              Gratis te gebruiken, in je browser en op je telefoon.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <StudieLink
                passage={null}
                surface="studie_page"
                variant="primary"
                label="Begin gratis op BijbelStudie"
              />
              {promo && (
                <a
                  href="#pro-code"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-rule-strong px-5 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken"
                >
                  Eerste maand Pro gratis
                </a>
              )}
            </div>
          </div>

          <figure className="min-w-0">
            <div className="relative aspect-[1600/1167] overflow-hidden rounded-lg border border-rule bg-paper-sunken">
              <Image
                src="/images/bijbelstudie/lezen.webp"
                alt="Genesis 1 in de Statenvertaling op BijbelStudie, met het commentaar van Matthew Henry ernaast"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover object-left-top"
              />
            </div>
            <figcaption className="mt-3 text-xs text-ink-muted">
              Lezen op BijbelStudie: de tekst links, het commentaar rechts.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-[1180px] 2xl:max-w-[1500px] px-5 sm:px-8 lg:mt-28 lg:px-10">
        <SectionHead eyebrow="Wat je er vindt" title="Alles om een hoofdstuk echt te begrijpen" />

        <ul className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="min-w-0">
              <Icon className="h-5 w-5 text-lapis" aria-hidden />
              <p className="mt-3 text-[15px] font-medium text-ink">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-20 w-full max-w-[1180px] 2xl:max-w-[1500px] px-5 sm:px-8 lg:mt-28 lg:px-10">
        <SectionHead eyebrow="Van quiz naar hoofdstuk" title="Zo horen de twee bij elkaar" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-14">
          <ol className="space-y-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-display text-[28px] leading-none tabular-nums text-lapis">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[15px] font-medium text-ink">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <figure className="min-w-0">
            <div className="relative aspect-[1600/1167] overflow-hidden rounded-lg border border-rule bg-paper-sunken">
              <Image
                src="/images/bijbelstudie/studies.webp"
                alt="De begeleide studie van Filippenzen op BijbelStudie: vier lessen van ongeveer tien minuten per hoofdstuk"
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover object-left-top"
              />
            </div>
            <figcaption className="mt-3 text-xs text-ink-muted">
              Een begeleide studie: een bijbelboek in korte lessen.
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        id="pro-code"
        className="mx-auto mt-20 w-full max-w-[1180px] 2xl:max-w-[1500px] scroll-mt-24 px-5 sm:px-8 lg:mt-28 lg:px-10"
      >
        <div className="grid gap-10 rounded-lg border border-rule bg-paper-raised p-6 sm:p-8 lg:grid-cols-2 lg:gap-14 lg:p-12">
          <div className="min-w-0">
            <Eyebrow>Gratis en Pro</Eyebrow>
            <h2 className="mt-4 font-display text-[26px] font-normal leading-[1.12] tracking-[-0.02em] text-ink sm:text-[32px]">
              Lezen is gratis. Pro gaat dieper.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
              Alles hierboven kun je gratis gebruiken. Met Pro krijg je er dit bij:
            </p>
            <ul className="mt-4 space-y-2.5">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-lapis" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {promo ? (
            <div className="min-w-0 rounded-lg border border-lapis/45 bg-paper p-5 sm:p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Voor BijbelQuiz-spelers
              </p>
              <p className="mt-2 font-display text-[24px] leading-snug text-ink">{promo.headline}</p>

              <StudiePromoCode code={promo.code} surface="studie_page" className="mt-4" />

              <ol className="mt-5 space-y-2 text-sm leading-relaxed text-ink-soft">
                <li>1. Maak een gratis account op BijbelStudie.</li>
                <li>2. Kies Pro, per maand of per jaar.</li>
                <li>
                  3. Vul <span className="font-mono font-medium text-ink">{promo.code}</span> in bij
                  het afrekenen.
                </li>
              </ol>

              <p className="mt-4 text-xs leading-relaxed text-ink-muted">{promo.terms}</p>

              <StudieLink
                passage={null}
                surface="studie_page_offer"
                destination="pricing"
                variant="primary"
                newTab
                label="Naar BijbelStudie Pro"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft sm:w-auto"
              />
            </div>
          ) : (
            <div className="min-w-0 self-center">
              <StudieLink
                passage={null}
                surface="studie_page_offer"
                destination="pricing"
                variant="primary"
                newTab
                label="Bekijk BijbelStudie Pro"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
