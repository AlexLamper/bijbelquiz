import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, RefreshCw, Swords, Trophy } from 'lucide-react';

import { Breadcrumbs, Button, Disclosure, DisclosureList, ProgressBar, ResultDisc, type Crumb } from '@/components/bq';
import { BoltSolidIcon, FlameIcon } from '@/components/bq/icons';
import StudieLink from '@/components/StudieLink';
import { passageFromQuestion, type StudiePassage } from '@/lib/ecosystem-links';
import type { QuizReviewQuestion } from '@/lib/quiz-review';
import { cn } from '@/lib/utils';

/**
 * The pieces of the result page (W19 P-Beoordeling), shared by the signed-in
 * page (server) and the guest result (client, from the attempt parked in the
 * browser).
 */

export function ResultLayout({
  crumbs,
  main,
  aside,
}: {
  crumbs: Crumb[];
  main: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 pb-[72px] pt-7 m:px-8">
      <Breadcrumbs items={crumbs} />
      <div className="grid grid-cols-1 items-start gap-8 m:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-9">{main}</div>
        <aside aria-label="Volgende stap" className="flex min-w-0 flex-col gap-4 m:sticky m:top-6">
          {aside}
        </aside>
      </div>
    </div>
  );
}

/* ── Score ──────────────────────────────────────────────────────────────── */

function ScoreRing({ score, total }: { score: number; total: number }) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, score / total)) : 0;
  const circumference = 2 * Math.PI * 64;
  const tone = ratio >= 0.5 ? 'var(--green)' : 'var(--coral)';
  return (
    <div className="grid size-[148px] shrink-0 place-items-center self-center">
      <svg width="148" height="148" viewBox="0 0 148 148" fill="none" aria-hidden="true" className="[grid-area:1/1]">
        <circle cx="74" cy="74" r="64" stroke="var(--line-soft)" strokeWidth="12" />
        {ratio > 0 && (
          <circle
            cx="74"
            cy="74"
            r="64"
            stroke={tone}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(circumference * ratio).toFixed(2)} ${circumference.toFixed(2)}`}
            transform="rotate(-90 74 74)"
          />
        )}
      </svg>
      <span className="flex flex-col items-center [grid-area:1/1]">
        <span className="text-[40px] font-extrabold leading-[44px] tabular-nums">
          {score}/{total}
        </span>
        <span className="text-[13px] font-bold text-ink-muted">goed</span>
      </span>
    </div>
  );
}

export function ScoreCard({
  score,
  total,
  quizTitle,
  firstName,
  isNewBest,
  playedOnLabel,
  canReview,
}: {
  score: number;
  total: number;
  quizTitle: string;
  firstName?: string | null;
  isNewBest?: boolean;
  playedOnLabel?: string | null;
  canReview: boolean;
}) {
  return (
    <section
      aria-label={`Score ${score} van ${total}`}
      className="flex flex-col items-stretch gap-8 rounded-[16px] border border-line bg-card p-5 m:flex-row m:items-center m:px-8 m:py-7"
    >
      <ScoreRing score={score} total={total} />
      <div className="flex min-w-0 flex-col items-start gap-2.5">
        <h1 className="m-0 font-display text-[30px] font-semibold leading-9 m:text-[36px] m:leading-[44px]">
          {firstName ? `Mooi gespeeld, ${firstName}` : 'Mooi gespeeld!'}
        </h1>
        {isNewBest && (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-lapis-tint px-3 text-[13px] font-extrabold text-lapis">
            <Trophy className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
            Nieuwe beste score
          </span>
        )}
        <p className="m-0 mt-1 max-w-[56ch] text-base font-semibold leading-6 text-ink-soft">
          Je had {score} van de {total} vragen goed in {quizTitle}.
          {canReview ? ' Open een vraag voor de uitleg en de bijbeltekst.' : ''}
        </p>
        {playedOnLabel && <span className="text-[13px] font-semibold text-ink-muted">Gespeeld op {playedOnLabel}</span>}
      </div>
    </section>
  );
}

export function NextQuizButton({ href }: { href: string }) {
  return (
    <Button href={href} block className="h-[60px] rounded-[14px] text-[18px]">
      Volgende quiz
    </Button>
  );
}

/* ── Answers ────────────────────────────────────────────────────────────── */

function AnswersHeader({ score, total }: { score: number; total: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id="antwoorden" className="m-0 font-display text-[26px] font-semibold leading-8">
        Jouw antwoorden
      </h2>
      <span className="shrink-0 text-[15px] font-bold text-ink-muted">
        <span className="text-green">{score} goed</span> · <span className="text-coral-text">{total - score} fout</span>
      </span>
    </div>
  );
}

/** Every answer collapsed; open one for the explanation and the reference. */
export function AnswerList({
  questions,
  score,
  total,
  quizSlug,
}: {
  questions: QuizReviewQuestion[];
  score: number;
  total: number;
  quizSlug: string;
}) {
  return (
    <section aria-labelledby="antwoorden" className="flex flex-col gap-3.5">
      <AnswersHeader score={score} total={total} />
      <DisclosureList>
        {questions.map((question, index) => {
          const reference = question.bibleReference?.trim();
          const passage = reference ? passageFromQuestion({ bibleReference: reference }) : null;
          return (
            <Disclosure
              key={question.questionId}
              leading={<ResultDisc correct={question.isCorrect} />}
              trailing={<span className="text-green">{question.correctAnswerText}</span>}
              summary={
                <span className="flex flex-col">
                  <span className="text-[13px] font-extrabold text-ink-muted">Vraag {index + 1}</span>
                  <span className="text-base font-bold text-ink">{question.questionText}</span>
                </span>
              }
              bodyClassName="m:pl-[62px]"
            >
              <p className="m-0">
                {!question.isCorrect && (
                  <span className="mb-1.5 block text-sm font-bold text-coral-text">
                    {question.selectedAnswerText ? `Jouw antwoord: ${question.selectedAnswerText}` : 'Geen antwoord gegeven'}
                  </span>
                )}
                <span className="mb-1.5 block text-sm font-bold text-green m:hidden">
                  Goed antwoord: {question.correctAnswerText}
                </span>
                {question.explanation || 'Bij deze vraag staat geen uitleg.'}
              </p>
              {reference && reference !== '-' && (
                <StudieLink
                  passage={passage}
                  surface="review"
                  quizSlug={quizSlug}
                  icon={false}
                  label={
                    <>
                      <BookOpen className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                      {reference}
                    </>
                  }
                  className="inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-lapis-tint px-3 text-[13px] font-extrabold text-lapis no-underline hover:brightness-95"
                />
              )}
            </Disclosure>
          );
        })}
      </DisclosureList>
    </section>
  );
}

/**
 * What a free player sees instead of the answer list: the same card, with
 * placeholder rows under a blur and the Premium ask. Nothing in it comes from
 * the attempt - which answers were right stays on the server.
 */
export function AnswerListLocked({
  score,
  total,
  premiumHref,
}: {
  score: number;
  total: number;
  premiumHref: string;
}) {
  const rows = Math.min(Math.max(total, 3), 5);
  return (
    <section aria-labelledby="antwoorden" className="flex flex-col gap-3.5">
      <AnswersHeader score={score} total={total} />
      <div className="relative overflow-hidden rounded-[16px] border border-line bg-card">
        <div aria-hidden="true" className="pointer-events-none select-none blur-[5px]">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex items-center gap-3.5 border-b border-line-soft px-5 py-3.5 last:border-b-0">
              <span className="size-7 shrink-0 rounded-full bg-track" />
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-[13px] font-extrabold text-ink-muted">Vraag {index + 1}</span>
                <span className="h-3.5 rounded-full bg-segment" style={{ width: `${[78, 62, 70, 55, 66][index]}%` }} />
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/40 px-6 text-center">
          <span className="text-[17px] font-extrabold text-ink">Je antwoorden terugkijken is Premium</span>
          <span className="max-w-[44ch] text-sm font-semibold text-ink-muted">
            Zie bij elke vraag wat je koos, het goede antwoord en de uitleg met de bijbeltekst.
          </span>
          <Button variant="gold" size="md" className="mt-1" href={premiumHref}>
            Premium bekijken
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ── Side column ────────────────────────────────────────────────────────── */

function IconTile({ tone, children }: { tone: 'gold' | 'coral' | 'lapis'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-[10px]',
        tone === 'gold' && 'bg-gold-tint',
        tone === 'coral' && 'bg-coral-tint',
        tone === 'lapis' && 'bg-lapis-tint text-lapis',
      )}
    >
      {children}
    </span>
  );
}

export function ProgressCard({
  xpEarned,
  xpToNext,
  nextLevel,
  levelProgress,
  streak,
}: {
  xpEarned: number;
  /** Null at the top level. */
  xpToNext: number | null;
  nextLevel: number | null;
  /** 0..1 */
  levelProgress: number;
  /** The reeks and when to play next; null when there is none to keep. */
  streak: { days: number; hint: string } | null;
}) {
  return (
    <section aria-label="Jouw voortgang" className="flex flex-col rounded-[16px] border border-line bg-card">
      <div className="flex flex-col gap-3 px-[18px] py-4">
        <div className="flex items-center gap-3">
          <IconTile tone="gold">
            <BoltSolidIcon size={20} />
          </IconTile>
          <span className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="text-[15px] font-bold">
              {xpEarned > 0 ? `+${xpEarned} XP verdiend` : 'Geen nieuwe XP'}
            </span>
            <span className="text-[13px] font-semibold text-ink-muted">
              {xpEarned > 0 || xpToNext === null
                ? xpToNext !== null && nextLevel !== null
                  ? `Nog ${xpToNext} XP tot level ${nextLevel}`
                  : 'Je hebt het hoogste level bereikt'
                : 'Verbeter je beste score voor meer XP'}
            </span>
          </span>
        </div>
        {nextLevel !== null && (
          <ProgressBar value={levelProgress} tone="gold" label={`Voortgang naar level ${nextLevel}`} />
        )}
      </div>
      {streak && (
        <div className="flex items-center gap-3 border-t border-line-soft px-[18px] py-3.5">
          <IconTile tone="coral">
            <FlameIcon size={20} className="text-coral" />
          </IconTile>
          <span className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="text-[15px] font-bold">
              Reeks van {streak.days} {streak.days === 1 ? 'dag' : 'dagen'}
            </span>
            <span className="text-[13px] font-semibold text-ink-muted">{streak.hint}</span>
          </span>
        </div>
      )}
    </section>
  );
}

export function ResultActions({ replayHref, duelHref }: { replayHref: string; duelHref: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Button href={duelHref} variant="secondary" size="xl" block>
        <Swords className="size-[18px] text-coral-text" strokeWidth={2.2} aria-hidden="true" />
        Daag een vriend uit
      </Button>
      <Link
        href={replayHref}
        className="flex h-11 items-center justify-center gap-2 rounded-[12px] text-[15px] font-bold no-underline focus-visible:outline-2 focus-visible:outline-lapis"
      >
        <RefreshCw className="size-4" strokeWidth={2.4} aria-hidden="true" />
        Opnieuw spelen
      </Link>
    </div>
  );
}

export function StudieCard({
  passage,
  quizSlug,
  hadWrongAnswers,
}: {
  passage: StudiePassage | null;
  quizSlug: string;
  hadWrongAnswers: boolean;
}) {
  return (
    <section aria-label="Lees het hoofdstuk" className="flex flex-col gap-2.5 rounded-[16px] border border-line bg-card px-[18px] py-4">
      <div className="flex items-center gap-3">
        <IconTile tone="lapis">
          <BookOpen className="size-5" strokeWidth={2.2} aria-hidden="true" />
        </IconTile>
        <span className="text-[15px] font-bold">
          {passage ? `Lees ${passage.book} ${passage.chapter} met uitleg` : 'Lees verder in de Bijbel'}
        </span>
      </div>
      <p className="m-0 text-sm font-semibold leading-[21px] text-ink-muted">
        {hadWrongAnswers ? 'Waarom was het antwoord anders? ' : ''}Op BijbelStudie lees je het hele hoofdstuk met uitleg.
      </p>
      <StudieLink
        passage={passage}
        surface={hadWrongAnswers ? 'result_wrong_answers' : 'result_primary'}
        quizSlug={quizSlug}
        newTab
        icon={false}
        label={
          <>
            Naar BijbelStudie
            <ArrowUpRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </>
        }
        className="inline-flex items-center gap-1.5 self-start text-sm font-bold no-underline"
      />
    </section>
  );
}
