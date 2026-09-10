import { getServerSession } from 'next-auth';
import { Metadata } from 'next';
import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Compass,
  CreditCard,
  Crown,
  Flame,
  Footprints,
  GraduationCap,
  Search,
  Target,
} from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { connectDB, User } from '@/database';
import { resolvePremiumSubscription } from '@/lib/premium-subscription';
import { getLevelInfo, BADGES, LEVELS } from '@/lib/gamification';
import { resolveAvatar } from '@/lib/avatar';
import { daysUntilRenameAllowed } from '@/lib/profile-identity';
import ProfileIdentityCard from '@/components/avatar/ProfileIdentityCard';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eyebrow, Figure, SectionHead } from '@/components/editorial';
import { Card, CardContent } from '@/components/ui/card';

/** Semantic badge icon names, mapped onto this platform's icon set. */
const BADGE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  footprints: Footprints,
  search: Search,
  target: Target,
  flame: Flame,
  'calendar-check': CalendarCheck,
  'graduation-cap': GraduationCap,
  crown: Crown,
  compass: Compass,
};

export const metadata: Metadata = {
  title: 'Mijn Profiel - BijbelQuiz',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/inloggen?callbackUrl=/profiel');
  }

  await connectDB();
  const user = await User.findById(session.user.id);

  if (!user) {
    return <div>Gebruiker niet gevonden</div>;
  }

  const totalQuizzesDone = user.quizzesPlayed || 0;
  const avgScore = user.averageScore || 0;

  const subscription = await resolvePremiumSubscription(user);
  const isLifetimePremium = subscription.isLifetime;
  const isMonthlyPremium = subscription.isMonthly;
  const subscriptionStatusText = subscription.statusText;
  const subscriptionEndDateLabel = subscription.endDateLabel;
  const subscriptionCancelAtPeriodEnd = subscription.cancelAtPeriodEnd;

  const levelInfo = getLevelInfo(user.xp || 0);
  let dailyVerse = {
    reference: 'Psalm 119:105',
    text: 'Uw woord is een lamp voor mijn voet en een licht op mijn pad.',
  };

  try {
    const apiKey =
      process.env.BIJBEL_API_KEY ||
      process.env.BIJBELAPI_KEY ||
      process.env.NEXT_PUBLIC_BIJBEL_API_KEY ||
      '';

    const response = await fetch('https://bijbelapi.com/api/daytext?version=bb', {
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const payload = await response.json();
      if (payload?.text && (payload?.reference || (payload?.book && payload?.chapter && payload?.verse))) {
        dailyVerse = {
          reference: payload.reference || `${payload.book} ${payload.chapter}:${payload.verse}`,
          text: payload.text,
        };
      }
    }
  } catch (error) {
    console.error('[PROFILE_DAYTEXT_GET]', error);
  }

  return (
    <div className="min-h-screen bg-paper pb-16 pt-8 lg:pt-10">
      {/* Masthead */}
      <section className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
        <Eyebrow>Profiel</Eyebrow>
        <ProfileIdentityCard
          initialName={user.name || 'Naamloos'}
          initialAvatar={resolveAvatar(user.avatar, String(user._id))}
          nameChangeAllowedInDays={daysUntilRenameAllowed(user.nameUpdatedAt)}
          email={user.email}
          memberSince={new Date(user.createdAt).toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          isPremium={Boolean(user.isPremium)}
        />
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pt-8 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-rule pb-6 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-rule">
          <Figure
            label="Ervaring"
            value={(user.xp || 0).toLocaleString('nl-NL')}
            meta="XP verzameld"
            pigment="lapis"
          />
          <Figure label="Reeks" value={user.streak || 0} meta="opeenvolgende dagen" pigment="vermilion" />
          <Figure label="Afgerond" value={totalQuizzesDone} meta="quizzen gespeeld" pigment="verdigris" />
          <Figure label="Gem. score" value={avgScore + '%'} meta="over alle pogingen" pigment="lapis" />
        </div>

        <div className="mt-11 grid gap-11 lg:mt-14 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] xl:gap-14">
          <article>
              <SectionHead
                eyebrow="Voortgang"
                title="Niveau"
                pigment="lapis"
                action={
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
                    {levelInfo.progressPercentage}% voltooid
                  </span>
                }
              />

              <div className="mt-7 flex items-center gap-6">
                <p className="font-display text-[44px] font-normal leading-none tracking-[-0.03em] text-ink tabular-nums">
                  {levelInfo.level}
                </p>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-snug text-ink">{levelInfo.title}</p>

                  <div className="mt-3 h-px w-full bg-rule-strong">
                    <div
                      className="h-px bg-lapis transition-[width] duration-700"
                      style={{ width: levelInfo.progressPercentage + '%' }}
                    />
                  </div>

                  {!levelInfo.isMaxLevel && (
                    <p className="mt-2.5 text-xs text-ink-muted">
                      Nog {levelInfo.nextLevelXp - levelInfo.currentXp} XP tot het volgende niveau
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Alle niveaus</p>
                <div className="grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
                  {LEVELS.map((entry) => {
                    const isReached = user.xp >= entry.minXp;
                    const isCurrent = entry.level === levelInfo.level;

                    return (
                      <div
                        key={entry.level}
                        className={`relative flex items-center gap-4 px-4 py-3.5 ${
                          isCurrent
                            ? 'bg-paper-sunken before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-lapis'
                            : 'bg-paper-raised'
                        }`}
                      >
                        <span
                          className={`w-6 shrink-0 font-display text-sm tabular-nums ${
                            isCurrent ? 'text-lapis' : isReached ? 'text-ink-soft' : 'text-ink-muted'
                          }`}
                        >
                          {String(entry.level).padStart(2, '0')}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block font-display text-base leading-snug ${
                              isReached ? 'text-ink' : 'text-ink-muted'
                            }`}
                          >
                            {entry.title}
                          </span>
                          <span className="mt-0.5 block text-xs tabular-nums text-ink-muted">
                            Vanaf {entry.minXp.toLocaleString('nl-NL')} XP
                          </span>
                        </span>

                        {isCurrent ? (
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.16em] text-lapis">
                            Nu
                          </span>
                        ) : isReached ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-positive" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
          </article>

          <aside>
              <SectionHead
                eyebrow="Erkenning"
                title="Badges"
                pigment="verdigris"
                action={
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
                    {(user.badges || []).length} / {BADGES.length}
                  </span>
                }
              />

              {/* Badges are struck marks, not stickers: a hairline square with
                  a line icon, filled in ink once earned and left as an empty
                  outline while it is not. */}
              <ul className="mt-7 divide-y divide-rule overflow-hidden rounded-lg border border-rule">
                {BADGES.map((badge) => {
                  const earned = (user.badges || []).includes(badge.id);
                  const Icon = BADGE_ICONS[badge.icon] ?? Award;

                  return (
                    <li
                      key={badge.id}
                      className={
                        earned
                          ? 'flex items-center gap-3.5 bg-paper-raised px-4 py-3.5'
                          : 'flex items-center gap-3.5 bg-paper px-4 py-3.5'
                      }
                    >
                      <span
                        aria-hidden
                        className={
                          earned
                            ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-ink-inverted'
                            : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-rule-strong text-ink-muted'
                        }
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            earned
                              ? 'break-words font-display text-sm leading-snug text-ink'
                              : 'break-words font-display text-sm leading-snug text-ink-muted'
                          }
                        >
                          {badge.name}
                        </p>
                        <p className="mt-0.5 break-words text-[11px] leading-relaxed text-ink-muted">
                          {badge.description}
                        </p>
                      </div>

                      {earned ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />
                      ) : (
                        <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                          Open
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
          </aside>
        </div>

        {!user.isPremium && (
          <section className="mt-11 lg:mt-14">
            <Card className="border-lapis/45 py-0">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.6fr)_auto] lg:items-center">
                <div>
                  <Badge variant="lapis" className="mb-4">
                    <Crown className="h-3 w-3" />
                    Premium
                  </Badge>
                  <h3 className="font-display text-2xl font-normal tracking-[-0.015em] text-ink">Upgrade naar Premium</h3>
                  <p className="mt-2 max-w-xl text-sm text-ink-muted">
                    Host onbeperkt multiplayer-rooms, krijg uitleg bij elke vraag en ontgrendel alle premium quizzen.
                  </p>
                </div>

                <Button asChild className="h-10 rounded-md bg-ink px-5 text-ink-inverted hover:bg-ink-soft">
                  <Link href="/premium">Word nu Premium</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {user.isPremium && (
          <section className="mt-8 border-t border-rule pt-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-ink-soft" />
                  <div>
                    <h3 className="font-display text-xl font-normal tracking-[-0.015em] text-ink">Premium lidmaatschap</h3>
                    <p className="text-sm text-ink-muted">Je account heeft toegang tot alle Premium content.</p>
                  </div>
                </div>

                <Badge variant="secondary" className="bg-paper-sunken text-ink-soft">
                  {isLifetimePremium ? 'Levenslang' : subscriptionStatusText}
                </Badge>
              </div>

              {isMonthlyPremium ? (
                <>
                  <div className="mb-5 space-y-2 text-sm text-ink-muted">
                    {subscriptionCancelAtPeriodEnd ? (
                      <p>
                        Je abonnement is opgezegd en blijft actief tot{' '}
                        <span className="font-semibold text-ink">{subscriptionEndDateLabel || 'einde van de huidige periode'}</span>.
                      </p>
                    ) : (
                      <p>
                        {subscriptionEndDateLabel
                          ? (
                            <>
                              Je Premium loopt door en verlengt op{' '}
                              <span className="font-semibold text-ink">{subscriptionEndDateLabel}</span>.
                            </>
                          )
                          : 'Je maandabonnement is actief.'}
                      </p>
                    )}
                    <p>Je kunt betaalgegevens en facturen beheren via Stripe.</p>
                  </div>

                  <form action="/api/stripe/portal" method="POST">
                    <Button type="submit" className="h-10 rounded-md bg-ink px-5 text-ink-inverted hover:bg-ink-soft">
                      Open abonnementsportaal (Stripe)
                    </Button>
                  </form>
                </>
              ) : (
                <div className="space-y-2 text-sm text-ink-muted">
                  <p>Je hebt levenslange Premium toegang. Er is geen terugkerend abonnement om stop te zetten.</p>
                  <p>Deze aankoop blijft permanent gekoppeld aan je account.</p>
                </div>
              )}
          </section>
        )}

        <section className="mt-8 border-t border-rule pt-6">
          <Card className="border-rule py-0">
            <CardContent className="p-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Dagtekst</p>
              <p className="mt-1 text-sm font-semibold text-ink">{dailyVerse.reference}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink">{dailyVerse.text}</p>
            </CardContent>
          </Card>
        </section>
      </section>
    </div>
  );
}
