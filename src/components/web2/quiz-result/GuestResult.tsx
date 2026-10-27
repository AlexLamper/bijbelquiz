'use client';

import { useSyncExternalStore } from 'react';

import { Button, Spinner, type Crumb } from '@/components/bq';
import { BoltSolidIcon } from '@/components/bq/icons';
import type { StudiePassage } from '@/lib/ecosystem-links';
import { readPendingAttempts, type PendingAttempt } from '@/lib/pending-attempts';

import ReviewLock from './ReviewLock';
import { NextQuizButton, ResultActions, ResultLayout, ScoreCard, StudieCard } from './ResultView';

interface GuestResultProps {
  quizId: string;
  quizSlug: string;
  quizTitle: string;
  crumbs: Crumb[];
  nextQuizHref: string;
  passage: StudiePassage | null;
  /** `?gast=` - the parked attempt's key, when coming straight from the player. */
  attemptKey: number | null;
}

const subscribe = () => () => undefined;

function formatPlayedOn(timestamp: number): string {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }).format(
    new Date(timestamp),
  );
}

/**
 * The result page for a guest: the score of the attempt parked in this
 * browser (`pending-attempts.ts`), and the offer to keep it with an account.
 * Reviewing the answers is Premium, so that part is locked.
 */
export default function GuestResult({ quizId, quizSlug, quizTitle, crumbs, nextQuizHref, passage, attemptKey }: GuestResultProps) {
  // Read once on the client; the server render shows a spinner.
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      const attempts = readPendingAttempts().filter((attempt) => attempt.quizId === quizId);
      const match = attemptKey ? attempts.find((attempt) => attempt.completedAt === attemptKey) : undefined;
      const attempt = match ?? attempts[attempts.length - 1];
      return attempt ? JSON.stringify(attempt) : '';
    },
    () => null,
  );

  if (snapshot === null) {
    return (
      <div className="flex flex-1 items-center justify-center py-24" aria-busy="true">
        <Spinner />
      </div>
    );
  }

  const attempt = snapshot ? (JSON.parse(snapshot) as PendingAttempt) : null;

  if (!attempt) {
    return (
      <ResultLayout
        crumbs={crumbs}
        main={
          <section className="flex flex-col items-start gap-3 rounded-[16px] border border-line bg-card p-5 m:px-8 m:py-7">
            <h1 className="m-0 font-display text-[30px] font-semibold leading-9">Geen resultaat gevonden</h1>
            <p className="m-0 text-base font-semibold leading-6 text-ink-soft">
              Op dit apparaat staat geen score van {quizTitle}. Speel de quiz, of log in om je resultaten te zien.
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <Button href={`/quiz/${quizSlug}`}>Speel de quiz</Button>
              <Button href={`/inloggen?callbackUrl=${encodeURIComponent(`/quiz/${quizSlug}/beoordeling`)}`} variant="secondary">
                Inloggen
              </Button>
            </div>
          </section>
        }
        aside={null}
      />
    );
  }

  const hadWrongAnswers = attempt.score < attempt.totalQuestions;

  return (
    <ResultLayout
      crumbs={crumbs}
      main={
        <>
          <ScoreCard
            score={attempt.score}
            total={attempt.totalQuestions}
            quizTitle={quizTitle}
            playedOnLabel={formatPlayedOn(attempt.completedAt)}
            canReview={false}
          />
          <NextQuizButton href={nextQuizHref} />
          <ReviewLock score={attempt.score} total={attempt.totalQuestions} quizSlug={quizSlug} guest />
        </>
      }
      aside={
        <>
          {/* Played without an account: the score is real and parked in this
              browser. Both buttons land on the dashboard, where the attempt
              shows up once `PendingAttemptSync` has claimed it. */}
          <section
            aria-label="Bewaar je score"
            data-analytics-id="result_account_prompt"
            data-analytics-label="Bewaar je score"
            className="flex flex-col gap-3 rounded-[16px] border border-line bg-card px-[18px] py-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gold-tint">
                <BoltSolidIcon size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-[15px] font-bold">Bewaar je score en {attempt.xpPreview} XP</span>
                <span className="text-[13px] font-semibold text-ink-muted">Nog niet opgeslagen</span>
              </span>
            </div>
            <p className="m-0 text-sm font-semibold leading-[21px] text-ink-muted">
              Maak een gratis account of log in, dan wordt deze score direct bijgeschreven en telt hij mee voor je level, je reeks en de
              ranglijst.
            </p>
            <div className="flex flex-col gap-2">
              <Button href="/registreren?callbackUrl=%2Fdashboard" data-analytics-id="result_account_register" block>
                Gratis account aanmaken
              </Button>
              <Button href="/inloggen?callbackUrl=%2Fdashboard" data-analytics-id="result_account_login" variant="secondary" block>
                Inloggen
              </Button>
            </div>
          </section>
          <ResultActions replayHref={`/quiz/${quizSlug}`} duelHref="/duels" />
          <StudieCard passage={passage} quizSlug={quizSlug} hadWrongAnswers={hadWrongAnswers} />
        </>
      }
    />
  );
}
