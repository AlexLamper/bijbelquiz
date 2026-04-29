'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award, BookOpen, CalendarDays, Play, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuizCard } from '@/components/QuizCard';

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
  level,
  levelTitle,
  totalQuizzesDone,
  userName,
  isPremium,
}: DashboardHomeClientProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
  const streakLabel = streak === 1 ? '1 dag reeks' : `${streak} dagen reeks`;

  const latestQuiz = recentProgress.find((entry) => entry.quizId);

  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-12 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <Card className="relative overflow-hidden border-0 bg-transparent py-0 shadow-none">
          <CardContent className="relative p-0">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:items-start">
              <div>
                <h1 className="text-4xl leading-tight text-[#1f2f4b] md:text-5xl dark:text-zinc-100">{greeting}, {userName}.</h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5f7297] md:text-[15px] dark:text-zinc-300">Kies een quiz en speel direct verder.</p>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button asChild className="h-10 rounded-[8px] bg-[#5d82d4] px-5 text-sm font-semibold text-white hover:bg-[#4f74c7] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                    <Link href="/quizzes" className="inline-flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Speel quiz
                    </Link>
                  </Button>

                  {latestQuiz?.quizId && (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-md border-[#cddaf0] bg-white/90 px-5 text-sm font-semibold text-[#2e4670] hover:bg-[#f6f9ff] dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <Link href={`/quiz/${latestQuiz.quizId.slug || latestQuiz.quizId._id}`} className="inline-flex items-center gap-2">
                        Ga verder
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end xl:pt-1">
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 border-border bg-card px-3 text-xs font-medium text-foreground dark:border-zinc-700 dark:bg-zinc-900/70"
                >
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                  Niveau {level} - {levelTitle}
                </Badge>

                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 border-border bg-card px-3 text-xs font-medium text-foreground dark:border-zinc-700 dark:bg-zinc-900/70"
                >
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  {totalQuizzesDone.toLocaleString('nl-NL')} quizzen gespeeld
                </Badge>

                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 border-border bg-card px-3 text-xs font-medium text-foreground dark:border-zinc-700 dark:bg-zinc-900/70"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {streak > 0 ? streakLabel : 'Start je reeks vandaag'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-6 sm:px-5 lg:px-4">
        <Link href="/multiplayer" className="block">
          <Card className="overflow-hidden border-[#c8d7ee] bg-[linear-gradient(135deg,#f8fbff,#edf3ff)] py-0 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.95),rgba(39,39,42,0.92))]">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-[#4f74c7] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white dark:bg-[#6f8ed4] dark:text-zinc-100">
                  <Users className="h-3.5 w-3.5 text-white" />
                  Samen spelen
                </p>
                <h2 className="mt-3 text-2xl text-[#1f2f4b] dark:text-zinc-100">Speel live met vrienden</h2>
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

      <section className="mx-auto max-w-340 px-4 pt-12 sm:px-5 lg:px-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#1f2f4b] dark:text-zinc-100">Aanbevolen quizzen</h2>
            <p className="mt-1 text-sm text-muted-foreground">Kies een quiz en start direct.</p>
          </div>

          <Link href="/quizzes" className="inline-flex items-center gap-2 text-sm font-medium text-[#355384] hover:text-[#243a5e] dark:text-zinc-300 dark:hover:text-zinc-100">
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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremium} layout="stack" darkPalette="neutral" />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
        <div>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-[#1f2f4b] dark:text-zinc-100">Verken per categorie</h2>
            <p className="mt-1 text-sm text-muted-foreground">Snelle ingangen naar je favoriete onderwerpen.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.title} href={category.href} className="block">
                <Card className="gap-0 overflow-hidden border-0 bg-transparent py-0 shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-transparent">
                  <div className="relative h-28">
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
        <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
          <Card className="overflow-hidden border-[#c8d7ee] bg-[linear-gradient(140deg,#f8fbff,#edf4ff)] py-0 shadow-sm dark:border-zinc-700 dark:bg-[linear-gradient(140deg,rgba(24,24,27,0.95),rgba(39,39,42,0.92))]">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
              <div>
                <p className="inline-flex items-center rounded-full bg-[#6f8ed4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white dark:bg-zinc-500 dark:text-zinc-100">
                  Premium
                </p>
                <p className="mt-3 text-sm font-semibold text-[#24395f] dark:text-zinc-100">Meer quizzen en geen advertenties met Premium</p>
                <p className="mt-1 text-xs text-muted-foreground">Ontgrendel alle premium quizzen vanaf EUR 5,99 per maand.</p>
              </div>

              <Button asChild className="h-10 rounded-md bg-[#6f8ed4] px-5 text-white hover:bg-[#5f81cc] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                <Link href="/premium">Bekijk Premium</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}