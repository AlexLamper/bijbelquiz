'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Maximize,
  RotateCcw,
  Settings,
  Timer,
  X,
} from 'lucide-react';

import QuizFreeReviewSection, { type RevealedExplanation } from '@/components/quiz/QuizFreeReviewSection';
import QuizPremiumReviewSection from '@/components/quiz/QuizPremiumReviewSection';
import BibleVerseDisplay from '@/components/BibleVerseDisplay';
import { Button } from '@/components/ui/button';
import { getStudyTopicLinkForQuizTitle } from '@/lib/ecosystem-links';
import { buildReviewQuestionsFromSelections } from '@/lib/quiz-review';
import { flushAnalytics, track } from '@/lib/analytics/client';
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
  // The review after the quiz is its own wall, and the funnel counts it apart.
  const reviewPaywallHref = premiumPaywallHref('review_locked', pathname);

  const isPremium = !!session?.user?.isPremium;
  const isLoggedIn = !!session?.user;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);
  // The one free explanation per sitting: the "onthulling". Held here rather
  // than on the question because the same reveal shows during the quiz and
  // again in the review afterwards. The text is fetched when chosen, so a
  // free player's page never carries explanations it is not showing.
  const [reveal, setReveal] = useState<RevealedExplanation | null>(null);
  const [revealPending, setRevealPending] = useState<number | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Where the reader had got to when they walked away. Kept in a ref because
  // the only place that can report it is the unmount cleanup, which would
  // otherwise close over the state as it was on mount.
  const progress = useRef({ answered: 0, finished: false });
  useEffect(() => {
    progress.current = {
      answered: Object.keys(selectedAnswers).length,
      finished: isFinished,
    };
  }, [selectedAnswers, isFinished]);

  // There is no "I give up" button, so abandonment has to be inferred from
  // leaving. Only reported once at least one answer was given: a quiz opened
  // and closed immediately is already visible as `quiz_started` without a
  // matching `quiz_completed`, and counting it here as well would double it -
  // and would fire spuriously on every dev-mode double mount.
  useEffect(() => {
    return () => {
      const { answered, finished } = progress.current;
      if (finished || answered === 0) return;

      const total = quiz.questions.length;
      track('quiz_abandoned', {
        quizId: String(quiz._id),
        quizTitle: quiz.title,
        answered,
        totalQuestions: total,
        progressPct: total > 0 ? Math.round((answered / total) * 100) : 0,
      });
      // The page is on its way out; the debounced flush would never run.
      flushAnalytics();
    };
  }, [quiz._id, quiz.title, quiz.questions.length]);

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
  // A free player sees the lock only once their single reveal is spent on
  // another question. Before that the explanation is an offer, not a wall.
  const explanationLocked =
    !isPremium && hasAnswered && showExplanation && reveal !== null && reveal.index !== currentIndex;

  // Recorded once per quiz sitting, the first time a locked explanation
  // appears. It used to fire on every answered question, which made one
  // player look like ninety paywalls in an afternoon and buried the real
  // paywall page in the funnel report. Somebody who just got it wrong wants
  // to know why more than at any other point, so that is still recorded.
  const lockedExplanationRecorded = useRef(false);
  useEffect(() => {
    if (!explanationLocked || lockedExplanationRecorded.current) return;
    lockedExplanationRecorded.current = true;
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

  // The review after the quiz is the wall that matters for a solo player:
  // they have just spent five minutes, they know their score, and the "why"
  // per question is what Premium holds back. Counted once per sitting.
  const reviewPaywallRecorded = useRef(false);
  useEffect(() => {
    if (!isFinished || isPremium || reviewPaywallRecorded.current) return;
    reviewPaywallRecorded.current = true;
    track('paywall_shown', {
      trigger: 'review_locked',
      surface: 'quiz_result',
      wrongAnswers: quiz.questions.length - score,
      signedIn: isLoggedIn,
    });
  }, [isFinished, isPremium, isLoggedIn, quiz.questions.length, score]);

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

  /**
   * Spend the free reveal on one question. Premium players never need it -
   * their explanations are already on the page - and a second call is a no-op
   * because the reveal is a single choice per sitting, not a queue.
   */
  const revealExplanation = async (index: number) => {
    if (isPremium || reveal !== null || revealPending !== null) return;

    const question = quiz.questions[index];
    if (!question) return;

    setRevealPending(index);
    setRevealError(null);

    try {
      const response = await fetch(
        `/api/quizzes/${quiz._id}/explanation?question=${encodeURIComponent(String(question._id))}`
      );
      if (!response.ok) {
        throw new Error(`Explanation request failed with ${response.status}`);
      }

      const data = (await response.json()) as { explanation?: string; bibleReference?: string | null };
      setReveal({
        index,
        explanation: data.explanation || 'Geen extra uitleg beschikbaar.',
        bibleReference: data.bibleReference || null,
      });
    } catch {
      setRevealError('De uitleg kon niet worden opgehaald. Probeer het nog eens.');
    } finally {
      setRevealPending(null);
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);

    // Nothing to save without an account. The result screen asks for one,
    // right next to the score it would have kept.
    if (!isLoggedIn) return;

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
    // Everybody gets the list of what went right and wrong. What differs is
    // whether the explanation per question is on it.
    const reviewQuestions = buildReviewQuestionsFromSelections(
      quiz.questions as Parameters<typeof buildReviewQuestionsFromSelections>[0],
      selectedAnswers
    );

    // Counted, not derived from the percentage: 14/15 rounds to 93% and 10/10
    // to 100%, but only one of those is actually every question right, and
    // telling somebody with a perfect score they got "bijna alles goed" reads
    // as the app not having looked at their answers.
    const isPerfect = score === quiz.questions.length;

    // The result speaks in its own voice rather than printing "Quiz afgerond"
    // over every outcome: a 3/15 and a 15/15 are not the same event.
    const verdict = isPerfect
      ? {
          headline: 'Alles goed',
          lead: 'Een foutloze ronde. Tijd voor een moeilijkere quiz of een nieuw bijbelboek.',
          tone: 'text-positive',
          bar: 'bg-positive',
        }
      : percentage >= 90
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

        {/* Played without an account: the score above is real but unkept.
            This is the moment to ask, with the XP it would have saved. */}
        {!isLoggedIn && (
          <div className="mt-10 rounded-lg border border-lapis/45 bg-paper-raised p-5 sm:p-6">
            <p className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
              <span aria-hidden className="h-px w-6 bg-lapis" />
              Niet opgeslagen
            </p>
            <p className="mt-3 font-display text-lg leading-snug text-ink">
              Bewaar je score, {resolvedXp} XP en je streak
            </p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
              Met een gratis account tellen je quizzen mee voor je niveau en de ranglijst, en zie
              je later terug hoe je groeit.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                asChild
                className="h-10 rounded-md bg-ink px-4 text-sm font-medium text-ink-inverted hover:bg-ink-soft"
              >
                <Link href={`/registreren?callbackUrl=${encodeURIComponent(pathname)}`}>
                  Gratis account aanmaken
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-md border-rule bg-paper-raised px-4 text-sm font-medium text-ink hover:bg-paper-sunken"
              >
                <Link href={`/inloggen?callbackUrl=${encodeURIComponent(pathname)}`}>Inloggen</Link>
              </Button>
            </div>
          </div>
        )}

        {isPremium && reviewQuestions.length > 0 && (
          <div className="mt-10 border-t border-rule pt-8">
            <QuizPremiumReviewSection
              questions={reviewQuestions}
              score={score}
              totalQuestions={quiz.questions.length}
              xpEarned={resolvedXp}
            />
          </div>
        )}

        {!isPremium && reviewQuestions.length > 0 && (
          <div className="mt-10 border-t border-rule pt-8">
            <QuizFreeReviewSection
              questions={reviewQuestions}
              reveal={reveal}
              revealPending={revealPending}
              revealError={revealError}
              onReveal={revealExplanation}
              paywallHref={reviewPaywallHref}
            />
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
            ) : reveal && reveal.index === currentIndex ? (
              /* The one free explanation, spent on this question. */
              <div className="mt-3">
                <p
                  className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} wrap-anywhere text-[15px] leading-relaxed text-ink-soft`}
                >
                  {reveal.explanation}
                </p>
                <p className="mt-4 border-t border-rule pt-4 text-xs text-ink-muted">
                  Je gratis onthulling voor deze quiz. Met Premium lees je de uitleg bij elke vraag.
                </p>
              </div>
            ) : reveal === null ? (
              /* Still available: an offer, not a wall. */
              <div className="mt-3">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Bij deze vraag hoort een uitleg. Je mag er per quiz één gratis onthullen.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
                  <button
                    type="button"
                    data-analytics-id="quiz.reveal-explanation"
                    disabled={revealPending !== null}
                    onClick={() => revealExplanation(currentIndex)}
                    className="inline-flex h-9 items-center rounded-md bg-ink px-3 text-xs font-medium text-ink-inverted transition-colors hover:bg-ink-soft disabled:opacity-60"
                  >
                    {revealPending === currentIndex ? 'Ophalen...' : 'Onthul de uitleg'}
                  </button>
                  <span className="text-xs text-ink-muted">1 gratis per quiz</span>
                </div>
                {revealError && <p className="mt-2 text-xs text-vermilion">{revealError}</p>}
              </div>
            ) : (
              /* Spent elsewhere: now it is Premium, said once and quietly. */
              <div className="mt-3">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Je gratis onthulling zit bij vraag {reveal.index + 1}. Met Premium lees je de uitleg
                  bij elke vraag, ook na afloop.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
                  <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                    <Lock className="h-3 w-3" />
                    Uitleg is Premium
                  </p>
                  <Link
                    href={paywallHref}
                    data-skip-leave-guard
                    className="inline-flex h-9 items-center rounded-md border border-lapis/45 px-3 text-xs font-medium text-lapis transition-colors hover:bg-lapis-tint"
                  >
                    Bekijk Premium
                  </Link>
                </div>
              </div>
            )}

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
