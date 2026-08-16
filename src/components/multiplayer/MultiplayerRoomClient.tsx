"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Copy, MinusCircle, RefreshCcw, Share2, Sparkles, Trophy, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import MascotAvatar from '@/components/avatar/MascotAvatar';
import { track } from '@/lib/analytics/client';
import {
  buildRoomInviteMessage,
  INVITE_SOURCE_PARAM,
  INVITE_SOURCE_VALUE,
} from '@/lib/multiplayer/invite';
import { useMultiplayerRoomController } from '@/lib/multiplayer-web/useMultiplayerRoomController';
import { getCapability } from '@/lib/multiplayer-web/client';
import { MultiplayerTokenStore } from '@/lib/multiplayer-web/token-store';
import { formatFreeGamesRemaining } from '@/lib/premium-benefits';
import type {
  RoomCurrentQuestionSnapshot,
  RoomPlayerSnapshot,
  RoomResultEntry,
  RoomStatus,
} from '@/lib/multiplayer/types';
import { cn } from '@/lib/utils';

export type MultiplayerRoomView = 'lobby' | 'game' | 'results';

interface MultiplayerRoomClientProps {
  roomCode: string;
  view: MultiplayerRoomView;
}

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

function getRouteForStatus(roomCode: string, status: RoomStatus): string {
  const normalized = normalizeRoomCode(roomCode);

  if (status === 'finished') {
    return `/samen-spelen/${normalized}/uitslag`;
  }

  if (status === 'lobby') {
    return `/samen-spelen/${normalized}/lobby`;
  }

  return `/samen-spelen/${normalized}/spel`;
}

function getConnectionBadgeClass(status: string): string {
  if (status === 'connected') {
    return 'border-positive/35 bg-positive/10 text-positive dark:text-positive';
  }

  if (status === 'reconnecting' || status === 'connecting') {
    return 'border-lapis/35 bg-lapis/10 text-lapis dark:text-lapis';
  }

  return 'border-muted bg-muted text-muted-foreground';
}

function getConnectionLabel(status: string): string {
  if (status === 'connected') {
    return 'Live verbonden';
  }

  if (status === 'reconnecting') {
    return 'Herverbinden...';
  }

  if (status === 'connecting') {
    return 'Verbinden...';
  }

  return 'Offline';
}

function answerChoiceClasses(
  optionId: string,
  cq: RoomCurrentQuestionSnapshot,
  roomStatus: RoomStatus,
): string {
  const { yourAnswerId, correctAnswerId } = cq;
  const revealed = roomStatus === 'question_result' && correctAnswerId != null;
  const isCorrectOption = revealed && optionId === correctAnswerId;
  const isYourWrong = revealed && yourAnswerId === optionId && optionId !== correctAnswerId;
  const isYourPending = roomStatus === 'in_progress' && yourAnswerId === optionId;

  return cn(
    'relative h-auto justify-start gap-3 whitespace-normal py-3.5 pl-4 pr-4 text-left transition-all',
    isCorrectOption &&
      'border-positive/35 bg-positive/[0.12] font-medium text-positive  dark:bg-positive/35 dark:text-positive',
    isYourWrong &&
      'border-destructive/70 bg-destructive/[0.08] font-medium dark:bg-destructive/15',
    !revealed && isYourPending && 'border-primary ring-2 ring-primary/25',
    revealed &&
      !isCorrectOption &&
      !isYourWrong &&
      'border-border/60 opacity-55 saturate-50',
  );
}

function GameProgressBar(props: { current: number; total: number; status: RoomStatus }) {
  const { current, total, status } = props;
  const pct =
    total <= 0 ? 0 : status === 'lobby' ? 0 : Math.min(100, Math.round(((current + 1) / total) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {status === 'lobby' ? 'Wachtkamer' : `Vraag ${Math.min(current + 1, total)} van ${total}`}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-lapis transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Turns the server's absolute deadlines into a "seconds left" countdown.
 *
 * The server publishes deadlines on its own clock, so we track the offset
 * between it and this browser and correct for it - a user whose system clock
 * is minutes off still sees the same timer as the rest of the room. While a
 * deadline is live we re-render 4x/second, which keeps the countdown smooth
 * between polls instead of stepping only when a snapshot lands.
 */
function useServerCountdown(serverTimeMs: number | null, active: boolean) {
  // The offset is a cache, not rendered state - recording it in a ref avoids a
  // render pass per snapshot, and it is always read together with `nowMs`,
  // which does drive renders.
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
      // Before the first tick there is nothing to count down from; callers
      // fall back to the server-supplied `remainingSeconds`.
      if (serverDeadlineMs == null || nowMs === 0) return null;
      return Math.max(0, Math.ceil((serverDeadlineMs + offsetMsRef.current - nowMs) / 1000));
    },
    [nowMs],
  );
}

function buildResultsFallback(players: Array<{
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
}>): RoomResultEntry[] {
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }

    return a.name.localeCompare(b.name);
  });

  return sortedPlayers.map((player, index) => ({
    rank: index + 1,
    playerId: player.id,
    playerName: player.name,
    score: player.score,
    correctAnswers: player.correctAnswers,
  }));
}

/**
 * The pause between two questions.
 *
 * Answering straight through gave players no moment to see how the round
 * actually went, so this takes over the question card during
 * `question_result`: the correct answer, how the room split across the
 * options, and a standings table marking who got this one right. The next
 * question replaces it automatically when the server's timer elapses.
 */
function QuestionResultInterstitial(props: {
  question: RoomCurrentQuestionSnapshot;
  players: RoomPlayerSnapshot[];
  viewerId: string | null;
  secondsLeft: number | null;
  isHost: boolean;
  onSkip: () => void;
  isSkipping: boolean;
}) {
  const { question, players, viewerId, secondsLeft, isHost, onSkip, isSkipping } = props;

  const totalResponses = question.answers.reduce((sum, answer) => sum + (answer.count ?? 0), 0);

  const standings = [...players].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (right.correctAnswers !== left.correctAnswers) return right.correctAnswers - left.correctAnswers;
    return left.name.localeCompare(right.name);
  });

  const correctCount = players.filter((player) => player.answeredCorrectly === true).length;
  const viewerAnswer = question.yourAnswerId;
  const viewerWasCorrect = viewerAnswer != null && viewerAnswer === question.correctAnswerId;

  return (
    <div className="space-y-6">
      {/* Your own outcome, kept as the loudest thing on the screen */}
      <div
        className={cn(
          'rounded-lg border p-4 md:p-5',
          viewerWasCorrect && 'border-positive/35 bg-positive/10 dark:bg-positive/30',
          viewerAnswer == null && 'border-lapis/35 bg-lapis/10 dark:bg-lapis/25',
          viewerAnswer != null && !viewerWasCorrect && 'border-destructive/40 bg-destructive/10 dark:bg-destructive/15',
        )}
      >
        <div className="flex gap-3">
          {viewerWasCorrect ? (
            <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-positive dark:text-positive" />
          ) : viewerAnswer == null ? (
            <MinusCircle className="mt-0.5 h-8 w-8 shrink-0 text-lapis dark:text-lapis" />
          ) : (
            <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <p
              className={cn(
                'text-lg font-medium',
                viewerWasCorrect && 'text-positive dark:text-positive',
                viewerAnswer == null && 'text-lapis dark:text-lapis',
                viewerAnswer != null && !viewerWasCorrect && 'text-destructive',
              )}
            >
              {viewerWasCorrect ? 'Goed zo!' : viewerAnswer == null ? 'Geen antwoord' : 'Helaas, niet goed'}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {correctCount} van {players.length} {players.length === 1 ? 'speler' : 'spelers'} had deze vraag goed.
            </p>
          </div>
        </div>
      </div>

      {/* The question, with the room's answer split per option */}
      <div className="rounded-lg border border-rule bg-paper-raised p-4 md:p-5">
        {question.bibleReference ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {question.bibleReference}
          </p>
        ) : null}
        <p className="text-base font-medium leading-relaxed md:text-lg">{question.text}</p>

        <div className="mt-4 space-y-2">
          {question.answers.map((answer) => {
            const count = answer.count ?? 0;
            const isCorrect = answer.id === question.correctAnswerId;
            const isYours = answer.id === viewerAnswer;
            const share = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

            return (
              <div
                key={answer.id}
                className={cn(
                  'relative overflow-hidden rounded-md border px-3 py-2.5',
                  isCorrect ? 'border-positive/35' : 'border-rule opacity-70',
                )}
              >
                {/* Proportion bar sits behind the label as a tint, not a fill */}
                <div
                  aria-hidden
                  className={cn(
                    'absolute inset-y-0 left-0',
                    isCorrect ? 'bg-positive/[0.14]' : 'bg-muted',
                  )}
                  style={{ width: `${share}%` }}
                />
                <div className="relative flex items-center gap-3">
                  {/* Fixed-width slot so every row reserves identical space for
                      its leading glyph - an icon here versus a small dot on
                      the other rows must not change where the text starts,
                      or otherwise-identical rows wrap at different points. */}
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-positive dark:text-positive" aria-hidden />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/25" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{answer.text}</span>
                  {isYours && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      Jouw keuze
                    </Badge>
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standings after this question */}
      <div className="rounded-lg border border-rule">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <p className="text-sm font-medium text-foreground">Tussenstand</p>
          <p className="text-xs text-muted-foreground">
            Na vraag {question.questionNumber} van {question.totalQuestions}
          </p>
        </div>
        <div className="divide-y divide-rule">
          {standings.map((player, index) => (
            <div
              key={player.id}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                player.id === viewerId && 'bg-lapis/[0.06]',
              )}
            >
              <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">{index + 1}</span>
              {player.answeredCorrectly === true ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-positive dark:text-positive" aria-hidden />
              ) : player.answeredCorrectly === false ? (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
              ) : (
                <MinusCircle className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
              )}
              <MascotAvatar avatar={player.avatar} size={26} bordered />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{player.name}</span>
              {player.scoreGained ? (
                <span className="shrink-0 text-xs font-medium tabular-nums text-positive dark:text-positive">
                  +{player.scoreGained}
                </span>
              ) : null}
              <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                {player.score} pt
              </span>
            </div>
          ))}
        </div>
      </div>

      {question.explanation && question.explanation.trim().length > 0 && (
        <div className="rounded-lg border border-lapis/35 bg-lapis/[0.06] p-4 dark:border-lapis/35 dark:bg-lapis/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-lapis dark:text-lapis">Uitleg</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{question.explanation}</p>
        </div>
      )}

      {/* The reveal pause is generous so the explanation is actually
          readable; the host can cut it short instead of everyone waiting
          out the full delay once the room has clearly moved on. */}
      {isHost ? (
        <div className="flex flex-col items-center gap-2">
          <Button onClick={onSkip} disabled={isSkipping} className="dark:text-ink-inverted">
            {isSkipping ? 'Bezig...' : 'Volgende vraag'}
          </Button>
          {secondsLeft != null && secondsLeft > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Gaat automatisch verder over {secondsLeft}s
            </p>
          )}
        </div>
      ) : (
        secondsLeft != null && secondsLeft > 0 && (
          <p className="text-center text-xs font-medium text-muted-foreground">
            Volgende vraag over {secondsLeft}s...
          </p>
        )
      )}
    </div>
  );
}

export default function MultiplayerRoomClient({ roomCode, view }: MultiplayerRoomClientProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const normalizedRoomCode = useMemo(() => normalizeRoomCode(roomCode), [roomCode]);

  // Read once, before the router has a chance to strip the parameter, so a
  // re-render does not turn an invited join into a direct one.
  const [arrivedViaInvite] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      new URLSearchParams(window.location.search).get(INVITE_SOURCE_PARAM) ===
      INVITE_SOURCE_VALUE
    );
  });

  // NextAuth keeps `data` populated across background refetches, so reading it
  // straight through is stable: the room controller only tears down when the
  // user is genuinely signed out.
  const resolvedUserId = session?.user?.id ?? null;

  const {
    loading,
    room,
    results,
    debugEvents,
    errorMessage,
    roomClosed,
    connectionStatus,
    currentPlayer,
    isHost,
    canStart,
    canAnswer,
    isStarting,
    isSubmittingAnswer,
    isLeaving,
    isSkipping,
    start,
    skip,
    answer,
    leave,
    refreshSnapshot,
    clearError,
  } = useMultiplayerRoomController({
    roomCode: normalizedRoomCode,
    userId: resolvedUserId,
    autoJoin: true,
    viaInvite: arrivedViaInvite,
  });

  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  /**
   * Offering to keep the people you just played with.
   *
   * Asked on the results screen and nowhere else: this is the one moment the
   * group demonstrably exists, and a prompt in a settings menu a week later
   * reaches nobody. Dismissable, and gone for good once saved.
   */
  const [groupSaveState, setGroupSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [groupSaveError, setGroupSaveError] = useState<string | null>(null);
  const [savedGroupName, setSavedGroupName] = useState<string | null>(null);
  const [groupPromptDismissed, setGroupPromptDismissed] = useState(false);

  /**
   * Starting the game is what actually spends a free game, so the host has to
   * be told *here* rather than only on the entry page. Premium hosts (and
   * non-hosts) get `null` and no line is rendered.
   */
  const [freeGamesLeft, setFreeGamesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isHost || view !== 'lobby') return;

    let cancelled = false;
    const tokens = new MultiplayerTokenStore();

    void (async () => {
      try {
        const capability = await tokens.run((token) => getCapability({ token }));
        // The quota endpoint still counts down for Premium hosts; they must not
        // be shown a limit they do not have.
        if (!cancelled) {
          setFreeGamesLeft(capability.isPremium ? null : capability.freeRoomsRemaining);
        }
      } catch {
        // Purely informational - the start button works either way.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHost, view]);

  const hasLiveDeadline =
    (room?.status === 'in_progress' && room.currentQuestion?.deadlineAtMs != null) ||
    (room?.status === 'question_result' && room.resultPhaseEndsAtMs != null);

  const secondsUntil = useServerCountdown(room?.serverTimeMs ?? null, hasLiveDeadline);

  const resultPhaseSecondsLeft =
    room?.status === 'question_result' ? secondsUntil(room.resultPhaseEndsAtMs) : null;

  const localSeconds =
    room?.status === 'in_progress'
      ? secondsUntil(room.currentQuestion?.deadlineAtMs) ?? room.currentQuestion?.remainingSeconds ?? null
      : null;

  useEffect(() => {
    if (!room) {
      return;
    }

    const targetRoute = getRouteForStatus(room.code, room.status);

    if (view === 'lobby' && targetRoute.endsWith('/lobby')) {
      return;
    }

    if (view === 'game' && targetRoute.endsWith('/spel')) {
      return;
    }

    if (view === 'results' && targetRoute.endsWith('/uitslag')) {
      return;
    }

    router.replace(targetRoute);
  }, [room, router, view]);

  const displayedResults = useMemo(() => {
    if (results.length > 0) {
      return results;
    }

    if (!room) {
      return [];
    }

    return buildResultsFallback(room.players);
  }, [results, room]);

  async function handleCopyRoomCode() {
    try {
      await navigator.clipboard.writeText(normalizedRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  /**
   * Share the room as a link.
   *
   * Uses the native share sheet where there is one - on a phone that is one
   * tap into WhatsApp, which is where these groups actually live - and falls
   * back to copying the whole message otherwise.
   */
  async function handleShareInvite() {
    const message = buildRoomInviteMessage(
      normalizedRoomCode,
      room?.quizTitle ?? '',
      window.location.origin,
    );

    track('room_invite_shared', {
      roomCode: normalizedRoomCode,
      method: typeof navigator.share === 'function' ? 'share_sheet' : 'clipboard',
    });

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'BijbelQuiz',
          text: message,
        });
        return;
      } catch {
        // Cancelled, or unavailable in this context: fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(message);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 1600);
    } catch {
      setInviteCopied(false);
    }
  }

  async function handleSaveGroup() {
    setGroupSaveState('saving');
    setGroupSaveError(null);

    try {
      const response = await fetch('/api/player-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: normalizedRoomCode }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setGroupSaveError(payload?.error || 'Groep bewaren is niet gelukt.');
        setGroupSaveState('error');
        return;
      }

      setSavedGroupName(payload?.group?.name ?? null);
      setGroupSaveState('saved');
    } catch {
      setGroupSaveError('Groep bewaren is niet gelukt.');
      setGroupSaveState('error');
    }
  }

  async function handleLeaveAndExit() {
    await leave();
    router.push('/samen-spelen');
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background pt-10">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background pt-10">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Inloggen vereist</CardTitle>
              <CardDescription>Je moet ingelogd zijn om samen te spelen.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/inloggen?callbackUrl=/samen-spelen">Naar login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (roomClosed) {
    return (
      <div className="min-h-screen bg-background pt-10">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Spel niet beschikbaar</CardTitle>
              <CardDescription>
                Dit spel bestaat niet meer of is beëindigd door de spelleider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void refreshSnapshot()}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Opnieuw proberen
                </Button>
                <Button asChild>
                  <Link href="/samen-spelen">Terug naar samen spelen</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background pt-10">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Spel laden mislukt</CardTitle>
              <CardDescription>Probeer opnieuw of ga terug naar de startpagina van samen spelen.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void refreshSnapshot()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Opnieuw proberen
              </Button>
              <Button asChild>
                <Link href="/samen-spelen">Terug</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-10">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* Room header */}
        <div
          className={cn(
            'mb-8 rounded-lg border border-rule bg-paper-raised p-5',
            '  dark:via-background dark:to-background md:p-7',
          )}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Samen spelen
              </p>
              <h1 className="mt-1.5 text-balance text-xl font-normal tracking-tight text-foreground md:text-2xl">
                {room.quizTitle}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Code{' '}
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-semibold text-foreground">
                  {room.code}
                </span>
                {view === 'lobby' && (
                  <span className="ml-2 text-xs">- deel deze code met je groep</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('border', getConnectionBadgeClass(connectionStatus))}>
                {connectionStatus === 'connected' ? (
                  <Sparkles className="mr-1 h-3 w-3 opacity-80" aria-hidden />
                ) : (
                  <Zap className="mr-1 h-3 w-3 opacity-70" aria-hidden />
                )}
                {getConnectionLabel(connectionStatus)}
              </Badge>
              {/* The link is the primary action: a code still has to be typed
                  by everybody in the room, a link does not. */}
              <Button size="sm" className="bg-ink text-ink-inverted hover:bg-ink-soft" onClick={handleShareInvite}>
                <Share2 className="mr-2 h-4 w-4" />
                {inviteCopied ? 'Uitnodiging gekopieerd' : 'Uitnodiging delen'}
              </Button>
              <Button variant="secondary" size="sm" className="" onClick={handleCopyRoomCode}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Gekopieerd' : 'Code kopiëren'}
              </Button>
            </div>
          </div>

          {view !== 'results' && (
            <div className="mt-6 border-t border-border/60 pt-5">
              <GameProgressBar
                current={room.currentQuestionIndex}
                total={room.totalQuestions}
                status={room.status}
              />
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <span>{errorMessage}</span>
            <Button size="sm" variant="outline" onClick={clearError}>
              Sluiten
            </Button>
            <Button size="sm" variant="outline" onClick={() => void refreshSnapshot()}>
              Verversen
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {view === 'lobby' && (
            <Card className="border-rule">
              <CardHeader>
                <CardTitle>Wachtkamer</CardTitle>
                <CardDescription>
                  Iedereen typt de spelcode in en wacht hier. Als de spelleider start, begint de quiz.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline">Spelers: {room.players.length} / {room.maxPlayers}</Badge>
                  {isHost ? <Badge>Spelleider</Badge> : <Badge variant="secondary">Deelnemer</Badge>}
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm font-medium">Startvoorwaarden</p>
                  {room.players.length < 2 ? (
                    <p className="text-sm text-lapis dark:text-lapis">
                      Nog {2 - room.players.length} {2 - room.players.length === 1 ? 'speler' : 'spelers'} nodig om te beginnen.
                    </p>
                  ) : (
                    <p className="text-sm text-positive dark:text-positive">
                      Voldoende spelers aanwezig. {isHost ? 'Je kunt het spel starten.' : 'Wachten op de spelleider.'}
                    </p>
                  )}
                  {connectionStatus !== 'connected' && (
                    <p className="text-xs text-muted-foreground">
                      Verbinding herstellen - spelerlijst wordt opnieuw opgehaald.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {isHost ? (
                    <>
                      <Button onClick={() => void start()} disabled={!canStart || isStarting}>
                        {isStarting ? 'Spel wordt gestart...' : 'Start spel'}
                      </Button>
                      {freeGamesLeft !== null && (
                        <p className="text-xs text-muted-foreground">
                          Starten kost één gratis spel. Je hebt nu{' '}
                          {formatFreeGamesRemaining(freeGamesLeft)}.
                        </p>
                      )}
                      {!canStart && !isStarting && room.players.length >= 2 && (
                        <p className="text-xs text-muted-foreground">
                          Even wachten - spelerlijst wordt bijgewerkt...
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Wachten op de spelleider om het spel te starten...
                    </p>
                  )}

                  <Button variant="outline" onClick={() => void handleLeaveAndExit()} disabled={isLeaving}>
                    {isLeaving ? 'Spel verlaten...' : isHost ? 'Spel sluiten' : 'Spel verlaten'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {view === 'game' && (
            <Card className="overflow-hidden border-rule">
              <CardHeader className="border-b bg-muted/40 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-ink-soft" aria-hidden />
                  Live ronde
                </CardTitle>
                <CardDescription>
                  {room.currentQuestion
                    ? room.status === 'question_result'
                      ? isHost
                        ? 'Uitslag van deze vraag - klik op "Volgende vraag" of wacht tot de timer afloopt.'
                        : 'Uitslag van deze vraag - daarna gaat het automatisch verder.'
                      : `Vraag ${room.currentQuestion.questionNumber} van ${room.currentQuestion.totalQuestions}`
                    : 'Even geduld, de volgende vraag wordt geladen...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {room.currentQuestion ? (
                  room.status === 'question_result' ? (
                    <QuestionResultInterstitial
                      question={room.currentQuestion}
                      players={room.players}
                      viewerId={resolvedUserId}
                      secondsLeft={resultPhaseSecondsLeft}
                      isHost={isHost}
                      onSkip={() => void skip()}
                      isSkipping={isSkipping}
                    />
                  ) : (
                  <>
                    <div
                      className={cn(
                        'rounded-lg border bg-card p-4 md:p-5',
                        room.status === 'in_progress' && '',
                      )}
                    >
                      {room.currentQuestion.bibleReference ? (
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {room.currentQuestion.bibleReference}
                        </p>
                      ) : null}
                      <p className="text-base font-medium leading-relaxed md:text-lg">
                        {room.currentQuestion.text}
                      </p>
                      {room.status === 'in_progress' && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/80 px-3 py-2 text-sm">
                          <span className="text-muted-foreground">Tijd over</span>
                          <span
                            className={cn(
                              'font-mono text-lg font-semibold tabular-nums',
                              (localSeconds ?? 0) <= 5 ? 'text-destructive' : 'text-foreground',
                            )}
                          >
                            {localSeconds ?? room.currentQuestion.remainingSeconds}s
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3">
                      {room.currentQuestion.answers.map((answerOption) => (
                        // This block only ever renders while status is
                        // in_progress (question_result has its own branch
                        // above), so there is no correct/wrong reveal to show
                        // here - every option looks the same aside from the
                        // player's own pending pick.
                        <Button
                          key={answerOption.id}
                          type="button"
                          variant="outline"
                          className={answerChoiceClasses(
                            answerOption.id,
                            room.currentQuestion!,
                            room.status,
                          )}
                          onClick={() => void answer(room.currentQuestion!.id, answerOption.id)}
                          disabled={!canAnswer || isSubmittingAnswer}
                        >
                          <span className="flex flex-1 items-center gap-3 text-left">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/25" />
                            <span>{answerOption.text}</span>
                          </span>
                        </Button>
                      ))}
                    </div>

                    {room.status === 'in_progress' && (
                      <p className="text-sm text-muted-foreground">
                        {currentPlayer?.hasAnswered
                          ? 'Je antwoord is verstuurd. Wacht tot iedereen klaar is of de timer afloopt - daarna zie je of het goed was.'
                          : 'Tik op het juiste antwoord. Je kunt maar één keer kiezen.'}
                      </p>
                    )}

                  </>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                    <RefreshCcw className="h-8 w-8 opacity-40" aria-hidden />
                    Wachten op de volgende vraag…
                  </div>
                )}

                <Button variant="outline" onClick={() => void handleLeaveAndExit()} disabled={isLeaving}>
                  {isLeaving ? 'Spel verlaten...' : 'Spel verlaten'}
                </Button>
              </CardContent>
            </Card>
          )}

          {view === 'results' && (
            <Card className="border-rule">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-lapis dark:text-lapis" aria-hidden />
                  Eindstand
                </CardTitle>
                <CardDescription>
                  Dit is het klassement na afloop van alle vragen. Goed gespeeld!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {displayedResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Resultaten worden geladen...</p>
                ) : (
                  <div className="space-y-2">
                    {displayedResults.map((entry) => (
                      <div key={entry.playerId} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <MascotAvatar
                            avatar={room?.players.find((player) => player.id === entry.playerId)?.avatar}
                            size={34}
                            bordered
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">#{entry.rank} {entry.playerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.correctAnswers} goed beantwoord
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">{entry.score} punten</p>
                      </div>
                    ))}
                  </div>
                )}

                {room.players.length >= 2 && !groupPromptDismissed && groupSaveState !== 'saved' && (
                  <div className="rounded-lg border border-lapis/35 bg-lapis-tint p-4">
                    <p className="text-sm font-medium text-ink">Deze groep bewaren?</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Dan houd je een eigen ranglijst bij met deze {room.players.length} spelers, en
                      nodig je ze de volgende keer met een tik weer uit.
                    </p>
                    {groupSaveError && (
                      <p className="mt-2 text-sm text-destructive">{groupSaveError}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Button
                        onClick={() => void handleSaveGroup()}
                        disabled={groupSaveState === 'saving'}
                      >
                        {groupSaveState === 'saving' ? 'Bewaren...' : 'Groep bewaren'}
                      </Button>
                      <Button variant="outline" onClick={() => setGroupPromptDismissed(true)}>
                        Nee, bedankt
                      </Button>
                    </div>
                  </div>
                )}

                {groupSaveState === 'saved' && (
                  <div className="rounded-lg border border-rule bg-paper-sunken p-4">
                    <p className="text-sm font-medium text-ink">
                      {savedGroupName ? `"${savedGroupName}" is bewaard.` : 'Groep bewaard.'}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Je vindt de stand van deze groep op de ranglijst.
                    </p>
                    <Button asChild variant="outline" className="mt-3">
                      <Link href="/ranglijst">Naar de ranglijst</Link>
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => void handleLeaveAndExit()} disabled={isLeaving}>
                    {isLeaving ? 'Spel verlaten...' : 'Spel verlaten'}
                  </Button>
                  <Button asChild>
                    <Link href="/samen-spelen">Nieuw spel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-rule">
            <CardHeader>
              <CardTitle>Scorebord</CardTitle>
              <CardDescription>Live stand - wie scoort het hoogst?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {room.players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((player) => (
                    <div
                    key={player.id}
                    className={cn(
                      'rounded-lg border bg-card/50 p-3 transition-colors',
                      player.id === currentPlayer?.id && 'border-primary/50 bg-primary/[0.07]',
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <MascotAvatar avatar={player.avatar} size={28} bordered />
                        <p className="truncate font-medium">{player.name}</p>
                      </div>
                      <div className="flex gap-1">
                        {player.isHost && <Badge variant="outline">Spelleider</Badge>}
                        {!player.isConnected && <Badge variant="secondary">Offline</Badge>}
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {player.correctAnswers} van {room.totalQuestions} goed
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-foreground">{player.score} pt</p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <Card className="mt-6 border-lapis/35 bg-lapis-tint/30 dark:border-lapis/35 dark:bg-lapis/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-sm">Debug - Samen spelen (HTTP polling)</CardTitle>
                  <CardDescription className="text-xs">
                    Status: <span className={connectionStatus === 'connected' ? 'text-positive' : 'text-lapis'}>{connectionStatus}</span>
                    {' · '}Room: {room?.status ?? 'unknown'}
                    {' · '}Spelers: {room?.players.length ?? 0}
                    {' · '}UserId: {resolvedUserId ?? '(none)'}
                  </CardDescription>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshSnapshot()}>
                    Snapshot
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(debugEvents.join('\n'));
                      } catch {
                        // ignore
                      }
                    }}
                    disabled={debugEvents.length === 0}
                  >
                    Kopieer logs
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/multiplayer/debug', { cache: 'no-store' });
                        const text = await response.text();
                        await navigator.clipboard.writeText(text);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Server status
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {debugEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nog geen debug events.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-md border bg-background p-3 font-mono text-[10px] leading-relaxed">
                  {debugEvents.map((entry, index) => {
                    const isError = entry.includes('[error]');
                    const isWarn = entry.includes('[warn]');
                    return (
                      <p
                        key={`${index}-${entry.slice(0, 30)}`}
                        className={`break-all ${isError ? 'text-vermilion dark:text-vermilion' : isWarn ? 'text-lapis dark:text-lapis' : 'text-muted-foreground'}`}
                      >
                        {entry}
                      </p>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
