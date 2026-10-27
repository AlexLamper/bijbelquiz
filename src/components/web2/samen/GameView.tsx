'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Hourglass, X } from 'lucide-react';

import {
  AnswerButton,
  Avatar,
  Button,
  Card,
  Container,
  Modal,
  PlayHeader,
  ProgressBar,
  ProgressRing,
  ProgressSegments,
  initialOf,
  type AnswerState,
} from '@/components/bq';
import type { MultiplayerControllerConnectionStatus } from '@/lib/multiplayer-web/useMultiplayerRoomController';
import type { RoomCurrentQuestionSnapshot, RoomPlayerSnapshot, RoomSnapshot } from '@/lib/multiplayer/types';
import { cn } from '@/lib/utils';
import { playerName, standings } from './players';
import { ReadingCard } from './ReadingCard';
import { pointsLabel } from './quiz-display';

interface GameViewProps {
  room: RoomSnapshot;
  userId: string | null;
  isHost: boolean;
  canAnswer: boolean;
  isSubmittingAnswer: boolean;
  isSkipping: boolean;
  isLeaving: boolean;
  connectionStatus: MultiplayerControllerConnectionStatus;
  onAnswer: (questionId: string, answerId: string) => void;
  onSkip: () => void;
  onLeave: () => void;
  errorBar: React.ReactNode;
  debug: React.ReactNode;
}

/**
 * Turns the server's absolute deadlines into a "seconds left" countdown.
 *
 * The server publishes deadlines on its own clock, so the offset between it
 * and this browser is tracked and corrected for: a player whose system clock
 * is minutes off still sees the same timer as the rest of the room. While a
 * deadline is live this re-renders 4x a second, so the countdown is smooth
 * between polls.
 */
function useServerCountdown(serverTimeMs: number | null, active: boolean) {
  const offsetMsRef = useRef(0);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    if (serverTimeMs == null) return;
    offsetMsRef.current = Date.now() - serverTimeMs;
  }, [serverTimeMs]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);

  return useCallback(
    (serverDeadlineMs: number | null | undefined): number | null => {
      if (serverDeadlineMs == null || nowMs === 0) return null;
      return Math.max(0, Math.ceil((serverDeadlineMs + offsetMsRef.current - nowMs) / 1000));
    },
    [nowMs],
  );
}

/** Short answers sit two by two on a phone too, as in the design; long ones get a row each. */
function answersFitTwoUp(question: RoomCurrentQuestionSnapshot): boolean {
  return question.answers.every((answer) => answer.text.length <= 14);
}

function YouTag({ name }: { name: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-1.5 -top-[11px] z-10 flex h-6 items-center gap-[5px] rounded-full border border-line bg-card pl-[3px] pr-[9px] text-xs font-extrabold text-lapis"
    >
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-lapis font-display text-[10px] font-semibold text-white">
        {initialOf(name)}
      </span>
      Jij
    </span>
  );
}

function StatusLine({ children, tone = 'lapis' }: { children: React.ReactNode; tone?: 'lapis' | 'grey' }) {
  return (
    <p
      role="status"
      className="m-0 flex items-center gap-3 rounded-[12px] border border-line bg-card px-4 py-3.5 text-base font-semibold leading-[22px] text-ink-soft"
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          tone === 'lapis' ? 'bg-lapis-tint text-lapis' : 'bg-chip text-ink-muted',
        )}
      >
        {tone === 'lapis' ? <Check className="size-4" strokeWidth={2.8} /> : <Hourglass className="size-4" strokeWidth={2.4} />}
      </span>
      {children}
    </p>
  );
}

function QuestionCard({
  question,
  secondsLeft,
  timerSeconds,
}: {
  question: RoomCurrentQuestionSnapshot;
  secondsLeft: number | null;
  timerSeconds: number;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-[16px] border border-line bg-card px-7 py-6 shadow-card max-m:px-6">
      <div className="flex min-h-14 items-center justify-between gap-3">
        {question.bibleReference ? (
          <span className="rounded-full bg-lapis-tint px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.04em] text-lapis-edge">
            {question.bibleReference}
          </span>
        ) : (
          <span />
        )}
        {secondsLeft != null && timerSeconds > 0 && (
          <span role="timer" aria-label={`Nog ${secondsLeft} seconden`}>
            <ProgressRing
              value={secondsLeft / timerSeconds}
              size={56}
              thickness={6}
              tone={secondsLeft <= 5 ? 'coral' : 'lapis'}
            >
              {secondsLeft}
            </ProgressRing>
          </span>
        )}
      </div>
      <h1 className="m-0 text-[28px] leading-9">{question.text}</h1>
    </section>
  );
}

function PlayersCard({
  room,
  userId,
  revealed,
}: {
  room: RoomSnapshot;
  userId: string | null;
  revealed: boolean;
}) {
  const question = room.currentQuestion;
  const players = standings(room.players);
  const answered = room.players.filter((player) => player.hasAnswered).length;
  const correct = room.players.filter((player) => player.answeredCorrectly === true).length;
  const playing = room.status === 'in_progress' || room.status === 'question_result';

  let caption = 'Stand';
  if (question && revealed) caption = `Stand na vraag ${question.questionNumber}`;
  else if (question && question.questionNumber > 1) caption = `Stand na vraag ${question.questionNumber - 1}`;

  return (
    <aside aria-labelledby="spelers-titel" className="min-w-0 overflow-hidden rounded-[16px] border border-line bg-card">
      <div className={cn('flex flex-col gap-3 px-5 pt-5', playing ? 'border-b border-line-soft pb-[18px]' : 'pb-1')}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="spelers-titel" className="m-0 text-xl leading-[26px]">
            Spelers
          </h2>
          <span className="text-[15px] font-extrabold text-lapis-edge" aria-live="polite">
            {!playing
              ? `${room.players.length} spelers`
              : revealed
                ? `${correct} van ${room.players.length} goed`
                : `${answered} van ${room.players.length} geantwoord`}
          </span>
        </div>
        {playing && (
          <ProgressBar
            value={room.players.length ? (revealed ? correct : answered) / room.players.length : 0}
            tone={revealed ? 'green' : 'lapis'}
            label={revealed ? 'Spelers met een goed antwoord' : 'Spelers die hebben geantwoord'}
          />
        )}
      </div>
      <span className="block px-5 pb-1 pt-3.5 text-[13px] font-bold text-ink-muted">{caption}</span>
      <ol className="m-0 flex list-none flex-col p-0 pb-2">
        {players.map((player, index) => (
          <PlayerRow key={player.id} player={player} rank={index + 1} userId={userId} revealed={revealed} playing={playing} />
        ))}
      </ol>
    </aside>
  );
}

function PlayerRow({
  player,
  rank,
  userId,
  revealed,
  playing,
}: {
  player: RoomPlayerSnapshot;
  rank: number;
  userId: string | null;
  revealed: boolean;
  playing: boolean;
}) {
  const isMe = player.id === userId;

  let status: React.ReactNode = null;
  if (playing && revealed) {
    status =
      player.answeredCorrectly === true ? (
        <span aria-label="goed" className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-green-tint text-green">
          <Check className="size-3" strokeWidth={3.2} />
        </span>
      ) : player.answeredCorrectly === false ? (
        <span aria-label="fout" className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-coral-tint text-coral-text">
          <X className="size-3" strokeWidth={3.2} />
        </span>
      ) : (
        <span aria-label="geen antwoord" className="size-[22px] shrink-0 rounded-full border-2 border-dashed border-input-line" />
      );
  } else if (playing) {
    status = player.hasAnswered ? (
      <span aria-label="heeft geantwoord" className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-green-tint text-green">
        <Check className="size-3" strokeWidth={3.2} />
      </span>
    ) : (
      <span aria-label="denkt nog na" className="size-[22px] shrink-0 rounded-full border-2 border-dashed border-input-line" />
    );
  }

  return (
    <li
      aria-current={isMe || undefined}
      className={cn('flex items-center gap-3 px-5 py-2', isMe && 'bg-lapis-tint', !player.isConnected && 'opacity-55')}
    >
      <span className={cn('w-4 shrink-0 text-center text-sm font-extrabold', isMe ? 'text-lapis-edge' : 'text-ink-soft')}>{rank}</span>
      <Avatar
        name={player.name}
        size={36}
        tone={isMe ? 'lapis' : 'auto'}
        className={isMe ? '[&>span>span]:bg-card!' : undefined}
      />
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
        <span className="truncate text-[15px] font-bold">{playerName(player, userId)}</span>
        {!player.isConnected && <span className="shrink-0 text-xs font-bold text-ink-faint">offline</span>}
      </span>
      {revealed && player.scoreGained ? (
        <span className="shrink-0 text-[13px] font-extrabold text-green-text">+{player.scoreGained}</span>
      ) : null}
      {status}
      <span className={cn('w-10 shrink-0 text-right text-[15px] font-extrabold', isMe && 'text-lapis-edge')}>
        {pointsLabel(player.score, true)}
      </span>
    </li>
  );
}

export function GameView({
  room,
  userId,
  isHost,
  canAnswer,
  isSubmittingAnswer,
  isSkipping,
  isLeaving,
  connectionStatus,
  onAnswer,
  onSkip,
  onLeave,
  errorBar,
  debug,
}: GameViewProps) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const question = room.currentQuestion;
  const me = room.players.find((player) => player.id === userId) ?? null;

  const hasLiveDeadline =
    (room.status === 'in_progress' && question?.deadlineAtMs != null) ||
    (room.status === 'question_result' && room.resultPhaseEndsAtMs != null);
  const secondsUntil = useServerCountdown(room.serverTimeMs ?? null, hasLiveDeadline);

  const questionSeconds =
    room.status === 'in_progress' && question?.deadlineAtMs != null
      ? secondsUntil(question.deadlineAtMs) ?? question.remainingSeconds
      : null;
  const resultSeconds = room.status === 'question_result' ? secondsUntil(room.resultPhaseEndsAtMs) : null;

  const revealed = room.status === 'question_result' && question?.correctAnswerId != null;
  const isLastQuestion = question ? question.questionNumber >= question.totalQuestions : false;

  function answerState(answerId: string): AnswerState {
    if (!question) return 'idle';
    if (revealed) {
      if (answerId === question.correctAnswerId) return 'correct';
      if (answerId === question.yourAnswerId) return 'wrong';
      return 'muted';
    }
    if (question.yourAnswerId) return answerId === question.yourAnswerId ? 'selected' : 'muted';
    return 'idle';
  }

  let main: React.ReactNode;

  if (room.status === 'reading') {
    main = <ReadingCard passage={room.passage} isHost={isHost} onStart={onSkip} isStarting={isSkipping} />;
  } else if (!question) {
    main = <StatusLine tone="grey">Even geduld, de volgende vraag wordt geladen...</StatusLine>;
  } else {
    const twoUp = answersFitTwoUp(question);
    const totalResponses = question.answers.reduce((sum, answer) => sum + (answer.count ?? 0), 0);
    const correctCount = room.players.filter((player) => player.answeredCorrectly === true).length;
    const viewerAnswer = question.yourAnswerId;
    const viewerCorrect = viewerAnswer != null && viewerAnswer === question.correctAnswerId;

    main = (
      <>
        <div className="flex items-center gap-3.5">
          <span className="shrink-0 whitespace-nowrap text-[15px] font-extrabold text-ink-soft">
            Vraag {question.questionNumber} van {question.totalQuestions}
          </span>
          <ProgressSegments current={question.questionNumber} total={question.totalQuestions} height={6} />
        </div>

        <QuestionCard question={question} secondsLeft={questionSeconds} timerSeconds={room.questionTimerSeconds} />

        <div
          role="group"
          aria-label="Antwoorden"
          className={cn('grid gap-3.5', twoUp ? 'grid-cols-2' : 'grid-cols-1 m:grid-cols-2')}
        >
          {question.answers.map((option) => {
            const state = answerState(option.id);
            const isMine = option.id === viewerAnswer;
            const count = option.count ?? 0;
            return (
              <div key={option.id} className="relative min-w-0">
                <AnswerButton
                  state={state}
                  aria-pressed={isMine || undefined}
                  aria-label={isMine ? `${option.text}, jouw antwoord` : undefined}
                  disabled={!canAnswer || isSubmittingAnswer}
                  onClick={() => onAnswer(question.id, option.id)}
                >
                  {option.text}
                </AnswerButton>
                {revealed && totalResponses > 0 && (
                  <span
                    className={cn(
                      'pointer-events-none absolute bottom-2 right-2.5 flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-extrabold',
                      state === 'correct' || state === 'wrong' ? 'bg-white/20 text-white' : 'bg-chip text-ink-muted',
                    )}
                    aria-label={`${count} ${count === 1 ? 'speler' : 'spelers'}`}
                  >
                    {count}
                  </span>
                )}
                {isMine && <YouTag name={me?.name ?? null} />}
              </div>
            );
          })}
        </div>

        {room.status === 'in_progress' &&
          (me?.hasAnswered || viewerAnswer ? (
            <StatusLine>
              {room.questionTimerSeconds === 0
                ? isHost
                  ? 'Je antwoord is verstuurd. Laat het antwoord zien zodra iedereen klaar is.'
                  : 'Je antwoord is verstuurd. Je ziet of het goed is zodra de host het antwoord laat zien.'
                : 'Je antwoord is verstuurd. Je ziet of het goed is zodra iedereen klaar is of de tijd om is.'}
            </StatusLine>
          ) : null)}

        {room.status === 'in_progress' && isHost && room.questionTimerSeconds === 0 && (
          <Button size="xl" block onClick={onSkip} loading={isSkipping}>
            {isSkipping ? 'Bezig...' : 'Laat het antwoord zien'}
          </Button>
        )}

        {revealed && (
          <Card accent={viewerCorrect ? 'green' : viewerAnswer == null ? 'lapis' : 'coral'} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2
                className={cn(
                  'm-0 text-[22px] leading-7',
                  viewerCorrect ? 'text-green-text' : viewerAnswer == null ? 'text-ink' : 'text-coral-text',
                )}
              >
                {viewerCorrect ? 'Goed zo!' : viewerAnswer == null ? 'Geen antwoord' : 'Helaas, niet goed'}
              </h2>
              <p className="m-0 text-[15px] font-semibold text-ink-muted">
                {correctCount} van {room.players.length} {room.players.length === 1 ? 'speler' : 'spelers'} had deze vraag goed.
              </p>
            </div>
            {question.explanation && question.explanation.trim().length > 0 && (
              <div className="flex flex-col gap-1 border-t border-line-soft pt-3">
                <span className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-ink-muted">Uitleg</span>
                <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-body">{question.explanation}</p>
              </div>
            )}
            {/* The pause is generous so the explanation is readable; the
                host can cut it short once the room has moved on. */}
            {isHost ? (
              <div className="flex flex-col items-stretch gap-2 pt-1 m:flex-row m:items-center">
                <Button size="lg" onClick={onSkip} loading={isSkipping}>
                  {isSkipping ? 'Bezig...' : isLastQuestion ? 'Naar de eindstand' : 'Volgende vraag'}
                </Button>
                {resultSeconds != null && resultSeconds > 0 && (
                  <span className="text-sm font-semibold text-ink-muted m:ml-2" aria-live="off">
                    Gaat vanzelf verder over {resultSeconds}s
                  </span>
                )}
              </div>
            ) : (
              resultSeconds != null &&
              resultSeconds > 0 && (
                <p className="m-0 text-sm font-bold text-ink-muted" aria-live="off">
                  {isLastQuestion ? 'De eindstand komt' : 'Volgende vraag'} over {resultSeconds}s
                </p>
              )
            )}
          </Card>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PlayHeader leaveLabel="Spel verlaten" onLeave={() => setConfirmLeave(true)} />
      <main id="inhoud" className="flex-1">
        <Container className="flex flex-col gap-5 pb-14 pt-8 max-m:px-5">
          {errorBar}
          {connectionStatus === 'reconnecting' || connectionStatus === 'disconnected' ? (
            <StatusLine tone="grey">Verbinding herstellen...</StatusLine>
          ) : null}
          <div className="grid grid-cols-1 items-start gap-8 m:grid-cols-[minmax(0,1fr)_340px]">
            <section aria-label={question ? `Vraag ${question.questionNumber} van ${question.totalQuestions}` : 'Spel'} className="flex min-w-0 flex-col gap-5">
              {main}
            </section>
            <PlayersCard room={room} userId={userId} revealed={revealed} />
          </div>
          {debug}
        </Container>
      </main>

      <Modal
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Spel verlaten?"
        description="Je punten blijven staan, maar je speelt deze ronde niet meer mee."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmLeave(false)}>
              Blijven
            </Button>
            <Button
              variant="danger"
              loading={isLeaving}
              onClick={() => {
                setConfirmLeave(false);
                onLeave();
              }}
            >
              Spel verlaten
            </Button>
          </>
        }
      />
    </div>
  );
}
