'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Check, Share2, X } from 'lucide-react';

import {
  AnswerButton,
  Avatar,
  BoltSolidIcon,
  Button,
  Modal,
  Pill,
  PlayHeader,
  Spinner,
  avatarToneFor,
  initialOf,
  toast,
  type AnswerState,
} from '@/components/bq';
import type { DuelQuestionView, DuelRoundView, DuelView, SubmitAnswerResult } from '@/lib/duels/service';
import { cn } from '@/lib/utils';
import {
  DuelApiError,
  answerRequest,
  createDuelRequest,
  declineRequest,
  errorMessage,
  forfeitRequest,
  getDuelRequest,
} from './api';
import { HomeButton } from '@/components/web2/quiz-result/HomeButton';
import { RoundDots } from './DuelCards';
import { opponentName, scoreLabel } from './format';
import { InviteLinkModal, type InviteLink } from './InviteLinkModal';

/**
 * One duel on the web (`/duels/[id]`), mirroring the app's duel screen.
 *
 * When it is the player's turn it plays the round: a scoreboard with only the
 * avatars, names, score and "Ronde X van 3 · vraag Y", the question, the
 * answer tiles (with "Jij" and the opponent on their picks once known) and a
 * white feedback sheet. Every answer is graded by the server the moment it is
 * picked, so leaving halfway loses nothing. Otherwise - and after a round -
 * it shows the overview: the score, what happens next and the rounds.
 */

type Phase = 'question' | 'overview';
type Outcome = SubmitAnswerResult['result'];

/** Errors after which the screen starts over from what the server says. */
const RELOAD_CODES = new Set([
  'QUESTION_MISMATCH',
  'NOT_YOUR_TURN',
  'ANSWER_ALREADY_SUBMITTED',
  'CONCURRENCY_CONFLICT',
  'DUEL_FINISHED',
]);

function playable(duel: DuelView): boolean {
  return duel.turn === 'me' && duel.nextQuestionIndex !== null;
}

const TONE_TEXT = {
  lapis: 'text-lapis',
  coral: 'text-coral-text',
  green: 'text-green-text',
  gold: 'text-gold-text',
  grey: 'text-ink-soft',
} as const;

const TONE_FILL = {
  lapis: 'bg-lapis-tint text-lapis',
  coral: 'bg-coral-tint text-coral-text',
  green: 'bg-green-tint text-green-text',
  gold: 'bg-gold-tint text-gold-text',
  grey: 'bg-chip text-ink-soft',
} as const;

export function DuelPlay({ initialDuel }: { initialDuel: DuelView }) {
  const router = useRouter();
  const [duel, setDuel] = useState(initialDuel);
  const [phase, setPhase] = useState<Phase>(() =>
    playable(initialDuel) && !initialDuel.canDecline ? 'question' : 'overview',
  );
  const [roundIndex, setRoundIndex] = useState(initialDuel.currentRound - 1);
  const [questionIndex, setQuestionIndex] = useState(initialDuel.nextQuestionIndex ?? 0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pendingAnswerId, setPendingAnswerId] = useState<string | null>(null);
  const [justFinishedRound, setJustFinishedRound] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<'forfeit' | 'decline' | null>(null);
  const [invite, setInvite] = useState<InviteLink | null>(null);

  const enter = useCallback((next: DuelView) => {
    setDuel(next);
    setOutcome(null);
    setPendingAnswerId(null);
    if (playable(next) && !next.canDecline) {
      setRoundIndex(next.currentRound - 1);
      setQuestionIndex(next.nextQuestionIndex ?? 0);
      setPhase('question');
    } else {
      setPhase('overview');
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      enter(await getDuelRequest(duel.id));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [duel.id, enter]);

  const startRound = () => {
    if (!playable(duel)) return;
    setRoundIndex(duel.currentRound - 1);
    setQuestionIndex(duel.nextQuestionIndex ?? 0);
    setOutcome(null);
    setPendingAnswerId(null);
    setJustFinishedRound(null);
    setPhase('question');
    window.scrollTo({ top: 0 });
  };

  const answer = async (answerId: string) => {
    if (pendingAnswerId || outcome) return;
    setPendingAnswerId(answerId);
    try {
      const result = await answerRequest(duel.id, { roundIndex, questionIndex, answerId });
      setDuel(result.duel);
      setOutcome(result.result);
    } catch (error) {
      setPendingAnswerId(null);
      toast.error(errorMessage(error));
      if (error instanceof DuelApiError && RELOAD_CODES.has(error.code)) void reload();
    }
  };

  const next = () => {
    if (!outcome) return;
    const sameRound = playable(duel) && duel.currentRound - 1 === roundIndex;
    if (!outcome.roundComplete && sameRound) {
      setQuestionIndex(duel.nextQuestionIndex ?? 0);
      setOutcome(null);
      setPendingAnswerId(null);
      window.scrollTo({ top: 0 });
      return;
    }
    setJustFinishedRound(outcome.roundComplete ? roundIndex : null);
    setOutcome(null);
    setPendingAnswerId(null);
    setPhase('overview');
    window.scrollTo({ top: 0 });
  };

  const runAction = async (action: () => Promise<DuelView>) => {
    setBusy(true);
    try {
      enter(await action());
      setJustFinishedRound(null);
    } catch (error) {
      toast.error(errorMessage(error));
      if (error instanceof DuelApiError && RELOAD_CODES.has(error.code)) void reload();
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const rematch = async () => {
    if (!duel.opponent) return;
    setBusy(true);
    try {
      const result = await createDuelRequest({ mode: 'friend', opponentId: duel.opponent.id });
      router.push(`/duels/${result.duel.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
      setBusy(false);
    }
  };

  const shareInvite = () => {
    if (!duel.inviteToken) return;
    setInvite({ duelId: null, url: `${window.location.origin}/duel/${duel.inviteToken}`, message: null });
  };

  const round = duel.rounds[roundIndex];
  const question: DuelQuestionView | undefined = outcome ?? round?.questions[questionIndex];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PlayHeader
        leaveLabel="Duel verlaten"
        leaveHref="/duels"
        icon={<X className="size-4" strokeWidth={2.6} aria-hidden="true" />}
      />

      {phase === 'question' && question && round ? (
        <QuestionScreen
          duel={duel}
          round={round}
          question={question}
          questionIndex={questionIndex}
          outcome={outcome}
          pendingAnswerId={pendingAnswerId}
          onAnswer={answer}
          onNext={next}
        />
      ) : (
        <Overview
          duel={duel}
          justFinishedRound={justFinishedRound}
          busy={busy || loading}
          onPlay={startRound}
          onDecline={() => setConfirm('decline')}
          onForfeit={() => setConfirm('forfeit')}
          onRematch={rematch}
          onShareInvite={shareInvite}
        />
      )}

      <Modal
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
        size="sm"
        title={confirm === 'decline' ? 'Duel afwijzen?' : duel.opponent ? 'Opgeven?' : 'Duel annuleren?'}
        description={
          confirm === 'decline'
            ? `${opponentName(duel)} krijgt te horen dat je niet meedoet. Dit duel telt niet mee voor je stand.`
            : duel.opponent
              ? `Als je opgeeft, wint ${opponentName(duel)} dit duel.`
              : 'Er doet nog niemand mee. Het duel verdwijnt uit je lijst.'
        }
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={() => setConfirm(null)} disabled={busy}>
              Terug
            </Button>
            <Button
              variant="danger"
              size="lg"
              loading={busy}
              onClick={() =>
                runAction(() => (confirm === 'decline' ? declineRequest(duel.id) : forfeitRequest(duel.id)))
              }
            >
              {confirm === 'decline' ? 'Afwijzen' : duel.opponent ? 'Opgeven' : 'Annuleren'}
            </Button>
          </>
        }
      />

      <InviteLinkModal invite={invite} onClose={() => setInvite(null)} />
    </div>
  );
}

/* ── Scoreboard ─────────────────────────────────────────────────────────── */

function Scoreboard({ duel, line }: { duel: DuelView; line: string }) {
  const name = opponentName(duel);
  return (
    <div
      role="group"
      aria-label={`Stand: jij ${duel.myScore}, ${name} ${duel.opponentScore}. ${line}.`}
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[16px] border border-line bg-card px-3.5 py-3 m:gap-4 m:px-5 m:py-4"
    >
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={duel.me.name} tone="solid" size={44} title="" className="max-m:!size-9 max-m:[&_span]:!text-[15px]" />
        <span className="truncate text-[15px] font-extrabold">Jij</span>
      </span>
      <span className="flex flex-col items-center gap-1.5" aria-hidden="true">
        <span className="whitespace-nowrap font-display text-[26px] font-semibold leading-none m:text-[34px]">{scoreLabel(duel)}</span>
        <span className="hidden whitespace-nowrap text-[13px] font-extrabold text-ink-muted m:block">{line}</span>
      </span>
      <span className="flex min-w-0 items-center justify-end gap-3">
        <span className="truncate text-[15px] font-extrabold">{name}</span>
        {duel.opponent ? (
          <Avatar name={duel.opponent.name} size={44} title="" className="max-m:!size-9 max-m:[&_span]:!text-[15px]" />
        ) : (
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chip font-display text-[15px] font-semibold text-ink-muted m:size-11 m:text-lg">
            ?
          </span>
        )}
      </span>
    </div>
  );
}

/* ── Question ───────────────────────────────────────────────────────────── */

function PickTag({ name, me }: { name: string; me: boolean }) {
  const tone = avatarToneFor(name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -right-1.5 -top-2.5 z-10 flex h-6 items-center gap-[5px] rounded-full border border-line bg-card pl-[3px] pr-[9px] text-xs font-extrabold',
        me ? 'text-lapis' : TONE_TEXT[tone],
      )}
    >
      <span
        className={cn(
          'flex size-[18px] shrink-0 items-center justify-center rounded-full font-display text-[10px] font-semibold',
          me ? 'bg-lapis text-white' : TONE_FILL[tone],
        )}
      >
        {initialOf(name)}
      </span>
      {me ? 'Jij' : name}
    </span>
  );
}

function QuestionScreen({
  duel,
  round,
  question,
  questionIndex,
  outcome,
  pendingAnswerId,
  onAnswer,
  onNext,
}: {
  duel: DuelView;
  round: DuelRoundView;
  question: DuelQuestionView;
  questionIndex: number;
  outcome: Outcome | null;
  pendingAnswerId: string | null;
  onAnswer: (answerId: string) => void;
  onNext: () => void;
}) {
  const line = `Ronde ${round.number} van ${duel.totalRounds} · vraag ${questionIndex + 1}`;
  const short = question.answers.every((option) => option.text.length <= 22);
  const myPick = outcome?.myAnswerId ?? pendingAnswerId;
  const theirPick = outcome?.opponentAnswerId ?? null;
  const name = opponentName(duel);

  const stateOf = (id: string): AnswerState => {
    if (outcome) {
      if (id === outcome.correctAnswerId) return 'correct';
      if (id === outcome.myAnswerId) return 'wrong';
      return 'muted';
    }
    if (pendingAnswerId) return id === pendingAnswerId ? 'selected' : 'muted';
    return 'idle';
  };

  return (
    <>
      <main className="mx-auto flex w-full max-w-[880px] grow flex-col gap-5 px-5 pb-10 pt-8 m:px-8">
        <span className="flex h-8 items-center self-center rounded-full border border-line bg-card px-3 text-[13px] font-extrabold text-ink-soft m:hidden">
          {line}
        </span>
        <Scoreboard duel={duel} line={line} />

        <section className="flex flex-col gap-3 rounded-[16px] border border-line bg-card px-5 py-5 shadow-card m:px-7 m:py-6">
          <Pill tone="green" size="md" kicker className="self-start">
            {round.topic}
          </Pill>
          <h1 className="m-0 text-[26px] leading-[34px] m:text-[28px] m:leading-9">{question.text}</h1>
        </section>

        <div
          role="group"
          aria-label="Antwoorden"
          className={cn('grid gap-3.5', short ? 'grid-cols-2' : 'grid-cols-1 m:grid-cols-2')}
        >
          {question.answers.map((option) => {
            const state = stateOf(option.id);
            const label = [
              option.text,
              option.id === myPick ? 'jouw antwoord' : null,
              option.id === theirPick ? `gekozen door ${name}` : null,
              state === 'correct' ? 'goed' : state === 'wrong' ? 'fout' : null,
            ]
              .filter(Boolean)
              .join(', ');
            return (
              <div key={option.id} className="relative">
                <AnswerButton
                  state={state}
                  onClick={() => onAnswer(option.id)}
                  disabled={!!pendingAnswerId || !!outcome}
                  aria-label={label}
                  className={cn('max-m:min-h-[84px] max-m:px-3 max-m:text-xl', pendingAnswerId === option.id && !outcome && 'animate-pulse')}
                >
                  {option.text}
                </AnswerButton>
                {myPick === option.id && <PickTag name={duel.me.name} me />}
                {theirPick === option.id && duel.opponent && (
                  <span className={cn(myPick === option.id && '[&>span]:right-auto [&>span]:-left-1.5')}>
                    <PickTag name={duel.opponent.name} me={false} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {pendingAnswerId && !outcome && <Spinner label="Antwoord controleren" className="self-center" />}
      </main>

      {outcome && <FeedbackSheet outcome={outcome} onNext={onNext} />}
    </>
  );
}

function FeedbackSheet({ outcome, onNext }: { outcome: Outcome; onNext: () => void }) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
    nextRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [outcome]);

  const correct = outcome.isCorrect;
  const rightAnswer = outcome.answers.find((option) => option.id === outcome.correctAnswerId)?.text;

  return (
    <section
      aria-label={correct ? 'Goed antwoord' : 'Fout antwoord'}
      aria-live="polite"
      className="shrink-0 border-t border-line bg-card shadow-[0_-4px_16px_rgba(27,26,24,0.06)]"
    >
      <div className="mx-auto flex max-w-[880px] flex-col items-stretch gap-6 px-5 pb-7 pt-6 m:flex-row m:items-center m:gap-8 m:px-8">
        <div className="flex min-w-0 grow flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'flex items-center gap-2.5 font-display text-2xl font-semibold',
                correct ? 'text-green-text' : 'text-coral-text',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full text-white',
                  correct ? 'bg-green' : 'bg-coral-strong',
                )}
              >
                {correct ? (
                  <Check className="size-[18px]" strokeWidth={3.2} aria-hidden="true" />
                ) : (
                  <X className="size-[18px]" strokeWidth={3.2} aria-hidden="true" />
                )}
              </span>
              {correct ? 'Goed!' : 'Helaas!'}
            </span>
            {outcome.xpEarned > 0 && (
              <Pill tone="gold" size="lg" icon={<BoltSolidIcon size={14} />}>
                +{outcome.xpEarned} XP
              </Pill>
            )}
          </div>
          {!correct && rightAnswer && (
            <p className="m-0 text-base font-semibold leading-6 text-ink-body">
              Het goede antwoord is <strong className="font-extrabold text-ink">{rightAnswer}</strong>.
            </p>
          )}
          {outcome.explanation && (
            <p className="m-0 max-w-[62ch] text-base font-semibold leading-6 text-ink-body">{outcome.explanation}</p>
          )}
          {outcome.bibleReference && <ReadReference reference={outcome.bibleReference} />}
        </div>
        <Button ref={nextRef} size="xl" onClick={onNext} className="w-full shrink-0 m:w-60">
          {outcome.roundComplete ? 'Bekijk de stand' : 'Volgende vraag'}
        </Button>
      </div>
    </section>
  );
}

const verseCache = new Map<string, string | null>();

/** "Lees Richteren 7:7": opens the verse text right below. */
function ReadReference({ reference }: { reference: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null | undefined>(verseCache.get(reference));
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (verseCache.has(reference)) {
      setText(verseCache.get(reference));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/bible/verse?ref=${encodeURIComponent(reference)}&version=sv`);
      const payload = response.ok ? await response.json() : null;
      const verse = typeof payload?.text === 'string' && payload.text.trim() ? payload.text.trim() : null;
      verseCache.set(reference, verse);
      setText(verse);
    } catch {
      verseCache.set(reference, null);
      setText(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border-0 bg-lapis-tint px-3 text-sm font-extrabold text-lapis hover:bg-lapis-wash"
      >
        {loading ? <Spinner size={14} label="Tekst laden" /> : <BookOpen className="size-3.5" strokeWidth={2.4} aria-hidden="true" />}
        {open ? `Verberg ${reference}` : `Lees ${reference}`}
      </button>
      {open && !loading && (
        <p className="m-0 max-w-[62ch] rounded-[12px] bg-chip px-3.5 py-3 text-[15px] font-semibold leading-6 text-ink-body">
          {text ?? 'De tekst kon niet worden opgehaald.'}
        </p>
      )}
    </div>
  );
}

/* ── Overview ───────────────────────────────────────────────────────────── */

function statusCopy(duel: DuelView, justFinishedRound: number | null): { title: string; body: string } {
  const name = opponentName(duel);
  const finishedRound = justFinishedRound !== null ? duel.rounds[justFinishedRound] : null;
  const roundLine = finishedRound
    ? `Ronde ${finishedRound.number} klaar: ${finishedRound.myScore} van ${finishedRound.myResults.length} goed`
    : null;
  const current = duel.rounds[duel.currentRound - 1];

  if (duel.status === 'finished') {
    switch (duel.endReason) {
      case 'declined':
        return {
          title: duel.isChallenger ? `${name} wees het duel af` : 'Je wees dit duel af',
          body: 'Dit duel telt niet mee voor je stand.',
        };
      case 'cancelled':
        return { title: 'Duel geannuleerd', body: 'Er deed niemand mee, dus dit duel telt niet mee.' };
      case 'expired':
        return { title: 'Duel verlopen', body: 'Er is een week niet gespeeld. Dit duel telt niet mee.' };
      default: {
        const title =
          duel.outcome === 'won' ? 'Gewonnen!' : duel.outcome === 'lost' ? 'Verloren' : duel.outcome === 'tie' ? 'Gelijkspel' : 'Afgelopen';
        const reason =
          duel.endReason === 'forfeit'
            ? duel.outcome === 'won'
              ? `${name} gaf op. `
              : 'Je gaf op. '
            : duel.endReason === 'timeout'
              ? duel.outcome === 'won'
                ? `${name} speelde een week niet. `
                : 'Je speelde een week niet. '
              : '';
        const xp = duel.xpEarned > 0 ? ` Je verdiende ${duel.xpEarned} XP in dit duel.` : '';
        const body = `${reason}Eindstand ${scoreLabel(duel)}.${xp}`;
        return { title, body: roundLine ? `${roundLine}. ${body}` : body };
      }
    }
  }

  if (duel.turn === 'me') {
    if (duel.canDecline) {
      return {
        title: `${name} daagt je uit`,
        body: `3 rondes van 3 vragen, om de beurt. Ronde ${duel.currentRound} gaat over ${current?.topic ?? 'de Bijbel'}.`,
      };
    }
    return {
      title: roundLine ?? 'Jij bent aan de beurt',
      body: roundLine
        ? `Je speelt ook ronde ${duel.currentRound}${current ? `, over ${current.topic}` : ''}.`
        : `Ronde ${duel.currentRound} van ${duel.totalRounds}${current ? ` gaat over ${current.topic}` : ''}.`,
    };
  }

  if (duel.turn === 'matching') {
    const invite = duel.mode === 'invite';
    let body = invite
      ? 'Zodra iemand je link opent en meedoet, speelt die dezelfde vragen. Je vriend speelt dit duel gratis.'
      : 'Zodra iemand anders een willekeurig duel start, spelen jullie tegen elkaar. Kijk later in Duels hoe het staat.';
    if (roundLine) body = `${invite ? 'Nu is het wachten tot je vriend meedoet.' : 'Nu zoeken we een tegenstander.'} ${body}`;
    return { title: roundLine ?? (invite ? 'Wacht tot je vriend meedoet' : 'We zoeken een tegenstander'), body };
  }

  return {
    title: roundLine ?? `${name} is aan de beurt`,
    body: roundLine
      ? `Nu is ${name} aan de beurt voor ronde ${duel.currentRound}. Kijk later in Duels hoe het staat.`
      : `${name} speelt ronde ${duel.currentRound}. Jullie spelen om de beurt, dus je hoeft niet tegelijk online te zijn.`,
  };
}

function roundScore(round: DuelRoundView): string {
  const played = round.myResults.some((mark) => mark !== 'pending') || round.opponentResults.some((mark) => mark !== 'pending');
  if (!played) return '-';
  const hidden = round.opponentResults.some((mark) => mark === 'hidden');
  return `${round.myScore} - ${hidden ? '?' : round.opponentScore}`;
}

function Overview({
  duel,
  justFinishedRound,
  busy,
  onPlay,
  onDecline,
  onForfeit,
  onRematch,
  onShareInvite,
}: {
  duel: DuelView;
  justFinishedRound: number | null;
  busy: boolean;
  onPlay: () => void;
  onDecline: () => void;
  onForfeit: () => void;
  onRematch: () => void;
  onShareInvite: () => void;
}) {
  const name = opponentName(duel);
  const { title, body } = statusCopy(duel, justFinishedRound);
  const finished = duel.status === 'finished';
  const myTurn = !finished && duel.turn === 'me';

  return (
    <main className="mx-auto flex w-full max-w-[880px] grow flex-col gap-5 px-5 pb-10 pt-8 m:px-8">
      <h1 className="m-0 truncate text-[26px] leading-8 m:text-[32px] m:leading-10">
        {duel.opponent ? `Duel met ${name}` : 'Nieuw duel'}
      </h1>

      <div
        role="group"
        aria-label={`Stand: jij ${duel.myScore}, ${name} ${duel.opponentScore}`}
        className={cn(
          'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-[16px] bg-card px-5 py-6 m:px-7',
          myTurn ? 'border-[1.5px] border-coral-line' : 'border border-line',
        )}
      >
        <span className="flex flex-col items-center gap-1.5">
          <Avatar name={duel.me.name} tone="solid" size={56} title="" />
          <span className="text-[15px] font-extrabold">Jij</span>
        </span>
        <span className="flex flex-col items-center gap-2" aria-hidden="true">
          <span className="whitespace-nowrap font-display text-[44px] font-semibold leading-none">{scoreLabel(duel)}</span>
          {finished ? (
            <span className="text-[13px] font-bold text-ink-muted">Afgelopen</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <RoundDots current={duel.currentRound} total={duel.totalRounds} />
              <span className="whitespace-nowrap text-[13px] font-bold text-ink-muted">
                Ronde {duel.currentRound} van {duel.totalRounds}
              </span>
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-col items-center gap-1.5">
          {duel.opponent ? (
            <Avatar name={duel.opponent.name} size={56} title="" />
          ) : (
            <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-chip font-display text-[22px] font-semibold text-ink-muted">
              ?
            </span>
          )}
          <span className="max-w-full truncate text-[15px] font-extrabold">{name}</span>
        </span>
      </div>

      <section aria-live="polite" className="flex flex-col gap-4 rounded-[16px] border border-line bg-card p-5 m:p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="m-0 text-[22px] leading-7">{title}</h2>
          <p className="m-0 text-base font-semibold leading-6 text-ink-muted">{body}</p>
        </div>
        <div className="flex flex-col gap-2.5 m:flex-row">
          {finished ? (
            <>
              {duel.opponent && (
                <Button variant="danger" size="lg" onClick={onRematch} loading={busy}>
                  Revanche
                </Button>
              )}
              <Button href="/duels#nieuw-duel" variant={duel.opponent ? 'secondary' : 'primary'} size="lg">
                Nieuw duel
              </Button>
            </>
          ) : myTurn ? (
            <>
              <Button variant="danger" size="lg" onClick={onPlay} disabled={busy}>
                Speel ronde {duel.currentRound}
              </Button>
              {duel.canDecline && (
                <Button variant="secondary" size="lg" onClick={onDecline} disabled={busy}>
                  Afwijzen
                </Button>
              )}
            </>
          ) : (
            <>
              {duel.turn === 'matching' && duel.inviteToken && (
                <Button variant="secondary" size="lg" onClick={onShareInvite}>
                  <Share2 className="size-[18px]" aria-hidden="true" />
                  Deel de link opnieuw
                </Button>
              )}
              <Button href="/duels" variant={duel.turn === 'matching' ? 'secondary' : 'primary'} size="lg">
                Terug naar duels
              </Button>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="rondes-titel" className="flex flex-col gap-2">
        <h2 id="rondes-titel" className="m-0 font-sans text-base font-extrabold">
          Rondes
        </h2>
        <ol className="m-0 flex list-none flex-col overflow-hidden rounded-[16px] border border-line bg-card p-0">
          {duel.rounds.map((round) => {
            const current = !finished && round.number === duel.currentRound;
            return (
              <li key={round.index} className="flex items-center gap-3 border-b border-line-soft px-5 py-3 last:border-b-0">
                <span className="flex min-w-0 grow flex-col">
                  <span className={cn('text-xs font-extrabold', current ? 'text-coral-text' : 'text-ink-muted')}>
                    Ronde {round.number}
                  </span>
                  <span className="truncate text-[15px] font-bold">{round.topic}</span>
                </span>
                <span
                  aria-label={`Jij ${round.myScore} goed`}
                  className="flex h-9 min-w-16 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] bg-chip px-2.5 font-display text-lg font-semibold text-ink-soft"
                >
                  {roundScore(round)}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="m-0 text-[13px] font-semibold leading-5 text-ink-muted">
          De antwoorden van je tegenstander zie je zodra jij dezelfde vraag hebt gespeeld.
        </p>
      </section>

      {duel.canForfeit && (
        <button
          type="button"
          onClick={onForfeit}
          disabled={busy}
          className="min-h-11 self-center rounded-[10px] border-0 bg-transparent px-3 text-[15px] font-extrabold text-coral-text hover:text-coral-strong"
        >
          {duel.opponent ? 'Opgeven' : 'Duel annuleren'}
        </button>
      )}

      {finished && <HomeButton href="/dashboard" />}
    </main>
  );
}
