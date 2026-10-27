import * as React from 'react';
import Link from 'next/link';

import { Button, Container } from '@/components/bq';
import { supportEmail } from '@/lib/support-email';
import { BugReportForm } from './BugReportForm';
import { BookIcon, BugIcon, HomeIcon, IconTile, PeopleIcon, SwordsIcon, TrophyIcon } from './icons';

/**
 * P-Foutmelding: the page for "this went wrong" - the 404 page, the error
 * boundary and `/foutmelding`. A short message with the way home on the left,
 * a "Waar wil je naartoe?" card with the four main sections on the right, and
 * under it the card to report the problem.
 *
 * No hooks, so it renders inside server pages and the client error boundary.
 */
export interface ErrorScreenProps {
  kicker: string;
  title: string;
  text: string;
  /** "VRAAG 404" on the card, a wink at the quiz question card. */
  cardKicker?: string;
  /** Replaces the default "Naar home" button (the error page puts "Opnieuw proberen" first). */
  actions?: React.ReactNode;
  /** Label of the link that jumps to the report form. */
  reportLabel?: string;
  /** Where the page field of the report form comes from. */
  pageSource?: 'current' | 'referrer';
  /** The h1 gets this id (the report card heading is "Klopt er iets niet?"). */
  titleId?: string;
}

const DESTINATIONS = [
  { label: 'Quizzen', href: '/quizzen', icon: BookIcon, tone: 'text-lapis' },
  { label: 'Duels', href: '/duels', icon: SwordsIcon, tone: 'text-coral-strong' },
  { label: 'Samen spelen', href: '/samen-spelen', icon: PeopleIcon, tone: 'text-green' },
  { label: 'Ranglijst', href: '/ranglijst', icon: TrophyIcon, tone: 'text-gold-text' },
];

export function HomeButton() {
  return (
    <Button href="/" size="xl" className="px-6">
      <HomeIcon size={18} />
      Naar home
    </Button>
  );
}

export function ErrorScreen({
  kicker,
  title,
  text,
  cardKicker = 'VRAAG 404',
  actions,
  reportLabel = 'Meld deze fout',
  pageSource = 'current',
  titleId = 'err-title',
}: ErrorScreenProps) {
  const email = supportEmail();

  return (
    <Container className="flex flex-col gap-10 pb-12 pt-8 m:gap-[72px] m:pb-[88px] m:pt-[72px]">
      <div className="grid grid-cols-1 items-center gap-7 m:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] m:gap-10">
        <section aria-labelledby={titleId} className="flex min-w-0 flex-col items-start gap-4">
          <span className="text-[13px] font-extrabold tracking-[0.04em] text-ink-muted">{kicker}</span>
          <h1 id={titleId} className="m-0 text-[34px] leading-[42px] m:text-[48px] m:leading-[56px]">
            {title}
          </h1>
          <p className="m-0 max-w-[460px] text-[17px] font-semibold leading-[27px] text-ink-soft">{text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
            {actions ?? <HomeButton />}
            <a href="#melden" className="flex h-11 items-center text-base font-bold no-underline">
              {reportLabel}
            </a>
          </div>
        </section>

        <div className="relative h-[350px] w-full max-w-full justify-self-stretch m:h-[380px] m:w-[440px] m:justify-self-end">
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-2.5 -ml-40 size-80 rounded-full bg-lapis-wash m:-ml-[180px] m:size-[360px]"
          />
          <span aria-hidden="true" className="absolute right-[30px] top-[30px] size-10 rounded-full bg-gold-wash" />
          <nav
            aria-label="Waar wil je naartoe?"
            className="absolute left-1/2 top-[54px] -ml-[170px] flex w-[340px] flex-col gap-3.5 rounded-[18px] border border-line bg-card p-5 shadow-float"
          >
            <span aria-hidden="true" className="self-start rounded-full bg-lapis-tint px-[9px] py-[3px] text-xs font-extrabold tracking-[0.04em] text-lapis-edge">
              {cardKicker}
            </span>
            <span className="font-display text-2xl font-semibold leading-[30px]">Waar wil je naartoe?</span>
            <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
              {DESTINATIONS.map(({ label, href, icon: Icon, tone }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex h-14 items-center justify-center gap-2 rounded-[12px] border border-line border-b-[3px] border-b-edge bg-card text-base font-extrabold whitespace-nowrap text-ink no-underline hover:bg-chip hover:text-ink"
                  >
                    <Icon size={18} className={tone} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <section
        id="melden"
        aria-labelledby="report-title"
        className="scroll-mt-24 rounded-[16px] border border-line bg-card px-5 py-6 m:p-10"
      >
        <div className="grid grid-cols-1 items-start gap-7 m:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] m:gap-12">
          <div className="flex flex-col gap-2.5">
            <IconTile tone="coral">
              <BugIcon />
            </IconTile>
            <h2 id="report-title" className="mt-1.5 text-[26px] leading-8">
              Klopt er iets niet?
            </h2>
            <p className="m-0 text-base font-semibold leading-[25px] text-ink-soft">
              Meld het, dan lossen we het op. Vertel wat je deed, wat er misging en op welke pagina het gebeurde.
            </p>
            <p className="mt-1 text-[15px] font-semibold leading-[23px] text-ink-muted">
              Liever mailen?{' '}
              <a href={`mailto:${email}`} className="break-all font-bold underline">
                {email}
              </a>
            </p>
          </div>
          <BugReportForm pageSource={pageSource} />
        </div>
      </section>
    </Container>
  );
}
