import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buttonVariants, Container, LogoMark } from '@/components/bq';
import { BijbelStudieMark } from '@/components/BijbelStudieMark';
import StudieLink from '@/components/StudieLink';
import {
  BookIcon,
  CapIcon,
  ChatIcon,
  CheckDisc,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  IconTile,
  LanguagesIcon,
  PencilIcon,
  SparkleIcon,
  type TileTone,
} from '@/components/web2/marketing/icons';
import { PromoCodeBox } from '@/components/web2/marketing/PromoCodeBox';
import { SectionHead } from '@/components/web2/marketing/SectionHead';
import { studiePromo } from '@/lib/ecosystem-links';
import { cn } from '@/lib/utils';

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

const FEATURES: { title: string; text: string; tone: TileTone; icon: ReactNode; pro?: boolean }[] = [
  { title: 'Vier Nederlandse vertalingen', text: 'Lees hoofdstuk voor hoofdstuk, onder andere in de Statenvertaling.', tone: 'lapis', icon: <BookIcon /> },
  {
    title: 'Commentaar bij elk hoofdstuk',
    text: 'Klassiek commentaar, zoals dat van Matthew Henry, naast de tekst die je leest.',
    tone: 'green',
    icon: <ChatIcon />,
  },
  { title: 'Begeleide studies', text: 'Per bijbelboek, in korte lessen met vragen om over na te denken.', tone: 'gold', icon: <CapIcon /> },
  { title: 'Notities en markeringen', text: 'Markeer verzen en schrijf je aantekeningen bij het hoofdstuk zelf.', tone: 'coral', icon: <PencilIcon /> },
  { title: 'AI-assistent', text: 'Stel een vraag over wat je leest en krijg direct uitleg.', tone: 'lapis', icon: <SparkleIcon /> },
  { title: 'Grondtekst', text: 'Het Hebreeuws en Grieks achter de vertaling, woord voor woord.', tone: 'green', icon: <LanguagesIcon />, pro: true },
];

const STEPS = [
  { title: 'Speel een quiz', text: 'Op BijbelQuiz, zoals je gewend bent.' },
  { title: 'Zie wat je nog niet wist', text: 'Bij elke vraag staat het hoofdstuk waar hij over gaat.' },
  { title: 'Lees dat hoofdstuk', text: 'Op BijbelStudie, met de uitleg ernaast. Eén klik vanaf de vraag.' },
];

const PRO_FEATURES = [
  'Het commentaar van Matthew Henry, Calvijn en Dachsel volledig',
  '200 vragen per dag aan de AI-assistent, in plaats van 5',
  'De grondtekst: Hebreeuws en Grieks',
];

const VERSES = [
  'In den beginne schiep God den hemel en de aarde.',
  'De aarde nu was woest en ledig, en duisternis was op den afgrond; en de Geest Gods zweefde op de wateren.',
  'En God zeide: Daar zij licht! en daar werd licht.',
  'En God zag het licht, dat het goed was; en God maakte scheiding tussen het licht en tussen de duisternis.',
];

/** The drawn example on the right of the hero: Genesis 1 on BijbelStudie and the quiz question that links to it. */
function HeroVisual() {
  return (
    <div
      role="img"
      aria-label="Voorbeeld: een quizvraag over Genesis 1 met een link naar het hoofdstuk, en Genesis 1 in de Statenvertaling op BijbelStudie met commentaar"
      className="relative box-border w-full max-w-[540px] justify-self-center pb-[178px] pt-6 m:pb-[156px]"
    >
      <span aria-hidden="true" className="absolute left-1/2 top-2.5 aspect-square w-[420px] max-w-full -translate-x-1/2 rounded-full bg-lapis-wash" />
      <div className="relative w-[440px] max-w-[94%] overflow-hidden rounded-[18px] border border-line bg-card shadow-float">
        <div className="flex items-center justify-between gap-2.5 border-b border-line-soft px-[18px] py-3.5">
          <span className="flex items-center gap-2">
            <BijbelStudieMark className="size-[22px]" />
            <span className="text-base font-extrabold">Genesis 1</span>
          </span>
          <span className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-line pl-3 pr-2.5 text-[13px] font-bold text-ink-soft">
            Statenvertaling
            <ChevronDownIcon size={14} className="text-ink-muted" />
          </span>
        </div>
        <div className="flex flex-col gap-1.5 px-[18px] pb-3.5 pt-4">
          {VERSES.map((verse, index) => (
            <p key={index} className="m-0 text-[15px] font-medium leading-[25px] text-ink">
              <sup className="mr-1 text-[10px] font-extrabold text-ink-faint">{index + 1}</sup>
              <span className={cn(index === 2 && 'rounded-[3px] bg-gold-tint shadow-[0_0_0_3px_var(--gold-tint)]')}>{verse}</span>
            </p>
          ))}
        </div>
        <div className="flex items-center gap-2.5 border-t border-line-soft px-[18px] py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-green-tint text-green">
            <ChatIcon size={17} strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-bold text-ink-soft">Commentaar · Matthew Henry</span>
          <ChevronRightIcon size={16} className="text-ink-faint" />
        </div>
      </div>
      <div className="absolute bottom-0 right-0 flex w-[270px] max-w-[74%] rotate-3 flex-col gap-2.5 rounded-[16px] border border-line bg-card p-3.5 shadow-float m:bottom-3">
        <span className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-lapis-tint px-[9px] py-[3px] text-[11px] font-extrabold tracking-[0.04em] text-lapis-edge">GENESIS 1</span>
          <LogoMark size={22} />
        </span>
        <span className="font-display text-base font-semibold leading-[21px]">Wat schiep God op de eerste dag?</span>
        <span className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-green-edge border-b-[3px] bg-green text-sm font-extrabold text-white">
          <CheckIcon size={14} />
          Het licht
        </span>
        <span className="flex h-7 items-center gap-1.5 self-start rounded-full bg-lapis-tint px-[11px] text-xs font-extrabold text-lapis">
          <BookIcon size={13} strokeWidth={2.4} />
          Lees Genesis 1:3
        </span>
      </div>
    </div>
  );
}

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
    <div className="pb-20">
      <Container as="section" className="pt-14">
        <div className="grid grid-cols-1 items-center gap-x-12 gap-y-10 m:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex flex-col items-start">
            <span role="img" aria-label="BijbelStudie" className="flex items-center gap-2.5">
              <BijbelStudieMark className="size-9" />
              <span aria-hidden="true" className="text-[22px] font-extrabold tracking-[-0.01em] text-ink">
                BijbelStudie
              </span>
            </span>
            <span className="mt-[22px] text-[15px] font-bold text-ink-muted">Van het team achter BijbelQuiz</span>
            <h1 className="mt-2 text-[32px] leading-[38px] m:text-[42px] m:leading-[50px]">
              BijbelStudie helpt je de Bijbel echt te begrijpen
            </h1>
            <p className="mt-4 max-w-[520px] text-lg font-semibold leading-7 text-ink-soft">
              BijbelQuiz test wat je weet. In BijbelStudie lees je elk hoofdstuk met uitleg erbij, zodat je ook snapt wat er staat.
              Gratis, in je browser en op je telefoon.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <StudieLink
                passage={null}
                surface="studie_page"
                variant="primary"
                label="Begin gratis op BijbelStudie"
                className={cn(buttonVariants({ size: 'hero' }), 'rounded-[12px] px-6')}
              />
              {promo && (
                <a href="#pro-code" className={cn(buttonVariants({ variant: 'secondary', size: 'hero' }), 'rounded-[12px] px-[22px]')}>
                  Eerste maand Pro gratis
                </a>
              )}
            </div>
          </div>
          <HeroVisual />
        </div>
      </Container>

      <Container as="section" className="pt-12 m:pt-20">
        <SectionHead title="Alles om een hoofdstuk echt te begrijpen" subtitle="Dit vind je op BijbelStudie." />
        <ul className="m-0 mt-7 grid list-none grid-cols-1 gap-4 p-0 m:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex flex-col gap-3 rounded-[16px] border border-line bg-card p-[22px]">
              <IconTile tone={feature.tone}>{feature.icon}</IconTile>
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <h3 className="m-0 font-sans text-[17px] font-extrabold">{feature.title}</h3>
                  {feature.pro && (
                    <span className="inline-flex h-[22px] items-center rounded-full bg-gold-tint px-2 text-xs font-extrabold text-gold-text">Pro</span>
                  )}
                </span>
                <span className="text-[15px] font-semibold leading-[22px] text-ink-muted">{feature.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>

      <Container as="section" className="pt-12 m:pt-20">
        <SectionHead title="Van quiz naar hoofdstuk" subtitle="Zo horen BijbelQuiz en BijbelStudie bij elkaar." />
        <ol className="m-0 mt-7 grid list-none grid-cols-1 gap-y-5 rounded-[16px] border border-line bg-card px-0 py-6 m:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                'flex flex-col gap-2.5 px-7 py-1',
                index > 0 && 'border-t border-line-soft pt-5 m:border-l m:border-t-0 m:pt-1',
              )}
            >
              <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-lapis-tint text-base font-extrabold text-lapis">
                {index + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[17px] font-extrabold">{step.title}</span>
                <span className="text-[15px] font-semibold leading-[22px] text-ink-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </Container>

      <Container as="section" id="pro-code" className="scroll-mt-6 pt-12 m:pt-20">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 rounded-[16px] border border-line bg-card p-5 m:grid-cols-2 m:p-10">
          <div className="flex flex-col gap-5">
            <SectionHead title="Lezen is gratis. Pro gaat dieper." subtitle="Alles hierboven gebruik je gratis. Met Pro krijg je er dit bij:" />
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-base font-bold text-ink">
                  <CheckDisc />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {promo ? (
            <div className="flex min-w-0 flex-col gap-3.5 rounded-[14px] border border-line p-6">
              <span className="text-sm font-extrabold text-lapis">Voor BijbelQuiz-spelers</span>
              <h3 className="-mt-2 text-2xl leading-[30px]">{promo.headline}</h3>
              <PromoCodeBox code={promo.code} surface="studie_page" />
              <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[15px] font-semibold leading-[22px] text-ink-soft">
                <li>Maak een gratis account op BijbelStudie.</li>
                <li>Kies Pro, per maand of per jaar.</li>
                <li>
                  Vul <span className="font-extrabold text-ink">{promo.code}</span> in bij het afrekenen.
                </li>
              </ol>
              <p className="m-0 text-[13px] font-semibold leading-[19px] text-ink-muted">{promo.terms}</p>
              <StudieLink
                passage={null}
                surface="studie_page_offer"
                destination="pricing"
                variant="primary"
                newTab
                label="Naar BijbelStudie Pro"
                className={cn(buttonVariants({ size: 'xl' }), 'px-6')}
              />
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-3.5 rounded-[14px] border border-line p-6">
              <span className="text-sm font-extrabold text-lapis">BijbelStudie Pro</span>
              <h3 className="-mt-2 text-2xl leading-[30px]">Per maand of per jaar</h3>
              <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-soft">
                Maak een gratis account op BijbelStudie en kies daar Pro wanneer je dieper wilt gaan.
              </p>
              <StudieLink
                passage={null}
                surface="studie_page_offer"
                destination="pricing"
                variant="primary"
                newTab
                label="Bekijk BijbelStudie Pro"
                className={cn(buttonVariants({ size: 'xl' }), 'px-6')}
              />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

