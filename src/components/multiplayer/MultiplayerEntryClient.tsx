"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface MultiplayerQuizOption {
  id: string;
  title: string;
  questionCount: number;
  isPremium: boolean;
}

interface MultiplayerEntryClientProps {
  quizzes: MultiplayerQuizOption[];
}

const PLAYER_OPTIONS = [2, 4, 6, 8, 10, 12];

function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

export default function MultiplayerEntryClient({ quizzes }: MultiplayerEntryClientProps) {
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);

  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id ?? '');
  const [maxPlayers, setMaxPlayers] = useState<string>('8');
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
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Multiplayer</h1>
          <p className="text-muted-foreground">
            Start een room, nodig spelers uit en speel live dezelfde quiz.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nieuwe room maken</CardTitle>
              <CardDescription>
                Kies een quiz en stel het maximum aantal spelers in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quiz</label>
                <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.questionCount} vragen{quiz.isPremium ? ', premium' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max spelers</label>
                <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies maximaal aantal spelers" />
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

              <Button className="w-full" onClick={handleCreateRoom} disabled={isCreating || quizzes.length === 0}>
                {isCreating ? 'Room wordt aangemaakt...' : 'Room aanmaken'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bestaande room joinen</CardTitle>
              <CardDescription>
                Vul de room code in die je van de host hebt gekregen.
              </CardDescription>
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
                />
              </div>

              <Button className="w-full" variant="outline" onClick={handleJoinRoom} disabled={isJoining}>
                {isJoining ? 'Verbinden met room...' : 'Join room'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
