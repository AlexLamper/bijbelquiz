import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Avatar, Button } from '@/components/bq';
import type { DuelView } from '@/lib/duels/service';
import { cn } from '@/lib/utils';
import { finishedLine, myTurnLine, opponentName, scoreLabel, waitingLine } from './format';

/**
 * The duel list blocks of `/duels`: the big "Jouw beurt" card and the rows
 * under "Wachten op tegenstander" and "Afgelopen". Server components; every
 * duel links to its play page `/duels/[id]`.
 */

export function duelHref(duel: Pick<DuelView, 'id'>): string {
  return `/duels/${duel.id}`;
}

/** Three dots, the played rounds filled in coral. */
export function RoundDots({ current, total, className }: { current: number; total: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex gap-1', className)}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={cn('size-2 rounded-full', index < current ? 'bg-coral-strong' : 'bg-segment')} />
      ))}
    </span>
  );
}

function OpponentAvatar({ duel, size }: { duel: DuelView; size: number }) {
  if (!duel.opponent) {
    return (
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-full bg-chip font-display font-semibold text-ink-muted"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      >
        ?
      </span>
    );
  }
  return <Avatar name={duel.opponent.name} size={size} title="" />;
}

export function MyTurnCard({ duel }: { duel: DuelView }) {
  const name = opponentName(duel);
  return (
    <div
      aria-label={`Duel met ${name}, ${duel.myScore} - ${duel.opponentScore}, ronde ${duel.currentRound} van ${duel.totalRounds}`}
      role="group"
      className="flex flex-col items-stretch gap-5 rounded-[16px] border-[1.5px] border-coral-line bg-card px-5 py-5 m:flex-row m:items-center m:gap-8 m:px-7 m:py-6"
    >
      <div className="grid min-w-0 grow grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <span className="flex flex-col items-center gap-1.5">
          <Avatar name={duel.me.name} tone="solid" size={56} title="" />
          <span className="text-[15px] font-extrabold">Jij</span>
        </span>
        <span className="flex flex-col items-center gap-2">
          <span className="whitespace-nowrap font-display text-[44px] font-semibold leading-none">{scoreLabel(duel)}</span>
          <span className="flex items-center gap-1.5">
            <RoundDots current={duel.currentRound} total={duel.totalRounds} />
            <span className="whitespace-nowrap text-[13px] font-bold text-ink-muted">
              Ronde {duel.currentRound} van {duel.totalRounds}
            </span>
          </span>
        </span>
        <span className="flex min-w-0 flex-col items-center gap-1.5">
          <OpponentAvatar duel={duel} size={56} />
          <span className="max-w-full truncate text-[15px] font-extrabold">{name}</span>
        </span>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2.5 m:w-60">
        <span className="text-center text-sm font-bold text-coral-text">{myTurnLine(duel)}</span>
        <Button href={duelHref(duel)} variant="danger" size="xl" block>
          Speel ronde {duel.currentRound}
        </Button>
      </div>
    </div>
  );
}

function ScoreChip({ duel, tone }: { duel: DuelView; tone: 'won' | 'neutral' }) {
  return (
    <span
      className={cn(
        'flex h-9 min-w-16 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] px-2.5 font-display text-lg font-semibold',
        tone === 'won' ? 'bg-green-tint text-green-text' : 'bg-chip text-ink-soft',
      )}
    >
      {scoreLabel(duel)}
    </span>
  );
}

function DuelRow({ duel, line, tone }: { duel: DuelView; line: string; tone: 'won' | 'neutral' | 'muted' }) {
  const showScore = duel.opponent !== null;
  return (
    <Link
      href={duelHref(duel)}
      className="flex items-center gap-3.5 border-b border-line-soft px-5 py-3.5 text-ink no-underline last:border-b-0 hover:bg-chip/60 hover:text-ink"
    >
      <OpponentAvatar duel={duel} size={44} />
      <span className="flex min-w-0 grow flex-col gap-px">
        <span className="truncate text-base font-bold">{opponentName(duel)}</span>
        <span className={cn('truncate text-sm font-semibold', tone === 'won' ? 'text-green' : 'text-ink-muted')}>{line}</span>
      </span>
      {showScore && <ScoreChip duel={duel} tone={tone === 'won' ? 'won' : 'neutral'} />}
      <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
}

export function WaitingList({ duels }: { duels: DuelView[] }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-card">
      {duels.map((duel) => (
        <DuelRow key={duel.id} duel={duel} line={waitingLine(duel)} tone="muted" />
      ))}
    </div>
  );
}

export function FinishedList({ duels }: { duels: DuelView[] }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-card">
      {duels.map((duel) => {
        const { text, tone } = finishedLine(duel);
        return <DuelRow key={duel.id} duel={duel} line={text} tone={tone} />;
      })}
    </div>
  );
}
