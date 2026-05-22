"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Crown,
  Gamepad2,
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
import { createRoom, getMultiplayerAuthToken, joinRoom } from '@/lib/multiplayer-web/client';
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

export default function MultiplayerEntryClient({
  quizzes,
  isPremiumUser,
  hasUsedFreeRoomCreation,
  maxPlayersForUser,
}: MultiplayerEntryClientProps) {
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);
  const canCreateRoom = isPremiumUser || !hasUsedFreeRoomCreation;
  const showQuotaPaywall = !isPremiumUser && hasUsedFreeRoomCreation;

  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id ?? '');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [joinCode, setJoinCode] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPlayersCount = Number(maxPlayers);
  const playerLimitTriggered =
    !isPremiumUser && selectedPlayersCount > MULTIPLAYER_FREE_MAX_PLAYERS;

  useEffect(() => {
    if (showQuotaPaywall) {
      trackEvent('multiplayer_paywall_shown', { placement: 'free_quota_used' });
    }
  }, [showQuotaPaywall]);

  useEffect(() => {
    if (playerLimitTriggered) {
      trackEvent('multiplayer_paywall_shown', {
        placement: 'player_limit',
        requested_players: selectedPlayersCount,
      });
    }
  }, [playerLimitTriggered, selectedPlayersCount]);

  async function ensureToken(): Promise<string> {
    if (tokenRef.current) {
      return tokenRef.current;
    }

    const token = await getMultiplayerAuthToken();
    tokenRef.current = token;
    return token;
  }

  async function handleCreateRoom() {
    trackEvent('multiplayer_room_create_clicked', {
      is_premium: isPremiumUser,
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
      const token = await ensureToken();
      const room = await createRoom({
        token,
        quizId: selectedQuizId,
        maxPlayers: selectedPlayersCount,
      });

      trackEvent('multiplayer_room_created', {
        is_premium: isPremiumUser,
        max_players: selectedPlayersCount,
      });
      router.push(`/samen-spelen/${room.code}/lobby`);
    } catch (error) {
      setErrorMessage(toUserMessage(error));
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
      const token = await ensureToken();
      const room = await joinRoom({
        token,
        roomCode,
      });

      trackEvent('multiplayer_room_joined', { status: room.status });

      const targetPath = room.status === 'finished'
        ? `/samen-spelen/${room.code}/uitslag`
        : room.status === 'lobby'
          ? `/samen-spelen/${room.code}/lobby`
          : `/samen-spelen/${room.code}/spel`;

      router.push(targetPath);
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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
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
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6f8ed4]/15 text-[11px] font-bold text-[#5f81cc] dark:bg-[#1a2b47] dark:text-[#8aa7e6]">
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

      {/* Error message */}
      {errorMessage && (
        <div className="mb-3 shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Action cards */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row lg:gap-6">
        {/* Create room card */}
        <Card className="flex min-h-0 flex-1 flex-col border-[#e2e8f0] py-0 shadow-md dark:border-zinc-800">
          <CardHeader className="shrink-0 px-5 pb-0 pt-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6f8ed4]/15">
                <Gamepad2 className="h-4 w-4 text-[#5f81cc] dark:text-zinc-200" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Nieuw spel starten</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  {isPremiumUser
                    ? `Jij bent host en kunt tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers uitnodigen.`
                    : hasUsedFreeRoomCreation
                      ? 'Word Premium om opnieuw te hosten.'
                      : `Eén spel gratis, tot ${MULTIPLAYER_FREE_MAX_PLAYERS} spelers.`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 px-5 pb-5 pt-3">
            {showQuotaPaywall && (
              <MultiplayerPremiumPaywall
                placement="free_quota_used"
                headline="Je gratis spel is al gebruikt - host onbeperkt met Premium."
              />
            )}

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
                    const isPremiumOnly = count > MULTIPLAYER_FREE_MAX_PLAYERS && !isPremiumUser;
                    return (
                      <SelectItem key={count} value={String(count)}>
                        <span className="flex items-center gap-2">
                          {count} spelers
                          {isPremiumOnly && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e9eff8] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#355384] dark:bg-zinc-700 dark:text-zinc-200">
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
                {isPremiumUser
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

            <Button
              className="mt-auto h-10 w-full shadow-sm dark:bg-[#6f8ed4] dark:text-white dark:hover:bg-[#5f81cc]"
              onClick={handleCreateRoom}
              disabled={isCreating || quizzes.length === 0 || !canCreateRoom}
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
          </CardContent>
        </Card>

        {/* Join room card */}
        <Card className="flex min-h-0 flex-1 flex-col border-[#e2e8f0] py-0 shadow-md dark:border-zinc-800">
          <CardHeader className="shrink-0 px-5 pb-0 pt-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Copy className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Meedoen aan spel</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Heb je een code van de spelleider? Vul hem hier in - hoofdletters maakt niet uit.
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
              className="mt-auto h-10 w-full dark:border-[#5a79bf] dark:bg-[#5f81cc] dark:text-white dark:hover:bg-[#5275bd]"
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
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span className="font-medium text-foreground">Inloggen vereist</span>
            <span className="text-muted-foreground">- maak gratis een account aan.</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span className="font-medium text-foreground">Stabiele verbinding</span>
            <span className="text-muted-foreground">- scores worden automatisch bijgewerkt.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
