'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Medal, UserCircle2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LeaderboardUser {
  _id: string;
  name: string;
  xp: number;
  streak: number;
  badges?: string[];
  createdAt?: string;
}

interface LeaderboardClientProps {
  users: LeaderboardUser[];
  currentUserId?: string;
  initialPeriod: 'weekly' | 'monthly' | 'all-time';
}

type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

function rankBadgeTone(index: number): string {
  if (index === 0) return 'border-[#d6bf7a] bg-[#f5e7bf] text-[#6e4f13] dark:border-[#866726] dark:bg-[#4a3a1a] dark:text-[#f3d88f]';
  if (index === 1) return 'border-[#c3cddd] bg-[#e8edf5] text-[#455a7d] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';
  if (index === 2) return 'border-[#d8b49b] bg-[#f3e2d8] text-[#7b4c37] dark:border-[#7e5742] dark:bg-[#3f2b22] dark:text-[#deb9a5]';
  return 'border-[#d7e1ee] bg-[#f8fafe] text-[#4e5f79] dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300';
}

function getDisplayName(user: LeaderboardUser): string {
  return user.name?.trim() || 'Gebruiker';
}

function formatStreak(streak: number): string {
  return streak === 1 ? '1 dag' : `${streak} dagen`;
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  weekly: 'Wekelijks',
  monthly: 'Maandelijks',
  'all-time': 'All-time',
};

export default function LeaderboardClient({ users, currentUserId, initialPeriod }: LeaderboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(users);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);

  useEffect(() => {
    setSelectedPeriod(initialPeriod);
    setLeaderboardUsers(users);
  }, [initialPeriod, users]);

  const currentUserRank = leaderboardUsers.findIndex((user) => user._id === currentUserId) + 1;
  const topXp = leaderboardUsers[0]?.xp || 0;

  const loadPeriod = async (period: LeaderboardPeriod) => {
    if (period === selectedPeriod) {
      return;
    }

    setSelectedPeriod(period);
    setIsLoadingPeriod(true);

    try {
      const response = await fetch(`/api/leaderboard?period=${period}`);
      if (!response.ok) {
        throw new Error('Kon ranglijst niet laden');
      }

      const payload = await response.json();
      setLeaderboardUsers(payload?.leaderboard || []);
    } catch (error) {
      console.error('[LEADERBOARD_PERIOD_LOAD]', error);
      // Keep current list if request fails.
    } finally {
      setIsLoadingPeriod(false);
    }
  };

  return (
    <div className="-mt-24 min-h-screen pt-24 pb-12">
      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#607597] dark:text-[#9db5dc]">Ranglijst</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#1f2f4b] dark:text-zinc-100 md:text-4xl">Top spelers</h1>
            <p className="mt-2 text-sm text-muted-foreground">Verdien XP door quizzen te spelen en stijg in de ranglijst.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-10 rounded-md bg-[#6f8ed4] dark:bg-[#6f8ed4] px-5 text-white hover:bg-[#5f81cc] dark:hover:bg-[#5f81cc]">
              <Link href="/quizzes">Speel quiz</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-md border-[#d7e1ee] bg-white px-5 text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(Object.keys(PERIOD_LABELS) as LeaderboardPeriod[]).map((period) => {
            const isActive = selectedPeriod === period;

            return (
              <Button
                key={period}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                onClick={() => loadPeriod(period)}
                disabled={isLoadingPeriod}
                className={
                  isActive
                    ? 'h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc] dark:bg-[#6f8ed4] dark:hover:bg-[#5f81cc]'
                    : 'h-9 rounded-md border-[#d7e1ee] bg-white px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800'
                }
              >
                {PERIOD_LABELS[period]}
              </Button>
            );
          })}
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-3.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Deelnemers</p>
              <p className="mt-1 text-xl font-semibold text-[#24395f] dark:text-zinc-100">{leaderboardUsers.length}</p>
            </CardContent>
          </Card>
          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-3.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Top XP</p>
              <p className="mt-1 text-xl font-semibold text-[#24395f] dark:text-zinc-100">{topXp.toLocaleString('nl-NL')}</p>
            </CardContent>
          </Card>
          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-3.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Jouw positie</p>
              <p className="mt-1 text-xl font-semibold text-[#24395f] dark:text-zinc-100">{currentUserRank > 0 ? `#${currentUserRank}` : '-'}</p>
            </CardContent>
          </Card>
        </div>

        {currentUserRank > 0 && (
          <Card className="mb-5 border-[#b8cff0] bg-[#edf4ff] py-0 shadow-sm dark:border-[#2d4a7a] dark:bg-[#192d48]">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm font-medium text-[#1e3a6e] dark:text-[#c5d9f5]">
                Je staat momenteel op plek{' '}
                <span className="font-bold text-[#4f6faa] dark:text-[#6f8ed4]">#{currentUserRank}</span>{' '}
                in de ranglijst.
              </p>
              <Badge className="bg-[#6f8ed4] text-white dark:bg-[#6f8ed4] dark:text-white">
                Blijf spelen om te stijgen
              </Badge>
            </CardContent>
          </Card>
        )}

        {leaderboardUsers.length === 0 ? (
          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-[#1f2f4b] dark:text-zinc-100">Nog geen ranglijstgegevens</h2>
              <p className="mt-2 text-sm text-muted-foreground">Start met quizzen om een positie op te bouwen.</p>
              <Button asChild className="mt-5 h-10 rounded-md bg-[#6f8ed4] dark:bg-zinc-500 px-5 text-white hover:bg-[#5f81cc] dark:hover:bg-zinc-400">
                <Link href="/quizzes">Naar quizzen</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-0">
              <div className="hidden w-full border-b border-[#dce5f1] bg-[#eef3f9] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#607597] md:grid md:grid-cols-[90px_minmax(0,1fr)_130px_130px] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <span>Positie</span>
                <span>Speler</span>
                <span>XP</span>
                <span>Streak</span>
              </div>

              <ul>
                {leaderboardUsers.map((user, index) => {
                  const isCurrentUser = user._id === currentUserId;
                  const isTopThree = index < 3;

                  return (
                    <li
                      key={user._id}
                      className={`grid gap-2 border-b text-sm md:grid-cols-[90px_minmax(0,1fr)_130px_130px] md:items-center ${
                        isCurrentUser
                          ? 'border-l-4 border-l-[#6f8ed4] border-b-[#dce8fb] bg-[#edf4ff] p-4 pl-3 dark:border-l-[#6f8ed4] dark:border-b-zinc-700 dark:bg-[#1a2e4a]'
                          : isTopThree
                            ? 'border-b-[#ecf1f8] bg-[#fbfdff] p-4 dark:border-b-zinc-700 dark:bg-zinc-900'
                            : 'border-b-[#ecf1f8] bg-white p-4 dark:border-b-zinc-700 dark:bg-zinc-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-8 min-w-8 items-center justify-center border px-1 text-xs font-bold ${rankBadgeTone(index)}`}>
                          #{index + 1}
                        </span>
                        {isTopThree && (
                          <Medal className={`h-4 w-4 ${index === 0 ? 'text-[#9b7428] dark:text-amber-300' : index === 1 ? 'text-[#647da7] dark:text-zinc-300' : 'text-[#95634d] dark:text-orange-200'}`} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <UserCircle2 className="h-4 w-4 text-[#607597] dark:text-zinc-300" />
                          <p className="truncate font-medium text-[#1f2f4b] dark:text-zinc-100">{getDisplayName(user)}</p>
                          {isCurrentUser && (
                            <Badge className="bg-[#6f8ed4] text-white dark:bg-[#6f8ed4] dark:text-white">
                              Jij
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:block">
                        <span className="text-xs text-muted-foreground md:hidden">XP:</span>
                        <span className="font-medium text-[#24395f] dark:text-zinc-100">{(user.xp || 0).toLocaleString('nl-NL')}</span>
                      </div>

                      <div className="flex items-center gap-2 md:block">
                        <span className="text-xs text-muted-foreground md:hidden">Streak:</span>
                        <span className="text-[#4e5f79] dark:text-zinc-300">{formatStreak(user.streak || 0)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
