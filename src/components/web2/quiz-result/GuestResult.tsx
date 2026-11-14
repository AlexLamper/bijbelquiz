'use client';

import { useSyncExternalStore } from 'react';

import { Button, Spinner, type Crumb } from '@/components/bq';
import { BoltSolidIcon } from '@/components/bq/icons';
import type { StudiePassage } from '@/lib/ecosystem-links';
import { readPendingAttempts, type PendingAttempt } from '@/lib/pending-attempts';

import ReviewLock from './ReviewLock';
import { HomeButton, NextQuizButton, ResultActions, ResultLayout, ScoreCard, StudieCard } from './ResultView';
import { isNlSite } from '@/config/site';
import { t } from '@/i18n';

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
  return new Intl.DateTimeFormat(t('bq.header.numberLocale'), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: isNlSite() ? 'Europe/Amsterdam' : undefined,
  }).format(
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
            <h1 className="m-0 font-display text-[30px] font-semibold leading-9">{t('result.guest.noneTitle')}</h1>
            <p className="m-0 text-base font-semibold leading-6 text-ink-soft">
              {t('result.guest.noneText', { title: quizTitle })}
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <Button href={`/quiz/${quizSlug}`}>{t('result.guest.playQuiz')}</Button>
              <Button href={`/inloggen?callbackUrl=${encodeURIComponent(`/quiz/${quizSlug}/beoordeling`)}`} variant="secondary">
                {t('bq.auth.login')}
              </Button>
            </div>
          </section>
        }
        aside={null}
        footer={<HomeButton href="/" />}
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
            aria-label={t('result.guest.saveAria')}
            data-analytics-id="result_account_prompt"
            data-analytics-label="Bewaar je score"
            className="flex flex-col gap-3 rounded-[16px] border border-line bg-card px-[18px] py-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gold-tint">
                <BoltSolidIcon size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-[15px] font-bold">{t('result.guest.saveTitle', { xp: attempt.xpPreview })}</span>
                <span className="text-[13px] font-semibold text-ink-muted">{t('result.guest.notSaved')}</span>
              </span>
            </div>
            <p className="m-0 text-sm font-semibold leading-[21px] text-ink-muted">
              {t('result.guest.saveText')}
            </p>
            <div className="flex flex-col gap-2">
              <Button href="/registreren?callbackUrl=%2Fdashboard" data-analytics-id="result_account_register" block>
                {t('result.guest.register')}
              </Button>
              <Button href="/inloggen?callbackUrl=%2Fdashboard" data-analytics-id="result_account_login" variant="secondary" block>
                {t('bq.auth.login')}
              </Button>
            </div>
          </section>
          <ResultActions replayHref={`/quiz/${quizSlug}`} playTogetherHref={`/samen-spelen?quiz=${quizId}`} />
          <StudieCard passage={passage} quizSlug={quizSlug} hadWrongAnswers={hadWrongAnswers} />
        </>
      }
      footer={<HomeButton href="/" />}
    />
  );
}
