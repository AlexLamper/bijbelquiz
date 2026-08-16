'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronDown, Medal } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Eyebrow, Figure } from '@/components/editorial';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MascotAvatar from '@/components/avatar/MascotAvatar';
import type { AvatarConfig } from '@/lib/avatar';

interface LeaderboardUser {
  _id: string;
  name: string;
  xp: number;
  streak: number;
  badges?: string[];
  avatar?: AvatarConfig;
  createdAt?: string;
}

interface LeaderboardClientProps {
  users: LeaderboardUser[];
  currentUserId?: string;
  initialCurrentUserRank?: number | null;
  initialPeriod: 'monthly' | 'all-time';
}

type LeaderboardPeriod = 'monthly' | 'all-time';

/** A saved group, as returned by `/api/player-groups`. */
interface PlayerGroupOption {
  id: string;
  name: string;
  memberCount: number;
}

/** The global board, or one saved group. */
type BoardScope = { kind: 'global' } | { kind: 'group'; id: string };

const VISIBLE_LIMIT = 20;

function rankBadgeTone(index: number): string {
  if (index === 0) return 'border-lapis/35 bg-lapis-tint text-lapis   ';
  if (index === 1) return 'border-rule bg-paper-sunken text-ink-soft';
  if (index === 2) return 'border-lapis/35 bg-lapis-tint text-ink   ';
  return 'border-rule bg-paper-sunken text-ink-soft';
}

function getDisplayName(user: LeaderboardUser): string {
  return user.name?.trim() || 'Gebruiker';
}

function formatStreak(streak: number): string {
  return streak === 1 ? '1 dag' : `${streak} dagen`;
}

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  monthly: 'Maandelijks',
  'all-time':'All-time',
};

export default function LeaderboardClient({ users, currentUserId, initialCurrentUserRank, initialPeriod }: LeaderboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(users);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(initialCurrentUserRank ?? null);
  const [showAll, setShowAll] = useState(false);
  const [groups, setGroups] = useState<PlayerGroupOption[]>([]);
  const [scope, setScope] = useState<BoardScope>({ kind: 'global' });

  useEffect(() => {
    setSelectedPeriod(initialPeriod);
    setLeaderboardUsers(users);
    setCurrentUserRank(initialCurrentUserRank ?? null);
    setScope({ kind: 'global' });
  }, [initialCurrentUserRank, initialPeriod, users]);

  // Loaded client-side rather than passed in from the page: a signed-out
  // visitor has no groups, and the global board should not wait on a query
  // that will come back empty for most of the people who see this page.
  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let cancelled = false;

    fetch('/api/player-groups')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.groups) return;
        setGroups(
          (payload.groups as Array<{ id: string; name: string; memberCount: number }>).map((group) => ({
            id: group.id,
            name: group.name,
            memberCount: group.memberCount,
          })),
        );
      })
      .catch(() => {
        // A missing group list is not worth an error state on a page whose
        // main content loaded fine.
      });

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const visibleCurrentUserRank = leaderboardUsers.findIndex((user) => user._id === currentUserId) + 1;
  const resolvedCurrentUserRank = currentUserRank || (visibleCurrentUserRank > 0 ? visibleCurrentUserRank : null);
  const topXp = leaderboardUsers[0]?.xp || 0;
  const activeGroup = scope.kind === 'group' ? groups.find((group) => group.id === scope.id) : undefined;

  /**
   * Loads whichever board the two selectors currently describe.
   *
   * One function for both because period and scope are the same request with
   * a different URL, and splitting them is how you end up asking the global
   * endpoint for a group's month.
   */
  const loadBoard = async (period: LeaderboardPeriod, nextScope: BoardScope) => {
    setSelectedPeriod(period);
    setScope(nextScope);
    setIsLoadingPeriod(true);

    const url =
      nextScope.kind === 'group'
        ? `/api/player-groups/${nextScope.id}/leaderboard?period=${period}`
        : `/api/leaderboard?period=${period}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Kon ranglijst niet laden');
      }

      const payload = await response.json();
      setLeaderboardUsers(
        nextScope.kind === 'group' ? payload?.entries || [] : payload?.leaderboard || [],
      );
      setShowAll(false);
      setCurrentUserRank(typeof payload?.currentUserRank === 'number' ? payload.currentUserRank : null);
    } catch (error) {
      console.error('[LEADERBOARD_LOAD]', error);
      // Keep the current list if the request fails.
    } finally {
      setIsLoadingPeriod(false);
    }
  };

  const loadPeriod = (period: LeaderboardPeriod) => {
    if (period === selectedPeriod) {
      return;
    }
    void loadBoard(period, scope);
  };

  const loadScope = (nextScope: BoardScope) => {
    if (nextScope.kind === scope.kind && (nextScope.kind === 'global' || nextScope.id === (scope as { id: string }).id)) {
      return;
    }
    void loadBoard(selectedPeriod, nextScope);
  };

  const hasOverflow = leaderboardUsers.length > VISIBLE_LIMIT;
  const visibleUsers = showAll ? leaderboardUsers : leaderboardUsers.slice(0, VISIBLE_LIMIT);

  return (
    <div className="min-h-screen bg-paper pb-16 pt-8 lg:pt-10">
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Ranglijst</Eyebrow>
            <h1 className="mt-3 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
              {activeGroup ? activeGroup.name : 'Top spelers'}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
              {activeGroup
                ? `De stand binnen je groep van ${activeGroup.memberCount} spelers.`
                : 'Verdien XP door quizzen te spelen en stijg in de ranglijst.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-10 rounded-md bg-ink px-5 text-ink-inverted hover:bg-ink-soft">
              <Link href="/quizzen">Speel quiz</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-md border-rule bg-paper-raised px-5 text-ink hover:bg-paper-sunken">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pt-8 sm:px-8 lg:px-10">
        {groups.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={scope.kind === 'global' ? 'default' : 'outline'}
              onClick={() => loadScope({ kind: 'global' })}
              disabled={isLoadingPeriod}
              className={
                scope.kind === 'global'
                  ? 'h-9 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft'
                  : 'h-9 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken'
              }
            >
              Iedereen
            </Button>
            {groups.map((group) => {
              const isActive = scope.kind === 'group' && scope.id === group.id;

              return (
                <Button
                  key={group.id}
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => loadScope({ kind: 'group', id: group.id })}
                  disabled={isLoadingPeriod}
                  className={
                    isActive
                      ? 'h-9 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft'
                      : 'h-9 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken'
                  }
                >
                  {group.name}
                </Button>
              );
            })}
          </div>
        )}

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
                    ? 'h-9 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft  '
                    : 'h-9 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken    '
                }
              >
                {PERIOD_LABELS[period]}
              </Button>
            );
          })}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-rule py-5 md:grid-cols-3 md:gap-y-0 md:divide-x md:divide-rule">
          <Figure label="Deelnemers" value={leaderboardUsers.length} pigment="lapis" />
          <Figure label="Top XP" value={topXp.toLocaleString('nl-NL')} pigment="lapis" />
          <Figure
            label="Jouw positie"
            value={resolvedCurrentUserRank ? `#${resolvedCurrentUserRank}` : '-'}
            pigment="verdigris"
          />
        </div>

        {resolvedCurrentUserRank && (
          <Card className="mb-6 border-lapis/35 bg-lapis-tint py-0">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm font-medium text-ink">
                Je staat momenteel op plek{' '}
                <span className="font-semibold text-ink-soft">#{resolvedCurrentUserRank}</span>{' '}
                in de ranglijst.
              </p>
              <Badge className="bg-ink text-ink-inverted dark:text-ink-inverted">
                Blijf spelen om te stijgen
              </Badge>
            </CardContent>
          </Card>
        )}

        {leaderboardUsers.length === 0 ? (
          <Card className="border-rule py-0">
            <CardContent className="p-12 text-center">
              <h2 className="font-display text-xl font-normal tracking-[-0.015em] text-ink">Nog geen ranglijstgegevens</h2>
              <p className="mt-2 text-sm text-muted-foreground">Start met quizzen om een positie op te bouwen.</p>
              <Button asChild className="mt-5 h-10 rounded-md bg-ink px-5 text-ink-inverted hover:bg-ink-soft">
                <Link href="/quizzen">Naar quizzen</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-rule py-0">
            <CardContent className="p-0">
              <div className="hidden w-full border-b border-rule px-5 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted md:grid md:grid-cols-[90px_minmax(0,1fr)_130px_130px]">
                <span>Positie</span>
                <span>Speler</span>
                <span>XP</span>
                <span>Streak</span>
              </div>

              <ul>
                {visibleUsers.map((user, index) => {
                  const isCurrentUser = user._id === currentUserId;
                  const isTopThree = index < 3;

                  return (
                    <li
                      key={user._id}
                      className={`grid gap-2 border-b text-sm md:grid-cols-[90px_minmax(0,1fr)_130px_130px] md:items-center ${
                        isCurrentUser
                          ? 'border-l-4 border-l-lapis/35 border-b-rule-strong bg-paper-sunken p-4 pl-3   '
                          : isTopThree
                            ? 'border-b-rule bg-paper-raised p-4'
                            : 'border-b-rule bg-paper-raised p-4'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-8 min-w-8 items-center justify-center border px-1 text-xs font-semibold ${rankBadgeTone(index)}`}>
                          #{index + 1}
                        </span>
                        {isTopThree && (
                          <Medal className={`h-4 w-4 ${index === 0 ? 'text-lapis dark:text-lapis' : index === 1 ? 'text-ink-soft' : 'text-ink-soft dark:text-lapis'}`} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <MascotAvatar avatar={user.avatar} size={34} bordered />
                          <p className="truncate font-medium text-ink">{getDisplayName(user)}</p>
                          {isCurrentUser && (
                            <Badge className="bg-ink text-ink-inverted dark:text-ink-inverted">
                              Jij
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:block">
                        <span className="text-xs text-muted-foreground md:hidden">XP:</span>
                        <span className="font-medium text-ink">{(user.xp || 0).toLocaleString('nl-NL')}</span>
                      </div>

                      <div className="flex items-center gap-2 md:block">
                        <span className="text-xs text-muted-foreground md:hidden">Streak:</span>
                        <span className="text-ink-soft">{formatStreak(user.streak || 0)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {hasOverflow && (
                <div className="border-t border-rule px-5 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAll((value) => !value)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
                  >
                    {showAll
                      ? 'Toon minder'
                      : `Toon alle ${leaderboardUsers.length.toLocaleString('nl-NL')} spelers`}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
