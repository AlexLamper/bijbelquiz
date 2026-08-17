"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
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
  formatFreeGamesRemaining,
  formatMonthlyFreeGames,
  MULTIPLAYER_FREE_MAX_PLAYERS,
  MULTIPLAYER_FREE_ROOM_QUOTA,
  MULTIPLAYER_PREMIUM_MAX_PLAYERS,
  premiumPaywallHref,
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
  /** Free games left to host, or `null` for Premium (unlimited). */
  freeGamesRemaining: number | null;
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
  freeGamesRemaining,
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
   * upgraded, or spent a free game, in another tab or on mobile since this
   * page was rendered. We re-check on mount and after a rejected create, so
   * the counter is never wrong in either direction.
   */
  const [quota, setQuota] = useState({
    isPremium: isPremiumUser,
    freeGamesRemaining,
    // The server-rendered props predate the monthly allowance, so this starts
    // false and is corrected by the capability call on mount.
    onMonthlyAllowance: false,
  });

  const gamesLeft = quota.isPremium ? null : Math.max(0, quota.freeGamesRemaining ?? 0);
  const outOfFreeGames = !quota.isPremium && gamesLeft === 0;
  const canCreateRoom = quota.isPremium || !outOfFreeGames;

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
    if (outOfFreeGames) {
      trackEvent('multiplayer_paywall_shown', { placement: 'free_quota_used' });
    }
  }, [outOfFreeGames]);

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
            freeGamesRemaining: capability.freeRoomsRemaining,
            onMonthlyAllowance: capability.onMonthlyAllowance,
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

  async function refreshQuota() {
    try {
      const capability = await tokensRef.current!.run((token) => getCapability({ token }));
      setQuota({
        isPremium: capability.isPremium,
        freeGamesRemaining: capability.freeRoomsRemaining,
        onMonthlyAllowance: capability.onMonthlyAllowance,
      });
    } catch {
      // Ignore - the error message already explains the block.
    }
  }

  async function handleCreateRoom() {
    trackEvent('multiplayer_room_create_clicked', {
      is_premium: quota.isPremium,
      requested_players: selectedPlayersCount,
    });

    if (!canCreateRoom) {
      setErrorMessage(
        'Je hebt je gratis spellen gebruikt. Volgende maand krijg je er weer een. ' +
          'Word Premium om nu onbeperkt spellen te hosten.',
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
      // Note: no local decrement. A room costs nothing until the host actually
      // starts the game, which happens on the lobby screen.
      router.push(`/samen-spelen/${room.code}/lobby`);
    } catch (error) {
      setErrorMessage(toUserMessage(error));

      // The server is the authority on the quota. If it says the free games
      // are gone, switch the whole card into the "used up" state rather than
      // leaving an enabled button that will keep failing.
      if (error instanceof MultiplayerClientHttpError && error.code === 'PREMIUM_REQUIRED') {
        trackEvent('multiplayer_room_create_blocked', { reason: 'server_rejected' });
        await refreshQuota();
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
      text: 'Kies een quiz en het maximum aantal spelers. Je krijgt een spelcode.',
    },
    {
      step: '2',
      icon: Share2,
      title: 'Deel de code',
      text: 'De anderen loggen in, vullen de code in en wachten met je in de wachtkamer.',
    },
    {
      step: '3',
      icon: Trophy,
      title: 'Speel samen',
      text: 'Jij drukt op start. Iedereen antwoordt tegelijk, de scores verschijnen direct.',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
      {/* Header: one sentence of what this is, and the quota, nothing else */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-2xl font-normal tracking-tight text-foreground lg:text-3xl">
            Samen spelen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nodig iedereen uit met een code en speel tegelijk dezelfde quiz.
          </p>
        </div>

        {quota.isPremium ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-paper-sunken px-2.5 py-1.5 text-xs font-medium text-ink">
            <Crown className="h-3.5 w-3.5" aria-hidden />
            Premium - onbeperkt spellen
          </span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium',
              outOfFreeGames
                ? 'border-vermilion/50 bg-vermilion-tint text-ink'
                : 'border-rule bg-paper-sunken text-ink',
            )}
          >
            {outOfFreeGames ? (
              <Lock className="h-3.5 w-3.5 text-vermilion" aria-hidden />
            ) : (
              <Gamepad2 className="h-3.5 w-3.5 text-ink-soft" aria-hidden />
            )}
            {outOfFreeGames
              ? quota.onMonthlyAllowance
                ? 'Je maandspel is gebruikt'
                : 'Je gratis spellen zijn op'
              : quota.onMonthlyAllowance
                ? formatMonthlyFreeGames(gamesLeft ?? 0)
                : formatFreeGamesRemaining(gamesLeft ?? 0)}
          </span>
        )}
      </div>

      {/* Resume a game this user is still part of */}
      {activeRoom && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-lapis/35 bg-lapis/10 p-3 text-sm">
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

      {errorMessage && (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Two games out, the counter stops being a chip and becomes a notice.
          Meeting the wall for the first time with a room full of people
          waiting is the one experience this has to prevent. */}
      {!outOfFreeGames && gamesLeft !== null && gamesLeft !== undefined && gamesLeft <= 2 && (
        <div className="mt-5 rounded-lg border border-vermilion/40 bg-vermilion-tint p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-vermilion">
            {quota.onMonthlyAllowance
              ? 'Je gratis spel van deze maand'
              : gamesLeft <= 1
                ? 'Laatste gratis spel'
                : `Nog ${gamesLeft} gratis spellen`}
          </p>
          <p className="mt-2 text-sm text-ink">
            {quota.onMonthlyAllowance
              ? 'Dit is je gratis spel voor deze maand. Volgende maand krijg je er weer een. Met Premium host je meteen zoveel je wilt.'
              : gamesLeft <= 1
                ? 'Dit is je laatste gratis spel om te hosten. Daarna krijg je er elke maand een terug. Meedoen met andermans spel blijft gratis.'
                : `Je hebt nog ${gamesLeft} gratis spellen om te hosten. Een spel telt pas mee zodra je hem echt start.`}
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3 border-rule bg-paper-raised">
            <Link href={premiumPaywallHref('host_quota_warning', '/samen-spelen')}>
              Bekijk Premium
            </Link>
          </Button>
        </div>
      )}

      {/* The single paywall on this page. It only exists once the counter is
          actually empty - before that the page says nothing about Premium. */}
      {outOfFreeGames && (
        <div className="mt-5">
          <MultiplayerPremiumPaywall
            placement="free_quota_used"
            headline={`Je hebt je ${MULTIPLAYER_FREE_ROOM_QUOTA} gratis spellen gespeeld - host onbeperkt met Premium.`}
          />
          <p className="mt-2 text-sm text-positive">
            Meedoen blijft gratis: vraag iemand anders om een spelcode en speel gewoon mee.
          </p>
        </div>
      )}

      {/* Two actions, side by side, nothing between them */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Join - always available, so it comes first */}
        <Card className="flex flex-col border-rule py-0">
          <CardHeader className="px-5 pb-0 pt-5">
            <CardTitle className="text-base">Meedoen aan een spel</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              Heb je een code van de spelleider? Vul hem hier in.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
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
            </div>

            <Button
              className="mt-auto h-10 w-full dark:text-ink-inverted"
              variant="outline"
              onClick={handleJoinRoom}
              disabled={isJoining}
            >
              {isJoining ? 'Bezig met verbinden...' : 'Meedoen'}
            </Button>
          </CardContent>
        </Card>

        {/* Create */}
        <Card
          className={cn(
            'flex flex-col py-0',
            outOfFreeGames ? 'border-2 border-vermilion/40' : 'border-rule',
          )}
        >
          <CardHeader className="px-5 pb-0 pt-5">
            <CardTitle className="text-base">Nieuw spel starten</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {quota.isPremium
                ? `Jij bent spelleider en kunt tot ${maxPlayersForUser} spelers uitnodigen.`
                : outOfFreeGames
                  ? 'Hiervoor heb je Premium nodig.'
                  : `Gratis tot ${MULTIPLAYER_FREE_MAX_PLAYERS} spelers. Een gratis spel telt pas mee als je het spel echt start.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
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
              </div>

              {/* Deliberately a one-liner and not a second paywall block: the
                  user only needs to know this number is out of reach. */}
              {playerLimitTriggered && (
                <p className="text-xs text-ink-soft">
                  {selectedPlayersCount} spelers vraagt om{' '}
                  <Link
                    href={premiumPaywallHref('host_player_cap', '/samen-spelen')}
                    className="font-semibold underline underline-offset-2"
                  >
                    Premium
                  </Link>
                  . Gratis speel je tot {MULTIPLAYER_FREE_MAX_PLAYERS} spelers.
                </p>
              )}
            </fieldset>

            {outOfFreeGames ? (
              <Button
                asChild
                className="mt-auto h-10 w-full bg-ink text-ink-inverted hover:bg-ink-soft"
                onClick={() =>
                  trackEvent('multiplayer_premium_cta_clicked', { placement: 'free_quota_used' })
                }
              >
                <Link href={premiumPaywallHref('host_quota_exhausted', '/samen-spelen')}>
                  <Crown className="mr-2 h-4 w-4" />
                  Word Premium om te hosten
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
      </div>

      {/* Folded away: needed once, in the way every time after that */}
      <details className="group mt-5 rounded-lg border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground">
          Hoe werkt het?
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ol className="grid gap-4 border-t border-border px-4 py-4 sm:grid-cols-3">
          {steps.map((step) => (
            <li key={step.step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lapis/15 text-xs font-semibold text-ink-soft">
                {step.step}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
