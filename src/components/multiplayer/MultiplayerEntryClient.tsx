"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Crown,
  Gamepad2,
  Lock,
  Share2,
  Trophy,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createRoom,
  getActiveRoom,
  getCapability,
  joinRoom,
  MultiplayerClientHttpError,
} from '@/lib/multiplayer-web/client';
import { MultiplayerTokenStore } from '@/lib/multiplayer-web/token-store';
import { toUserMessage } from '@/lib/multiplayer-web/errors';
import { trackEvent } from '@/components/GoogleAnalytics';
import MultiplayerPremiumPaywall from '@/components/multiplayer/MultiplayerPremiumPaywall';
import {
  MULTIPLAYER_FREE_MAX_PLAYERS,
  MULTIPLAYER_PREMIUM_MAX_PLAYERS,
} from '@/lib/premium-benefits';
import { cn } from '@/lib/utils';

interface MultiplayerQuizOption {
  id: string;
  title: string;
  questionCount: number;
  isPremium: boolean;
}

interface MultiplayerEntryClientProps {
  quizzes: MultiplayerQuizOption[];
  isPremiumUser: boolean;
  hasUsedFreeRoomCreation: boolean;
  /** Hard upper bound for the player picker for the current user. */
  maxPlayersForUser: number;
}

const PLAYER_OPTIONS = [2, 3, 4, 6, 8, 10, 12, MULTIPLAYER_PREMIUM_MAX_PLAYERS];

function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

function routeForRoom(code: string, status: string): string {
  if (status === 'finished') return `/samen-spelen/${code}/uitslag`;
  if (status === 'lobby') return `/samen-spelen/${code}/lobby`;
  return `/samen-spelen/${code}/spel`;
}

export default function MultiplayerEntryClient({
  quizzes,
  isPremiumUser,
  hasUsedFreeRoomCreation,
  maxPlayersForUser,
}: MultiplayerEntryClientProps) {
  const router = useRouter();
  // Owns the bearer token and silently re-mints it if it has expired, so a
  // page left open for hours still creates/joins on the first click.
  const tokensRef = useRef<MultiplayerTokenStore | null>(null);
  if (!tokensRef.current) {
    tokensRef.current = new MultiplayerTokenStore();
  }
  /**
   * The server-rendered props are only the *initial* truth: the user may have
   * upgraded, or used their free room, in another tab or on mobile since this
   * page was rendered. We re-check on mount and after a rejected create, so
   * the "free room used" state is never wrong in either direction.
   */
  const [quota, setQuota] = useState({
    isPremium: isPremiumUser,
    hasUsedFreeRoom: hasUsedFreeRoomCreation,
  });

  const canCreateRoom = quota.isPremium || !quota.hasUsedFreeRoom;
  const freeRoomUsedUp = !quota.isPremium && quota.hasUsedFreeRoom;

  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id ?? '');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [joinCode, setJoinCode] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<{ code: string; status: string; quizTitle: string } | null>(
    null,
  );

  const selectedPlayersCount = Number(maxPlayers);
  const playerLimitTriggered =
    !quota.isPremium && selectedPlayersCount > MULTIPLAYER_FREE_MAX_PLAYERS;

  useEffect(() => {
    if (freeRoomUsedUp) {
      trackEvent('multiplayer_paywall_shown', { placement: 'free_quota_used' });
    }
  }, [freeRoomUsedUp]);

  useEffect(() => {
    if (playerLimitTriggered) {
      trackEvent('multiplayer_paywall_shown', {
        placement: 'player_limit',
        requested_players: selectedPlayersCount,
      });
    }
  }, [playerLimitTriggered, selectedPlayersCount]);

  // On mount: pick up the room this user is still in (so they can jump back
  // into it) and re-confirm their hosting quota against the server.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const room = await tokensRef.current!.run((token) => getActiveRoom({ token }));
        if (!cancelled && room) {
          setActiveRoom({ code: room.code, status: room.status, quizTitle: room.quizTitle });
        }
      } catch {
        // Purely additive: if this fails the page still works normally.
      }
    })();

    void (async () => {
      try {
        const capability = await tokensRef.current!.run((token) => getCapability({ token }));
        if (!cancelled) {
          setQuota({
            isPremium: capability.isPremium,
            hasUsedFreeRoom: capability.hasUsedFreeRoom,
          });
        }
      } catch {
        // Fall back to the server-rendered props.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateRoom() {
    trackEvent('multiplayer_room_create_clicked', {
      is_premium: quota.isPremium,
      requested_players: selectedPlayersCount,
    });

    if (!canCreateRoom) {
      setErrorMessage(
        `Je gratis spel is al gebruikt. Word Premium om onbeperkt spellen te hosten, tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers.`,
      );
      trackEvent('multiplayer_room_create_blocked', { reason: 'free_quota_used' });
      return;
    }

    if (playerLimitTriggered) {
      setErrorMessage(
        `Met een gratis account speel je tot ${MULTIPLAYER_FREE_MAX_PLAYERS} spelers per spel. Upgrade naar Premium voor spellen tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers.`,
      );
      trackEvent('multiplayer_room_create_blocked', {
        reason: 'player_limit',
        requested_players: selectedPlayersCount,
      });
      return;
    }

    if (!selectedQuizId) {
      setErrorMessage('Kies eerst een quiz.');
      return;
    }

    setErrorMessage(null);
    setIsCreating(true);

    try {
      const room = await tokensRef.current!.run((token) =>
        createRoom({
          token,
          quizId: selectedQuizId,
          maxPlayers: selectedPlayersCount,
        }),
      );

      trackEvent('multiplayer_room_created', {
        is_premium: quota.isPremium,
        max_players: selectedPlayersCount,
      });
      // A free account just spent its one room; reflect that immediately in
      // case the user navigates back to this page.
      if (!quota.isPremium) {
        setQuota((current) => ({ ...current, hasUsedFreeRoom: true }));
      }
      router.push(`/samen-spelen/${room.code}/lobby`);
    } catch (error) {
      setErrorMessage(toUserMessage(error));

      // The server is the authority on the quota. If it says the free room is
      // gone, switch the whole card into the "used up" state rather than
      // leaving an enabled button that will keep failing.
      if (error instanceof MultiplayerClientHttpError && error.code === 'PREMIUM_REQUIRED') {
        trackEvent('multiplayer_room_create_blocked', { reason: 'server_rejected' });
        try {
          const capability = await tokensRef.current!.run((token) => getCapability({ token }));
          setQuota({
            isPremium: capability.isPremium,
            hasUsedFreeRoom: capability.hasUsedFreeRoom,
          });
        } catch {
          // Ignore - the error message above already explains the block.
        }
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinRoom() {
    const roomCode = normalizeRoomCode(joinCode);

    if (roomCode.length < 4) {
      setErrorMessage('Vul een geldige spelcode in.');
      return;
    }

    setErrorMessage(null);
    setIsJoining(true);
    trackEvent('multiplayer_room_join_clicked');

    try {
      const room = await tokensRef.current!.run((token) =>
        joinRoom({
          token,
          roomCode,
        }),
      );

      trackEvent('multiplayer_room_joined', { status: room.status });

      router.push(routeForRoom(room.code, room.status));
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    } finally {
      setIsJoining(false);
    }
  }

  const steps = [
    {
      step: '1',
      icon: Users,
      title: 'Start een spel',
      text: 'Kies een quiz en max. spelers. Je krijgt een code.',
    },
    {
      step: '2',
      icon: Share2,
      title: 'Deel de code',
      text: 'Spelers loggen in, vullen de code in en wachten samen.',
    },
    {
      step: '3',
      icon: Trophy,
      title: 'Speel samen',
      text: 'Spelleider start. Iedereen antwoordt live, scores verschijnen direct.',
    },
  ];

  return (
    <div className="flex flex-col overflow-auto bg-background px-4 py-4 lg:h-[calc(100vh-4rem)] lg:overflow-hidden lg:px-6 lg:py-5">
      {/* Header + "Zo werkt het" strip */}
      <div className="shrink-0 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <div>
            <h1 className="text-2xl font-normal tracking-tight text-foreground lg:text-3xl">
              Samen spelen
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Nodig iedereen uit met een code en speel tegelijk - zie wie de Bijbel het beste kent.
            </p>
          </div>
        </div>

        {/* Compact "Zo werkt het" strip */}
        <div className="mt-3 flex items-stretch rounded-lg border border-border bg-muted/40">
          {steps.map((step, i) => (
            <div key={step.step} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
              {i > 0 && <div className="-ml-3 mr-1 hidden h-full w-px bg-border sm:block" />}
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lapis/15 text-[11px] font-semibold text-ink-soft">
                {step.step}
              </span>
              <step.icon className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" aria-hidden />
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-foreground">{step.title}</span>
                <span className="hidden truncate text-[11px] text-muted-foreground md:block">{step.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free hosting quota spent - the single loudest thing on the page */}
      {freeRoomUsedUp && (
        <div
          role="status"
          className="mb-3 shrink-0 rounded-lg border-2 border-vermilion/50 bg-vermilion-tint p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vermilion/15">
                <Lock className="h-4 w-4 text-vermilion" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  Je gratis spel is al gebruikt - je kunt geen nieuw spel meer starten
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Met een gratis account host je{' '}
                  <strong className="font-semibold">één spel, één keer</strong>. Die heb je
                  inmiddels gebruikt. Word Premium om onbeperkt spellen te starten, met tot{' '}
                  {MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers.
                </p>
                <p className="mt-1.5 text-sm font-medium text-positive">
                  Meedoen blijft wél gratis en onbeperkt - vraag een vriend om een spelcode.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="h-9 shrink-0 bg-ink px-4 text-xs font-semibold text-ink-inverted hover:bg-ink-soft"
              onClick={() =>
                trackEvent('multiplayer_premium_cta_clicked', { placement: 'free_quota_used' })
              }
            >
              <Link href="/premium">
                <Crown className="mr-2 h-4 w-4" />
                Word Premium
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Resume a game this user is still part of */}
      {activeRoom && (
        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3 rounded-lg border border-lapis/35 bg-lapis/10 p-3 text-sm">
          <span className="font-medium text-foreground">
            Je doet nog mee aan{' '}
            <span className="font-mono font-semibold">{activeRoom.code}</span> ({activeRoom.quizTitle}).
          </span>
          <Button
            size="sm"
            className="dark:text-ink-inverted"
            onClick={() => router.push(routeForRoom(activeRoom.code, activeRoom.status))}
          >
            Verder spelen
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="mb-3 shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Action cards */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row lg:gap-6">
        {/* Create room card */}
        <Card
          className={cn(
            'flex min-h-0 flex-1 flex-col py-0',
            freeRoomUsedUp ? 'border-2 border-vermilion/40' : 'border-rule',
          )}
        >
          <CardHeader className="shrink-0 px-5 pb-0 pt-5">
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  freeRoomUsedUp ? 'bg-vermilion/15' : 'bg-lapis/15',
                )}
              >
                {freeRoomUsedUp ? (
                  <Lock className="h-4 w-4 text-vermilion" aria-hidden />
                ) : (
                  <Gamepad2 className="h-4 w-4 text-ink-soft" aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">Nieuw spel starten</CardTitle>
                  {freeRoomUsedUp && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-vermilion px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-inverted">
                      <Lock className="h-3 w-3" />
                      Gratis spel gebruikt
                    </span>
                  )}
                </div>
                <CardDescription className="mt-0.5 text-xs">
                  {quota.isPremium
                    ? `Jij bent host en kunt tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers uitnodigen.`
                    : freeRoomUsedUp
                      ? 'Je hebt je enige gratis spel al gehost. Alleen Premium kan opnieuw hosten.'
                      : `Eén spel gratis, tot ${MULTIPLAYER_FREE_MAX_PLAYERS} spelers. Daarna is Premium nodig.`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 px-5 pb-5 pt-3">
            {freeRoomUsedUp && (
              <MultiplayerPremiumPaywall
                placement="free_quota_used"
                headline="Je gratis spel is al gebruikt - host onbeperkt met Premium."
              />
            )}

            {/* The form stays visible so the user can see what they're missing,
                but it is inert: nothing here can lead to a room any more. */}
            <fieldset
              disabled={!canCreateRoom}
              className={cn(
                'min-w-0 space-y-3 border-0 p-0',
                !canCreateRoom && 'pointer-events-none opacity-45',
              )}
            >
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Quiz</label>
              <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Kies een quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}{' '}
                      <span className="text-muted-foreground">
                        ({quiz.questionCount} vragen{quiz.isPremium ? ', premium' : ''})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Maximaal aantal spelers</label>
              <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Kies aantal" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYER_OPTIONS.map((count) => {
                    const isPremiumOnly = count > MULTIPLAYER_FREE_MAX_PLAYERS && !quota.isPremium;
                    return (
                      <SelectItem key={count} value={String(count)}>
                        <span className="flex items-center gap-2">
                          {count} spelers
                          {isPremiumOnly && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-paper-sunken px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
                              <Crown className="h-3 w-3" />
                              Premium
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {quota.isPremium
                  ? `Je kunt tot ${maxPlayersForUser} spelers uitnodigen.`
                  : `Gratis tot ${MULTIPLAYER_FREE_MAX_PLAYERS} spelers, met Premium tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS}.`}
              </p>
            </div>

            {playerLimitTriggered && (
              <MultiplayerPremiumPaywall
                placement="player_limit"
                headline={`Speel met ${selectedPlayersCount} spelers - beschikbaar met Premium.`}
              />
            )}
            </fieldset>

            {/* One free room per free account, so tell the user which state
                they're in instead of only greying the button out. */}
            {!quota.isPremium && !freeRoomUsedUp && (
              <p className="rounded-md border border-rule bg-paper-sunken px-3 py-2 text-xs text-ink-soft">
                <strong className="font-semibold">Let op:</strong> dit is je enige gratis spel.
                Daarna heb je Premium nodig om zelf een spel te starten.
              </p>
            )}

            {freeRoomUsedUp ? (
              <Button
                asChild
                className="mt-auto h-10 w-full bg-ink text-ink-inverted hover:bg-ink-soft"
                onClick={() =>
                  trackEvent('multiplayer_premium_cta_clicked', { placement: 'free_quota_used' })
                }
              >
                <Link href="/premium">
                  <Crown className="mr-2 h-4 w-4" />
                  Word Premium om weer te hosten
                </Link>
              </Button>
            ) : (
              <Button
                className="mt-auto h-10 w-full dark:text-ink-inverted"
                onClick={handleCreateRoom}
                disabled={isCreating || quizzes.length === 0}
              >
                {isCreating ? (
                  'Spel wordt aangemaakt...'
                ) : (
                  <>
                    Spel starten
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Join room card */}
        <Card
          className={cn(
            'flex min-h-0 flex-1 flex-col py-0',
            // When hosting is locked, this is the user's remaining route into a
            // game - make it read as the live option, not the leftover one.
            freeRoomUsedUp ? 'border-2 border-positive/45' : 'border-rule',
          )}
        >
          <CardHeader className="shrink-0 px-5 pb-0 pt-5">
            <div className="flex items-start gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-positive/10">
                <Copy className="h-4 w-4 text-positive dark:text-positive" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">Meedoen aan spel</CardTitle>
                  {freeRoomUsedUp && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-positive/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-positive">
                      <CheckCircle2 className="h-3 w-3" />
                      Gratis en onbeperkt
                    </span>
                  )}
                </div>
                <CardDescription className="mt-0.5 text-xs">
                  {freeRoomUsedUp
                    ? 'Dit kan altijd, ook zonder Premium. Vraag iemand anders om een spel te starten en vul hier hun code in.'
                    : 'Heb je een code van de spelleider? Vul hem hier in - hoofdletters maakt niet uit.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 px-5 pb-5 pt-3">
            <div className="space-y-1.5">
              <label htmlFor="room-code" className="text-sm font-medium">
                Spelcode
              </label>
              <Input
                id="room-code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Bijv. ABCD12"
                maxLength={10}
                autoCapitalize="characters"
                className="h-12 font-mono text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Tip: de spelleider kan de code met één klik kopiëren in de wachtkamer.
              </p>
            </div>

            <div className="flex-1" />

            <Button
              className="mt-auto h-10 w-full dark:text-ink-inverted"
              variant="outline"
              onClick={handleJoinRoom}
              disabled={isJoining}
            >
              {isJoining ? 'Bezig met verbinden...' : 'Deelnemen'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips strip */}
      <div className="mt-3 shrink-0">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-positive dark:text-positive" aria-hidden />
            <span className="font-medium text-foreground">Inloggen vereist</span>
            <span className="text-muted-foreground">- maak gratis een account aan.</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-positive dark:text-positive" aria-hidden />
            <span className="font-medium text-foreground">Stabiele verbinding</span>
            <span className="text-muted-foreground">- scores worden automatisch bijgewerkt.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
