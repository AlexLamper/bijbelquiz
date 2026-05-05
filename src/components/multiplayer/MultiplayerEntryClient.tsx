"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
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
}

const PLAYER_OPTIONS = [2, 3, 4, 6, 8, 10, 12];

function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

export default function MultiplayerEntryClient({
  quizzes,
  isPremiumUser,
  hasUsedFreeRoomCreation,
}: MultiplayerEntryClientProps) {
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);
  const canCreateRoom = isPremiumUser || !hasUsedFreeRoomCreation;

  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id ?? '');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [joinCode, setJoinCode] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function ensureToken(): Promise<string> {
    if (tokenRef.current) {
      return tokenRef.current;
    }

    const token = await getMultiplayerAuthToken();
    tokenRef.current = token;
    return token;
  }

  async function handleCreateRoom() {
    if (!canCreateRoom) {
      setErrorMessage('Room aanmaken is Premium nadat je gratis room is gebruikt.');
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
        maxPlayers: Number(maxPlayers),
      });

      router.push(`/multiplayer/${room.code}/lobby`);
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinRoom() {
    const roomCode = normalizeRoomCode(joinCode);

    if (roomCode.length < 4) {
      setErrorMessage('Vul een geldige room code in.');
      return;
    }

    setErrorMessage(null);
    setIsJoining(true);

    try {
      const token = await ensureToken();
      const room = await joinRoom({
        token,
        roomCode,
      });

      const targetPath = room.status === 'finished'
        ? `/multiplayer/${room.code}/results`
        : room.status === 'lobby'
          ? `/multiplayer/${room.code}/lobby`
          : `/multiplayer/${room.code}/game`;

      router.push(targetPath);
    } catch (error) {
      setErrorMessage(toUserMessage(error));
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <div className="-mt-24 min-h-screen bg-background pt-24">
      {/* Hero */}
      <section
        className={cn(
          'relative overflow-hidden border-b',
          'bg-gradient-to-b from-[#e8eef8] via-background to-background',
          'dark:from-zinc-900 dark:via-background dark:to-background',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(111,142,212,0.25) 0%, transparent 45%), radial-gradient(circle at 80% 10%, rgba(95,129,204,0.18) 0%, transparent 40%)',
          }}
        />
        <div className="container relative mx-auto max-w-5xl px-4 py-8 md:py-10">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Samen spelen
            </h1>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              Nodig vrienden of familie uit met een korte code, speel dezelfde vragen tegelijk
              en zie direct wie het beste scoort. Ideaal voor een gezellige quizavond of kleine groep.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-full shadow-sm dark:bg-[#6f8ed4] dark:text-white dark:hover:bg-[#5f81cc]">
                <a href="#start">
                  <Copy className="mr-2 h-4 w-4" />
                  Join room
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-[#c5d4ea] bg-white/80 dark:bg-zinc-900/80">
                <a href="#start">
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  Start een room
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main actions */}
      <section id="start" className="scroll-mt-24 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Aan de slag</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Maak zelf een room als host, of voeg je bij een bestaande game met een code.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card id="create-room" className="border-[#e2e8f0] shadow-md dark:border-zinc-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6f8ed4]/15">
                    <Gamepad2 className="h-4 w-4 text-[#5f81cc] dark:text-zinc-200" aria-hidden />
                  </div>
                  <div>
                    <CardTitle>Nieuwe room maken</CardTitle>
                    <CardDescription className="mt-0.5">
                      {isPremiumUser
                        ? 'Jij bent host en bepaalt wanneer de quiz start.'
                        : hasUsedFreeRoomCreation
                          ? 'Premium nodig voor nieuwe rooms na je gratis room.'
                          : 'Als gratis gebruiker kun je één room maken.'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isPremiumUser && hasUsedFreeRoomCreation && (
                  <div className="rounded-lg border border-[#d7e1ee] bg-[#f8fbff] p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900/70">
                    <p className="font-medium text-[#30466e] dark:text-zinc-100">Premium voor hosten</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Joinen met een code blijft gratis.
                    </p>
                    <Button asChild className="mt-3 h-9 rounded-md bg-[#6f8ed4] text-xs text-white hover:bg-[#5f81cc] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                      <Link href="/premium">Upgrade naar Premium</Link>
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quiz</label>
                  <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                    <SelectTrigger className="h-11">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Maximaal aantal spelers</label>
                  <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                    <SelectTrigger className="h-11">
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

                <Button
                  className="h-11 w-full text-base shadow-sm dark:bg-[#6f8ed4] dark:text-white dark:hover:bg-[#5f81cc]"
                  onClick={handleCreateRoom}
                  disabled={isCreating || quizzes.length === 0 || !canCreateRoom}
                >
                  {isCreating ? (
                    'Room wordt aangemaakt...'
                  ) : (
                    <>
                      Room aanmaken
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card id="join-room" className="border-[#e2e8f0] shadow-md dark:border-zinc-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Copy className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden />
                  </div>
                  <div>
                    <CardTitle>Room joinen</CardTitle>
                    <CardDescription className="mt-0.5">
                      Heb je een code van de host? Vul hem hier in, hoofdletters maakt niet uit.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="room-code" className="text-sm font-medium">
                    Room code
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
                    Tip: de host kan de code met één klik kopiëren in de lobby.
                  </p>
                </div>

                <Button
                  className="h-11 w-full text-base dark:border-[#5a79bf] dark:bg-[#5f81cc] dark:text-white dark:hover:bg-[#5275bd]"
                  variant="outline"
                  onClick={handleJoinRoom}
                  disabled={isJoining}
                >
                  {isJoining ? 'Bezig met verbinden...' : 'Join room'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tips row */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <p className="text-sm font-medium">Iedereen moet ingelogd zijn</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Maak zo nodig even een gratis account aan; daarna kun je direct meedoen.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <p className="text-sm font-medium">Stabiele verbinding</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  De score en spelers worden automatisch bijgewerkt. Blijf op deze pagina tijdens de game.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-center text-xl font-semibold tracking-tight md:text-2xl">
            Zo werkt het
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Drie stappen, geen installatie, iedereen speelt in de browser.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: '1',
                icon: Users,
                title: 'Host maakt een room',
                text: 'Kies een quiz en het maximum aantal spelers. Je krijgt een korte room code die je deelt.',
              },
              {
                step: '2',
                icon: Share2,
                title: 'Deel de code',
                text: 'Spelers loggen in, vullen de code in en belanden in dezelfde lobby. Iedereen ziet live wie er klaarstaat.',
              },
              {
                step: '3',
                icon: Trophy,
                title: 'Speel en vergelijk',
                text: 'De host start de game. Iedereen antwoordt op dezelfde vragen; na elke vraag zie je of je antwoord goed was en het tussenklassement.',
              },
            ].map((item) => (
              <Card
                key={item.step}
                className="relative overflow-hidden border-[#e2e8f0] shadow-sm dark:border-zinc-800"
              >
                <CardHeader className="pb-2">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f8ed4]/15 text-[#5f81cc] dark:bg-zinc-800 dark:text-zinc-200">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Stap {item.step}
                  </span>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
