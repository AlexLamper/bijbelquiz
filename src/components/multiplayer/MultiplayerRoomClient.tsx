"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Copy, RefreshCcw, Sparkles, Trophy, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useMultiplayerRoomController } from '@/lib/multiplayer-web/useMultiplayerRoomController';
import type { RoomCurrentQuestionSnapshot, RoomResultEntry, RoomStatus } from '@/lib/multiplayer/types';
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
    return `/multiplayer/${normalized}/results`;
  }

  if (status === 'lobby') {
    return `/multiplayer/${normalized}/lobby`;
  }

  return `/multiplayer/${normalized}/game`;
}

function getConnectionBadgeClass(status: string): string {
  if (status === 'connected') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }

  if (status === 'reconnecting' || status === 'connecting') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
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
      'border-emerald-500/80 bg-emerald-500/[0.12] font-medium text-emerald-900 shadow-sm dark:bg-emerald-950/35 dark:text-emerald-100',
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
          {status === 'lobby' ? 'Lobby' : `Vraag ${Math.min(current + 1, total)} van ${total}`}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8fa8dc] to-[#5f81cc] transition-all duration-500 dark:from-zinc-600 dark:to-zinc-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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

export default function MultiplayerRoomClient({ roomCode, view }: MultiplayerRoomClientProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const normalizedRoomCode = useMemo(() => normalizeRoomCode(roomCode), [roomCode]);

  // Keep using the last known user ID during transient NextAuth "loading" states
  // (e.g. background refetch) so the room controller does not tear down and
  // recreate the websocket connection unnecessarily.
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(session?.user?.id ?? null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      setResolvedUserId(null);
      return;
    }

    if (session?.user?.id) {
      setResolvedUserId(session.user.id);
    }
  }, [session?.user?.id, sessionStatus]);

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
    start,
    answer,
    leave,
    refreshSnapshot,
    clearError,
  } = useMultiplayerRoomController({
    roomCode: normalizedRoomCode,
    userId: resolvedUserId,
    autoJoin: true,
  });

  const [copied, setCopied] = useState(false);

  /** Drives smooth countdown during the between-questions pause. */
  const [, setResultPhaseTick] = useState(0);
  useEffect(() => {
    if (room?.status !== 'question_result' || room.resultPhaseEndsAtMs == null) {
      return;
    }
    const id = window.setInterval(() => {
      setResultPhaseTick((n) => n + 1);
    }, 400);
    return () => window.clearInterval(id);
  }, [room?.status, room?.resultPhaseEndsAtMs]);

  const resultPhaseSecondsLeft =
    room?.status === 'question_result' && room.resultPhaseEndsAtMs != null
      ? Math.max(0, Math.ceil((room.resultPhaseEndsAtMs - Date.now()) / 1000))
      : null;

  // Live countdown: tick every second from the server-supplied remainingSeconds.
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const remaining = room?.currentQuestion?.remainingSeconds ?? null;
    setLocalSeconds(remaining);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (remaining !== null && remaining > 0 && room?.status === 'in_progress') {
      countdownRef.current = setInterval(() => {
        setLocalSeconds((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [room?.currentQuestion?.id, room?.currentQuestion?.remainingSeconds, room?.status]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const targetRoute = getRouteForStatus(room.code, room.status);

    if (view === 'lobby' && targetRoute.endsWith('/lobby')) {
      return;
    }

    if (view === 'game' && targetRoute.endsWith('/game')) {
      return;
    }

    if (view === 'results' && targetRoute.endsWith('/results')) {
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

  async function handleLeaveAndExit() {
    await leave();
    router.push('/multiplayer');
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="-mt-24 min-h-screen bg-background pt-24">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="-mt-24 min-h-screen bg-background pt-24">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Inloggen vereist</CardTitle>
              <CardDescription>Je moet ingelogd zijn om samen te spelen.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login?callbackUrl=/multiplayer">Naar login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (roomClosed) {
    return (
      <div className="-mt-24 min-h-screen bg-background pt-24">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Room niet beschikbaar</CardTitle>
              <CardDescription>
                Deze room bestaat niet meer of is beëindigd door de host.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <Button asChild>
                <Link href="/multiplayer">Terug naar samen spelen</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="-mt-24 min-h-screen bg-background pt-24">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Room laden mislukt</CardTitle>
              <CardDescription>Probeer opnieuw of ga terug naar de startpagina van samen spelen.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void refreshSnapshot()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Opnieuw proberen
              </Button>
              <Button asChild>
                <Link href="/multiplayer">Terug</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="-mt-24 min-h-screen bg-background pt-24">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* Room header */}
        <div
          className={cn(
            'mb-8 rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-[#f0f4fc] via-background to-background p-5 shadow-sm',
            'dark:border-zinc-800 dark:from-zinc-900/90 dark:via-background dark:to-background md:p-7',
          )}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Samen spelen
              </p>
              <h1 className="mt-1.5 text-balance text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {room.quizTitle}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Code{' '}
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-semibold text-foreground">
                  {room.code}
                </span>
                {view === 'lobby' && (
                  <span className="ml-2 text-xs">— deel deze code met je groep</span>
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
              <Button variant="secondary" size="sm" className="shadow-sm" onClick={handleCopyRoomCode}>
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
            <Card className="border-[#e8edf5] shadow-md dark:border-zinc-800">
              <CardHeader>
                <CardTitle>Lobby</CardTitle>
                <CardDescription>
                  Iedereen die wil meespelen join met de room code. Als de host kiest, start de quiz.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline">Spelers: {room.players.length} / {room.maxPlayers}</Badge>
                  {isHost ? <Badge>Host</Badge> : <Badge variant="secondary">Deelnemer</Badge>}
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm font-medium">Startvoorwaarden</p>
                  {room.players.length < 2 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Nog {2 - room.players.length} {2 - room.players.length === 1 ? 'speler' : 'spelers'} nodig voor de game kan starten.
                    </p>
                  ) : (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Voldoende spelers aanwezig. {isHost ? 'Je kunt de game starten.' : 'Wachten op de host.'}
                    </p>
                  )}
                  {connectionStatus !== 'connected' && (
                    <p className="text-xs text-muted-foreground">
                      Verbinding herstellen — spelerlijst wordt opnieuw opgehaald.
                    </p>
                  )}
                </div>

                {isHost ? (
                  <>
                    <Button onClick={() => void start()} disabled={!canStart || isStarting}>
                      {isStarting ? 'Game wordt gestart...' : 'Start game'}
                    </Button>
                    {!canStart && !isStarting && room.players.length >= 2 && (
                      <p className="text-xs text-muted-foreground">
                        Even wachten — spelerlijst wordt bijgewerkt...
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Wachten op de host om de game te starten...
                  </p>
                )}

                <Button variant="outline" onClick={() => void handleLeaveAndExit()} disabled={isLeaving}>
                  {isLeaving ? 'Room verlaten...' : isHost ? 'Room sluiten en verlaten' : 'Room verlaten'}
                </Button>
              </CardContent>
            </Card>
          )}

          {view === 'game' && (
            <Card className="overflow-hidden border-[#e8edf5] shadow-md dark:border-zinc-800">
              <CardHeader className="border-b bg-muted/40 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-[#5f81cc] dark:text-zinc-300" aria-hidden />
                  Live ronde
                </CardTitle>
                <CardDescription>
                  {room.currentQuestion
                    ? room.status === 'question_result'
                      ? 'Uitslag van deze vraag — daarna gaat het automatisch verder.'
                      : `Vraag ${room.currentQuestion.questionNumber} van ${room.currentQuestion.totalQuestions}`
                    : 'Even geduld, de volgende vraag wordt geladen...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {room.currentQuestion ? (
                  <>
                    {/* Result banner */}
                    {room.status === 'question_result' && room.currentQuestion.correctAnswerId != null && (
                      <div
                        className={cn(
                          'rounded-xl border-2 p-4 md:p-5',
                          room.currentQuestion.yourAnswerId === room.currentQuestion.correctAnswerId &&
                            'border-emerald-400/60 bg-emerald-500/10 dark:bg-emerald-950/30',
                          room.currentQuestion.yourAnswerId == null &&
                            'border-amber-400/50 bg-amber-500/10 dark:bg-amber-950/25',
                          room.currentQuestion.yourAnswerId != null &&
                            room.currentQuestion.yourAnswerId !== room.currentQuestion.correctAnswerId &&
                            'border-destructive/40 bg-destructive/10 dark:bg-destructive/15',
                        )}
                      >
                        {room.currentQuestion.yourAnswerId === room.currentQuestion.correctAnswerId ? (
                          <div className="flex gap-3">
                            <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <div>
                              <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                                Goed zo!
                              </p>
                              <p className="mt-0.5 text-sm text-emerald-900/85 dark:text-emerald-200/90">
                                Je antwoord is correct — je hebt een punt verdiend.
                              </p>
                            </div>
                          </div>
                        ) : room.currentQuestion.yourAnswerId == null ? (
                          <div className="flex gap-3">
                            <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                              <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                                Geen antwoord
                              </p>
                              <p className="mt-0.5 text-sm text-amber-900/85 dark:text-amber-200/90">
                                Je hebt niet op tijd geantwoord. Het juiste antwoord staat hieronder gemarkeerd.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-destructive" />
                            <div>
                              <p className="text-lg font-semibold text-destructive">Helaas, niet goed</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                Jouw keuze was fout. Het goede antwoord is groen gemarkeerd.
                              </p>
                            </div>
                          </div>
                        )}
                        {resultPhaseSecondsLeft != null && resultPhaseSecondsLeft > 0 && (
                          <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
                            Volgende vraag over {resultPhaseSecondsLeft}s…
                          </p>
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        'rounded-xl border bg-card p-4 md:p-5',
                        room.status === 'in_progress' && 'shadow-sm',
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
                      {room.currentQuestion.answers.map((answerOption) => {
                        const revealed =
                          room.status === 'question_result' &&
                          room.currentQuestion!.correctAnswerId != null;
                        const isCorrect =
                          revealed && answerOption.id === room.currentQuestion!.correctAnswerId;
                        const isWrongYours =
                          revealed &&
                          room.currentQuestion!.yourAnswerId === answerOption.id &&
                          answerOption.id !== room.currentQuestion!.correctAnswerId;

                        return (
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
                            disabled={
                              (!canAnswer && room.status === 'in_progress') ||
                              isSubmittingAnswer ||
                              room.status === 'question_result'
                            }
                          >
                            <span className="flex flex-1 items-start gap-3 text-left">
                              {isCorrect && (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              )}
                              {isWrongYours && (
                                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                              )}
                              {!isCorrect && !isWrongYours && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/25" />
                              )}
                              <span>{answerOption.text}</span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>

                    {room.status === 'in_progress' && (
                      <p className="text-sm text-muted-foreground">
                        {currentPlayer?.hasAnswered
                          ? 'Je antwoord is verstuurd. Wacht tot iedereen klaar is of de timer afloopt — daarna zie je of het goed was.'
                          : 'Tik op het juiste antwoord. Je kunt maar één keer kiezen.'}
                      </p>
                    )}

                    {room.status === 'question_result' &&
                      room.currentQuestion.explanation &&
                      room.currentQuestion.explanation.trim().length > 0 && (
                        <div className="rounded-xl border border-blue-200/60 bg-blue-500/[0.06] p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-200">
                            Uitleg
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-foreground">
                            {room.currentQuestion.explanation}
                          </p>
                        </div>
                      )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                    <RefreshCcw className="h-8 w-8 opacity-40" aria-hidden />
                    Wachten op de volgende vraag…
                  </div>
                )}

                <Button variant="outline" onClick={() => void handleLeaveAndExit()} disabled={isLeaving}>
                  {isLeaving ? 'Room verlaten...' : 'Room verlaten'}
                </Button>
              </CardContent>
            </Card>
          )}

          {view === 'results' && (
            <Card className="border-[#e8edf5] shadow-md dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
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
                        <div>
                          <p className="font-medium">#{entry.rank} {entry.playerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.correctAnswers} goed beantwoord
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{entry.score} punten</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => void handleLeaveAndExit()} disabled={isLeaving}>
                    {isLeaving ? 'Room verlaten...' : 'Room verlaten'}
                  </Button>
                  <Button asChild>
                    <Link href="/multiplayer">Nieuwe game</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#e8edf5] shadow-md dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Scorebord</CardTitle>
              <CardDescription>Live stand — wie scoort het hoogst?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {room.players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((player) => (
                    <div
                    key={player.id}
                    className={cn(
                      'rounded-xl border bg-card/50 p-3 transition-colors',
                      player.id === currentPlayer?.id && 'border-primary/50 bg-primary/[0.07]',
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-medium">{player.name}</p>
                      <div className="flex gap-1">
                        {player.isHost && <Badge variant="outline">Host</Badge>}
                        {!player.isConnected && <Badge variant="secondary">Offline</Badge>}
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {player.correctAnswers} van {room.totalQuestions} goed
                      </p>
                      <p className="text-sm font-bold tabular-nums text-foreground">{player.score} pt</p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <Card className="mt-6 border-amber-300/40 bg-amber-50/30 dark:border-amber-700/30 dark:bg-amber-950/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-sm">Debug — Samen spelen (HTTP polling)</CardTitle>
                  <CardDescription className="text-xs">
                    Status: <span className={connectionStatus === 'connected' ? 'text-emerald-600' : 'text-amber-600'}>{connectionStatus}</span>
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
                        className={`break-all ${isError ? 'text-red-600 dark:text-red-400' : isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
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
