'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award, BookOpen, CalendarDays, Play } from 'lucide-react';

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
    <div className="-mt-24 min-h-screen pb-12 pt-24">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden border-0 bg-transparent py-0 shadow-none">
          <CardContent className="relative p-0">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:items-start">
              <div>
                <h1 className="text-4xl leading-tight text-[#1f2f4b] md:text-5xl dark:text-slate-100">{greeting}, {userName}.</h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5f7297] md:text-[15px] dark:text-slate-300">Kies een quiz en speel direct verder.</p>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button asChild className="h-10 rounded-[8px] bg-[#5d82d4] px-5 text-sm font-semibold text-white hover:bg-[#4f74c7] dark:bg-blue-500 dark:hover:bg-blue-400">
                    <Link href="/quizzes" className="inline-flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Speel quiz
                    </Link>
                  </Button>

                  {latestQuiz?.quizId && (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-md border-[#cddaf0] bg-white/90 px-5 text-sm font-semibold text-[#2e4670] hover:bg-[#f6f9ff] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
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
                  className="h-9 gap-1.5 border-border bg-card px-3 text-xs font-medium text-foreground dark:bg-slate-900/70"
                >
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                  Niveau {level} - {levelTitle}
                </Badge>

                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 border-border bg-card px-3 text-xs font-medium text-foreground dark:bg-slate-900/70"
                >
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  {totalQuizzesDone.toLocaleString('nl-NL')} quizzen gespeeld
                </Badge>

                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 border-border bg-card px-3 text-xs font-medium text-foreground dark:bg-slate-900/70"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {streak > 0 ? streakLabel : 'Start je reeks vandaag'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#1f2f4b] dark:text-slate-100">Aanbevolen quizzen</h2>
            <p className="mt-1 text-sm text-muted-foreground">Kies een quiz en start direct.</p>
          </div>

          <Link href="/quizzes" className="inline-flex items-center gap-2 text-sm font-medium text-[#355384] hover:text-[#243a5e] dark:text-blue-300 dark:hover:text-blue-200">
            Alle quizzen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <Card className="border-[#d8e1ee] shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Er zijn nog geen quizzen beschikbaar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremium} layout="stack" />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-6 lg:px-8">
        <div>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-[#1f2f4b] dark:text-slate-100">Verken per categorie</h2>
            <p className="mt-1 text-sm text-muted-foreground">Snelle ingangen naar je favoriete onderwerpen.</p>

            <Link href="/quizzes" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#355384] hover:text-[#243a5e] dark:text-blue-300 dark:hover:text-blue-200">
              Naar alle categorieen
              <ArrowRight className="h-4 w-4" />
            </Link>
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
        </div>
      </section>

      {!isPremium && (
        <section className="mx-auto max-w-340 px-4 pt-8 sm:px-6 lg:px-8">
          <Card className="border-[#d8e1ee] bg-[#f8fafe] shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold text-[#24395f] dark:text-slate-100">Meer quizzen en geen advertenties met Premium</p>
                <p className="mt-1 text-xs text-muted-foreground">Ontgrendel alle premium quizzen vanaf EUR 5,99 per maand.</p>
              </div>

              <Button asChild className="h-10 rounded-md bg-[#6f8ed4] px-5 text-white hover:bg-[#5f81cc] dark:bg-blue-500 dark:hover:bg-blue-400">
                <Link href="/premium">Bekijk Premium</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}