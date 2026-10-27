import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { Container } from '@/components/bq';
import ProfileView, { type ProfileBadge } from '@/components/web2/account/ProfileView';
import { authOptions } from '@/lib/auth';
import { connectDB, Duel, User, UserProgress } from '@/database';
import { resolveAvatar } from '@/lib/avatar';
import { listDuelPlayers } from '@/lib/duels/service';
import { buildDuelInviteUrl } from '@/lib/duels/invite';
import { BADGES, getLevelInfo } from '@/lib/gamification';
import { getPremiumSnapshot } from '@/lib/premium-state';
import { daysUntilRenameAllowed } from '@/lib/profile-identity';

export const metadata: Metadata = {
  title: 'Mijn Profiel - BijbelQuiz',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

/** Unique quizzes the "Allrounder" badge asks for (`lib/quiz-submission.ts`: more than 20). */
const ALL_ROUNDER_QUIZZES = 21;

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/inloggen?callbackUrl=/profiel');
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) {
    redirect('/inloggen?callbackUrl=/profiel');
  }

  const userId = String(user._id);
  const [uniqueQuizIds, players, openInvite, dailyVerse] = await Promise.all([
    UserProgress.distinct('quizId', { userId: user._id }),
    listDuelPlayers(userId, null).catch((error) => {
      console.error('[PROFILE_DUEL_PLAYERS]', error);
      return { players: [] };
    }),
    Duel.findOne({
      challengerId: user._id,
      mode: 'invite',
      status: 'open',
      opponentId: null,
      inviteToken: { $exists: true },
      turnDeadline: { $gt: new Date() },
    })
      .select('inviteToken')
      .sort({ createdAt: -1 })
      .lean(),
    fetchDailyVerse(),
  ]);

  const xp = user.xp || 0;
  const level = getLevelInfo(xp);
  const streak = user.streak || 0;
  const earned = new Set<string>(user.badges || []);
  const uniqueQuizzes = uniqueQuizIds.length;

  const progressFor = (id: string): { current: number; target: number } => {
    switch (id) {
      case 'first_steps':
        return { current: Math.min(user.quizzesPlayed || 0, 1), target: 1 };
      case 'knowledge_seeker':
        return { current: uniqueQuizzes, target: 10 };
      case 'perfect_score':
        return { current: 0, target: 1 };
      case 'streak_3':
        return { current: streak, target: 3 };
      case 'streak_7':
        return { current: streak, target: 7 };
      case 'scholar':
        return { current: level.level, target: 5 };
      case 'master':
        return { current: level.level, target: 10 };
      case 'all_rounder':
        return { current: uniqueQuizzes, target: ALL_ROUNDER_QUIZZES };
      default:
        return { current: 0, target: 1 };
    }
  };

  const badges: ProfileBadge[] = BADGES.map((badge) => {
    const { current, target } = progressFor(badge.id);
    return {
      id: badge.id,
      name: badge.name,
      // The rule behind "Allrounder" is a number of different quizzes; the
      // description says so rather than promise categories it does not count.
      description: badge.id === 'all_rounder' ? `Speel ${ALL_ROUNDER_QUIZZES} verschillende quizzen.` : badge.description,
      icon: badge.icon,
      earned: earned.has(badge.id),
      current: Math.min(current, target),
      target,
    };
  });

  const memberSince = new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

  return (
    <Container>
      <ProfileView
        identity={{
          name: user.name || 'Naamloos',
          avatar: resolveAvatar(user.avatar, userId),
          nameChangeAllowedInDays: daysUntilRenameAllowed(user.nameUpdatedAt),
          memberSince,
        }}
        level={{
          level: level.level,
          xp,
          isMaxLevel: level.isMaxLevel,
          xpToNext: Math.max(0, level.nextLevelXp - xp),
          progress: level.progressPercentage,
        }}
        stats={{
          streak,
          xp,
          quizzesPlayed: user.quizzesPlayed || 0,
          averageScore: user.averageScore || 0,
        }}
        badges={badges}
        friends={players.players.slice(0, 4)}
        inviteUrl={openInvite?.inviteToken ? buildDuelInviteUrl(openInvite.inviteToken) : null}
        isPremium={getPremiumSnapshot(user).isPremium}
        dailyVerse={dailyVerse}
      />
    </Container>
  );
}

/** The verse of the day from BijbelAPI; a fixed verse when it is unreachable. */
async function fetchDailyVerse(): Promise<{ reference: string; text: string }> {
  const fallback = {
    reference: 'Psalm 119:105',
    text: 'Uw woord is een lamp voor mijn voet en een licht op mijn pad.',
  };

  try {
    const apiKey =
      process.env.BIJBEL_API_KEY || process.env.BIJBELAPI_KEY || process.env.NEXT_PUBLIC_BIJBEL_API_KEY || '';

    const response = await fetch('https://bijbelapi.com/api/daytext?version=bb', {
      headers: { Accept: 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
      // Same verse all day: no need to ask on every profile view.
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const payload = await response.json();
      if (payload?.text && (payload?.reference || (payload?.book && payload?.chapter && payload?.verse))) {
        return {
          reference: payload.reference || `${payload.book} ${payload.chapter}:${payload.verse}`,
          text: payload.text,
        };
      }
    }
  } catch (error) {
    console.error('[PROFILE_DAYTEXT_GET]', error);
  }

  return fallback;
}
