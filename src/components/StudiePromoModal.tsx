'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, GraduationCap, Sparkles, X } from 'lucide-react';

import { BijbelStudieLogo } from '@/components/BijbelStudieMark';
import { Eyebrow } from '@/components/editorial';
import StudieLink from '@/components/StudieLink';
import StudiePromoCode from '@/components/StudiePromoCode';
import { track } from '@/lib/analytics/client';
import { studiePromo, type StudiePassage } from '@/lib/ecosystem-links';

interface StudiePromoModalProps {
  passage: StudiePassage | null;
  quizSlug?: string | null;
}

const STORAGE_KEY = 'bq.studie-modal';
/** Long enough to read the score first; the popup is not the price of finishing. */
const SHOW_AFTER_MS = 3000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const FEATURES = [
  { icon: BookOpen, title: 'Commentaar bij elk hoofdstuk', text: 'Uitleg naast de tekst die je leest.' },
  { icon: GraduationCap, title: 'Begeleide studies', text: 'Per bijbelboek, in korte lessen.' },
  { icon: Sparkles, title: 'AI-assistent', text: 'Stel je vraag over wat je leest.' },
];

function readLastShown(): number {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    // Private mode or storage switched off: behave as if it was never shown.
    return 0;
  }
}

function writeLastShown(at: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(at));
  } catch {
    // Not remembering is better than throwing on a result screen.
  }
}

/**
 * The big introduction to BijbelStudie, after a finished quiz.
 *
 * This replaced a small corner card (`StudiePrompt`) that was shown at most
 * once a day and went quiet for a fortnight after two refusals. BijbelQuiz now
 * exists to send readers to BijbelStudie, and that card earned two clicks in
 * its first week, so the product decision (2026-09-16) is a real popup: on the
 * first quiz a browser ever finishes, then at most once a week.
 *
 * It is only ever raised by finishing a quiz, never on page load. Quiz pages
 * are where search visitors land, and a popup that covers a page the moment it
 * opens is what search engines mark down on mobile.
 */
export default function StudiePromoModal({ passage, quizSlug }: StudiePromoModalProps) {
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const promo = studiePromo();

  const dismiss = (via: 'close' | 'later' | 'backdrop' | 'escape') => {
    setVisible(false);
    track('bijbelstudie_prompt_dismissed', { quizSlug: quizSlug || null, via });
  };

  // Following a link out is not a refusal: close without counting a dismissal.
  const closeQuietly = () => setVisible(false);

  useEffect(() => {
    const lastShown = readLastShown();
    if (lastShown > 0 && Date.now() - lastShown < WEEK_MS) return;

    const timer = window.setTimeout(() => {
      setVisible(true);
      writeLastShown(Date.now());
      track('bijbelstudie_prompt_shown', { quizSlug: quizSlug || null, withOffer: Boolean(promo) });
    }, SHOW_AFTER_MS);

    return () => window.clearTimeout(timer);
    // Decided once per result screen; a re-render must not restart the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) return;

    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss('escape');
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 p-3 sm:items-center sm:p-6"
      onClick={() => dismiss('backdrop')}
    >
      {/* A column with a scrolling body and a fixed foot: however short the
          screen, the button to BijbelStudie and the way out stay in view. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studie-promo-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[580px] flex-col overflow-hidden rounded-lg border border-rule bg-paper-raised outline-none sm:max-h-[calc(100dvh-3rem)]"
      >
        <button
          type="button"
          onClick={() => dismiss('close')}
          aria-label="Sluiten"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          <div className="px-5 pt-6 sm:px-7 sm:pt-7">
            <BijbelStudieLogo />

            <Eyebrow className="mt-5 flex">Van hetzelfde team als BijbelQuiz</Eyebrow>

            <h2
              id="studie-promo-title"
              className="mt-3 font-display text-[25px] font-normal leading-[1.12] tracking-[-0.02em] text-ink sm:text-[30px]"
            >
              {passage
                ? `Lees ${passage.book} ${passage.chapter} met uitleg erbij`
                : 'Lees de Bijbel met uitleg erbij'}
            </h2>

            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              De quiz laat zien wat je weet. Op BijbelStudie lees je het hoofdstuk zelf, met
              commentaar, begeleide studies en een AI-assistent voor je vragen. Gratis te gebruiken,
              in je browser en op je telefoon.
            </p>
          </div>

          {/* Too small to read on a phone, where it only pushes the offer down. */}
          <div className="relative mx-7 mt-5 hidden aspect-[16/6] overflow-hidden rounded-md border border-rule bg-paper-sunken sm:block">
            <Image
              src="/images/bijbelstudie/lezen.webp"
              alt="Genesis 1 in BijbelStudie, met het commentaar van Matthew Henry ernaast"
              fill
              sizes="520px"
              className="object-cover object-left-top"
            />
          </div>

          <ul className="mx-5 mt-5 grid gap-3 sm:mx-7 sm:grid-cols-3 sm:gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 sm:block">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-lapis sm:mt-0" aria-hidden />
                <div className="sm:mt-2">
                  <p className="text-sm font-medium text-ink">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          {promo && (
            <div className="mx-5 mt-6 rounded-lg border border-lapis/45 bg-paper p-4 sm:mx-7 sm:p-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Voor BijbelQuiz-spelers
              </p>
              <p className="mt-2 font-display text-lg leading-snug text-ink">{promo.headline}</p>
              <StudiePromoCode code={promo.code} surface="interstitial" className="mt-3" />
              <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">{promo.terms}</p>
              <StudieLink
                passage={null}
                surface="interstitial_offer"
                destination="pricing"
                quizSlug={quizSlug}
                label="Bekijk BijbelStudie Pro"
                onClick={closeQuietly}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-lapis underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-lapis"
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-rule px-5 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-7">
          <StudieLink
            passage={passage}
            surface="interstitial"
            quizSlug={quizSlug}
            variant="primary"
            newTab
            label={passage ? `Lees ${passage.book} ${passage.chapter} gratis` : 'Naar BijbelStudie'}
            onClick={closeQuietly}
          />
          <div className="flex items-center justify-between gap-4 sm:contents">
            <Link
              href="/bijbelstudie"
              onClick={closeQuietly}
              className="text-sm font-medium text-ink-soft underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink"
            >
              Meer over BijbelStudie
            </Link>
            <button
              type="button"
              onClick={() => dismiss('later')}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:ml-auto"
            >
              Niet nu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
