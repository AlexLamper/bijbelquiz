import { getServerSession } from 'next-auth';
import { Metadata } from 'next';
import Link from 'next/link';
import type Stripe from 'stripe';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Crown,
  Flame,
  Mail,
  Star,
  Target,
  Trophy,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';

import { authOptions } from '@/lib/auth';
import { connectDB, User } from '@/database';
import stripe from '@/lib/stripe';
import { getLevelInfo, BADGES, LEVELS } from '@/lib/gamification';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
    redirect('/login');
  }

  await connectDB();
  const user = await User.findById(session.user.id);

  if (!user) {
    return <div>Gebruiker niet gevonden</div>;
  }

  const totalQuizzesDone = user.quizzesPlayed || 0;
  const avgScore = user.averageScore || 0;

  const isLifetimePremium = !!user.hasLifetimePremium;
  const isMonthlyPremium = !!user.isPremium && !isLifetimePremium;

  let resolvedStripeCustomerId = user.stripeCustomerId || '';
  let resolvedStripeSubscriptionId = user.stripeSubscriptionId || '';
  let resolvedSubscriptionStatus = (user.stripeSubscriptionStatus || '').toLowerCase();
  let subscriptionCurrentPeriodEnd: Date | null = null;
  let subscriptionCancelAtPeriodEnd = false;

  const setSubscriptionPeriodEnd = (subscription: Stripe.Subscription) => {
    const periodEndUnix = subscription.items?.data?.[0]?.current_period_end;
    if (typeof periodEndUnix === 'number') {
      subscriptionCurrentPeriodEnd = new Date(periodEndUnix * 1000);
    }
  };

  if (isMonthlyPremium) {
    try {
      if (!resolvedStripeSubscriptionId && resolvedStripeCustomerId) {
        const subscriptions = await stripe.subscriptions.list({
          customer: resolvedStripeCustomerId,
          status: 'all',
          limit: 1,
        });

        if (subscriptions.data[0]) {
          resolvedStripeSubscriptionId = subscriptions.data[0].id;
          resolvedSubscriptionStatus = subscriptions.data[0].status;
          subscriptionCancelAtPeriodEnd = !!subscriptions.data[0].cancel_at_period_end;
          setSubscriptionPeriodEnd(subscriptions.data[0]);
        }
      }

      if (!resolvedStripeSubscriptionId && user.email) {
        const customers = await stripe.customers.list({ email: user.email, limit: 10 });

        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
            limit: 1,
          });

          if (subscriptions.data[0]) {
            resolvedStripeCustomerId = customer.id;
            resolvedStripeSubscriptionId = subscriptions.data[0].id;
            resolvedSubscriptionStatus = subscriptions.data[0].status;
            subscriptionCancelAtPeriodEnd = !!subscriptions.data[0].cancel_at_period_end;
            setSubscriptionPeriodEnd(subscriptions.data[0]);
            break;
          }
        }
      }

      if (resolvedStripeSubscriptionId && !subscriptionCurrentPeriodEnd) {
        const subscription = await stripe.subscriptions.retrieve(resolvedStripeSubscriptionId);
        resolvedSubscriptionStatus = subscription.status || resolvedSubscriptionStatus;
        subscriptionCancelAtPeriodEnd = !!subscription.cancel_at_period_end;
        setSubscriptionPeriodEnd(subscription);
        if (!resolvedStripeCustomerId && typeof subscription.customer === 'string') {
          resolvedStripeCustomerId = subscription.customer;
        }
      }
    } catch (subscriptionError) {
      console.warn('[PROFILE] Failed to resolve Stripe subscription details', subscriptionError);
    }

    if (
      resolvedStripeCustomerId !== (user.stripeCustomerId || '') ||
      resolvedStripeSubscriptionId !== (user.stripeSubscriptionId || '') ||
      resolvedSubscriptionStatus !== (user.stripeSubscriptionStatus || '').toLowerCase()
    ) {
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: resolvedStripeCustomerId || undefined,
        stripeSubscriptionId: resolvedStripeSubscriptionId || undefined,
        stripeSubscriptionStatus: resolvedSubscriptionStatus || undefined,
      });
    }
  }

  const subscriptionStatusLabel: Record<string, string> = {
    trialing: 'Proefperiode',
    active: 'Actief',
    past_due: 'Betaling achterstallig',
    unpaid: 'Onbetaald',
    canceled: 'Geannuleerd',
    incomplete: 'Onvolledig',
    incomplete_expired: 'Verlopen',
  };

  const subscriptionStatusText =
    subscriptionStatusLabel[resolvedSubscriptionStatus] ||
    (isMonthlyPremium ? 'In verwerking' : 'Levenslang actief');

  const resolvedPeriodEndDate = subscriptionCurrentPeriodEnd as Date | null;
  const subscriptionEndDateLabel = resolvedPeriodEndDate
    ? resolvedPeriodEndDate.toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const levelInfo = getLevelInfo(user.xp || 0);

  return (
    <div className="relative -mt-24 min-h-screen overflow-hidden pb-14 pt-24">
      <div className="pointer-events-none absolute -top-24 left-0 -z-10 h-72 w-72 rounded-full bg-[#bbcff0]/45 blur-3xl dark:bg-zinc-900/30" />
      <div className="pointer-events-none absolute right-0 top-8 -z-10 h-64 w-64 rounded-full bg-[#d9e5f8]/70 blur-3xl dark:bg-zinc-700/35" />

      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#edf2fa] dark:bg-zinc-800/80">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name || 'Gebruiker'} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-8 w-8 text-[#607597] dark:text-zinc-300" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-[#1f2f4b] dark:text-zinc-100 md:text-4xl">{user.name || 'Naamloos'}</h1>
              {user.isPremium && (
                <Badge className="bg-[#e9eff8] text-[#355384] dark:bg-zinc-800 dark:text-zinc-200">
                  <Star className="mr-1 h-3.5 w-3.5" />
                  Premium
                </Badge>
              )}
            </div>

            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Lid sinds{' '}
              {new Date(user.createdAt).toLocaleDateString('nl-NL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-6 sm:px-5 lg:px-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-5">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Trophy className="h-4 w-4 text-[#4f6faa] dark:text-zinc-300" />
                Totaal XP
              </p>
              <p className="mt-1 text-3xl font-bold text-[#1f2f4b] dark:text-zinc-100">{user.xp || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-5">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Flame className="h-4 w-4 text-[#4f6faa] dark:text-zinc-300" />
                Dagen reeks
              </p>
              <p className="mt-1 text-3xl font-bold text-[#1f2f4b] dark:text-zinc-100">{user.streak || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-5">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-[#4f6faa] dark:text-zinc-300" />
                Quizzen gespeeld
              </p>
              <p className="mt-1 text-3xl font-bold text-[#1f2f4b] dark:text-zinc-100">{totalQuizzesDone}</p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-5">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Target className="h-4 w-4 text-[#4f6faa] dark:text-zinc-300" />
                Gemiddelde score
              </p>
              <p className="mt-1 text-3xl font-bold text-[#1f2f4b] dark:text-zinc-100">{avgScore}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <article className="border-t border-[#d9e3f1] pt-6 dark:border-zinc-700">
              <div className="mb-5 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[#4f6faa] dark:text-zinc-300" />
                <div>
                  <h2 className="text-xl font-semibold text-[#1f2f4b] dark:text-zinc-100">Niveau voortgang</h2>
                  <p className="text-sm text-muted-foreground">Verdien XP om nieuwe niveaus te ontgrendelen</p>
                </div>
              </div>

              <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
                <CardContent className="p-5">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#6f8ed4] text-2xl font-bold text-white dark:bg-zinc-500">
                      {levelInfo.level}
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-lg font-semibold text-[#24395f] dark:text-zinc-100">{levelInfo.title}</p>
                        <p className="text-sm text-muted-foreground">{levelInfo.progressPercentage}%</p>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e2eaf5] dark:bg-zinc-700">
                        <div
                          className="h-full bg-[#6f8ed4] dark:bg-zinc-500"
                          style={{ width: `${levelInfo.progressPercentage}%` }}
                        />
                      </div>

                      {!levelInfo.isMaxLevel && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nog {levelInfo.nextLevelXp - levelInfo.currentXp} XP tot het volgende niveau
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alle niveaus</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {LEVELS.map((entry) => {
                    const isReached = user.xp >= entry.minXp;
                    const isCurrent = entry.level === levelInfo.level;

                    return (
                      <div
                        key={entry.level}
                        className={`rounded-md border px-3 py-3 ${
                          isCurrent
                            ? 'border-[#6f8ed4] bg-[#f8fbff] dark:border-zinc-400 dark:bg-zinc-900/60'
                            : 'border-[#d7e1ee] bg-white dark:border-zinc-700 dark:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#24395f] dark:text-zinc-100">Niveau {entry.level}</p>
                          {isReached && <CheckCircle2 className="h-4 w-4 text-[#5f7fc7] dark:text-zinc-300" />}
                        </div>
                        <p className="mt-0.5 text-sm text-[#30466e] dark:text-zinc-300">{entry.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Vanaf {entry.minXp} XP</p>
                      </div>
                    );
                  })}
                </div>
              </div>
          </article>

          <aside className="border-t border-[#d9e3f1] pt-6 dark:border-zinc-700">
              <div className="mb-5 flex items-center gap-3">
                <Star className="h-5 w-5 text-[#4f6faa] dark:text-zinc-300" />
                <div>
                  <h2 className="text-xl font-semibold text-[#1f2f4b] dark:text-zinc-100">Badges</h2>
                  <p className="text-sm text-muted-foreground">{(user.badges || []).length} van {BADGES.length} verdiend</p>
                </div>
              </div>

              <div className="space-y-3">
                {BADGES.map((badge) => {
                  const earned = (user.badges || []).includes(badge.id);

                  return (
                    <div
                      key={badge.id}
                      className={
                        earned
                          ? 'flex items-start gap-3 border-l-2 border-[#5f7fc7] pl-3'
                          : 'flex items-start gap-3 pl-3 opacity-70'
                      }
                    >
                      <div className="text-2xl">{badge.icon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#24395f] dark:text-zinc-100">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                      {earned && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5f7fc7] dark:text-zinc-300" />}
                    </div>
                  );
                })}
              </div>
          </aside>
        </div>

        {!user.isPremium && (
          <section className="mt-8 border-t border-[#d9e3f1] pt-6 dark:border-zinc-700">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_auto] lg:items-center">
              <div>
                <Badge className="mb-3 bg-[#e9eff8] text-[#355384] dark:bg-zinc-800 dark:text-zinc-200">
                  <Crown className="mr-1 h-3.5 w-3.5" />
                  Premium
                </Badge>
                <h3 className="text-2xl font-semibold text-[#1f2f4b] dark:text-zinc-100">Upgrade naar Premium</h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Speel alle quizzen, leer zonder advertenties en krijg toegang tot exclusieve content.
                </p>
              </div>

              <Button asChild className="h-10 rounded-md bg-[#6f8ed4] px-5 text-white hover:bg-[#5f81cc] dark:bg-zinc-500 dark:hover:bg-zinc-400">
                <Link href="/premium">Word nu Premium</Link>
              </Button>
            </div>
          </section>
        )}

        {user.isPremium && (
          <section className="mt-8 border-t border-[#d9e3f1] pt-6 dark:border-zinc-700">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-[#4f6faa] dark:text-zinc-300" />
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f2f4b] dark:text-zinc-100">Premium lidmaatschap</h3>
                    <p className="text-sm text-muted-foreground">Je account heeft toegang tot alle Premium content.</p>
                  </div>
                </div>

                <Badge variant="secondary" className="bg-[#f3f6fb] text-[#5f7090] dark:bg-zinc-800 dark:text-zinc-300">
                  {isLifetimePremium ? 'Levenslang' : subscriptionStatusText}
                </Badge>
              </div>

              {isMonthlyPremium ? (
                <>
                  <div className="mb-5 space-y-2 text-sm text-muted-foreground">
                    {subscriptionCancelAtPeriodEnd ? (
                      <p>
                        Je abonnement is opgezegd en blijft actief tot{' '}
                        <span className="font-semibold text-[#24395f] dark:text-zinc-100">{subscriptionEndDateLabel || 'einde van de huidige periode'}</span>.
                      </p>
                    ) : (
                      <p>
                        {subscriptionEndDateLabel
                          ? (
                            <>
                              Je Premium loopt door en verlengt op{' '}
                              <span className="font-semibold text-[#24395f] dark:text-zinc-100">{subscriptionEndDateLabel}</span>.
                            </>
                          )
                          : 'Je maandabonnement is actief.'}
                      </p>
                    )}
                    <p>Je kunt betaalgegevens en facturen beheren via Stripe.</p>
                  </div>

                  <form action="/api/stripe/portal" method="POST">
                    <Button type="submit" className="h-10 rounded-md bg-[#6f8ed4] px-5 text-white hover:bg-[#5f81cc] dark:bg-zinc-500 dark:hover:bg-zinc-400">
                      Open abonnementsportaal (Stripe)
                    </Button>
                  </form>
                </>
              ) : (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Je hebt levenslange Premium toegang. Er is geen terugkerend abonnement om stop te zetten.</p>
                  <p>Deze aankoop blijft permanent gekoppeld aan je account.</p>
                </div>
              )}
          </section>
        )}
      </section>
    </div>
  );
}
