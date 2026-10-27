import * as React from 'react';
import Link from 'next/link';

import {
  APP_STORE_URL,
  Avatar,
  BoltIcon,
  BoltSolidIcon,
  Button,
  buttonVariants,
  Container,
  FlameIcon,
  GOOGLE_PLAY_URL,
  QuizCard,
  StoreBadges,
} from '@/components/bq';
import StudieLink from '@/components/StudieLink';
import { cn } from '@/lib/utils';
import { FaqList, type FaqItem } from './FaqList';
import type { LandingData, LandingTestament } from './landing-data';
import { BookIcon, CheckDisc, CheckIcon, ChevronRightIcon, CrownIcon, LockIcon, PeopleIcon, ShieldCheckIcon, SwordsIcon } from './icons';
import { SectionHead } from './SectionHead';

/** P-Landing: the home page for visitors who are not signed in. */

const sectionTop = 'pt-12 m:pt-20';

function ArrowLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-1 whitespace-nowrap text-base font-extrabold no-underline', className)}>
      {children}
      <ChevronRightIcon size={18} strokeWidth={2.6} />
    </Link>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */

function HeroVisual() {
  const answers = ['3', '5', '7', '12'];
  return (
    <div
      role="img"
      aria-label="Voorbeeld: een quizvraag over Johannes 6 met het goede antwoord en uitleg, een duel tegen Lotte, verdiende XP en een reeks van 6 dagen"
      className="relative box-border w-full max-w-[540px] justify-self-center pb-[72px] pt-[76px]"
    >
      <span aria-hidden="true" className="absolute left-1/2 top-[30px] aspect-square w-[410px] max-w-full -translate-x-1/2 rounded-full bg-lapis-wash" />
      <span aria-hidden="true" className="absolute right-[58px] top-[54px] size-10 rounded-full bg-gold-wash" />
      <div className="relative mx-auto flex w-[380px] max-w-[84%] -rotate-3 flex-col gap-3.5 rounded-[20px] border border-line bg-card p-[22px] shadow-float">
        <span className="self-start rounded-full bg-lapis-tint px-2.5 py-1 text-xs font-extrabold tracking-[0.04em] text-lapis-edge">JOHANNES 6</span>
        <span className="font-display text-[22px] font-semibold leading-7">Hoeveel broden had de jongen bij zich?</span>
        <span className="grid grid-cols-2 gap-2.5">
          {answers.map((answer) =>
            answer === '5' ? (
              <span
                key={answer}
                className="flex h-[46px] items-center justify-center gap-1.5 rounded-[12px] border border-green-edge border-b-[3px] bg-green text-[17px] font-extrabold text-white"
              >
                <CheckIcon size={16} />5
              </span>
            ) : (
              <span
                key={answer}
                className="flex h-[46px] items-center justify-center rounded-[12px] border border-line border-b-[3px] border-b-edge bg-card text-[17px] font-extrabold text-ink-faint"
              >
                {answer}
              </span>
            ),
          )}
        </span>
        <span className="flex flex-col gap-2.5 border-t border-line-soft pt-3.5">
          <span className="text-sm font-semibold leading-5 text-ink-soft">
            <span className="font-extrabold text-green-text">Goed!</span> Andreas wees Jezus op een jongen met vijf gerstebroden en
            twee vissen.
          </span>
          <span className="flex h-[30px] items-center gap-1.5 self-start whitespace-nowrap rounded-full bg-lapis-tint px-3 text-[13px] font-extrabold text-lapis">
            <BookIcon size={14} strokeWidth={2.4} />
            Lees Johannes 6:9
          </span>
        </span>
      </div>
      <span className="absolute right-0 top-[18px] flex h-11 rotate-[4deg] items-center gap-2 whitespace-nowrap rounded-[14px] border border-line bg-card px-3.5 text-sm font-extrabold text-ink-soft shadow-float">
        <SwordsIcon size={17} strokeWidth={2.4} className="text-coral-strong" />
        Jij <span className="font-display text-[19px] font-semibold text-ink">3 - 2</span> Lotte
      </span>
      <span className="absolute bottom-5 left-0 flex h-[38px] -rotate-[5deg] items-center gap-[5px] whitespace-nowrap rounded-full bg-gold px-[13px] text-[15px] font-extrabold text-gold-ink shadow-float m:bottom-[132px]">
        <BoltSolidIcon size={15} />
        +15 XP
      </span>
      <span className="absolute bottom-[26px] right-3.5 flex h-10 rotate-3 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-card px-[13px] text-[15px] font-extrabold text-ink shadow-float">
        <FlameIcon size={17} className="text-coral" />6 dagen op rij
      </span>
    </div>
  );
}

function Hero() {
  return (
    <Container as="section" className="pb-4 pt-14">
      <div className="grid grid-cols-1 items-center gap-10 m:grid-cols-2">
        <div className="flex flex-col items-start">
          <h1 className="m-0 text-[38px] leading-[44px] tracking-[-0.01em] m:text-[56px] m:leading-[62px]">
            Hoe goed ken jij
            <br />
            de Bijbel?
          </h1>
          <p className="mt-[18px] max-w-[500px] text-[19px] font-semibold leading-[29px] text-ink-soft">
            Korte quizzen over alle bijbelboeken, met uitleg bij elk antwoord. Speel alleen, daag een vriend uit of speel samen met je
            groep.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-[18px] gap-y-3.5">
            {/* Straight to the quizzes: a visitor who came to play should not
                meet a registration form first. An account is offered on the
                result screen, where there is a score to keep. */}
            <Button href="/quizzen" size="hero" className="rounded-[12px] px-[34px]">
              Gratis beginnen
            </Button>
            <span className="flex items-center gap-[7px] text-sm font-bold text-ink-muted">
              <ShieldCheckIcon size={16} strokeWidth={2.4} className="text-green" />3 quizzen gratis, zonder account
            </span>
          </div>
          <div className="mt-8 flex max-w-[500px] flex-col gap-3 self-stretch border-t border-line pt-6">
            <span className="text-sm font-bold text-ink-muted">Of speel in de app</span>
            <StoreBadges className="gap-3" />
          </div>
        </div>
        <HeroVisual />
      </div>
    </Container>
  );
}

/* ── Zo werkt BijbelQuiz ─────────────────────────────────────────────────── */

function ModeCard({ panel, tint, title, text }: { panel: React.ReactNode; tint: string; title: string; text: string }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-card">
      <div aria-hidden="true" className={cn('mx-2 mt-2 flex h-[200px] items-center justify-center rounded-[10px] p-5', tint)}>
        {panel}
      </div>
      <div className="flex flex-col gap-2 px-6 pb-[26px] pt-[22px]">
        <h3 className="m-0 text-xl leading-[26px]">{title}</h3>
        <p className="m-0 text-base font-semibold leading-6 text-ink-muted">{text}</p>
      </div>
    </article>
  );
}

function HowItWorks() {
  return (
    <Container as="section" className="pt-12 m:pt-[72px]">
      <SectionHead title="Zo werkt BijbelQuiz" subtitle="Drie manieren om te spelen, allemaal met dezelfde korte quizzen." />
      <div className="mt-7 grid grid-cols-1 gap-5 m:grid-cols-3">
        <ModeCard
          tint="bg-lapis-tint"
          title="Speel een quiz"
          text="Tien vragen over een bijbelgedeelte. Na elk antwoord lees je de uitleg en de bijbeltekst erbij."
          panel={
            <span className="flex w-full max-w-[290px] flex-col gap-2.5 rounded-[14px] border border-line border-t-4 border-t-green bg-card px-4 py-3.5">
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-display text-[19px] font-semibold text-green-text">
                  <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-green text-white">
                    <CheckIcon size={14} />
                  </span>
                  Goed!
                </span>
                <span className="flex items-center gap-1 rounded-full bg-gold-tint px-2.5 py-1 text-xs font-extrabold text-gold-text">
                  <BoltIcon size={13} />
                  +15 XP
                </span>
              </span>
              <span className="text-[13px] font-semibold leading-[19px] text-ink-soft">
                Noach maakte de ark van goferhout, zoals God hem had opgedragen.
              </span>
              <span className="flex h-7 items-center gap-1.5 self-start whitespace-nowrap rounded-full bg-lapis-tint px-3 text-xs font-extrabold text-lapis">
                <BookIcon size={14} strokeWidth={2.4} />
                Lees Genesis 6:14
              </span>
            </span>
          }
        />
        <ModeCard
          tint="bg-coral-tint"
          title="Daag een vriend uit"
          text="Een duel speel je om de beurt: 3 rondes van 3 vragen. Je vriend krijgt een link en speelt gratis mee."
          panel={
            <span className="grid w-full max-w-[290px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 rounded-[14px] border-[1.5px] border-coral-line bg-card px-3.5 py-4">
              <span className="flex flex-col items-center gap-1">
                <Avatar name="A" tone="solid" size={44} />
                <span className="text-[13px] font-extrabold">Jij</span>
              </span>
              <span className="flex flex-col items-center gap-1.5">
                <span className="whitespace-nowrap font-display text-[32px] font-semibold leading-none">3 - 2</span>
                <span className="flex items-center gap-1">
                  <span className="size-[7px] rounded-full bg-coral-strong" />
                  <span className="size-[7px] rounded-full bg-coral-strong" />
                  <span className="size-[7px] rounded-full bg-segment" />
                </span>
                <span className="whitespace-nowrap text-xs font-bold text-ink-muted">Ronde 2 van 3</span>
              </span>
              <span className="flex flex-col items-center gap-1">
                <Avatar name="L" tone="coral" size={44} />
                <span className="text-[13px] font-extrabold">Lotte</span>
              </span>
            </span>
          }
        />
        <ModeCard
          tint="bg-green-tint"
          title="Speel samen"
          text="Start een kamer en deel de code. Tot 20 spelers doen mee, ieder op een eigen telefoon."
          panel={
            <span className="flex w-full max-w-[290px] flex-col gap-2.5 rounded-[14px] border border-line bg-card px-4 pb-4 pt-3.5">
              <span className="text-xs font-extrabold text-ink-muted">Kamercode</span>
              <span className="grid grid-cols-6 gap-1.5">
                {'K7P2QM'.split('').map((char) => (
                  <span
                    key={char}
                    className="flex h-[42px] items-center justify-center rounded-[10px] border border-line border-b-[3px] bg-card text-[19px] font-extrabold text-ink"
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className="flex items-center gap-[7px] text-[13px] font-bold text-ink-soft">
                <PeopleIcon size={16} strokeWidth={2.4} className="text-green" />
                14 spelers doen mee
              </span>
            </span>
          }
        />
      </div>
    </Container>
  );
}

/* ── Quizzen over elk bijbelboek ─────────────────────────────────────────── */

const KICKER_TONES = ['lapis', 'lapis', 'gold', 'green'] as const;

function OldTestamentArt() {
  return (
    <svg width={34} height={34} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 60V24a12 12 0 0 1 24 0v36z" className="fill-track stroke-ink-muted" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M32 60V24a12 12 0 0 1 24 0v36z" className="fill-line-soft stroke-ink-muted" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M14 29h12M14 35h12M14 41h12M14 47h8M38 29h12M38 35h12M38 41h12M38 47h8" className="stroke-ink-faint" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}

function NewTestamentArt() {
  return (
    <svg width={40} height={40} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="self-end">
      <circle cx="44" cy="20" r="13" className="fill-gold-wash" />
      <path d="M0 64Q30 46 64 58V64Z" className="fill-lapis-pale" />
      <path d="M28 8h8v13h11v8H36v35h-8V29H17v-8h11z" className="fill-lapis stroke-lapis-edge" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

const CHIPS_SHOWN = 13;

function TestamentBlock({ data }: { data: LandingTestament }) {
  const shown = data.books.slice(0, CHIPS_SHOWN);
  const more = data.books.length - shown.length;
  const isOld = data.testament === 'OT';
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn('flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px]', isOld ? 'bg-green-tint' : 'bg-lapis-wash')}
        >
          {isOld ? <OldTestamentArt /> : <NewTestamentArt />}
        </span>
        <span className="flex flex-col">
          <h3 className="m-0 font-sans text-[17px] font-extrabold">{isOld ? 'Oude Testament' : 'Nieuwe Testament'}</h3>
          <span className="text-sm font-semibold text-ink-muted">{data.totalBooks} boeken</span>
        </span>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {shown.map((book) => (
          <li key={book.slug}>
            <Link
              href={`/quizzen?boek=${book.slug}`}
              className="inline-flex h-[34px] items-center whitespace-nowrap rounded-full border border-line bg-card px-3 text-sm font-bold text-ink-soft no-underline hover:border-input-line hover:text-ink"
            >
              {book.title}
            </Link>
          </li>
        ))}
        {more > 0 && (
          <li>
            <Link
              href="/quizzen"
              className="inline-flex h-[34px] items-center whitespace-nowrap rounded-full bg-lapis-tint px-3 text-sm font-extrabold no-underline"
            >
              + {more} meer
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

function QuizzesSection({ data }: { data: LandingData }) {
  const testaments = data.testaments.filter((entry) => entry.books.length > 0);
  return (
    <Container as="section" className={sectionTop}>
      <div className="flex flex-col items-start justify-between gap-4 m:flex-row m:items-end">
        <SectionHead
          title="Quizzen over elk bijbelboek"
          subtitle={`${data.quizCount ? `${data.quizCount} quizzen` : 'Quizzen'} over het Oude en Nieuwe Testament, per bijbelboek en per thema. De vragen gaan uit van de Statenvertaling.`}
        />
        <ArrowLink href="/quizzen">Alle quizzen</ArrowLink>
      </div>
      {data.featured.length > 0 && (
        <div className="mt-7 grid grid-cols-2 gap-5 m:grid-cols-4">
          {data.featured.map((quiz, index) => (
            <QuizCard
              key={quiz.id}
              href={quiz.href}
              title={quiz.title}
              reference={quiz.reference}
              questionCount={quiz.questionCount}
              imageUrl={quiz.imageUrl}
              seed={quiz.slug}
              kickerTone={KICKER_TONES[index % KICKER_TONES.length]}
            />
          ))}
        </div>
      )}
      {testaments.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-8 rounded-[16px] border border-line bg-card p-5 m:grid-cols-2 m:p-7">
          {testaments.map((entry) => (
            <TestamentBlock key={entry.testament} data={entry} />
          ))}
        </div>
      )}
    </Container>
  );
}

/* ── Samen spelen ────────────────────────────────────────────────────────── */

const GROUP_STEPS = [
  { title: 'Start een kamer', text: 'Kies een quiz en open de kamer op je telefoon of laptop.' },
  { title: 'Deel de code', text: 'Lees de code van 6 tekens voor of zet hem op het scherm.' },
  { title: 'Speel tegelijk', text: 'Iedereen beantwoordt dezelfde vraag. De stand is live te zien.' },
];

const ROOM_EXAMPLE = [
  { name: 'Lotte', score: 840, tone: 'coral' as const },
  { name: 'Daan', score: 790, tone: 'green' as const },
  { name: 'Alex', score: 760, tone: 'solid' as const, me: true },
  { name: 'Noor', score: 720, tone: 'gold' as const },
  { name: 'Ruben', score: 650, tone: 'lapis' as const },
];

function GroupSection() {
  return (
    <Container as="section" className={sectionTop}>
      <div className="grid grid-cols-1 items-center gap-14 m:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SectionHead
            title="Samen spelen met je groep"
            subtitle="Voor het gezin, de jeugdvereniging, catechisatie of de klas. Eén persoon start een kamer, de rest doet mee met de code."
          />
          <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
            {GROUP_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3.5">
                <span aria-hidden="true" className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-lapis-tint text-base font-extrabold text-lapis">
                  {index + 1}
                </span>
                <span className="flex flex-col gap-0.5 pt-[5px]">
                  <span className="text-[17px] font-extrabold">{step.title}</span>
                  <span className="text-[15px] font-semibold leading-[22px] text-ink-muted">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-3.5">
            <Button href="/samen-spelen" size="xl" className="px-6">
              Start een kamer
            </Button>
            <ArrowLink href="/groepslicentie" className="whitespace-normal">
              Groepslicentie voor kerken en scholen
            </ArrowLink>
          </div>
        </div>

        <div
          role="img"
          aria-label="Voorbeeld van een kamer met code K7P2QM: 14 spelers, vraag 6 van 10, Lotte staat eerste"
          className="min-w-0 overflow-hidden rounded-[16px] border border-line bg-card"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-[18px]">
            <span className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-ink-muted">Kamer</span>
              <span className="font-display text-2xl font-semibold leading-7 tracking-[0.1em]">K7P2QM</span>
            </span>
            <span className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-green-tint px-3 text-[13px] font-extrabold text-green-text">
              <PeopleIcon size={15} strokeWidth={2.4} className="text-green" />
              14 spelers
            </span>
          </div>
          <div className="flex items-center gap-3 border-b border-line-soft px-5 py-3.5">
            <span className="grid flex-1 grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index} className={cn('h-1.5 rounded-[3px]', index < 6 ? 'bg-lapis' : 'bg-segment')} />
              ))}
            </span>
            <span className="whitespace-nowrap text-[13px] font-extrabold text-ink-soft">Vraag 6 van 10</span>
          </div>
          <div className="px-5 pb-1 pt-3.5 text-xs font-extrabold text-ink-muted">Stand</div>
          <ol className="m-0 list-none p-0">
            {ROOM_EXAMPLE.map((player, index) => (
              <li
                key={player.name}
                className={cn('flex items-center gap-3 border-b border-line-soft px-5 py-2.5 last:border-b-0', player.me && 'bg-lapis-tint')}
              >
                <span className="w-5 shrink-0 text-center text-sm font-extrabold text-ink-soft">{index + 1}</span>
                <Avatar name={player.name} tone={player.tone} size={38} />
                <span className="min-w-0 flex-1 text-[15px] font-bold">{player.name}</span>
                <span className="tabular text-[15px] font-extrabold text-ink-soft">{player.score}</span>
              </li>
            ))}
          </ol>
          <div className="border-t border-line-soft px-5 pb-3.5 pt-3 text-[13px] font-bold text-ink-muted">en 9 andere spelers</div>
        </div>
      </div>
    </Container>
  );
}

/* ── Premium ─────────────────────────────────────────────────────────────── */

const PREMIUM_BENEFITS = ['Alle quizzen, zo vaak je wilt', 'Uitleg bij elk antwoord', 'Je antwoorden terugkijken na elke quiz'];

const LOCK_EXAMPLE = [
  { abbr: 'Gen', title: 'Genesis', testament: 'Oude Testament', tone: 'bg-green-tint text-green', free: true },
  { abbr: 'Ps', title: 'Psalmen', testament: 'Oude Testament', tone: 'bg-lapis-tint text-lapis', free: false },
  { abbr: 'Opb', title: 'Openbaring', testament: 'Nieuwe Testament', tone: 'bg-coral-tint text-coral-text', free: false },
];

function PremiumSection() {
  return (
    <Container as="section" className={sectionTop}>
      <div className="grid grid-cols-1 items-center gap-10 rounded-[16px] border border-line bg-card p-5 m:grid-cols-2 m:px-12 m:py-10">
        <div className="flex flex-col items-start gap-[22px]">
          <SectionHead
            title="Speel onbeperkt met Premium"
            subtitle="Je eerste 3 quizzen zijn gratis. Met Premium speel je alles, zo vaak je wilt."
          />
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {PREMIUM_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-base font-bold text-ink">
                <CheckDisc />
                {benefit}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3">
            <Link
              href="/premium"
              className={cn(
                buttonVariants({ size: 'xl' }),
                'border-b-lapis-pale bg-lapis-tint px-[22px] text-lapis-edge hover:bg-lapis-wash hover:text-lapis-edge',
              )}
            >
              Bekijk Premium
            </Link>
            <span className="text-sm font-bold text-ink-muted">7 dagen gratis proberen</span>
          </div>
        </div>

        <div
          role="img"
          aria-label="Gratis speel je 3 quizzen. Met Premium gaan alle bijbelboeken open, ook Psalmen en Openbaring."
          className="relative box-border flex min-w-0 justify-center pb-10 pt-7"
        >
          <span aria-hidden="true" className="absolute left-1/2 top-0 aspect-square w-[300px] max-w-full -translate-x-1/2 rounded-full bg-lapis-wash" />
          <span className="relative flex w-[320px] max-w-[92%] -rotate-2 flex-col rounded-[16px] border border-line bg-card px-4 pb-1.5 pt-3 shadow-float">
            <span className="pb-0.5 text-xs font-extrabold text-ink-muted">Quizzen</span>
            {LOCK_EXAMPLE.map((row) => (
              <span key={row.title} className="flex items-center gap-3 border-b border-line-soft py-2.5 last:border-b-0">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-extrabold', row.tone)}>{row.abbr}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-extrabold">{row.title}</span>
                  <span className="text-xs font-semibold text-ink-muted">{row.testament}</span>
                </span>
                {row.free ? (
                  <span className="flex h-6 items-center rounded-full bg-green-tint px-[9px] text-xs font-extrabold text-green">Gratis</span>
                ) : (
                  <span className="flex h-6 items-center gap-1 rounded-full bg-gold-tint px-[9px] text-xs font-extrabold text-gold-text">
                    <LockIcon size={13} className="text-ink-faint" />
                    Premium
                  </span>
                )}
              </span>
            ))}
          </span>
          <span className="absolute bottom-2 right-[8%] flex h-10 rotate-3 items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-3.5 text-sm font-extrabold text-gold-ink shadow-float">
            <CrownIcon size={16} className="fill-white text-gold-ink" />
            Met Premium alles open
          </span>
        </div>
      </div>
    </Container>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────────── */

export const LANDING_FAQ: (FaqItem & { text: string })[] = [
  {
    question: 'Is BijbelQuiz gratis?',
    text: 'Je speelt 3 quizzen gratis, zonder account. Daarna kun je Premium 7 dagen gratis proberen. Word je uitgedaagd voor een duel, dan speel je dat altijd gratis.',
  },
  {
    question: 'Heb ik een account nodig?',
    text: 'Niet om te beginnen. Met een account bewaar je je XP, je reeks en je duels. Inloggen kan met Google, Apple of je e-mailadres.',
  },
  {
    question: 'Welke bijbelvertaling gebruiken jullie?',
    text: 'De vragen gaan uit van de Statenvertaling. Bij elk antwoord staat de bijbelverwijzing, zodat je het zelf kunt nalezen.',
  },
  {
    question: 'Werkt het op mijn telefoon?',
    text: 'Ja. Je speelt in de browser op elk apparaat, of in de app voor iPhone en Android.',
  },
  {
    question: 'Kan ik spelen met mijn klas of jeugdgroep?',
    text: 'Ja. Met samen spelen doen tot 20 spelers mee met één code. Voor kerken, scholen en jeugdgroepen is er een groepslicentie.',
  },
  {
    question: 'Hoe zeg ik Premium op?',
    text: 'Wanneer je wilt, via Profiel en dan Premium. Je houdt Premium tot het einde van de periode die je al betaald hebt.',
  },
].map((item) => ({ ...item, answer: item.text }));

function FaqSection() {
  return (
    <Container as="section" className={sectionTop}>
      <div className="grid grid-cols-1 items-start gap-x-14 gap-y-8 m:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
        <div className="flex flex-col items-start gap-4">
          <SectionHead title="Veelgestelde vragen" subtitle="Staat je vraag er niet bij? In de hulp vind je meer antwoorden." />
          <ArrowLink href="/hulp">Naar de hulp</ArrowLink>
        </div>
        <FaqList items={LANDING_FAQ} />
      </div>
    </Container>
  );
}

/* ── Closing band ────────────────────────────────────────────────────────── */

function OutlineStoreBadge({ href, eyebrow, label, icon }: { href: string; eyebrow: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-[52px] items-center gap-2.5 rounded-[12px] border border-white/55 pl-3.5 pr-4 text-white no-underline hover:bg-white/10 hover:text-white focus-visible:outline-white"
    >
      {icon}
      <span className="flex flex-col whitespace-nowrap leading-[1.15]">
        <span className="text-[11px] font-bold text-lapis-pale-strong">{eyebrow}</span>
        <span className="text-base font-extrabold">{label}</span>
      </span>
    </a>
  );
}

function ClosingBand() {
  return (
    <Container as="section" className="pb-[72px] pt-12 m:pt-20">
      <div className="relative flex flex-col items-center overflow-hidden rounded-[20px] bg-lapis p-5 py-10 text-center text-white m:px-12 m:py-14">
        <svg
          width={220}
          height={220}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="absolute -right-[30px] -top-10 text-white"
        >
          <path d="M2 5c3-1 6-1 10 1 4-2 7-2 10-1v14c-3-1-6-1-10 1-4-2-7-2-10-1z" />
          <path d="M12 6v14" />
        </svg>
        <h2 className="relative m-0 text-[32px] leading-[38px] text-white m:text-4xl m:leading-[42px]">Klaar voor je eerste quiz?</h2>
        <p className="relative mt-3 max-w-[600px] text-[17px] font-semibold leading-[26px] text-lapis-pale-strong">
          Speel direct in je browser of download de app. Je eerste 3 quizzen zijn gratis.
        </p>
        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button href="/quizzen" variant="inverse" size="xl" className="px-[30px]">
            Gratis beginnen
          </Button>
          <OutlineStoreBadge
            href={APP_STORE_URL}
            eyebrow="Download in de"
            label="App Store"
            icon={
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="6" y="2.5" width="12" height="19" rx="3" />
                <path d="M10.5 18.5h3" />
              </svg>
            }
          />
          {GOOGLE_PLAY_URL && (
            <OutlineStoreBadge
              href={GOOGLE_PLAY_URL}
              eyebrow="Ontdek het op"
              label="Google Play"
              icon={
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7.5 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.7 4.1a.8.8 0 0 0-1.2.7z" />
                </svg>
              }
            />
          )}
        </div>
      </div>
      <p className="mt-5 text-center text-[15px] font-semibold leading-[22px] text-ink-muted">
        Na een quiz verder lezen?{' '}
        <StudieLink passage={null} surface="landing_cta" label="BijbelStudie" icon={false} variant="primary" className="font-extrabold no-underline" />{' '}
        geeft het hoofdstuk erbij, van hetzelfde team.
      </p>
    </Container>
  );
}

export function LandingPage({ data }: { data: LandingData }) {
  return (
    <div className="overflow-x-clip">
      <Hero />
      <HowItWorks />
      <QuizzesSection data={data} />
      <GroupSection />
      <PremiumSection />
      <FaqSection />
      <ClosingBand />
    </div>
  );
}
