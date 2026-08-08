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
import { Eyebrow, Figure, SectionHead } from '@/components/editorial';
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
        <div className="border-b border-rule pb-8">
          <Eyebrow>Profiel</Eyebrow>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-rule bg-paper-sunken">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name || 'Gebruiker'} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8 text-ink-muted" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">{user.name || 'Naamloos'}</h1>
                {user.isPremium && (
                  <Badge variant="lapis">
                    <Star className="h-3 w-3" />
                    Premium
                  </Badge>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  Lid sinds{' '}
                  {new Date(user.createdAt).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
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

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {BADGES.map((badge) => {
                  const earned = (user.badges || []).includes(badge.id);

                  return (
                    <Card
                      key={badge.id}
                      className={
                        earned
                          ? 'border-lapis/35 bg-paper-sunken py-0   '
                          : 'border-rule bg-paper-raised py-0 opacity-60'
                      }
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 text-2xl ${earned ? '' : 'grayscale'}`}>{badge.icon}</div>
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-display text-sm leading-snug text-ink">{badge.name}</p>
                            <p className="mt-1 break-words text-[11px] leading-relaxed text-ink-muted sm:text-xs">{badge.description}</p>
                          </div>
                          {earned ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-positive dark:text-positive" />
                          ) : (
                            <span className="mt-0.5 shrink-0 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:text-[10px]">Nog niet</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
