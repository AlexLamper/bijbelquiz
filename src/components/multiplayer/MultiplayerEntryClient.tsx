"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Share2, Trophy, Users } from 'lucide-react';
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
import { createRoom, getActiveRoom, joinRoom } from '@/lib/multiplayer-web/client';
import { MultiplayerTokenStore } from '@/lib/multiplayer-web/token-store';
import { toUserMessage } from '@/lib/multiplayer-web/errors';
import { trackEvent } from '@/components/GoogleAnalytics';
import QuizPickerField, {
  type PickerCategory,
  type PickerQuiz,
} from '@/components/multiplayer/QuizPickerField';
import { MULTIPLAYER_MAX_PLAYERS } from '@/lib/premium-benefits';
import { QUESTION_TIMER_CHOICES } from '@/lib/user-settings';
import { cn } from '@/lib/utils';

type MultiplayerQuizOption = PickerQuiz;

interface MultiplayerEntryClientProps {
  quizzes: MultiplayerQuizOption[];
  /** Categories the picker can filter on, in display order. */
  categories: PickerCategory[];
  /** Whether this account holds a licence. Reported, never enforced. */
  isPremiumUser: boolean;
  /** Room capacity. The same number for everybody. */
  maxPlayersForUser: number;
}

const PLAYER_OPTIONS = [2, 3, 4, 6, 8, 10, 12, MULTIPLAYER_MAX_PLAYERS];

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
  categories,
  isPremiumUser,
  maxPlayersForUser,
}: MultiplayerEntryClientProps) {
  const router = useRouter();
  // Owns the bearer token and silently re-mints it if it has expired, so a
  // page left open for hours still creates/joins on the first click.
  const tokensRef = useRef<MultiplayerTokenStore | null>(null);
  if (!tokensRef.current) {
    tokensRef.current = new MultiplayerTokenStore();
  }
  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id ?? '');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [readChapterFirst, setReadChapterFirst] = useState(false);
  const [questionTimerSeconds, setQuestionTimerSeconds] = useState<number>(0);
  const [joinCode, setJoinCode] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<{ code: string; status: string; quizTitle: string } | null>(
    null,
  );

  const selectedPlayersCount = Number(maxPlayers);

  // On mount: pick up the room this user is still in, so they can jump back
  // into it.
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

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateRoom() {
    trackEvent('multiplayer_room_create_clicked', {
      is_premium: isPremiumUser,
      requested_players: selectedPlayersCount,
    });

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
          readChapterFirst,
          questionTimerSeconds,
        }),
      );

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
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-10">
      {/* Header: one sentence of what this is. The quota chip that used to sit
          on the right is gone with the quota. */}
      <div>
        <h1 className="text-2xl font-normal tracking-tight text-foreground lg:text-3xl">
          Samen spelen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nodig iedereen uit met een code en speel tegelijk dezelfde quiz. Gratis, zo vaak je wilt.
        </p>
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
        <Card className="flex flex-col border-rule py-0">
          <CardHeader className="px-5 pb-0 pt-5">
            <CardTitle className="text-base">Nieuw spel starten</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {`Jij bent spelleider en kunt tot ${maxPlayersForUser} spelers uitnodigen, zo vaak je wilt.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
            <fieldset className="min-w-0 space-y-3 border-0 p-0">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Quiz</label>
                <QuizPickerField
                  quizzes={quizzes}
                  categories={categories}
                  value={selectedQuizId}
                  onChange={setSelectedQuizId}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Maximaal aantal spelers</label>
                <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Kies aantal" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYER_OPTIONS.map((count) => (
                      <SelectItem key={count} value={String(count)}>
                        {count} spelers
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tempo</label>
                {/* "Host bepaalt tempo" is far wider than "30s" and used to
                    wrap to two lines in a quarter-width cell. It gets a row of
                    its own; the timed choices share the row below. */}
                <div className="grid grid-cols-3 gap-1.5">
                  {QUESTION_TIMER_CHOICES.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setQuestionTimerSeconds(choice)}
                      className={cn(
                        'h-9 whitespace-nowrap rounded-md border px-2 text-sm font-medium transition-colors',
                        choice === 0 && 'col-span-3',
                        questionTimerSeconds === choice
                          ? 'border-ink bg-ink text-ink-inverted'
                          : 'border-rule bg-paper text-ink-soft hover:border-rule-strong hover:text-ink',
                      )}
                    >
                      {choice === 0 ? 'Host bepaalt tempo' : `${choice}s`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-ink-soft">
                  Zonder timer is er geen aftelklok - jij drukt zelf door naar het antwoord
                  en de volgende vraag.
                </p>
              </div>

              <label className="flex items-start gap-2.5 rounded-md border border-rule bg-paper p-3">
                <input
                  type="checkbox"
                  checked={readChapterFirst}
                  onChange={(event) => setReadChapterFirst(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-rule accent-lapis"
                />
                <span className="min-w-0">
                  <span className="text-sm font-medium">Lees eerst het bijbelhoofdstuk</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    Werkt alleen als de quiz over 1 hoofdstuk gaat.
                  </span>
                </span>
              </label>

              {/* Deliberately a one-liner and not a second paywall block: the
                  user only needs to know this number is out of reach. */}
            </fieldset>

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
