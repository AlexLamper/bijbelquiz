import * as React from 'react';
import Link from 'next/link';

import { Avatar, BoltIcon, Button, FlameIcon, Pill, ProgressBar, ProgressRing, QuizCover, XpPill, quizMeta } from '@/components/bq';
import { cn } from '@/lib/utils';
import { playHref, type BrowseBook, type BrowseQuiz } from '@/lib/quiz-browse-shape';
import { BookIcon, CoatArt, CrossArt, CrownArt, OpenBookArt, SwordsIcon, TabletsArt } from './illustrations';

const nl = new Intl.NumberFormat('nl-NL');

/* ── Quiz van de dag ─────────────────────────────────────────────────────── */

export function QuizOfTheDayCard({ quiz }: { quiz: BrowseQuiz }) {
  const meta = [quiz.reference, quizMeta(quiz.questionCount)].filter(Boolean).join(' · ');
  return (
    <section
      aria-label="Quiz van de dag"
      className="relative flex min-h-[216px] flex-col justify-between gap-[22px] overflow-hidden rounded-[20px] bg-lapis px-8 py-7 text-white max-m:p-5"
    >
      <span
        aria-hidden="true"
        className="absolute right-10 top-1/2 -mt-[92px] hidden size-[184px] items-center justify-center rounded-full bg-lapis-soft m:flex"
      >
        {quiz.title === 'Jozef en zijn broers' ? (
          <CoatArt className="block" />
        ) : (
          <QuizCover
            title={quiz.title}
            imageUrl={quiz.cover}
            seed={quiz.slug}
            inset={false}
            className="size-[150px] !aspect-square rounded-full"
          />
        )}
      </span>
      <div className="relative flex max-w-[440px] flex-col gap-1.5 max-m:max-w-none">
        <span className="text-xs font-extrabold tracking-[0.06em] text-lapis-pale">QUIZ VAN DE DAG</span>
        <h2 className="m-0 text-[32px] leading-[38px] text-white">{quiz.title}</h2>
        {meta && <span className="text-[15px] font-semibold text-lapis-pale-strong">{meta}</span>}
      </div>
      <div className="relative flex items-center gap-3">
        <Button href={playHref(quiz)} variant="inverse" size="lg">
          Speel nu
        </Button>
        {quiz.rewardXp > 0 && <XpPill xp={quiz.rewardXp} size="lg" className="h-[30px] px-2.5" />}
      </div>
    </section>
  );
}

/* ── Kies een onderwerp ──────────────────────────────────────────────────── */

export interface TopicTile {
  key: 'ot' | 'nt' | 'algemeen' | 'themas';
  title: string;
  detail: string;
  href: string;
}

const TOPIC_LOOK: Record<TopicTile['key'], { circle: string; text: string; art: React.ReactNode }> = {
  ot: { circle: 'bg-green-tint', text: 'text-green-text', art: <TabletsArt className="absolute -bottom-2.5 -right-0.5" /> },
  nt: { circle: 'bg-lapis-wash', text: 'text-lapis-text', art: <CrossArt className="absolute -bottom-2 -right-1" /> },
  algemeen: { circle: 'bg-gold-tint', text: 'text-gold-text', art: <OpenBookArt className="absolute -bottom-3 -right-1.5" /> },
  themas: { circle: 'bg-coral-tint', text: 'text-coral-text', art: <CrownArt className="absolute -bottom-1.5 -right-0.5" /> },
};

export function TopicTiles({ tiles }: { tiles: TopicTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="m-0 text-[26px] leading-8">Kies een onderwerp</h2>
      <div className="grid grid-cols-2 gap-3 m:grid-cols-4">
        {tiles.map((tile) => {
          const look = TOPIC_LOOK[tile.key];
          return (
            <Link
              key={tile.key}
              href={tile.href}
              className="relative flex h-[104px] min-w-0 flex-col justify-between overflow-hidden rounded-[16px] border border-line bg-card px-4 py-3.5 text-ink no-underline transition-colors hover:border-input-line hover:text-ink"
            >
              <span aria-hidden="true" className={cn('absolute -bottom-7 -right-[22px] size-[116px] rounded-full', look.circle)} />
              <span className="relative max-w-[96px] text-base font-extrabold leading-5">{tile.title}</span>
              <span className={cn('relative text-[13px] font-bold', look.text)}>{tile.detail}</span>
              {look.art}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ── Level, XP en reeks ──────────────────────────────────────────────────── */

export interface LevelSummary {
  level: number;
  xp: number;
  progress: number;
  toNext: number | null;
  streak: number;
  quizzesPlayed: number;
}

export function LevelCard({ summary }: { summary: LevelSummary }) {
  const { level, xp, progress, toNext, streak, quizzesPlayed } = summary;
  return (
    <section aria-label="Jouw voortgang" className="overflow-hidden rounded-[16px] border border-line bg-card">
      <div className="flex flex-col gap-3 p-[18px]">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-gold-tint">
            <BoltIcon size={20} />
          </span>
          <span className="flex min-w-0 flex-grow flex-col gap-px">
            <span className="text-[17px] font-extrabold">Level {level}</span>
            <span className="text-[13px] font-semibold text-ink-muted">{nl.format(xp)} XP verzameld</span>
          </span>
        </div>
        <ProgressBar value={progress / 100} tone="gold" label={toNext === null ? 'Hoogste level' : `Voortgang naar level ${level + 1}`} />
        <span className="text-[13px] font-bold text-ink-muted">
          {toNext === null ? 'Je hebt het hoogste level bereikt' : `Nog ${nl.format(toNext)} XP tot level ${level + 1}`}
        </span>
      </div>
      <div className="grid grid-cols-2 border-t border-line-soft">
        <div className="flex items-center gap-2.5 border-r border-line-soft px-[18px] py-3.5">
          <FlameIcon size={20} className="shrink-0 text-coral" />
          <span className="flex flex-col">
            <span className="text-lg font-extrabold leading-[22px]">{nl.format(streak)}</span>
            <span className="text-xs font-bold text-ink-muted">{streak === 1 ? 'Dag op rij' : 'Dagen op rij'}</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5 px-[18px] py-3.5">
          <BookIcon size={20} className="shrink-0 text-lapis" />
          <span className="flex flex-col">
            <span className="text-lg font-extrabold leading-[22px]">{nl.format(quizzesPlayed)}</span>
            <span className="text-xs font-bold text-ink-muted">{quizzesPlayed === 1 ? 'Quiz gespeeld' : 'Quizzen gespeeld'}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

/* ── Verder spelen ───────────────────────────────────────────────────────── */

/**
 * The next quiz in the book the player is working through. Same shape as the
 * foundation `ContinueCard`, but the ring counts quizzes of the book, not
 * questions of a half-played quiz (the site keeps no half-played quizzes).
 */
export function ContinueBookCard({ next, book, played, total, allHref }: { next: BrowseQuiz; book: BrowseBook; played: number; total: number; allHref: string }) {
  const detail = [next.chapterFrom ? `Hoofdstuk ${next.chapterFrom}` : null, `${played}/${total}`].filter(Boolean).join(' · ');
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[20px] leading-[26px]">Verder spelen</h2>
        <Link href={allHref} className="text-sm font-extrabold no-underline">
          Alles
        </Link>
      </div>
      <Link
        href={playHref(next)}
        className="flex min-w-0 flex-col gap-3.5 rounded-[16px] border border-line bg-card p-4 text-ink no-underline transition-colors hover:border-input-line hover:text-ink"
      >
        <span className="flex items-center justify-between">
          <Pill tone="lapis" size="sm" className="h-auto px-2.5 py-[3px]">
            {book.title}
          </Pill>
          <ProgressRing value={total ? played / total : 0} size={32} label={`${played} van ${total} quizzen uit ${book.title} gespeeld`} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-display text-lg font-semibold leading-[22px]">{next.title}</span>
          <span className="text-[13px] font-bold text-lapis-text">{detail}</span>
        </span>
      </Link>
    </section>
  );
}

/* ── Duel: jouw beurt ────────────────────────────────────────────────────── */

export interface DuelTurn {
  id: string;
  opponentName: string;
  myScore: number;
  opponentScore: number;
  round: number;
}

export function DuelTurnCard({ duel }: { duel: DuelTurn }) {
  return (
    <section
      aria-label={`Duel met ${duel.opponentName}, jouw beurt`}
      className="flex items-center gap-3 rounded-[16px] border-[1.5px] border-coral-line bg-card px-4 py-3.5"
    >
      <span className="relative shrink-0">
        <Avatar name={duel.opponentName} tone="coral" size={46} />
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 flex size-[22px] items-center justify-center rounded-full border-2 border-card bg-card text-coral-strong shadow-[0_0_0_1px_var(--coral-line)]"
        >
          <SwordsIcon size={12} />
        </span>
      </span>
      <span className="flex min-w-0 flex-grow flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.06em] text-coral-text">
          <span aria-hidden="true" className="size-[7px] rounded-full bg-coral ring-[3px] ring-coral-tint" />
          JOUW BEURT
        </span>
        <span className="truncate text-base font-extrabold">{duel.opponentName} wacht op jou</span>
        <span className="whitespace-nowrap text-[13px] font-semibold text-ink-muted">
          Duel · {duel.myScore} - {duel.opponentScore} · ronde {duel.round}
        </span>
      </span>
      <Button href={`/duels/${duel.id}`} variant="danger" size="md" className="shrink-0" aria-label={`Speel je beurt tegen ${duel.opponentName}`}>
        Speel
      </Button>
    </section>
  );
}
