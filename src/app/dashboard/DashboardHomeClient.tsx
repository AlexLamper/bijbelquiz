'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award, BookOpen, CalendarDays, Play, Trophy, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuizCard } from '@/components/QuizCard';
import { trackEvent } from '@/components/GoogleAnalytics';

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
  levelProgress: number;
  totalQuizzesDone: number;
  userName: string;
  isPremium: boolean;
}

const categories = [
  {
    title: 'Oude Testament',
    imageUrl: '/images/quizzes/img1.png',
    href: '/quizzes?category=oude-testament',
  },
  {
    title: 'Nieuwe Testament',
    imageUrl: '/images/quizzes/img2.png',
    href: '/quizzes?category=nieuwe-testament',
  },
  {
    title: 'Bijbelse Figuren',
    imageUrl: '/images/quizzes/img3.png',
    href: '/quizzes?category=bijbelse-figuren',
  },
  {
    title: 'Themas en Verhalen',
    imageUrl: '/images/quizzes/img4.png',
    href: '/quizzes?category=verhalen',
  },
];

export default function DashboardHomeClient({
  quizzes,
  recentProgress,
  streak,
  xp,
  level,
  levelProgress,
  totalQuizzesDone,
  userName,
  isPremium,
}: DashboardHomeClientProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
  const streakLabel = streak === 1 ? '1 dag reeks' : `${streak} dagen reeks`;

  const latestQuiz = recentProgress.find((entry) => entry.quizId);

  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-10 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <section className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-5 lg:px-4 2xl:max-w-340">
        <Card className="relative overflow-hidden rounded-none border-0 bg-transparent py-0 shadow-none">
          <CardContent className="relative p-0">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:items-start">
              <div>
                <h1 className="text-2xl leading-tight text-[#1f2f4b] sm:text-3xl lg:text-4xl 2xl:text-5xl">
                  <span className="dark:text-[#9db5dc]">{greeting},</span> <span className="dark:text-zinc-100">{userName}.</span>
                </h1>

                <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#5f7297] lg:text-[14px] 2xl:text-[15px] dark:text-zinc-300">Kies een quiz en speel direct verder.</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild className="h-9 rounded-[8px] bg-[#5d82d4] px-4 text-sm font-semibold text-white hover:bg-[#4f74c7] sm:h-10 sm:px-5 dark:bg-[#6f8ed4] dark:text-white dark:hover:bg-[#5f81cc]">
                    <Link href="/quizzes" className="inline-flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Speel quiz
                    </Link>
                  </Button>

                  {latestQuiz?.quizId && (
                    <Button
                      asChild
                      variant="outline"
                      className="h-9 rounded-md border-[#cddaf0] bg-white/90 px-4 text-sm font-semibold text-[#2e4670] hover:bg-[#f6f9ff] sm:h-10 sm:px-5 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <Link href={`/quiz/${latestQuiz.quizId.slug || latestQuiz.quizId._id}`} className="inline-flex items-center gap-2">
                        Ga verder
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:w-auto xl:justify-end xl:pt-1">
                <Badge
                  variant="outline"
                  className="h-8 min-w-0 justify-center gap-1 border-border bg-card px-2 text-[10px] font-medium text-foreground sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs dark:border-zinc-700 dark:bg-zinc-900/70"
                >
                  <Trophy className="h-3 w-3 shrink-0 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">{xp.toLocaleString('nl-NL')} XP</span>
                </Badge>

                <Badge
                  variant="outline"
                  className="h-8 min-w-0 justify-center gap-1 border-border bg-card px-2 text-[10px] font-medium text-foreground sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs dark:border-zinc-700 dark:bg-zinc-900/70"
                >
                  <Award className="h-3 w-3 shrink-0 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">Niveau {level} ({levelProgress}%)</span>
                </Badge>

                <Badge
                  variant="outline"
                  className="h-8 min-w-0 justify-center gap-1 border-border bg-card px-2 text-[10px] font-medium text-foreground sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs dark:border-zinc-700 dark:bg-zinc-900/70"
                >
                  <BookOpen className="h-3 w-3 shrink-0 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">{totalQuizzesDone.toLocaleString('nl-NL')} quizzen</span>
                </Badge>

                <Badge
                  variant="outline"
                  className="h-8 min-w-0 justify-center gap-1 border-border bg-card px-2 text-[10px] font-medium text-foreground sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs dark:border-zinc-700 dark:bg-zinc-900/70"
                >
                  <CalendarDays className="h-3 w-3 shrink-0 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                  <span className="truncate">{streak > 0 ? streakLabel : 'Start vandaag'}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-5 lg:px-4 2xl:max-w-340">
        <Link href="/multiplayer" className="block">
          <Card className="overflow-hidden border-[#c8d7ee] bg-[linear-gradient(135deg,#f8fbff,#edf3ff)] py-0 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.95),rgba(39,39,42,0.92))]">
            <CardContent className="flex flex-wrap items-center justify-between gap-3.5 p-4 md:p-5 xl:p-6">
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-[#4f74c7] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white dark:bg-[#6f8ed4] dark:text-zinc-100">
                  <Users className="h-3.5 w-3.5 text-white" />
                  Samen spelen
                </p>
                <h2 className="mt-2.5 text-xl text-[#1f2f4b] lg:text-2xl dark:text-zinc-100">Speel samen met vrienden of familie</h2>
                <p className="mt-1 text-sm text-[#5f7297] dark:text-zinc-300">
                  Start een kamer of sluit direct aan en beantwoord vragen samen in realtime.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#355384] dark:text-zinc-200">
                Naar samen spelen
                <ArrowRight className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-5 lg:px-4 2xl:max-w-340">
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#1f2f4b] sm:text-xl lg:text-2xl dark:text-zinc-100">Aanbevolen quizzen</h2>
            <p className="mt-1 text-sm text-muted-foreground">Kies een quiz en start direct.</p>
          </div>

          <Link href="/quizzes" className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-[#355384] hover:text-[#243a5e] dark:text-zinc-300 dark:hover:text-zinc-100">
            Alle quizzen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <Card className="border-[#d8e1ee] shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Er zijn nog geen quizzen beschikbaar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremium} layout="stack" darkPalette="neutral" />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-7 sm:px-5 lg:px-4 2xl:max-w-340">
        <div>
          <div className="mb-5 text-center">
            <h2 className="text-xl font-semibold text-[#1f2f4b] lg:text-2xl dark:text-zinc-100">Verken per categorie</h2>
            <p className="mt-1 text-sm text-muted-foreground">Snelle ingangen naar je favoriete onderwerpen.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.title} href={category.href} className="block">
                <Card className="gap-0 overflow-hidden border-0 bg-transparent py-0 shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-transparent">
                  <div className="relative h-24 lg:h-28">
                    <Image
                      src={category.imageUrl}
                      alt={category.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/35" />
                    <CardContent className="relative z-10 flex h-full items-center justify-center p-3 text-center">
                      <p className="text-sm font-semibold text-white">{category.title}</p>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-5 flex justify-center">
            <Link href="/quizzes" className="inline-flex items-center gap-2 text-sm font-medium text-[#355384] hover:text-[#243a5e] dark:text-zinc-300 dark:hover:text-zinc-100">
              Naar alle categorieen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {!isPremium && (
        <section className="mx-auto w-full max-w-6xl px-4 pt-7 sm:px-5 lg:px-4 2xl:max-w-340">
          <Card className="overflow-hidden border-[#c8d7ee] bg-[linear-gradient(140deg,#f8fbff,#edf4ff)] py-0 shadow-sm dark:border-zinc-700 dark:bg-[linear-gradient(140deg,rgba(24,24,27,0.95),rgba(39,39,42,0.92))]">
            <CardContent className="flex flex-wrap items-center justify-between gap-3.5 p-4 md:p-5 xl:p-6">
              <div>
                <p className="inline-flex items-center rounded-full bg-[#6f8ed4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white dark:bg-zinc-500 dark:text-zinc-100">
                  Premium
                </p>
                <p className="mt-3 text-sm font-semibold text-[#24395f] dark:text-zinc-100">Speel onbeperkt samen met Premium</p>
                <p className="mt-1 text-xs text-muted-foreground">Host rooms tot 20 spelers en krijg uitleg bij elke vraag.</p>
              </div>

              <Button
                asChild
                className="h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc] sm:h-10 sm:px-5 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={() =>
                  trackEvent('multiplayer_premium_cta_clicked', { placement: 'dashboard_banner' })
                }
              >
                <Link href="/premium">Bekijk Premium</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

    </div>
  );
}