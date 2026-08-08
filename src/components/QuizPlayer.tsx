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

import QuizPremiumReviewSection from '@/components/quiz/QuizPremiumReviewSection';
import BibleVerseDisplay from '@/components/BibleVerseDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStudyTopicLinkForQuizTitle } from '@/lib/ecosystem-links';
import { buildReviewQuestionsFromSelections } from '@/lib/quiz-review';

interface Answer {
  text: string;
  isCorrect: boolean;
  _id: string;
}

interface Question {
  text: string;
  answers: Answer[];
  explanation?: string;
  explanationPreview?: string;
  bibleReference?: string;
  bibleReferencePreview?: string;
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

function getQuestionTextSizeClass(textSize: 'normal' | 'large', questionText: string): string {
  const length = questionText.trim().length;

  if (textSize === 'large') {
    if (length >= 320) return 'text-[1.1rem] md:text-[1.25rem] xl:text-[1.35rem]';
    if (length >= 220) return 'text-[1.2rem] md:text-[1.4rem] xl:text-[1.55rem]';
    if (length >= 140) return 'text-[1.35rem] md:text-[1.7rem] xl:text-[1.9rem]';
    return 'text-[1.75rem] md:text-[2.35rem] xl:text-[2.6rem]';
  }

  if (length >= 320) return 'text-[1rem] md:text-[1.15rem] xl:text-[1.25rem]';
  if (length >= 220) return 'text-[1.1rem] md:text-[1.3rem] xl:text-[1.45rem]';
  if (length >= 140) return 'text-[1.2rem] md:text-[1.55rem] xl:text-[1.7rem]';
  return 'text-[1.4rem] md:text-[1.9rem] xl:text-[2.2rem]';
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
  const [showPremiumReviewUpsell, setShowPremiumReviewUpsell] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [pendingLeaveHref, setPendingLeaveHref] = useState<string | null>(null);
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [showExplanation, setShowExplanation] = useState(true);

  const currentQuestion = quiz.questions[currentIndex];
  const progressPercentage = (currentIndex / quiz.questions.length) * 100;
  const selectedAnswer = selectedAnswers[currentIndex] ?? null;
  const hasAnswered = selectedAnswer !== null;
  const difficultyLabel = getDifficultyLabel(quiz.difficulty);
  const categoryLabel = getCategoryLabel(quiz.categoryId);
  const questionTextSizeClass = getQuestionTextSizeClass(textSize, currentQuestion.text);
  const visibleBibleReference = currentQuestion.bibleReference;
  const maxPossibleXp = typeof quiz.rewardXp === 'number' ? quiz.rewardXp : 50;
  const studyTopicLink = getStudyTopicLinkForQuizTitle(quiz.title || '');

  const openLeaveDialog = (href: string) => {
    setPendingLeaveHref(href);
    setIsLeaveDialogOpen(true);
  };

  const navigateToPendingHref = () => {
    const href = pendingLeaveHref || '/quizzes';
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.location.assign(href);
      return;
    }
    router.push(href);
  };

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
      const submittedAnswers = quiz.questions.map((question, index) => {
        const selectedAnswerIndex = selectedAnswers[index];
        const selectedAnswer =
          typeof selectedAnswerIndex === 'number' ? question.answers[selectedAnswerIndex] : null;
        return {
          questionId: String(question._id),
          selectedAnswerId: selectedAnswer?._id != null ? String(selectedAnswer._id) : null,
          selectedAnswerIndex: typeof selectedAnswerIndex === 'number' ? selectedAnswerIndex : null,
        };
      });

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          quizId: quiz._id,
          score,
          totalQuestions: quiz.questions.length,
          answers: submittedAnswers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.xpEarned === 'number') {
          setEarnedXp(data.xpEarned);
        }
        if (!isPremium) {
          setShowPremiumReviewUpsell(true);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const enforceMobileTextSize = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) {
        setTextSize('normal');
      }
    };

    enforceMobileTextSize(mediaQuery);

    const listener = (event: MediaQueryListEvent) => enforceMobileTextSize(event);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (isFinished) {
      return;
    }

    const onAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');

      if (!anchor || event.defaultPrevented) {
        return;
      }

      if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      if (anchor.hasAttribute('data-skip-leave-guard')) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      const isSameLocation =
        destination.pathname === current.pathname &&
        destination.search === current.search &&
        destination.hash === current.hash;

      if (isSameLocation) {
        return;
      }

      event.preventDefault();
      const normalizedHref =
        destination.origin === current.origin
          ? `${destination.pathname}${destination.search}${destination.hash}`
          : destination.toString();
      openLeaveDialog(normalizedHref);
    };

    document.addEventListener('click', onAnchorClick, true);
    return () => {
      document.removeEventListener('click', onAnchorClick, true);
    };
  }, [isFinished]);

  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const fallbackXp = Math.round((typeof quiz.rewardXp === 'number' ? quiz.rewardXp : 50) * (score / quiz.questions.length));
    const resolvedXp = earnedXp ?? fallbackXp;
    const premiumReviewQuestions = isPremium
      ? buildReviewQuestionsFromSelections(quiz.questions as Parameters<typeof buildReviewQuestionsFromSelections>[0], selectedAnswers)
      : [];

    return (
      <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-10 sm:px-8">
        {!isPremium && showPremiumReviewUpsell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4">
            <div className="w-full max-w-md rounded-lg border border-rule bg-paper-raised p-5">
              <h2 className="text-base font-normal text-ink">Ontgrendel je volledige quizanalyse</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Wil je een gedetailleerd overzicht van je score, precies zien welke antwoorden fout waren, de uitleg per vraag en
                bijbelverwijzingen? Upgrade dan naar Premium.
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-md border-rule bg-paper-raised px-3 text-ink hover:bg-paper-sunken"
                  onClick={() => setShowPremiumReviewUpsell(false)}
                >
                  Later bekijken
                </Button>
                <Button
                  asChild
                  type="button"
                  className="h-9 rounded-md bg-ink px-3 text-ink-inverted hover:bg-ink-soft"
                >
                  <Link href="/premium">Upgrade naar Premium</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <Card className="border-rule py-0">
          <CardContent className="p-6 lg:p-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Resultaat</p>
            <h1 className="mt-2 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">Quiz afgerond</h1>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="border border-rule bg-paper-sunken p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Jouw score</p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-5xl font-semibold text-ink">{score}</p>
                  <p className="pb-1 text-2xl font-semibold text-ink-soft">/ {quiz.questions.length}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{percentage}% correct</p>

                <div className="mt-4 inline-flex items-center gap-2 bg-paper-sunken px-3 py-1 text-sm font-medium text-ink">
                  <Award className="h-4 w-4" />
                  + {resolvedXp} XP verdiend
                </div>
              </div>

              <div className="border border-rule bg-paper-raised p-5">
                <p className="text-sm font-semibold text-ink">Volgende stap</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {percentage >= 90
                    ? 'Sterk resultaat. Kies nu een moeilijkere quiz of een nieuwe categorie.'
                    : percentage >= 60
                      ? 'Goede basis. Herhaal deze quiz of werk verder in dezelfde categorie.'
                      : 'Herhaling helpt. Speel opnieuw om je score te verbeteren.'}
                </p>

                {!isPremium && (
                  <div className="mt-4 border border-rule bg-paper-sunken p-3">
                    <p className="text-sm font-semibold text-ink">Premium analyse</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ontgrendel uitgebreide uitleg en meer voortgangsinzichten.
                    </p>
                    <Button asChild className="mt-3 h-9 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft">
                      <Link href="/premium">Bekijk Premium</Link>
                    </Button>
                  </div>
                )}
                <div className="mt-4 border-t border-rule pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Meer ontdekken</p>
                  <a
                    href={studyTopicLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-sm font-medium text-ink hover:text-ink"
                  >
                    Verdiep je verder in {studyTopicLink.label} op Bijbel Studie
                  </a>
                  <a
                    href="https://www.bijbelapi.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-muted-foreground hover:text-foreground"
                  >
                    Mogelijk gemaakt met BijbelAPI
                  </a>
                </div>
              </div>
            </div>

            {isPremium && premiumReviewQuestions.length > 0 && (
              <div className="mt-8 border-t border-rule pt-6">
                <QuizPremiumReviewSection
                  questions={premiumReviewQuestions}
                  score={score}
                  totalQuestions={quiz.questions.length}
                  xpEarned={resolvedXp}
                />
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.reload()}
                className="h-10 rounded-md border-rule bg-paper-raised px-4 text-ink hover:bg-paper-sunken"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Opnieuw spelen
              </Button>

              <Button
                type="button"
                onClick={() => router.push(isLoggedIn ? '/dashboard' : '/')}
                disabled={isSaving}
                className="h-10 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft"
              >
                {isSaving ? 'Opslaan...' : isLoggedIn ? 'Naar dashboard' : 'Naar home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    /* On a laptop the whole player is one viewport-height column: the question
       area flexes, so the page itself never scrolls. The subtraction is the
       sticky header's 4rem height plus its 1px bottom border. */
    <div className="flex min-h-screen flex-col bg-paper lg:h-[calc(100dvh-4rem-1px)] lg:max-h-[calc(100dvh-4rem-1px)] lg:min-h-0 lg:overflow-hidden">
      {/* Quiz bar: progress, place in the quiz, and the two controls. */}
      <div className="sticky top-16 z-30 shrink-0 border-b border-rule bg-paper/90 backdrop-blur-sm supports-backdrop-filter:bg-paper/75 lg:static">
        <div className="h-px w-full bg-rule">
          <div
            className="h-px bg-lapis transition-[width] duration-500"
            style={{ width: `${Math.max(2, progressPercentage)}%` }}
          />
        </div>

        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-4 px-5 sm:px-8">
          <button
            type="button"
            onClick={() => openLeaveDialog('/quizzen')}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Quizzen</span>
          </button>

          <p className="min-w-0 flex-1 truncate text-center text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            {quiz.title}
          </p>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
              aria-label="Volledig scherm"
            >
              <Maximize className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
              aria-label="Instellingen"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pb-10 pt-8 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:pt-10">
        {/* Where you are */}
        <div className="flex items-center justify-between gap-4 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
          <span className="tabular-nums">
            Vraag {currentIndex + 1} <span className="text-rule-strong">/</span> {quiz.questions.length}
          </span>
          <span className="flex items-center gap-3">
            <span className="hidden sm:inline">{categoryLabel}</span>
            <span aria-hidden className="hidden h-3 w-px bg-rule sm:block" />
            <span>{difficultyLabel}</span>
          </span>
        </div>

        {/* The question */}
        <h1
          className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} mt-4 wrap-anywhere ${questionTextSizeClass} font-normal leading-[1.2] tracking-[-0.02em] text-ink`}
        >
          {currentQuestion.text}
        </h1>

        {/* The answers */}
        <div className="mt-6 space-y-2.5">
          {currentQuestion.answers.map((answer, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answer.isCorrect;

            let rowClass = 'border-rule bg-paper-raised hover:border-ink hover:bg-paper-sunken';
            let markerClass = 'border-rule-strong text-ink-muted group-hover:border-ink group-hover:text-ink';

            if (hasAnswered) {
              if (isCorrect) {
                rowClass = 'border-positive/45 bg-positive-tint';
                markerClass = 'border-positive bg-positive text-ink-inverted';
              } else if (isSelected) {
                rowClass = 'border-vermilion/45 bg-vermilion-tint';
                markerClass = 'border-vermilion bg-vermilion text-ink-inverted';
              } else {
                rowClass = 'border-rule bg-paper-raised opacity-55';
                markerClass = 'border-rule-strong text-ink-muted';
              }
            }

            return (
              <button
                key={answer._id || index}
                type="button"
                disabled={hasAnswered}
                onClick={() => handleAnswer(index)}
                className={`group flex w-full items-start gap-4 rounded-md border px-4 py-3.5 text-left transition-colors disabled:cursor-default ${rowClass}`}
              >
                <span
                  className={`mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border text-[11px] font-medium transition-colors ${markerClass}`}
                >
                  {hasAnswered && isCorrect ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : hasAnswered && isSelected ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    answerLetters[index] || index + 1
                  )}
                </span>

                <span
                  className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} min-w-0 flex-1 wrap-anywhere ${textSize === 'large' ? 'text-[17px]' : 'text-[15px]'} leading-relaxed text-ink`}
                >
                  {answer.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {hasAnswered && showExplanation && (
          <div className="mt-6 rounded-lg border border-rule bg-paper-raised p-5">
            <p className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              <BookOpen className="h-3.5 w-3.5 text-lapis" />
              Uitleg
            </p>

            {isPremium ? (
              <p
                className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} mt-3 wrap-anywhere text-[15px] leading-relaxed text-ink-soft`}
              >
                {currentQuestion.explanation || 'Geen extra uitleg beschikbaar.'}
              </p>
            ) : currentQuestion.explanationPreview ? (
              <div className="mt-3">
                <div className="relative overflow-hidden">
                  <p
                    className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} wrap-anywhere text-[15px] leading-relaxed text-ink-soft`}
                  >
                    {currentQuestion.explanationPreview}
                  </p>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-paper-raised to-transparent" />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
                  <p className="text-xs text-ink-muted">Volledige uitleg zichtbaar met Premium</p>
                  <Link
                    href="/premium"
                    data-skip-leave-guard
                    className="inline-flex h-9 items-center rounded-md border border-lapis/45 px-3 text-xs font-medium text-lapis transition-colors hover:bg-lapis-tint"
                  >
                    Ontgrendel Premium
                  </Link>
                </div>
              </div>
            ) : null}

            {visibleBibleReference && <BibleVerseDisplay reference={visibleBibleReference} />}
          </div>
        )}
      </div>

      {/* Navigation stays within reach on every screen size. */}
      <div className="sticky bottom-0 z-30 shrink-0 border-t border-rule bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex h-17 w-full max-w-3xl items-center gap-3 px-5 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="group inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Vorige
              </button>
            ) : (
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Score <span className="tabular-nums text-ink">{score}</span>
              </span>
            )}
          </div>

          {hasAnswered ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-6 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
            >
              {currentIndex < quiz.questions.length - 1 ? 'Volgende vraag' : 'Quiz afronden'}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Kies een antwoord
            </span>
          )}
        </div>
      </div>

      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-rule bg-paper-raised p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-normal text-ink">Instellingen</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-ink"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Instellingen sluiten"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="hidden items-center justify-between gap-3 sm:flex">
                <span className="text-sm text-ink">Tekstgrootte</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 rounded-md px-2 text-xs ${textSize === 'normal' ? 'bg-paper-sunken text-ink' : 'bg-paper-raised   '}`}
                    onClick={() => setTextSize('normal')}
                  >
                    Normaal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 rounded-md px-2 text-xs ${textSize === 'large' ? 'bg-paper-sunken text-ink' : 'bg-paper-raised   '}`}
                    onClick={() => setTextSize('large')}
                  >
                    Groot
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">Lettertype</span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-md px-2 text-xs"
                  onClick={() => setFontFamily((value) => (value === 'serif' ? 'sans' : 'serif'))}
                >
                  {fontFamily === 'serif' ? 'Serif' : 'Sans'}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink">Toon uitleg</p>
                  {!isPremium && (
                    <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                      <Lock className="h-3 w-3" />
                      Premium
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-8 rounded-md px-2 text-xs ${showExplanation ? 'bg-paper-sunken text-ink' : 'bg-paper-raised   '}`}
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

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-rule bg-paper-raised px-3 text-ink hover:bg-paper-sunken"
                onClick={() => setIsSettingsOpen(false)}
              >
                Sluiten
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLeaveDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4"
          onClick={() => {
            setIsLeaveDialogOpen(false);
            setPendingLeaveHref(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-lg border border-rule bg-paper-raised p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-base font-normal text-ink">Quiz verlaten?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Weet je zeker dat je wilt stoppen? Je kunt tot{' '}
              <span className="font-semibold text-ink">{maxPossibleXp} XP</span> mislopen.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Als je nu weggaat, krijg je geen XP en wordt je voortgang niet opgeslagen.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-rule bg-paper-raised px-3 text-ink hover:bg-paper-sunken"
                onClick={() => {
                  setIsLeaveDialogOpen(false);
                  setPendingLeaveHref(null);
                }}
              >
                Blijven
              </Button>
              <Button
                type="button"
                className="h-9 rounded-md bg-ink px-3 text-ink-inverted hover:bg-ink-soft"
                onClick={navigateToPendingHref}
              >
                Quiz verlaten
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
