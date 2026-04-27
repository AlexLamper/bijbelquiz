'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Lock,
  Maximize,
  RotateCcw,
  Settings,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Answer {
  text: string;
  isCorrect: boolean;
  _id: string;
}

interface Question {
  text: string;
  answers: Answer[];
  explanation?: string;
  bibleReference?: string;
  _id: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: Question[];
  rewardXp?: number;
  difficulty?: string;
  categoryId?: { _id?: string; title?: string } | string;
  isPremium?: boolean;
}

function getDifficultyLabel(difficulty?: string): string {
  const key = difficulty?.toLowerCase();
  if (key === 'easy' || key === 'beginner') return 'Makkelijk';
  if (key === 'medium' || key === 'intermediate') return 'Gemiddeld';
  if (key === 'hard' || key === 'advanced') return 'Moeilijk';
  return 'Onbekend';
}

function getCategoryLabel(categoryId?: Quiz['categoryId']): string {
  if (!categoryId) return 'Algemeen';

  if (typeof categoryId === 'object' && categoryId.title) {
    return categoryId.title;
  }

  return 'Algemeen';
}

export default function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const { data: session } = useSession();
  const router = useRouter();

  const isPremium = !!session?.user?.isPremium;
  const isLoggedIn = !!session?.user;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [showExplanation, setShowExplanation] = useState(true);

  const currentQuestion = quiz.questions[currentIndex];
  const progressPercentage = (currentIndex / quiz.questions.length) * 100;
  const selectedAnswer = selectedAnswers[currentIndex] ?? null;
  const hasAnswered = selectedAnswer !== null;
  const difficultyLabel = getDifficultyLabel(quiz.difficulty);
  const categoryLabel = getCategoryLabel(quiz.categoryId);

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: answerIndex,
    }));

    if (currentQuestion.answers[answerIndex]?.isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    setIsSaving(true);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz._id,
          score,
          totalQuestions: quiz.questions.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.xpEarned === 'number') {
          setEarnedXp(data.xpEarned);
        }
      }
    } catch (error) {
      console.error('Failed to save quiz progress', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    await finishQuiz();
  };

  const handlePrevious = () => {
    if (currentIndex === 0) {
      return;
    }

    setCurrentIndex((prev) => prev - 1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSettingsOpen]);

  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const fallbackXp = Math.round((typeof quiz.rewardXp === 'number' ? quiz.rewardXp : 50) * (score / quiz.questions.length));

    return (
      <div className="mx-auto w-full max-w-340 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <Card className="border-[#d8e1ee] py-0 shadow-[0_14px_28px_-24px_rgba(22,42,74,0.55)] dark:border-slate-700 dark:bg-slate-900/80">
          <CardContent className="p-6 lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#607597]">Resultaat</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1f2f4b] dark:text-slate-100 md:text-4xl">Quiz afgerond</h1>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="border border-[#dce5f1] bg-[#f8fafe] p-5 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jouw score</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-5xl font-bold text-[#1f2f4b] dark:text-slate-100">{score}</p>
                  <p className="pb-1 text-2xl font-semibold text-[#5f7190] dark:text-slate-300">/ {quiz.questions.length}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{percentage}% correct</p>

                <div className="mt-4 inline-flex items-center gap-2 bg-[#e9eff8] px-3 py-1 text-sm font-medium text-[#355384] dark:bg-slate-700 dark:text-blue-200">
                  <Award className="h-4 w-4" />
                  + {earnedXp ?? fallbackXp} XP verdiend
                </div>
              </div>

              <div className="border border-[#dce5f1] bg-white p-5 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-sm font-semibold text-[#24395f] dark:text-slate-100">Volgende stap</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {percentage >= 90
                    ? 'Sterk resultaat. Kies nu een moeilijkere quiz of een nieuwe categorie.'
                    : percentage >= 60
                      ? 'Goede basis. Herhaal deze quiz of werk verder in dezelfde categorie.'
                      : 'Herhaling helpt. Speel opnieuw om je score te verbeteren.'}
                </p>

                {!isPremium && (
                  <div className="mt-4 border border-[#d7e1ee] bg-[#f8fafe] p-3 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="text-sm font-semibold text-[#24395f] dark:text-slate-100">Premium analyse</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ontgrendel uitgebreide uitleg en meer voortgangsinzichten.
                    </p>
                    <Button asChild className="mt-3 h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc]">
                      <Link href="/premium">Bekijk Premium</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.reload()}
                className="h-10 rounded-md border-[#d7e1ee] bg-white px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Opnieuw spelen
              </Button>

              <Button
                type="button"
                onClick={() => router.push(isLoggedIn ? '/dashboard' : '/')}
                disabled={isSaving}
                className="h-10 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc]"
              >
                {isSaving ? 'Opslaan...' : isLoggedIn ? 'Naar dashboard' : 'Naar home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <div className="grid min-h-[calc(100dvh-7rem)] gap-6 xl:grid-cols-[minmax(320px,0.38fr)_minmax(0,1fr)]">
        <Card className="border-[#d8e1ee] bg-[#f8fafe] py-0 shadow-sm xl:sticky xl:top-24 xl:h-[calc(100dvh-7rem)] dark:border-slate-700 dark:bg-slate-900/70">
          <CardContent className="h-full overflow-y-auto p-5 lg:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                className="h-8 px-0 text-[#355384] hover:bg-transparent hover:text-[#243a5e] dark:text-blue-300 dark:hover:text-blue-200"
                onClick={() => router.push('/quizzes')}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Quizzen
              </Button>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 border-[#d7e1ee] bg-white text-[#355384] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  aria-label="Volledig scherm"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSettingsOpen(true)}
                  className="h-8 w-8 border-[#d7e1ee] bg-white text-[#355384] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  aria-label="Instellingen"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{quiz.title}</p>
            <h1
              className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} mt-2 text-[#1f2f4b] dark:text-slate-100 ${
                textSize === 'large'
                  ? 'text-3xl md:text-[2.5rem] xl:text-[2.8rem]'
                  : 'text-2xl md:text-[2.05rem] xl:text-[2.35rem]'
              } font-semibold leading-[1.15]`}
            >
              {currentQuestion.text}
            </h1>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="border border-[#d7e1ee] bg-white px-3 py-2 text-xs text-[#4e5f79] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <span className="font-semibold text-[#24395f] dark:text-slate-100">Type:</span> Normale quiz
              </div>
              <div className="border border-[#d7e1ee] bg-white px-3 py-2 text-xs text-[#4e5f79] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <span className="font-semibold text-[#24395f] dark:text-slate-100">Categorie:</span> {categoryLabel}
              </div>
              <div className="border border-[#d7e1ee] bg-white px-3 py-2 text-xs text-[#4e5f79] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:col-span-2">
                <span className="font-semibold text-[#24395f] dark:text-slate-100">Niveau:</span> {difficultyLabel}
              </div>
            </div>

            <div className="mt-4 h-1.5 w-full overflow-hidden bg-[#e2eaf5] dark:bg-slate-700">
              <div className="h-full bg-[#6f8ed4] transition-all dark:bg-blue-400" style={{ width: `${Math.max(2, progressPercentage)}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Vraag {currentIndex + 1} van {quiz.questions.length}</span>
              <span>Score: {score}</span>
            </div>

            <div className="mt-5 border-t border-[#dce5f1] pt-4 text-xs text-muted-foreground dark:border-slate-700">
              Gebruik instellingen om tekstgrootte en uitlegweergave aan te passen.
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#d8e1ee] py-0 shadow-[0_14px_28px_-24px_rgba(22,42,74,0.55)] xl:h-[calc(100dvh-7rem)] dark:border-slate-700 dark:bg-slate-900/80">
          <CardContent className="flex h-full flex-col overflow-y-auto p-5 lg:p-6">
            <div className="flex-1">
              <div className="space-y-3">
                {currentQuestion.answers.map((answer, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = answer.isCorrect;

                  let itemClass = 'border-[#d7e1ee] bg-white text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800';
                  if (hasAnswered) {
                    if (isCorrect) {
                      itemClass = 'border-[#22c55e] bg-[#22c55e]/12 text-[#166534] dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-100';
                    } else if (isSelected) {
                      itemClass = 'border-[#ef4444] bg-[#ef4444]/12 text-[#991b1b] dark:border-rose-500 dark:bg-rose-500/20 dark:text-rose-100';
                    } else {
                      itemClass = 'border-[#e5ebf4] bg-[#fafcff] text-[#90a0b9] dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400';
                    }
                  }

                  return (
                    <Button
                      key={answer._id || index}
                      type="button"
                      variant="outline"
                      disabled={hasAnswered}
                      onClick={() => handleAnswer(index)}
                      className={`h-auto w-full justify-start rounded-md border px-4 py-3 text-left text-sm ${itemClass}`}
                    >
                      <span className="mr-3 inline-flex h-5 w-5 items-center justify-center border border-current/35">
                        {hasAnswered && isCorrect && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {hasAnswered && !isCorrect && isSelected && <X className="h-3.5 w-3.5" />}
                      </span>
                      <span className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} ${textSize === 'large' ? 'text-base' : 'text-sm'} leading-relaxed`}>
                        {answer.text}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {hasAnswered && showExplanation && (
                <div className="mt-5 border border-[#d7e1ee] bg-[#f8fafe] p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#355384]">
                    <BookOpen className="h-4 w-4" />
                    Uitleg
                  </p>

                  {isPremium ? (
                    <p className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} mt-2 text-sm leading-relaxed text-[#30466e] dark:text-slate-200`}>
                      {currentQuestion.explanation || 'Geen extra uitleg beschikbaar.'}
                    </p>
                  ) : (
                    <div className="mt-2 border border-[#d7e1ee] bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-sm text-muted-foreground">Uitleg is beschikbaar voor Premium leden.</p>
                      <Button asChild className="mt-3 h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc]">
                        <Link href="/premium">Ontgrendel uitleg</Link>
                      </Button>
                    </div>
                  )}

                  {currentQuestion.bibleReference && (
                    <Badge variant="secondary" className="mt-3 bg-[#e9eff8] text-[#355384] dark:bg-slate-700 dark:text-blue-200">
                      Referentie: {currentQuestion.bibleReference}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {(currentIndex > 0 || hasAnswered) && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {currentIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="h-10 rounded-md border-[#d7e1ee] bg-white px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Vorige vraag
                    </Button>
                  )}
                </div>

                {hasAnswered && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-10 rounded-md bg-[#6f8ed4] px-5 text-white hover:bg-[#5f81cc]"
                  >
                    {currentIndex < quiz.questions.length - 1 ? 'Volgende vraag' : 'Quiz afronden'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md border border-[#d7e1ee] bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1f2f4b] dark:text-slate-100">Instellingen</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#30466e] dark:text-slate-200"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Instellingen sluiten"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#30466e] dark:text-slate-200">Tekstgrootte</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 rounded-md px-2 text-xs ${textSize === 'normal' ? 'bg-[#edf2fa] text-[#24395f] dark:bg-slate-800 dark:text-slate-100' : 'bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
                    onClick={() => setTextSize('normal')}
                  >
                    Normaal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 rounded-md px-2 text-xs ${textSize === 'large' ? 'bg-[#edf2fa] text-[#24395f] dark:bg-slate-800 dark:text-slate-100' : 'bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
                    onClick={() => setTextSize('large')}
                  >
                    Groot
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#30466e] dark:text-slate-200">Lettertype</span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-md px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  onClick={() => setFontFamily((value) => (value === 'serif' ? 'sans' : 'serif'))}
                >
                  {fontFamily === 'serif' ? 'Serif' : 'Sans'}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#30466e] dark:text-slate-200">Toon uitleg</p>
                  {!isPremium && (
                    <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#6f8ed4]">
                      <Lock className="h-3 w-3" />
                      Premium
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-8 rounded-md px-2 text-xs ${showExplanation ? 'bg-[#edf2fa] text-[#24395f] dark:bg-slate-800 dark:text-slate-100' : 'bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
                  onClick={() => {
                    if (isPremium) {
                      setShowExplanation((value) => !value);
                    } else {
                      router.push('/premium');
                    }
                  }}
                >
                  {showExplanation ? 'Aan' : 'Uit'}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-[#d7e1ee] bg-white px-3 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                onClick={() => setIsSettingsOpen(false)}
              >
                Sluiten
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
