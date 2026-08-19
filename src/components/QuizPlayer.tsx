'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Gem,
  Lock,
  Maximize,
  RotateCcw,
  Settings,
  Timer,
  X,
} from 'lucide-react';

import QuizPremiumReviewSection from '@/components/quiz/QuizPremiumReviewSection';
import BibleVerseDisplay from '@/components/BibleVerseDisplay';
import { Button } from '@/components/ui/button';
import { getStudyTopicLinkForQuizTitle } from '@/lib/ecosystem-links';
import { buildReviewQuestionsFromSelections } from '@/lib/quiz-review';
import { track } from '@/lib/analytics/client';
import { premiumPaywallHref } from '@/lib/premium-benefits';
import { useUserSettings } from '@/lib/user-settings-client';
import {
  QUESTION_TIMER_CHOICES,
  type QuestionFontSize,
  type QuestionTimerSeconds,
} from '@/lib/user-settings';

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

/** "1:05" / "0:24" - minutes only appear once there are any. */
function formatSeconds(total: number): string {
  const safe = Math.max(0, total);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

export default function QuizPlayer({
  quiz,
  timerOverride,
}: {
  quiz: Quiz;
  /**
   * Seconds per question chosen on the start screen for this sitting. Falls
   * back to the saved preference when not given, so the player still works when
   * it is rendered on its own.
   */
  timerOverride?: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { settings, isAuthenticated, saveSettings } = useUserSettings();

  // Upgrading from inside a quiz returns to that same quiz, so a locked
  // explanation is still on screen when the reader comes back.
  const paywallHref = premiumPaywallHref('explanation_locked', pathname);

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
  // Seeded from the account preference and written back when changed here, so
  // the in-quiz panel and the settings page are the same knob. Held in state
  // rather than read straight off `settings` so the button responds instantly,
  // before the session round-trip finishes.
  const [textSize, setTextSize] = useState<QuestionFontSize>(settings.questionFontSize);
  const [showBibleReferences, setShowBibleReferences] = useState(settings.showBibleReferences);
  // Reading comfort that is genuinely per-sitting: not persisted on purpose.
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [showExplanation, setShowExplanation] = useState(true);

  // The session resolves after first paint, so the saved values arrive a beat
  // late and have to be adopted then. Comparing against what was last seeded
  // means only a genuine change in the account preference re-applies — a change
  // made here is not immediately undone by the session catching up. Done during
  // render rather than in an effect to avoid a second render pass.
  // Tracked per field, so a change to one preference never resets the other.
  const [seededFontSize, setSeededFontSize] = useState(settings.questionFontSize);
  const [seededBibleReferences, setSeededBibleReferences] = useState(settings.showBibleReferences);

  // ── Per-question timer ───────────────────────────────────────────────────
  // Off unless the reader asked for it on the start screen. The countdown is a
  // thin rule and a number, never a ticking clock face: this is a Bible study
  // quiz, and the timer is there for people who want a challenge, not to put
  // everybody under pressure.
  // Held in state so it can be switched off from the in-quiz panel without
  // waiting for the session round trip - the reader who wants the clock gone
  // usually wants it gone now.
  const [timerSeconds, setTimerSeconds] = useState<number>(
    timerOverride ?? settings.questionTimerSeconds
  );
  const [seededTimer, setSeededTimer] = useState(settings.questionTimerSeconds);
  const timerEnabled = timerSeconds > 0;
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);
  const [timedOutQuestions, setTimedOutQuestions] = useState<Record<number, true>>({});

  if (seededTimer !== settings.questionTimerSeconds && timerOverride === undefined) {
    setSeededTimer(settings.questionTimerSeconds);
    setTimerSeconds(settings.questionTimerSeconds);
  }

  if (seededFontSize !== settings.questionFontSize) {
    setSeededFontSize(settings.questionFontSize);
    setTextSize(settings.questionFontSize);
  }

  if (seededBibleReferences !== settings.showBibleReferences) {
    setSeededBibleReferences(settings.showBibleReferences);
    setShowBibleReferences(settings.showBibleReferences);
  }

  const persistSetting = (patch: Parameters<typeof saveSettings>[0]) => {
    if (!isAuthenticated) return;
    saveSettings(patch).catch(() => {
      // Already applied locally; a failed write only costs persistence, and an
      // error toast mid-quiz is worse than silently not remembering.
    });
  };

  const updateTextSize = (value: QuestionFontSize) => {
    setTextSize(value);
    persistSetting({ questionFontSize: value });
  };

  const updateTimerSeconds = (value: QuestionTimerSeconds) => {
    setTimerSeconds(value);
    setSecondsLeft(value);
    setSeededTimer(value);
    persistSetting({ questionTimerSeconds: value });
  };

  const updateShowBibleReferences = (value: boolean) => {
    setShowBibleReferences(value);
    persistSetting({ showBibleReferences: value });
  };

  const currentQuestion = quiz.questions[currentIndex];
  const progressPercentage = (currentIndex / quiz.questions.length) * 100;
  const selectedAnswer = selectedAnswers[currentIndex] ?? null;
  const hasAnswered = selectedAnswer !== null;
  const difficultyLabel = getDifficultyLabel(quiz.difficulty);
  const categoryLabel = getCategoryLabel(quiz.categoryId);
  const questionTextSizeClass = getQuestionTextSizeClass(textSize, currentQuestion.text);
  const visibleBibleReference = showBibleReferences ? currentQuestion.bibleReference : undefined;
  const maxPossibleXp = typeof quiz.rewardXp === 'number' ? quiz.rewardXp : 50;
  const studyTopicLink = getStudyTopicLinkForQuizTitle(quiz.title || '');

  const answeredWrong =
    hasAnswered && !currentQuestion.answers[selectedAnswer!]?.isCorrect;
  const timedOut = Boolean(timedOutQuestions[currentIndex]);
  const explanationLocked =
    !isPremium && hasAnswered && showExplanation && Boolean(currentQuestion.explanationPreview);

  // Recorded once per question, when the locked explanation actually appears.
  // Somebody who just got it wrong wants to know why more than at any other
  // point in the quiz, so the funnel needs to see that separately.
  useEffect(() => {
    if (!explanationLocked) return;
    track('paywall_shown', {
      trigger: 'explanation_locked',
      surface: 'quiz_explanation',
      afterWrongAnswer: answeredWrong,
      questionId: currentQuestion._id,
    });
    // `answeredWrong` is derived from the same answer that gates this effect,
    // so it is deliberately not a dependency: it cannot change without the
    // question changing too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explanationLocked, currentQuestion._id]);

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

  /**
   * Every question starts at the top of the screen.
   *
   * On a phone the answer buttons sit below the fold, so answering leaves the
   * reader scrolled down; without this the next question opens halfway through
   * itself and has to be scrolled back up by hand, once per question, for the
   * whole quiz. Also runs when the quiz finishes, so the result is not opened
   * from the middle.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentIndex, isFinished]);

  /** A new question restarts the clock. */
  useEffect(() => {
    setSecondsLeft(timerSeconds);
  }, [currentIndex, timerSeconds]);

  /**
   * The countdown itself. Stops the moment the question is answered - the
   * reader is then reading the explanation, and a clock still running would
   * rush exactly the part of the quiz that is worth lingering on.
   */
  useEffect(() => {
    if (!timerEnabled || hasAnswered || isFinished) return;

    const tick = window.setInterval(() => {
      setSecondsLeft((remaining) => (remaining <= 1 ? 0 : remaining - 1));
    }, 1000);

    return () => window.clearInterval(tick);
  }, [timerEnabled, hasAnswered, isFinished, currentIndex]);

  /**
   * Running out locks the question in as unanswered rather than skipping past
   * it: the correct answer and its explanation still appear, which is the whole
   * point of getting one wrong.
   */
  useEffect(() => {
    if (!timerEnabled || hasAnswered || isFinished || secondsLeft > 0) return;

    setTimedOutQuestions((previous) => ({ ...previous, [currentIndex]: true }));
    setSelectedAnswers((previous) => ({ ...previous, [currentIndex]: -1 }));
  }, [timerEnabled, hasAnswered, isFinished, secondsLeft, currentIndex]);

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

    // The result speaks in its own voice rather than printing "Quiz afgerond"
    // over every outcome: a 3/15 and a 15/15 are not the same event.
    const verdict =
      percentage >= 90
        ? {
            headline: 'Uitstekend gedaan',
            lead: 'Bijna alles goed. Tijd voor een moeilijkere quiz of een nieuw bijbelboek.',
            tone: 'text-positive',
            bar: 'bg-positive',
          }
        : percentage >= 60
          ? {
              headline: 'Goed gedaan',
              lead: 'Een stevige basis. Speel hem nog eens of ga verder in dezelfde categorie.',
              tone: 'text-ink',
              bar: 'bg-lapis',
            }
          : {
              headline: 'Quiz afgerond',
              lead: 'Herhaling helpt: speel opnieuw en kijk hoeveel je nu al onthoudt.',
              tone: 'text-ink',
              bar: 'bg-vermilion',
            };

    return (
      <div className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-10 sm:px-8">
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
                  <Link href={paywallHref}>Upgrade naar Premium</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── The result ────────────────────────────────────────────────
            An editorial report, not a boxed card inside a boxed card: the
            score is the headline, everything else is set against hairlines in
            the same rhythm as the rest of the product. */}
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          {quiz.title}
        </p>

        <h1 className="mt-3 font-display text-[34px] font-normal leading-[1.05] tracking-[-0.025em] text-ink sm:text-[44px]">
          {verdict.headline}
        </h1>

        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
          {verdict.lead}
        </p>

        {/* Score, as one figure with the bar underneath it. */}
        <div className="mt-9 border-y border-rule py-7">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Jouw score
              </p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className={`font-display text-[56px] font-normal leading-none tabular-nums ${verdict.tone}`}>
                  {score}
                </span>
                <span className="font-display text-2xl leading-none text-ink-muted">
                  / {quiz.questions.length}
                </span>
              </p>
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                  Correct
                </p>
                <p className="mt-2 font-display text-[26px] font-normal leading-none tabular-nums text-ink">
                  {percentage}%
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                  Verdiend
                </p>
                <p className="mt-2 inline-flex items-baseline gap-1.5 font-display text-[26px] font-normal leading-none tabular-nums text-positive">
                  +{resolvedXp}
                  <span className="text-xs font-sans font-medium uppercase tracking-[0.16em] text-ink-muted">
                    xp
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 h-1 w-full bg-rule">
            <div
              className={`h-1 transition-[width] duration-1000 ease-out ${verdict.bar}`}
              style={{ width: `${Math.max(2, percentage)}%` }}
            />
          </div>
        </div>

        {/* Actions come immediately after the figure - what to do next is the
            question the reader actually has here. */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => router.push(isLoggedIn ? '/dashboard' : '/')}
            disabled={isSaving}
            className="h-12 flex-1 rounded-md bg-ink px-5 text-sm font-medium text-ink-inverted hover:bg-ink-soft"
          >
            {isSaving ? 'Opslaan...' : isLoggedIn ? 'Naar dashboard' : 'Naar home'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            className="h-12 flex-1 rounded-md border-rule bg-paper-raised px-5 text-sm font-medium text-ink hover:bg-paper-sunken"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Opnieuw spelen
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 flex-1 rounded-md border-rule bg-paper px-5 text-sm font-medium text-ink-soft hover:bg-paper-sunken hover:text-ink"
          >
            <Link href="/quizzen">Volgende quiz</Link>
          </Button>
        </div>

        {isPremium && premiumReviewQuestions.length > 0 && (
          <div className="mt-10 border-t border-rule pt-8">
            <QuizPremiumReviewSection
              questions={premiumReviewQuestions}
              score={score}
              totalQuestions={quiz.questions.length}
              xpEarned={resolvedXp}
            />
          </div>
        )}

        {!isPremium && (
          <div className="mt-10 rounded-lg border border-lapis/45 bg-paper-raised p-5 sm:p-6">
            <p className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
              <span aria-hidden className="h-px w-6 bg-lapis" />
              Premium
            </p>
            <p className="mt-3 font-display text-lg leading-snug text-ink">
              Zie precies welke vragen je fout had
            </p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
              Met Premium krijg je per vraag de uitleg en de bijbelverwijzing, en zie je je
              voortgang per bijbelboek terug.
            </p>
            <Button
              asChild
              className="mt-4 h-10 rounded-md bg-ink px-4 text-sm font-medium text-ink-inverted hover:bg-ink-soft"
            >
              <Link href={paywallHref}>
                <Gem className="mr-2 h-4 w-4" />
                Bekijk Premium
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-10 border-t border-rule pt-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            Verder lezen
          </p>
          <a
            href={studyTopicLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 block text-sm font-medium text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-ink"
          >
            Verdiep je in {studyTopicLink.label} op Bijbel Studie
          </a>
          <a
            href="https://www.bijbelapi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-xs text-ink-muted underline decoration-rule underline-offset-4 transition-colors hover:text-ink"
          >
            Mogelijk gemaakt met BijbelAPI
          </a>
        </div>
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
            <span className="hidden sm:inline">{difficultyLabel}</span>

            {/* The countdown. One number and one hairline - on a phone this
                sits in the line that is already there rather than adding a
                band of its own. */}
            {timerEnabled && (
              <>
                <span aria-hidden className="h-3 w-px bg-rule" />
                <span
                  className={`inline-flex items-center gap-1.5 tabular-nums ${
                    timedOut ? 'text-vermilion' : secondsLeft <= 5 && !hasAnswered ? 'text-vermilion' : 'text-ink'
                  }`}
                  aria-live="off"
                >
                  <Timer className="h-3.5 w-3.5" />
                  {timedOut ? 'Tijd om' : formatSeconds(secondsLeft)}
                </span>
              </>
            )}
          </span>
        </div>

        {timerEnabled && (
          <div className="mt-3 h-px w-full bg-rule" aria-hidden>
            <div
              className={`h-px transition-[width] duration-1000 ease-linear ${
                secondsLeft <= 5 ? 'bg-vermilion' : 'bg-lapis'
              }`}
              style={{ width: `${timerSeconds > 0 ? (secondsLeft / timerSeconds) * 100 : 0}%` }}
            />
          </div>
        )}

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
                    href={paywallHref}
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
                    onClick={() => updateTextSize('normal')}
                  >
                    Normaal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-8 rounded-md px-2 text-xs ${textSize === 'large' ? 'bg-paper-sunken text-ink' : 'bg-paper-raised   '}`}
                    onClick={() => updateTextSize('large')}
                  >
                    Groot
                  </Button>
                </div>
              </div>

              {/* The timer is switchable mid-quiz, and off is the first
                  option: somebody opening this panel while a clock is running
                  is usually looking for the way to stop it. */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">Tijd per vraag</span>
                <div className="flex items-center gap-1">
                  {QUESTION_TIMER_CHOICES.map((choice) => (
                    <Button
                      key={choice}
                      type="button"
                      variant="outline"
                      className={`h-8 rounded-md px-2 text-xs ${
                        timerSeconds === choice ? 'bg-paper-sunken text-ink' : 'bg-paper-raised'
                      }`}
                      onClick={() => updateTimerSeconds(choice)}
                    >
                      {choice === 0 ? 'Uit' : `${choice}s`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">Bijbelverwijzingen</span>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-8 rounded-md px-2 text-xs ${showBibleReferences ? 'bg-paper-sunken text-ink' : 'bg-paper-raised   '}`}
                  onClick={() => updateShowBibleReferences(!showBibleReferences)}
                >
                  {showBibleReferences ? 'Aan' : 'Uit'}
                </Button>
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
                      router.push(paywallHref);
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
