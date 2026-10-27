'use client';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { FaqList } from './FaqList';
import { HELP_QUESTIONS, POPULAR_SEARCHES, type HelpTopic } from './help-content';
import {
  BookIcon,
  ChevronRightIcon,
  CrownIcon,
  IconTile,
  PeopleIcon,
  PlayIcon,
  SearchIcon,
  ShieldCheckIcon,
  SwordsIcon,
  type TileTone,
} from './icons';

const TOPICS: { id: HelpTopic; title: string; text: string; tone: TileTone; icon: React.ReactNode }[] = [
  { id: 'start', title: 'Aan de slag', text: 'Een account maken, inloggen en je eerste quiz', tone: 'grey', icon: <PlayIcon /> },
  { id: 'quizzen', title: 'Quizzen en uitleg', text: 'Quizzen spelen, uitleg en bijbelverwijzingen', tone: 'lapis', icon: <BookIcon /> },
  { id: 'duels', title: 'Duels', text: 'Iemand uitdagen, om de beurt spelen en de stand', tone: 'coral', icon: <SwordsIcon /> },
  { id: 'samen', title: 'Samen spelen', text: 'Een kamer starten en meedoen met een code', tone: 'green', icon: <PeopleIcon /> },
  { id: 'premium', title: 'Premium en betalen', text: 'Proefperiode, opzeggen en de groepslicentie', tone: 'gold', icon: <CrownIcon /> },
  { id: 'account', title: 'Account en privacy', text: 'Je gegevens en je account verwijderen', tone: 'grey', icon: <ShieldCheckIcon /> },
];

/** Lower case without accents, so "verifieren" finds "verifiëren". */
function normalise(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function openAnswer(id: string) {
  const element = document.getElementById(id);
  if (element instanceof HTMLDetailsElement) {
    element.open = true;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.querySelector('summary')?.focus({ preventScroll: true });
  }
}

/**
 * The interactive part of `/hulp`: the search box with popular searches, the
 * six topics and the FAQ. Searching or picking a topic filters the FAQ card in
 * place; a link like `/hulp#premium-opzeggen` opens that answer.
 */
export function HelpCenter() {
  const [query, setQuery] = React.useState('');
  const [topic, setTopic] = React.useState<HelpTopic | null>(null);
  const faqRef = React.useRef<HTMLElement>(null);

  // `/hulp#duel` from the contact page: open that answer once it is rendered.
  React.useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !HELP_QUESTIONS.some((item) => item.id === id)) return;
      setQuery('');
      setTopic(null);
      requestAnimationFrame(() => openAnswer(id));
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);

  const term = normalise(query.trim());
  const items = term
    ? HELP_QUESTIONS.filter((item) => normalise(`${item.question} ${item.text}`).includes(term))
    : topic
      ? HELP_QUESTIONS.filter((item) => item.topics.includes(topic))
      : HELP_QUESTIONS.filter((item) => item.featured);

  const activeTopic = TOPICS.find((entry) => entry.id === topic) ?? null;
  const heading = term ? 'Zoekresultaten' : activeTopic ? activeTopic.title : 'Veelgestelde vragen';
  const subtitle = term
    ? `${items.length === 1 ? '1 antwoord' : `${items.length} antwoorden`} voor "${query.trim()}".`
    : activeTopic
      ? activeTopic.text + '.'
      : 'De vragen die we het vaakst krijgen.';

  const showFaq = () => faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <section className="mx-auto w-full max-w-[1200px] px-4 pt-16 m:px-8">
        <div className="mx-auto flex max-w-[680px] flex-col items-center text-center">
          <h1 className="m-0 text-[32px] leading-[38px] m:text-[40px] m:leading-[48px]">Waar kunnen we je mee helpen?</h1>
          <form
            role="search"
            className="mt-6 w-full"
            onSubmit={(event) => {
              event.preventDefault();
              if (query.trim()) showFaq();
            }}
          >
            <label className="flex h-[60px] items-center gap-3 rounded-[14px] border border-line bg-card px-[18px] text-left focus-within:border-lapis focus-within:ring-2 focus-within:ring-lapis/25">
              <SearchIcon className="shrink-0 text-ink-faint" />
              <span className="sr-only">Zoek in de hulp</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Zoek in de hulp"
                className="h-14 min-w-0 flex-1 border-0 bg-transparent p-0 text-[17px] font-semibold text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
              />
            </label>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-0.5 text-sm font-bold text-ink-muted">Veel gezocht:</span>
            {POPULAR_SEARCHES.map((chip) => (
              <a
                key={chip.id}
                href={`#${chip.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  setQuery('');
                  setTopic(null);
                  history.replaceState(null, '', `#${chip.id}`);
                  requestAnimationFrame(() => openAnswer(chip.id));
                }}
                className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-line bg-card px-3.5 text-sm font-bold text-ink-soft no-underline hover:border-input-line hover:text-ink"
              >
                {chip.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="topics-title" className="mx-auto w-full max-w-[1200px] px-4 pt-12 m:px-8 m:pt-14">
        <h2 id="topics-title" className="m-0 font-sans text-[13px] font-extrabold uppercase tracking-[0.04em] text-ink-muted">
          Onderwerpen
        </h2>
        <ul className="m-0 mt-3.5 grid list-none grid-cols-1 gap-4 p-0 m:grid-cols-3">
          {TOPICS.map((entry) => {
            const selected = entry.id === topic && !term;
            return (
              <li key={entry.id} className="flex">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setQuery('');
                    setTopic(selected ? null : entry.id);
                    requestAnimationFrame(showFaq);
                  }}
                  className={cn(
                    'flex w-full items-start gap-4 rounded-[16px] border bg-card p-[22px] text-left text-ink transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
                    selected ? 'border-lapis' : 'border-line hover:border-input-line',
                  )}
                >
                  <IconTile tone={entry.tone} size={48}>
                    {entry.icon}
                  </IconTile>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px] pt-0.5">
                    <span className="text-[17px] font-extrabold">{entry.title}</span>
                    <span className="text-[15px] font-semibold leading-[22px] text-ink-muted">{entry.text}</span>
                  </span>
                  <ChevronRightIcon size={20} className="mt-3.5 shrink-0 text-ink-faint" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        ref={faqRef}
        aria-labelledby="faq-title"
        className="mx-auto w-full max-w-[1200px] scroll-mt-6 px-4 pt-12 m:px-8 m:pt-[72px]"
      >
        <div className="grid grid-cols-1 items-start gap-x-14 gap-y-8 m:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
          <div className="flex flex-col items-start gap-2">
            <h2 id="faq-title" className="m-0 text-[26px] leading-8">
              {heading}
            </h2>
            <p aria-live="polite" className="m-0 max-w-[640px] text-[17px] font-semibold leading-[26px] text-ink-muted">
              {subtitle}
            </p>
            {(term || activeTopic) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setTopic(null);
                }}
                className="mt-1 flex min-h-8 items-center gap-1 text-base font-extrabold text-lapis hover:text-lapis-edge"
              >
                Alle veelgestelde vragen
                <ChevronRightIcon size={18} strokeWidth={2.6} />
              </button>
            )}
          </div>
          {items.length > 0 ? (
            <FaqList key={`${term}|${topic ?? ''}`} items={items} openFirst={!term} />
          ) : (
            <div className="rounded-[16px] border border-line bg-card px-[22px] py-6 text-base font-semibold leading-[25px] text-ink-soft">
              Daar hebben we nog geen antwoord op. <Link href="/contact" className="font-extrabold no-underline">Stel je vraag</Link>,
              dan helpen we je verder.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
