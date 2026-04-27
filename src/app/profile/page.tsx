import { getServerSession } from 'next-auth';
import { Metadata } from 'next';
import Link from 'next/link';
import type Stripe from 'stripe';
import {
  ArrowLeft,
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
    <div className="-mt-24 min-h-screen pt-24 pb-12">
      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-6 lg:px-8">
        <Card className="border-[#d8e1ee] shadow-[0_14px_28px_-24px_rgba(22,42,74,0.55)]">
          <CardContent className="p-6 lg:p-7">
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#4f6281] hover:text-[#2c4166]"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug naar dashboard
            </Link>

            <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
              <div className="flex h-20 w-20 items-center justify-center border border-[#d8e1ee] bg-[#f5f8fd]">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || 'Gebruiker'} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-8 w-8 text-[#607597]" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold text-[#1f2f4b] md:text-4xl">{user.name || 'Naamloos'}</h1>
                  {user.isPremium && (
                    <Badge className="bg-[#e9eff8] text-[#355384]">
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
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-[#d8e1ee] shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Totaal XP</p>
                <Trophy className="h-4 w-4 text-[#4f6faa]" />
              </div>
              <p className="text-3xl font-bold text-[#1f2f4b]">{user.xp || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dagen reeks</p>
                <Flame className="h-4 w-4 text-[#4f6faa]" />
              </div>
              <p className="text-3xl font-bold text-[#1f2f4b]">{user.streak || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quizzen gespeeld</p>
                <CheckCircle2 className="h-4 w-4 text-[#4f6faa]" />
              </div>
              <p className="text-3xl font-bold text-[#1f2f4b]">{totalQuizzesDone}</p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gemiddelde score</p>
                <Target className="h-4 w-4 text-[#4f6faa]" />
              </div>
              <p className="text-3xl font-bold text-[#1f2f4b]">{avgScore}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Card className="border-[#d8e1ee] shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="bg-[#edf2fa] p-2 text-[#4f6faa]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#1f2f4b]">Niveau voortgang</h2>
                  <p className="text-sm text-muted-foreground">Verdien XP om nieuwe niveaus te ontgrendelen</p>
                </div>
              </div>

              <div className="border border-[#d9e3f1] bg-[#f8fafe] p-5">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center bg-[#6f8ed4] text-2xl font-bold text-white">
                    {levelInfo.level}
                  </div>

                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-lg font-semibold text-[#24395f]">{levelInfo.title}</p>
                      <p className="text-sm text-muted-foreground">{levelInfo.progressPercentage}%</p>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden bg-[#e2eaf5]">
                      <div
                        className="h-full bg-[#6f8ed4]"
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
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alle niveaus</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {LEVELS.map((entry) => {
                    const isReached = user.xp >= entry.minXp;
                    const isCurrent = entry.level === levelInfo.level;

                    return (
                      <div
                        key={entry.level}
                        className={
                          isCurrent
                            ? 'border border-[#bfd0ee] bg-[#edf2fa] p-3'
                            : isReached
                              ? 'border border-[#d7e1ee] bg-white p-3'
                              : 'border border-[#edf2f9] bg-[#f8fafe] p-3 opacity-70'
                        }
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#24395f]">Niveau {entry.level}</p>
                          {isReached && <CheckCircle2 className="h-4 w-4 text-[#5f7fc7]" />}
                        </div>
                        <p className="mt-0.5 text-sm text-[#30466e]">{entry.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Vanaf {entry.minXp} XP</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="bg-[#edf2fa] p-2 text-[#4f6faa]">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#1f2f4b]">Badges</h2>
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
                          ? 'flex items-start gap-3 border border-[#ccdaf1] bg-[#f3f7fd] p-3'
                          : 'flex items-start gap-3 border border-[#e6edf7] bg-[#fafcff] p-3 opacity-70'
                      }
                    >
                      <div className="text-2xl">{badge.icon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#24395f]">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                      {earned && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5f7fc7]" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {!user.isPremium && (
          <Card className="mt-6 border-[#d7e1ee] bg-[#f8fafe] shadow-sm">
            <CardContent className="p-6 lg:p-7">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_auto] lg:items-center">
                <div>
                  <Badge className="mb-3 bg-[#e9eff8] text-[#355384]">
                    <Crown className="mr-1 h-3.5 w-3.5" />
                    Premium
                  </Badge>
                  <h3 className="text-2xl font-semibold text-[#1f2f4b]">Upgrade naar Premium</h3>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    Speel alle quizzen, leer zonder advertenties en krijg toegang tot exclusieve content.
                  </p>
                </div>

                <Button asChild className="h-10 rounded-md bg-[#6f8ed4] px-5 text-white hover:bg-[#5f81cc]">
                  <Link href="/premium">Word nu Premium</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {user.isPremium && (
          <Card className="mt-6 border-[#d8e1ee] shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#edf2fa] p-2 text-[#4f6faa]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f2f4b]">Premium lidmaatschap</h3>
                    <p className="text-sm text-muted-foreground">Je account heeft toegang tot alle Premium content.</p>
                  </div>
                </div>

                <Badge variant="secondary" className="bg-[#f3f6fb] text-[#5f7090]">
                  {isLifetimePremium ? 'Levenslang' : subscriptionStatusText}
                </Badge>
              </div>

              {isMonthlyPremium ? (
                <>
                  <div className="mb-5 space-y-2 text-sm text-muted-foreground">
                    {subscriptionCancelAtPeriodEnd ? (
                      <p>
                        Je abonnement is opgezegd en blijft actief tot{' '}
                        <span className="font-semibold text-[#24395f]">{subscriptionEndDateLabel || 'einde van de huidige periode'}</span>.
                      </p>
                    ) : (
                      <p>
                        {subscriptionEndDateLabel
                          ? (
                            <>
                              Je Premium loopt door en verlengt op{' '}
                              <span className="font-semibold text-[#24395f]">{subscriptionEndDateLabel}</span>.
                            </>
                          )
                          : 'Je maandabonnement is actief.'}
                      </p>
                    )}
                    <p>Je kunt betaalgegevens en facturen beheren via Stripe.</p>
                  </div>

                  <form action="/api/stripe/portal" method="POST">
                    <Button type="submit" className="h-10 rounded-md bg-[#6f8ed4] px-5 text-white hover:bg-[#5f81cc]">
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
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
