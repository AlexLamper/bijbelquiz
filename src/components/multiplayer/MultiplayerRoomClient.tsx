"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Copy, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useMultiplayerRoomController } from '@/lib/multiplayer-web/useMultiplayerRoomController';
import type { RoomResultEntry, RoomStatus } from '@/lib/multiplayer/types';
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
    userId: session?.user?.id ?? null,
    autoJoin: true,
  });

  const [copied, setCopied] = useState(false);

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
              <CardDescription>Je moet ingelogd zijn om multiplayer te gebruiken.</CardDescription>
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
                <Link href="/multiplayer">Terug naar multiplayer</Link>
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
              <CardDescription>Probeer opnieuw of ga terug naar de multiplayer startpagina.</CardDescription>
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
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Room {room.code}</h1>
            <p className="text-sm text-muted-foreground">Quiz: {room.quizTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('border', getConnectionBadgeClass(connectionStatus))}>
              {getConnectionLabel(connectionStatus)}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCopyRoomCode}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Gekopieerd' : room.code}
            </Button>
          </div>
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
            <Card>
              <CardHeader>
                <CardTitle>Lobby</CardTitle>
                <CardDescription>
                  Wacht tot alle spelers er zijn en start daarna de game.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline">Spelers: {room.players.length} / {room.maxPlayers}</Badge>
                  {isHost ? <Badge>Host</Badge> : <Badge variant="secondary">Deelnemer</Badge>}
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm font-medium">Startvoorwaarden</p>
                  <p className="text-sm text-muted-foreground">
                    Minimaal 2 spelers nodig. Alleen de host kan starten.
                  </p>
                </div>

                {isHost ? (
                  <Button onClick={() => void start()} disabled={!canStart || isStarting}>
                    {isStarting ? 'Game wordt gestart...' : 'Start game'}
                  </Button>
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
            <Card>
              <CardHeader>
                <CardTitle>Live game</CardTitle>
                <CardDescription>
                  {room.currentQuestion
                    ? `Vraag ${room.currentQuestion.questionNumber} van ${room.currentQuestion.totalQuestions}`
                    : 'Volgende vraag wordt voorbereid...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {room.currentQuestion ? (
                  <>
                    <div className="rounded-lg border p-4">
                      <p className="mb-2 text-sm text-muted-foreground">
                        {room.currentQuestion.bibleReference}
                      </p>
                      <p className="text-base font-medium leading-relaxed">{room.currentQuestion.text}</p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Tijd over: {room.currentQuestion.remainingSeconds}s
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {room.currentQuestion.answers.map((answerOption) => (
                        <Button
                          key={answerOption.id}
                          variant="outline"
                          className="h-auto justify-start whitespace-normal py-3 text-left"
                          onClick={() => void answer(room.currentQuestion!.id, answerOption.id)}
                          disabled={!canAnswer || isSubmittingAnswer}
                        >
                          {answerOption.text}
                        </Button>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {currentPlayer?.hasAnswered
                        ? 'Antwoord ontvangen. Wachten op andere spelers...'
                        : 'Kies je antwoord voordat de timer afloopt.'}
                    </p>
                  </>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    Wachten op de volgende vraag of afronding...
                  </div>
                )}

                <Button variant="outline" onClick={() => void handleLeaveAndExit()} disabled={isLeaving}>
                  {isLeaving ? 'Room verlaten...' : 'Room verlaten'}
                </Button>
              </CardContent>
            </Card>
          )}

          {view === 'results' && (
            <Card>
              <CardHeader>
                <CardTitle>Uitslag</CardTitle>
                <CardDescription>De game is klaar. Dit is het eindklassement.</CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle>Spelers</CardTitle>
              <CardDescription>Live scorebord en status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {room.players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((player) => (
                  <div
                    key={player.id}
                    className={cn(
                      'rounded-lg border p-3',
                      player.id === currentPlayer?.id && 'border-primary/40 bg-primary/5',
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-medium">{player.name}</p>
                      <div className="flex gap-1">
                        {player.isHost && <Badge variant="outline">Host</Badge>}
                        {!player.isConnected && <Badge variant="secondary">Offline</Badge>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {player.score} punten · {player.correctAnswers} goed
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Multiplayer debug</CardTitle>
              <CardDescription>
                Live client debug voor websocket, reconnects en snapshot fallback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debugEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nog geen debug events.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/20 p-3 font-mono text-[11px] leading-relaxed">
                  {debugEvents.map((entry, index) => (
                    <p key={`${index}-${entry}`} className="break-all">
                      {entry}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
