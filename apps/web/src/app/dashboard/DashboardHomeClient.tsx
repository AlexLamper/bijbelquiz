'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crown,
  Flame,
  Lock,
  Play,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  difficulty: string;
  isPremium: boolean;
  slug?: string;
  categoryId?: { _id: string; title: string } | string;
  questions?: { _id: string }[];
}

interface ProgressDoc {
  quizId?: { _id: string; title: string; slug?: string; categoryId?: { title: string } };
  score: number;
  totalQuestions: number;
  completedAt: string;
}

interface DashboardHomeClientProps {
  quizzes: Quiz[];
  recentProgress: ProgressDoc[];
  streak: number;
  xp: number;
  level: number;
  levelTitle: string;
  levelProgress: number;
  totalQuizzesDone: number;
  userName: string;
  isPremium: boolean;
}

const categories = [
  {
    title: "Oude Testament",
    imageUrl: '/images/quizzes/img1.png',
    href: "/quizzes?category=oude-testament",
  },
  {
    title: "Nieuwe Testament",
    imageUrl: '/images/quizzes/img2.png',
    href: "/quizzes?category=nieuwe-testament",
  },
  {
    title: "Bijbelse Figuren",
    imageUrl: '/images/quizzes/img3.png',
    href: "/quizzes?category=bijbelse-figuren",
  },
  {
    title: "Thema's & Verhalen",
    imageUrl: '/images/quizzes/img4.png',
    href: "/quizzes?category=verhalen",
  },
];

// Consistent premium badge component
function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-[#1a2942] px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider shadow-sm ${className}`}>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> PREMIUM
    </span>
  );
}

export default function DashboardHomeClient({
  quizzes,
  recentProgress,
  streak,
  xp,
  level,
  levelTitle,
  levelProgress,
  totalQuizzesDone,
  userName,
  isPremium,
}: DashboardHomeClientProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  const getCategoryName = (categoryId: Quiz['categoryId']): string => {
    if (typeof categoryId === 'object' && categoryId?.title) return categoryId.title;
    return 'Algemeen';
  };

  const avgScore = recentProgress.length > 0
    ? Math.round(
        recentProgress.reduce((acc, p) =>
          acc + (p.totalQuestions > 0 ? (p.score / p.totalQuestions) * 100 : 0), 0
        ) / recentProgress.length
      )
    : 0;

  return (
    <div className="flex flex-col min-h-screen -mt-[96px]">
      {/* Hero Section - Welcome + Quick Actions + Stats */}
      <section className="relative pt-[96px]">
        {/* Blue background - fixed height that stops at middle of stats */}
        <div className="absolute inset-x-0 top-0 bg-[#1a2942]" style={{ height: 'calc(96px + 12rem + 4rem)' }}></div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-8 lg:px-12 xl:px-16 max-w-[1400px] pt-8 md:pt-12 pb-8">
          {/* Welcome Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
            {/* Left: Welcome */}
            <div>
              <p className="text-sm font-medium tracking-wider text-[#5b7dd9] uppercase mb-2">
                Dashboard
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl leading-[1.1] font-bold text-white tracking-tight mb-3 flex items-center gap-3">
                {getGreeting()}, {userName}. <span className="text-3xl">👋</span>
              </h1>
              <p className="max-w-lg text-white/60 text-base leading-relaxed">
                Ontdek Gods Woord, één vraag tegelijk.
              </p>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <Button
                size="lg"
                className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all flex-1 lg:flex-none whitespace-nowrap"
                asChild
              >
                <Link href="/quizzes">
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Speel Quiz
                </Link>
              </Button>

              {recentProgress.length > 0 && recentProgress[0].quizId && (
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-semibold rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex-1 lg:flex-none whitespace-nowrap"
                  asChild
                >
                  <Link href={`/quiz/${recentProgress[0].quizId.slug || recentProgress[0].quizId._id}`}>
                    Ga verder
                    <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Stats Row - Matching reference design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Totaal XP Card */}
            <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Totaal XP</span>
                <Trophy className="w-5 h-5 text-[#5b7dd9]" />
              </div>
              <div className="text-4xl font-bold text-[#1a2333] dark:text-foreground">{xp}</div>
            </div>

            {/* Dagen Reeks Card */}
            <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Dagen Reeks</span>
                <Flame className="w-5 h-5 text-[#5b7dd9]" />
              </div>
              <div className="text-4xl font-bold text-[#1a2333] dark:text-foreground">{streak}</div>
            </div>

            {/* Quizzen Gespeeld Card */}
            <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Quizzen Gespeeld</span>
                <CheckCircle2 className="w-5 h-5 text-[#5b7dd9]" />
              </div>
              <div className="text-4xl font-bold text-[#1a2333] dark:text-foreground">{totalQuizzesDone}</div>
            </div>

            {/* Gem. Score Card with Progress */}
            <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold text-[#5b7dd9] uppercase tracking-wider">Niveau {level}</span>
                <span className="text-xs font-medium text-muted-foreground">{levelProgress}%</span>
              </div>
              <div className="text-2xl font-bold text-[#1a2333] dark:text-foreground mb-3">{levelTitle}</div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5b7dd9] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Quizzes Section */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 max-w-[1400px]">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-[#1a2942] dark:text-foreground">
                Aanbevolen voor jou
              </h2>
              <p className="mt-1 text-muted-foreground">
                Quizzen die bij jouw niveau passen.
              </p>
            </div>
            <Link
              href="/quizzes"
              className="hidden sm:inline-flex items-center gap-2 font-medium text-[#5b7dd9] transition-colors hover:text-[#4a6bc7]"
            >
              Alle quizzen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quizzes.slice(0, 8).map((quiz) => {
              const isLocked = quiz.isPremium && !isPremium;
              const categoryName = getCategoryName(quiz.categoryId);

              return (
                <Link
                  key={quiz._id}
                  href={isLocked ? '/premium' : `/quiz/${quiz.slug || quiz._id}`}
                  className="block h-full"
                >
                  <Card className="group relative flex h-full flex-col overflow-hidden border-0 bg-white dark:bg-card shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 p-0 pb-5 gap-0 cursor-pointer">
                    <div className="relative h-36 w-full overflow-hidden bg-[#dbe1ee] dark:bg-muted shrink-0">
                      {quiz.imageUrl ? (
                        <Image
                          src={quiz.imageUrl}
                          alt={quiz.title}
                          fill
                          className="object-cover brightness-90 transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-[#bac6da] dark:text-muted-foreground" />
                        </div>
                      )}
                      {quiz.isPremium && (
                        <ProBadge className="absolute top-3 right-3" />
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-white/90 dark:bg-background/90 rounded-full p-2">
                            <Lock className="w-5 h-5 text-[#1c223a] dark:text-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <Badge variant="secondary" className="w-fit mb-2 font-normal bg-slate-100 dark:bg-muted text-slate-700 dark:text-muted-foreground">
                        {categoryName}
                      </Badge>
                      <h3 className="font-serif text-base font-medium text-[#1a2942] dark:text-foreground group-hover:text-[#5b7dd9] transition-colors line-clamp-1 mb-1">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {quiz.description || "Test je kennis over dit onderwerp."}
                      </p>
                      <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {quiz.questions?.length || 0} vragen
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/quizzes"
              className="inline-flex items-center gap-2 font-medium text-[#5b7dd9] transition-colors hover:text-[#4a6bc7]"
            >
              Bekijk alle quizzen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 max-w-[1400px]">
          <div className="mb-8 text-center">
            <h2 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-[#1a2942] dark:text-foreground">
              Ontdek categorieën
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Kies een categorie en test je kennis van de Bijbel.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link key={index} href={category.href} className="block">
                <Card className="group relative h-32 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="absolute inset-0">
                    <Image
                      src={category.imageUrl}
                      alt={category.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/45" />
                  <CardContent className="relative z-10 flex h-full items-center justify-center p-4">
                    <h3 className="text-center font-serif text-lg font-semibold text-white drop-shadow-md">
                      {category.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Upsell */}
      {!isPremium && (
        <section className="bg-[#1a2942] py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-8 lg:px-12 xl:px-16 max-w-[1400px]">
            <div className="flex flex-col items-center text-center gap-8">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#5b7dd9]/20 px-4 py-2">
                  <Crown className="h-5 w-5 text-[#5b7dd9]" />
                  <span className="text-sm font-medium text-[#5b7dd9]">Premium</span>
                </div>

                <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-medium leading-tight tracking-tight text-white mb-4 max-w-2xl mx-auto">
                  Ontgrendel de volledige{' '}
                  <span className="text-[#5b7dd9]">BijbelQuiz ervaring.</span>
                </h2>

                <p className="max-w-lg mx-auto text-white/70 leading-relaxed mb-6">
                  Krijg toegang tot alle quizzen, speel zonder advertenties en 
                  ontdek exclusieve content om je Bijbelkennis te verdiepen.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    className="rounded-full bg-[#5b7dd9] px-8 py-6 text-base font-medium text-white hover:bg-[#4a6bc7]"
                    asChild
                  >
                    <Link href="/premium">Word nu Premium</Link>
                  </Button>
                  <div className="flex items-baseline gap-1 text-white">
                    <span className="text-2xl font-semibold">€4,99</span>
                    <span className="text-white/60">/maand</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
                {[
                  { icon: BookOpen, title: "100+ Quizzen", desc: "Onbeperkte toegang" },
                  { icon: Zap, title: "Geen reclame", desc: "Focus op leren" },
                  { icon: Trophy, title: "Exclusieve badges", desc: "Laat je voortgang zien" },
                  { icon: Star, title: "Vroege toegang", desc: "Nieuwe content eerst" },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm text-center"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b7dd9]/20 mx-auto">
                      <feature.icon className="h-5 w-5 text-[#5b7dd9]" />
                    </div>
                    <h3 className="font-medium text-white text-sm">{feature.title}</h3>
                    <p className="text-xs text-white/60">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
