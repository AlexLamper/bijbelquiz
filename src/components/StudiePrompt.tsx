'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import StudieLink from '@/components/StudieLink';
import { track } from '@/lib/analytics/client';
import type { StudiePassage } from '@/lib/ecosystem-links';

interface StudiePromptProps {
  passage: StudiePassage | null;
  quizSlug?: string | null;
}

const STORAGE_KEY = 'bq.studie-prompt';
const SHOW_AFTER_MS = 2500;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Two dismissals is an answer. Stop asking for a fortnight. */
const DISMISSALS_BEFORE_SNOOZE = 2;
const SNOOZE_MS = 14 * DAY_MS;

interface PromptState {
  lastShownAt: number;
  dismissals: number;
}

function readState(): PromptState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastShownAt: 0, dismissals: 0 };

    const parsed = JSON.parse(raw) as Partial<PromptState>;
    return {
      lastShownAt: typeof parsed.lastShownAt === 'number' ? parsed.lastShownAt : 0,
      dismissals: typeof parsed.dismissals === 'number' ? parsed.dismissals : 0,
    };
  } catch {
    // Private mode, cleared storage, or a browser that refuses outright. The
    // prompt simply behaves as if it has never been shown.
    return { lastShownAt: 0, dismissals: 0 };
  }
}

function writeState(state: PromptState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Not remembering is better than throwing on a result screen.
  }
}

/**
 * One card, after the quiz, pointing at the chapter it was about.
 *
 * The frequency cap is the whole design. A prompt after *every* quiz is what
 * the old lock badge was - shown four hundred times, dismissed in two seconds,
 * and it taught readers to look past exactly the spot this now occupies. Once a
 * day, and silent for a fortnight after two refusals, keeps it something a
 * reader still reads.
 *
 * It also waits: the score is the thing the player came for, and covering it at
 * the moment it appears would make the card the price of finishing a quiz.
 */
export default function StudiePrompt({ passage, quizSlug }: StudiePromptProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const state = readState();
    const now = Date.now();

    const snoozed =
      state.dismissals >= DISMISSALS_BEFORE_SNOOZE && now - state.lastShownAt < SNOOZE_MS;
    if (snoozed || now - state.lastShownAt < DAY_MS) return;

    const timer = window.setTimeout(() => {
      setVisible(true);
      writeState({ ...state, lastShownAt: Date.now() });
    }, SHOW_AFTER_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    const state = readState();
    writeState({ lastShownAt: state.lastShownAt, dismissals: state.dismissals + 1 });
    track('bijbelstudie_prompt_dismissed', { quizSlug: quizSlug || null });
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]">
      <div className="rounded-lg border border-rule bg-paper-raised p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Verder lezen
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Sluiten"
            className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 font-display text-lg leading-snug text-ink">
          {passage
            ? `Lees ${passage.book} ${passage.chapter} zelf`
            : 'Lees het bijbelgedeelte zelf'}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Op BijbelStudie staat het hoofdstuk met uitleg, leesplannen en ruimte voor
          je eigen aantekeningen. Gratis te lezen.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <StudieLink
            passage={passage}
            surface="interstitial"
            quizSlug={quizSlug}
            variant="primary"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-lapis px-4 text-sm font-medium text-ink-inverted transition-colors hover:bg-lapis/90"
            label={passage ? `Lees ${passage.book} ${passage.chapter}` : 'Naar BijbelStudie'}
          />
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-medium text-ink-muted underline decoration-rule underline-offset-4 transition-colors hover:text-ink"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
