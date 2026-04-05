import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB, User } from '@bijbelquiz/database';
import stripe from '@/lib/stripe';
import type Stripe from 'stripe';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getLevelInfo, BADGES, LEVELS } from '@/lib/gamification';
import { 
  User as UserIcon, 
  Mail, 
  Star, 
  Calendar, 
  Trophy, 
  Flame, 
  CheckCircle2, 
  Crown, 
  ArrowLeft,
  Target,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';

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

  // Get quiz statistics directly from the saved User model
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

  const subscriptionStatusText = subscriptionStatusLabel[resolvedSubscriptionStatus] || (isMonthlyPremium ? 'In verwerking' : 'Levenslang actief');
  const resolvedPeriodEndDate = subscriptionCurrentPeriodEnd as Date | null;
  const subscriptionEndDateLabel = resolvedPeriodEndDate
    ? resolvedPeriodEndDate.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  
  const levelInfo = getLevelInfo(user.xp || 0);

  return (
    <div className="min-h-screen bg-[#f0f4fa] dark:bg-background">
      {/* Header Section */}
      <div className="bg-[#1a2942] pt-24 md:pt-32 pb-24 -mt-[104px]">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Mijn Profiel' },
            ]}
            className="mb-6 text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white"
          />
          
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Terug naar Dashboard</span>
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-white/60" />
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {user.name || 'Naamloos'}
                </h1>
                {user.isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Star className="h-3 w-3 fill-amber-400" /> PREMIUM
                  </span>
                )}
              </div>
              <p className="text-white/60 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <p className="text-white/40 text-sm mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Lid sinds {new Date(user.createdAt).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 max-w-[1200px] -mt-16 pb-14">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Totaal XP</span>
              <Trophy className="w-5 h-5 text-[#5b7dd9]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2333] dark:text-foreground">{user.xp || 0}</div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Dagen Reeks</span>
              <Flame className="w-5 h-5 text-[#5b7dd9]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2333] dark:text-foreground">{user.streak || 0}</div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Quizzen Gespeeld</span>
              <CheckCircle2 className="w-5 h-5 text-[#5b7dd9]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2333] dark:text-foreground">{totalQuizzesDone}</div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Gem. Score</span>
              <Target className="w-5 h-5 text-[#5b7dd9]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2333] dark:text-foreground">{avgScore}%</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Level Progress Card */}
          <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#5b7dd9]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#5b7dd9]" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1a2942] dark:text-foreground">Niveau Voortgang</h2>
                <p className="text-sm text-muted-foreground">Verdien XP om een hoger niveau te bereiken</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5b7dd9] to-[#4a6bc7] flex items-center justify-center shrink-0">
                  <span className="text-3xl font-bold text-white">{levelInfo.level}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-[#1a2942] dark:text-foreground">{levelInfo.title}</span>
                    <span className="text-sm text-muted-foreground">{levelInfo.progressPercentage}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 dark:bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#5b7dd9] to-[#4a6bc7] rounded-full transition-all duration-1000"
                      style={{ width: `${levelInfo.progressPercentage}%` }}
                    />
                  </div>
                  {!levelInfo.isMaxLevel && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Nog {levelInfo.nextLevelXp - levelInfo.currentXp} XP tot het volgende niveau
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-border/50">
                <h3 className="text-sm font-semibold text-[#1a2942] dark:text-foreground mb-4 uppercase tracking-wider">Alle Niveaus</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LEVELS.map((level) => {
                    const isReached = user.xp >= level.minXp;
                    const isCurrent = level.level === levelInfo.level;
                    
                    return (
                      <div 
                        key={level.level} 
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-[#5b7dd9]/10 border-[#5b7dd9]/30'
                            : isReached 
                              ? 'bg-gray-50 dark:bg-card/50 border-gray-200 dark:border-border' 
                              : 'bg-gray-50/50 dark:bg-card/30 border-transparent opacity-50 grayscale'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isCurrent 
                            ? 'bg-[#5b7dd9] text-white' 
                            : isReached 
                              ? 'bg-gray-200 dark:bg-muted text-gray-700 dark:text-foreground' 
                              : 'bg-gray-100 dark:bg-muted/50 text-gray-400 dark:text-muted-foreground'
                        }`}>
                          {level.level}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-semibold ${
                              isCurrent 
                                ? 'text-[#5b7dd9] dark:text-[#5b7dd9]' 
                                : isReached 
                                  ? 'text-[#1a2942] dark:text-foreground' 
                                  : 'text-gray-500 dark:text-muted-foreground'
                            }`}>
                              {level.title}
                            </h4>
                            {isReached && !isCurrent && (
                              <CheckCircle2 className="w-4 h-4 text-[#5b7dd9]/70" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{level.minXp} XP</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Badges Card */}
          <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-lg lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1a2942] dark:text-foreground">Badges</h2>
                <p className="text-sm text-muted-foreground">{(user.badges || []).length} van de {BADGES.length} verdiend</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {BADGES.map((badge) => {
                const earned = (user.badges || []).includes(badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      earned 
                        ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' 
                        : 'bg-gray-50/50 dark:bg-card/50 border-gray-100 dark:border-border opacity-60 grayscale-[0.8]'
                    }`}
                  >
                    <div className="text-2xl">{badge.icon}</div>
                    <div>
                      <h4 className={`text-sm font-semibold ${earned ? 'text-amber-900 dark:text-amber-400' : 'text-gray-600 dark:text-muted-foreground'}`}>
                        {badge.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                    </div>
                    {earned && (
                      <CheckCircle2 className="w-4 h-4 text-amber-500 ml-auto opacity-70" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Premium Upsell (for non-premium users) */}
        {!user.isPremium && (
          <div className="mt-8 bg-gradient-to-r from-[#1a2942] to-[#2a3f5f] rounded-2xl p-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#5b7dd9]/20 px-4 py-2 mb-4">
              <Crown className="h-5 w-5 text-[#5b7dd9]" />
              <span className="text-sm font-medium text-[#5b7dd9]">Premium</span>
            </div>
            <h3 className="text-2xl font-serif font-medium text-white mb-2">
              Upgrade naar Premium
            </h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Krijg toegang tot alle quizzen, speel zonder advertenties en ontdek exclusieve content.
            </p>
            <Button
              className="rounded-full bg-[#5b7dd9] px-8 py-6 text-base font-medium text-white hover:bg-[#4a6bc7]"
              asChild
            >
              <Link href="/premium">Word nu Premium</Link>
            </Button>
          </div>
        )}

        {/* Unified Premium Billing Card */}
        {user.isPremium && (
          <div className="mt-8 bg-white dark:bg-card rounded-2xl p-6 border border-border shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5b7dd9]/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#5b7dd9]" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#1a2942] dark:text-foreground">Premium lidmaatschap</h3>
                  <p className="text-sm text-muted-foreground">Bedankt voor je steun. Je hebt toegang tot alle premium content van BijbelQuiz.</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-muted px-3 py-1 text-xs font-semibold text-slate-700 dark:text-muted-foreground">
                {isLifetimePremium ? 'Levenslang' : subscriptionStatusText}
              </span>
            </div>

            {isMonthlyPremium ? (
              <>
                <div className="space-y-2 mb-5 text-sm text-muted-foreground">
                  {subscriptionCancelAtPeriodEnd ? (
                    <p>
                      Je abonnement is opgezegd en blijft actief tot <span className="font-semibold text-[#1a2942] dark:text-foreground">{subscriptionEndDateLabel || 'einde van de huidige periode'}</span>.
                    </p>
                  ) : (
                    <p>
                      {subscriptionEndDateLabel
                        ? <>Je Premium loopt door en verlengt op <span className="font-semibold text-[#1a2942] dark:text-foreground">{subscriptionEndDateLabel}</span>.</>
                        : 'Je maandabonnement is actief.'}
                    </p>
                  )}
                  <p>Je kunt je betaalmethode aanpassen, facturen bekijken of je maandabonnement stopzetten via Stripe.</p>
                </div>

                <form action="/api/stripe/portal" method="POST">
                  <Button type="submit" className="rounded-full bg-[#1a2942] hover:bg-[#101b2f] text-white px-6">
                    Open abonnementsportaal (Stripe)
                  </Button>
                </form>
              </>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Je hebt een levenslange Premium-toegang. Er is geen terugkerend abonnement om stop te zetten.
                </p>
                <p>
                  Deze aankoop blijft permanent gekoppeld aan je account.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
