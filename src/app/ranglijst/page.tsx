import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { Container, Tabs } from '@/components/bq';
import { authOptions } from '@/lib/auth';
import { getLeaderboardResult, type LeaderboardPeriod } from '@/lib/leaderboard';
import { getUserPeriodXp, nextPlaceGap } from '@/lib/leaderboard-standing';
import { leaderboardFor, listFor, type PlayerGroupSummary } from '@/lib/player-groups';
import { GroupsCard, StandingCard } from './SideCards';
import { Podium } from './Podium';
import { RankList } from './RankList';
import type { BoardRow } from './types';

export const metadata: Metadata = {
  title: 'Ranglijst - BijbelQuiz',
  description: 'Bekijk de topspelers van BijbelQuiz. Verdien punten door quizzen te spelen en stijg in de ranglijst.',
  alternates: {
    canonical: '/ranglijst',
  },
  openGraph: {
    title: 'De BijbelQuiz Ranglijst - Wie heeft de meeste bijbelkennis?',
    description: 'Strijd mee voor de eerste plek. Speel quizzen, verdien punten en word de nummer 1.',
    url: 'https://www.bijbelquiz.com/ranglijst',
  },
};

interface LeaderboardPageProps {
  searchParams?: Promise<{ period?: string; groep?: string }>;
}

/**
 * The ranglijst. "Deze maand" (the default) is the rolling last 30 days the
 * server already computes for `/api/leaderboard?period=monthly`; "Altijd" is
 * the account total. `?groep=<id>` shows one of the player's saved groups
 * instead of everybody, with the same two periods.
 */
export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? String(session.user.id) : null;

  const params = searchParams ? await searchParams : undefined;
  // The website opens on the month; the API keeps its own default for the app.
  const period: LeaderboardPeriod = params?.period === 'all-time' ? 'all-time' : 'monthly';
  const requestedGroup = userId && params?.groep ? params.groep : null;

  const groups: PlayerGroupSummary[] = userId ? await listFor(userId).catch(() => []) : [];

  let rows: BoardRow[];
  let currentUserRank: number | null;
  let activeGroup: PlayerGroupSummary | null = null;

  const groupBoard = requestedGroup ? await leaderboardFor(userId!, requestedGroup, period).catch(() => null) : null;
  if (groupBoard?.ok) {
    activeGroup = groupBoard.leaderboard.group;
    rows = groupBoard.leaderboard.entries.map((entry) => ({ id: entry._id, name: entry.name, xp: entry.xp }));
    currentUserRank = groupBoard.leaderboard.currentUserRank;
  } else {
    const result = await getLeaderboardResult(period, 100, userId);
    rows = result.leaderboard.map((entry) => ({ id: entry._id, name: entry.name, xp: entry.xp }));
    currentUserRank = result.currentUserRank;
  }

  const ownIndex = userId ? rows.findIndex((row) => row.id === userId) : -1;
  const ownXp = ownIndex >= 0 ? rows[ownIndex].xp : userId ? await getUserPeriodXp(period, userId) : 0;
  const ownRank = ownIndex >= 0 ? ownIndex + 1 : currentUserRank;
  const gap = nextPlaceGap(
    rows.map((row) => ({ _id: row.id, xp: row.xp })),
    userId,
  );

  const query = (next: { period?: LeaderboardPeriod; groep?: string | null }) => {
    const search = new URLSearchParams();
    const nextPeriod = next.period ?? period;
    const nextGroup = next.groep === undefined ? activeGroup?.id ?? null : next.groep;
    if (nextPeriod === 'all-time') search.set('period', 'all-time');
    if (nextGroup) search.set('groep', nextGroup);
    const text = search.toString();
    return text ? `/ranglijst?${text}` : '/ranglijst';
  };

  const periodLabel = period === 'monthly' ? 'deze maand' : 'altijd';

  return (
    <Container className="flex flex-col gap-7 px-5 pb-[72px] pt-10">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">
          {activeGroup ? activeGroup.name : 'Ranglijst'}
        </h1>
        <p className="m-0 flex items-center gap-2 text-[17px] font-semibold leading-6 text-ink-muted">
          <TrophyIcon />
          {period === 'monthly' ? 'XP van de afgelopen 30 dagen' : 'Alle verdiende XP'}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 m:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label={`Ranglijst ${periodLabel}`} className="flex min-w-0 flex-col gap-8">
          <Tabs
            aria-label="Periode"
            value={period}
            items={[
              { value: 'monthly', label: 'Deze maand', href: query({ period: 'monthly' }) },
              { value: 'all-time', label: 'Altijd', href: query({ period: 'all-time' }) },
            ]}
          />

          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[16px] border border-line bg-card px-6 py-10 text-center">
              <p className="m-0 font-display text-xl font-semibold text-ink">Nog niemand op de ranglijst</p>
              <p className="m-0 max-w-[44ch] text-[15px] font-semibold leading-[22px] text-ink-muted">
                {period === 'monthly'
                  ? 'De afgelopen 30 dagen heeft nog niemand XP verdiend. Speel een quiz en sta bovenaan.'
                  : 'Speel een quiz om de eerste op de ranglijst te zijn.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <Podium rows={rows.slice(0, 3)} label={`Top 3 ${periodLabel}`} />
              <RankList rows={rows} startAt={3} currentUserId={userId} gap={gap} />
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-5">
          <StandingCard
            signedIn={!!userId}
            rank={ownRank}
            xp={ownXp}
            label={activeGroup ? `Jouw plek in ${activeGroup.name}` : period === 'monthly' ? 'Jouw plek deze maand' : 'Jouw plek altijd'}
          />
          {userId && (
            <GroupsCard
              groups={groups.map((group) => ({
                id: group.id,
                name: group.name,
                memberCount: group.memberCount,
                href: query({ groep: group.id }),
              }))}
              activeGroupId={activeGroup?.id ?? null}
              everyoneHref={query({ groep: null })}
            />
          )}
        </aside>
      </div>
    </Container>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-gold-text"
    >
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5a3 3 0 0 0 3 4" />
      <path d="M16 6h3a3 3 0 0 1-3 4" />
      <path d="M12 13v4" />
      <path d="M8 20h8" />
    </svg>
  );
}
