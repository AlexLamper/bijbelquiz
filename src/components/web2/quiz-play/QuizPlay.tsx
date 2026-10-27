'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2, Settings, X } from 'lucide-react';

import {
  AnswerButton,
  AnswerGrid,
  Button,
  IconButton,
  Modal,
  Pill,
  PremiumLock,
  ProgressRing,
  ProgressSegments,
  ResultDisc,
  Spinner,
  StreakPill,
  type AnswerState,
} from '@/components/bq';
import { BoltSolidIcon } from '@/components/bq/icons';
import StudieLink from '@/components/StudieLink';
import { flushAnalytics, track } from '@/lib/analytics/client';
import { passageFromQuestion } from '@/lib/ecosystem-links';
import {
  canPlayQuiz,
  lockedPaywallHref,
  readGuestAllowance,
  rememberGuestPlayedQuiz,
} from '@/lib/free-quiz-limit';
import { addPendingAttempt } from '@/lib/pending-attempts';
import type { QuizPassage } from '@/lib/quiz-passage';
import { useUserSettings } from '@/lib/user-settings-client';
import { QUESTION_TIMER_CHOICES, type QuestionFontSize, type QuestionTimerSeconds } from '@/lib/user-settings';
import { cn } from '@/lib/utils';
import { calculateAttemptXp } from '@/lib/xp';

import PassageReader from './PassageReader';
import type { PlayQuiz, PlayViewer } from './types';
import { useVerse } from './useVerse';

type Phase = 'checking' | 'passage' | 'playing';

interface QuizPlayProps {
  quiz: PlayQuiz;
  passage: QuizPassage | null;
  viewer: PlayViewer;
  /** The account played this quiz before (guests are checked in the browser). */
  isReplay: boolean;
  /** Account preference: read the chapter before the first question. */
  readPassageFirst: boolean;
}

/** Answers this short fit two per row on a phone, as in the design. */
const SHORT_ANSWER = 18;

/**
 * The quiz player (W18 P-QuizSpelen): one question at a time in a 784px
 * column, the answers as big buttons, and after answering a card with the
 * verdict, the explanation (Premium) and "Volgende vraag". Finishing writes
 * the attempt (or parks it for a guest) and opens the result page.
 */
export default function QuizPlay({ quiz, passage, viewer, isReplay: serverReplay, readPassageFirst }: QuizPlayProps) {
  const router = useRouter();
  const { settings, isAuthenticated, saveSettings } = useUserSettings();
  const total = quiz.questions.length;

  // Guests are held on a blank screen for one tick while this browser's free
  // quizzes are counted, so a fourth new quiz never flashes before the paywall.
  const [phase, setPhase] = useState<Phase>(() =>
    !viewer.isLoggedIn ? 'checking' : readPassageFirst && passage ? 'passage' : 'playing',
  );
  const [guestReplay, setGuestReplay] = useState(false);
  const isReplay = serverReplay || guestReplay;

  useEffect(() => {
    if (viewer.isLoggedIn || phase !== 'checking') return;
    const allowance = readGuestAllowance();
    if (!canPlayQuiz(allowance, quiz._id, quiz.slug)) {
      router.replace(lockedPaywallHref(quiz.slug));
      return;
    }
    setGuestReplay(allowance.playedQuizIds.includes(quiz._id) || allowance.playedQuizIds.includes(quiz.slug));
    setPhase('playing');
  }, [viewer.isLoggedIn, phase, quiz._id, quiz.slug, router]);

  const [currentIndex, setCurrentIndex] = useState(0);
  /** Answer index per question; -1 means the clock ran out. */
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const finished = useRef(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingLeaveHref, setPendingLeaveHref] = useState<string | null>(null);

  // Seeded from the account preference and written back when changed here, so
  // the in-quiz panel and the settings page are the same knob.
  const [textSize, setTextSize] = useState<QuestionFontSize>(settings.questionFontSize);
  const [showBibleReferences, setShowBibleReferences] = useState(settings.showBibleReferences);
  const [timerSeconds, setTimerSeconds] = useState<number>(settings.questionTimerSeconds);
  // Reading comfort that is per sitting: not persisted on purpose.
  const [fontFamily, setFontFamily] = useState<'display' | 'sans'>('display');
  const [showExplanation, setShowExplanation] = useState(true);

  // The session resolves after first paint; adopt a later change in the
  // account preference once, per field, without undoing a change made here.
  const [seeded, setSeeded] = useState(settings);
  if (seeded !== settings) {
    if (seeded.questionFontSize !== settings.questionFontSize) setTextSize(settings.questionFontSize);
    if (seeded.showBibleReferences !== settings.showBibleReferences) setShowBibleReferences(settings.showBibleReferences);
    if (seeded.questionTimerSeconds !== settings.questionTimerSeconds) setTimerSeconds(settings.questionTimerSeconds);
    setSeeded(settings);
  }

  const persistSetting = (patch: Parameters<typeof saveSettings>[0]) => {
    if (!isAuthenticated) return;
    saveSettings(patch, { refreshSession: false }).catch(() => {
      // Already applied locally; a failed write only costs persistence.
    });
  };

  const question = quiz.questions[currentIndex];
  const selected = selectedAnswers[currentIndex];
  const hasAnswered = typeof selected === 'number';
  const timedOut = selected === -1;
  const answeredCorrectly = hasAnswered && Boolean(question.answers[selected]?.isCorrect);
  const isLast = currentIndex === total - 1;

  const score = useMemo(
    () =>
      quiz.questions.reduce(
        (sum, item, index) => sum + (item.answers[selectedAnswers[index]]?.isCorrect ? 1 : 0),
        0,
      ),
    [quiz.questions, selectedAnswers],
  );

  /** Correct answers in a row, up to the current question. */
  const inARow = useMemo(() => {
    let count = 0;
    const last = hasAnswered ? currentIndex : currentIndex - 1;
    for (let index = last; index >= 0; index -= 1) {
      if (quiz.questions[index].answers[selectedAnswers[index]]?.isCorrect) count += 1;
      else break;
    }
    return count;
  }, [currentIndex, hasAnswered, quiz.questions, selectedAnswers]);

  // XP is earned per correct answer; a replay only earns what beats the best
  // earlier score, so the per-question figure is not promised there.
  const xpPerQuestion = Math.round(quiz.rewardXp / Math.max(1, total));
  const questionPassage = passageFromQuestion(question);
  const kicker = questionPassage ? `${questionPassage.book} ${questionPassage.chapter}` : quiz.categoryTitle;
  const reference = showBibleReferences && question.bibleReference.trim() && question.bibleReference.trim() !== '-'
    ? question.bibleReference.trim()
    : '';
  const verse = useVerse(reference);

  /* ── Analytics: started and abandoned ─────────────────────────────────── */

  const startedTracked = useRef(false);
  useEffect(() => {
    if (phase === 'checking' || startedTracked.current) return;
    startedTracked.current = true;
    // The other half of `quiz_completed`: a completion count alone cannot tell
    // a quiz nobody opens from one everybody abandons.
    track('quiz_started', {
      quizId: quiz._id,
      quizTitle: quiz.title,
      category: quiz.categoryTitle ?? null,
      difficulty: quiz.difficulty ?? null,
      isPremium: quiz.isPremium,
      questionCount: total,
      timerSeconds,
      readPassageFirst: phase === 'passage',
      isReplay,
    });
  }, [phase, quiz, total, timerSeconds, isReplay]);

  const progress = useRef({ answered: 0 });
  useEffect(() => {
    progress.current = { answered: Object.keys(selectedAnswers).length };
  }, [selectedAnswers]);

  // There is no "I give up" button, so abandonment is inferred from leaving.
  // Only reported once at least one answer was given.
  useEffect(() => {
    return () => {
      const { answered } = progress.current;
      if (finished.current || answered === 0) return;
      track('quiz_abandoned', {
        quizId: quiz._id,
        quizTitle: quiz.title,
        answered,
        totalQuestions: total,
        progressPct: total > 0 ? Math.round((answered / total) * 100) : 0,
      });
      flushAnalytics();
    };
  }, [quiz._id, quiz.title, total]);

  /* ── Answering ────────────────────────────────────────────────────────── */

  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const feedbackRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (hasAnswered || phase !== 'playing') return;
      setSelectedAnswers((previous) => ({ ...previous, [currentIndex]: answerIndex }));
    },
    [currentIndex, hasAnswered, phase],
  );

  // After answering, the way on gets focus (Enter continues) and, on a phone,
  // the verdict scrolls into view.
  useEffect(() => {
    if (!hasAnswered) return;
    nextButtonRef.current?.focus({ preventScroll: true });
    feedbackRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [hasAnswered, currentIndex]);

  const finishQuiz = useCallback(async () => {
    setIsFinishing(true);
    setFinishError(false);

    const submittedAnswers = quiz.questions.map((item, index) => {
      const answerIndex = selectedAnswers[index];
      const answer = typeof answerIndex === 'number' && answerIndex >= 0 ? item.answers[answerIndex] : null;
      return {
        questionId: item._id,
        selectedAnswerId: answer?._id ?? null,
        selectedAnswerIndex: answer ? answerIndex : null,
      };
    });

    // Without an account the attempt is parked in this browser; the result
    // page asks for an account next to the score it would keep, and
    // `PendingAttemptSync` writes it the moment a session appears.
    if (!viewer.isLoggedIn) {
      // A guest completion never reaches the submit route until it is claimed
      // (which is then marked `claimed` and left out of the counts).
      track('quiz_completed', { quizId: quiz._id, score, totalQuestions: total, guest: true });
      const stored = addPendingAttempt({
        quizId: quiz._id,
        quizSlug: quiz.slug,
        quizTitle: quiz.title,
        score,
        totalQuestions: total,
        answers: submittedAnswers,
        xpPreview: calculateAttemptXp(quiz.rewardXp, score, total),
      });
      rememberGuestPlayedQuiz(quiz._id, quiz.slug);
      finished.current = true;
      router.push(`/quiz/${quiz.slug}/beoordeling?gast=${stored.completedAt}`);
      return;
    }

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz._id, score, totalQuestions: total, answers: submittedAnswers }),
      });

      if (response.status === 403) {
        finished.current = true;
        router.replace(lockedPaywallHref(quiz.slug));
        return;
      }
      if (!response.ok) throw new Error(String(response.status));

      const data = (await response.json()) as { attemptId?: string };
      finished.current = true;
      router.push(
        data.attemptId
          ? `/quiz/${quiz.slug}/beoordeling?attempt=${data.attemptId}`
          : `/quiz/${quiz.slug}/beoordeling`,
      );
    } catch (error) {
      console.error('Failed to save quiz progress', error);
      setIsFinishing(false);
      setFinishError(true);
    }
  }, [quiz, router, score, selectedAnswers, total, viewer.isLoggedIn]);

  const handleNext = useCallback(() => {
    if (!hasAnswered || isFinishing) return;
    if (!isLast) {
      setCurrentIndex((index) => index + 1);
      return;
    }
    void finishQuiz();
  }, [finishQuiz, hasAnswered, isFinishing, isLast]);

  // Every question starts at the top of the screen, and its heading gets focus
  // so a screen reader reads the new question.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (currentIndex > 0) headingRef.current?.focus({ preventScroll: true });
  }, [currentIndex]);

  // Keys 1-4 answer, Enter goes on.
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (isSettingsOpen || pendingLeaveHref || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;

      const number = Number(event.key);
      if (!hasAnswered && Number.isInteger(number) && number >= 1 && number <= question.answers.length) {
        event.preventDefault();
        handleAnswer(number - 1);
        return;
      }
      if (hasAnswered && event.key === 'Enter' && !(target && ['BUTTON', 'A'].includes(target.tagName))) {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, isSettingsOpen, pendingLeaveHref, hasAnswered, question.answers.length, handleAnswer, handleNext]);

  /* ── Timer ────────────────────────────────────────────────────────────── */

  // Off unless asked for. Stops the moment the question is answered: the
  // reader is then reading the explanation, which is worth lingering on.
  const timerEnabled = timerSeconds > 0;
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);
  const [timerFor, setTimerFor] = useState({ index: currentIndex, seconds: timerSeconds });
  if (timerFor.index !== currentIndex || timerFor.seconds !== timerSeconds) {
    setTimerFor({ index: currentIndex, seconds: timerSeconds });
    setSecondsLeft(timerSeconds);
  }

  useEffect(() => {
    if (!timerEnabled || hasAnswered || phase !== 'playing') return;
    const tick = window.setInterval(() => {
      setSecondsLeft((remaining) => (remaining <= 1 ? 0 : remaining - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [timerEnabled, hasAnswered, phase, currentIndex]);

  // Running out locks the question as unanswered: the right answer still
  // shows, which is the point of getting one wrong.
  useEffect(() => {
    if (!timerEnabled || hasAnswered || secondsLeft > 0 || phase !== 'playing') return;
    setSelectedAnswers((previous) => ({ ...previous, [currentIndex]: -1 }));
  }, [timerEnabled, hasAnswered, secondsLeft, currentIndex, phase]);

  /* ── Small screens read at normal size ───────────────────────────────── */

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 700px)');
    const enforce = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) setTextSize('normal');
    };
    enforce(mediaQuery);
    mediaQuery.addEventListener('change', enforce);
    return () => mediaQuery.removeEventListener('change', enforce);
  }, []);

  /* ── Leaving mid-quiz asks first ──────────────────────────────────────── */

  useEffect(() => {
    if (phase !== 'playing') return;
    const onAnchorClick = (event: MouseEvent) => {
      if (finished.current) return;
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor || event.defaultPrevented) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.hasAttribute('data-skip-leave-guard')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (
        destination.pathname === current.pathname &&
        destination.search === current.search &&
        destination.hash === current.hash
      ) {
        return;
      }
      event.preventDefault();
      setPendingLeaveHref(
        destination.origin === current.origin
          ? `${destination.pathname}${destination.search}${destination.hash}`
          : destination.toString(),
      );
    };
    document.addEventListener('click', onAnchorClick, true);
    return () => document.removeEventListener('click', onAnchorClick, true);
  }, [phase]);

  const leave = () => {
    const href = pendingLeaveHref || '/quizzen';
    setPendingLeaveHref(null);
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.location.assign(href);
      return;
    }
    router.push(href);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => undefined);
      return;
    }
    document.exitFullscreen?.().catch(() => undefined);
  };

  const openPremium = () => {
    track('paywall_shown', {
      trigger: 'explanation_locked',
      surface: 'quiz_explanation',
      afterWrongAnswer: !answeredCorrectly,
    });
    // A new tab, so the quiz in progress is still here afterwards.
    window.open(`/premium?reden=explanation_locked&terug=${encodeURIComponent(`/quiz/${quiz.slug}`)}`, '_blank', 'noopener');
  };

  /* ── Render ───────────────────────────────────────────────────────────── */

  if (phase === 'checking') {
    return (
      <div className="flex flex-1 items-center justify-center py-24" aria-busy="true">
        <Spinner />
      </div>
    );
  }

  if (phase === 'passage' && passage) {
    return <PassageReader passage={passage} onContinue={() => setPhase('playing')} onBack={() => router.push('/quizzen')} />;
  }

  const allShort = question.answers.every((answer) => answer.text.trim().length <= SHORT_ANSWER);
  const anyLong = question.answers.some((answer) => answer.text.trim().length > 40);
  const questionFont = fontFamily === 'display' ? 'font-display font-semibold' : 'font-sans font-extrabold';
  const questionSize =
    textSize === 'large'
      ? 'text-[24px] leading-[31px] m:text-[32px] m:leading-[40px]'
      : question.text.length > 160
        ? 'text-[20px] leading-[27px] m:text-[24px] m:leading-[32px]'
        : 'text-[24px] leading-[31px] m:text-[28px] m:leading-[36px]';

  const answerState = (index: number): AnswerState => {
    if (!hasAnswered) return 'idle';
    if (question.answers[index].isCorrect) return 'correct';
    if (index === selected) return 'wrong';
    return 'muted';
  };

  const verdict = answeredCorrectly
    ? { label: 'Goed!', aria: 'Goed antwoord', tone: 'text-green-text', border: 'border-t-green' }
    : timedOut
      ? { label: 'Tijd om', aria: 'Tijd om', tone: 'text-coral-text', border: 'border-t-coral-strong' }
      : { label: 'Helaas', aria: 'Fout antwoord', tone: 'text-coral-text', border: 'border-t-coral-strong' };

  return (
    <div className="mx-auto flex w-full max-w-[784px] flex-col gap-5 px-4 pb-16 pt-8 m:px-8">
      {/* Stop, progress, settings */}
      <div className="flex items-center gap-3.5">
        <IconButton aria-label="Quiz stoppen" onClick={() => setPendingLeaveHref('/quizzen')}>
          <X className="size-[18px]" strokeWidth={2.6} aria-hidden="true" />
        </IconButton>
        <ProgressSegments current={currentIndex + 1} total={total} />
        <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-ink-soft" aria-hidden="true">
          {currentIndex + 1}/{total}
        </span>
        <IconButton aria-label="Quiz-instellingen" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="size-[19px]" strokeWidth={2.2} aria-hidden="true" />
        </IconButton>
      </div>

      {/* The question */}
      <section className="flex flex-col gap-3.5 rounded-[16px] border border-line bg-card p-5 m:px-7 m:pb-7 m:pt-6">
        {(kicker || inARow >= 2 || timerEnabled) && (
          <div className="flex min-h-6 items-center justify-between gap-3">
            {kicker ? (
              <Pill kicker className="h-6 px-2.5 text-lapis-edge">
                {kicker}
              </Pill>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-2">
              {inARow >= 2 && <StreakPill count={inARow} className="h-6" />}
              {timerEnabled && (
                <ProgressRing
                  value={timerSeconds > 0 ? secondsLeft / timerSeconds : 0}
                  size={36}
                  tone={secondsLeft <= 5 && !hasAnswered ? 'coral' : 'lapis'}
                  label={timedOut ? 'Tijd om' : `Nog ${secondsLeft} seconden`}
                >
                  <span className="text-[12px] tabular-nums">{timedOut ? 0 : secondsLeft}</span>
                </ProgressRing>
              )}
            </span>
          </div>
        )}
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={cn('m-0 wrap-anywhere text-ink outline-none', questionFont, questionSize)}
        >
          <span className="sr-only">
            Vraag {currentIndex + 1} van {total}:{' '}
          </span>
          {question.text}
        </h1>
      </section>

      {/* The answers */}
      <AnswerGrid className={cn(allShort && 'grid-cols-2')}>
        {question.answers.map((answer, index) => {
          const state = answerState(index);
          return (
            <AnswerButton
              key={answer._id || index}
              state={state}
              onClick={() => handleAnswer(index)}
              aria-keyshortcuts={index < 9 ? String(index + 1) : undefined}
              aria-label={
                state === 'correct'
                  ? `${answer.text}, goed antwoord`
                  : state === 'wrong'
                    ? `${answer.text}, jouw antwoord, fout`
                    : undefined
              }
              className={cn(anyLong && 'text-[18px] leading-snug', fontFamily === 'sans' && 'font-sans')}
            >
              {answer.text}
            </AnswerButton>
          );
        })}
      </AnswerGrid>

      {/* After answering: the verdict, the explanation, the way on */}
      {hasAnswered && (
        <section
          ref={feedbackRef}
          aria-label={verdict.aria}
          className={cn(
            'flex scroll-mb-4 flex-col gap-3 rounded-[16px] border border-line border-t-4 bg-card p-5 m:px-7 m:pb-6 m:pt-5',
            verdict.border,
          )}
        >
          <div className="flex items-center justify-between gap-3" aria-live="polite">
            <span className={cn('flex items-center gap-2.5 font-display text-[24px] font-semibold', verdict.tone)}>
              <ResultDisc correct={answeredCorrectly} size={36} />
              {verdict.label}
            </span>
            {answeredCorrectly && !isReplay && xpPerQuestion > 0 && (
              <Pill tone="gold" icon={<BoltSolidIcon size={14} />} className="h-[27px] px-[11px] text-[13px]">
                +{xpPerQuestion} XP
              </Pill>
            )}
          </div>

          {showExplanation && question.hasExplanation && (
            viewer.hasPremium ? (
              <p className={cn('m-0 max-w-[62ch] text-base font-semibold leading-6 text-ink-body', fontFamily === 'sans' && 'font-sans')}>
                {question.explanation}
              </p>
            ) : (
              <PremiumLock
                lines={2}
                onPremiumClick={openPremium}
                description="Lees bij elk antwoord waarom het klopt, met Premium."
              />
            )
          )}

          <div className="mt-1 flex flex-col items-start gap-4 m:flex-row m:items-center m:justify-between">
            {reference ? (
              <button
                type="button"
                onClick={verse.toggle}
                aria-expanded={verse.open}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-lapis-tint px-3 text-sm font-extrabold text-lapis hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
              >
                {verse.loading ? (
                  <Loader2 className="size-[15px] animate-spin" aria-hidden="true" />
                ) : (
                  <BookOpen className="size-[15px]" strokeWidth={2.4} aria-hidden="true" />
                )}
                {verse.open ? `Verberg ${reference}` : `Lees ${reference}`}
              </button>
            ) : (
              <span />
            )}
            <Button
              ref={nextButtonRef}
              size="xl"
              onClick={handleNext}
              loading={isFinishing}
              className="w-full m:w-auto m:min-w-[240px]"
            >
              {isFinishing ? 'Opslaan...' : isLast ? 'Quiz afronden' : 'Volgende vraag'}
            </Button>
          </div>

          {finishError && (
            <p role="alert" className="m-0 text-sm font-bold text-coral-text">
              Je score kon niet worden opgeslagen. Controleer je verbinding en probeer het opnieuw.
            </p>
          )}

          {reference && verse.open && (
            <div className="flex flex-col gap-2 rounded-[12px] border border-line-soft bg-chip px-4 py-3">
              {verse.result ? (
                <>
                  <p className="m-0 text-[15px] font-semibold italic leading-[22px] text-ink">
                    &ldquo;{verse.result.text}&rdquo;
                  </p>
                  <p className="m-0 text-[13px] font-semibold text-ink-muted">{verse.result.reference} - Statenvertaling</p>
                </>
              ) : (
                <p className="m-0 text-[13px] font-semibold text-ink-muted">De tekst kon niet worden opgehaald.</p>
              )}
              {/* The handover to BijbelStudie: the whole chapter, in its own tab
                  so the quiz is still here afterwards. */}
              {questionPassage && (
                <StudieLink
                  passage={questionPassage}
                  surface="explanation"
                  quizSlug={quiz.slug}
                  label={`Lees ${questionPassage.book} ${questionPassage.chapter} met uitleg op BijbelStudie`}
                  className="text-[14px] font-bold no-underline"
                />
              )}
            </div>
          )}
        </section>
      )}

      <Modal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="Quiz-instellingen"
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>
            Sluiten
          </Button>
        }
      >
        <div className="flex flex-col divide-y divide-line-soft">
          <SettingRow label="Tekstgrootte" className="hidden m:flex">
            <Segmented
              value={textSize}
              options={[
                { value: 'normal', label: 'Normaal' },
                { value: 'large', label: 'Groot' },
              ]}
              onChange={(value) => {
                setTextSize(value);
                persistSetting({ questionFontSize: value });
              }}
            />
          </SettingRow>
          {/* Off first: somebody opening this while a clock runs usually wants it gone. */}
          <SettingRow label="Tijd per vraag">
            <Segmented
              value={timerSeconds as QuestionTimerSeconds}
              options={QUESTION_TIMER_CHOICES.map((choice) => ({ value: choice, label: choice === 0 ? 'Uit' : `${choice}s` }))}
              onChange={(value) => {
                setTimerSeconds(value);
                setSecondsLeft(value);
                persistSetting({ questionTimerSeconds: value });
              }}
            />
          </SettingRow>
          <SettingRow label="Bijbelverwijzingen">
            <Segmented
              value={showBibleReferences}
              options={[
                { value: true, label: 'Aan' },
                { value: false, label: 'Uit' },
              ]}
              onChange={(value) => {
                setShowBibleReferences(value);
                persistSetting({ showBibleReferences: value });
              }}
            />
          </SettingRow>
          <SettingRow label="Lettertype">
            <Segmented
              value={fontFamily}
              options={[
                { value: 'display', label: 'Rond' },
                { value: 'sans', label: 'Strak' },
              ]}
              onChange={setFontFamily}
            />
          </SettingRow>
          <SettingRow label="Toon uitleg">
            <Segmented
              value={showExplanation}
              options={[
                { value: true, label: 'Aan' },
                { value: false, label: 'Uit' },
              ]}
              onChange={setShowExplanation}
            />
          </SettingRow>
          <SettingRow label="Volledig scherm">
            <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
              Aan/uit
            </Button>
          </SettingRow>
        </div>
      </Modal>

      <Modal
        open={pendingLeaveHref !== null}
        onOpenChange={(open) => {
          if (!open) setPendingLeaveHref(null);
        }}
        title="Quiz verlaten?"
        size="sm"
        description={
          <>
            Weet je zeker dat je wilt stoppen? Je kunt tot <span className="font-extrabold text-ink">{quiz.rewardXp} XP</span>{' '}
            mislopen. Als je nu weggaat, wordt je voortgang niet opgeslagen.
          </>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingLeaveHref(null)}>
              Blijven
            </Button>
            <Button variant="danger" onClick={leave}>
              Quiz verlaten
            </Button>
          </>
        }
      />
    </div>
  );
}

function SettingRow({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0', className)}>
      <span className="text-[15px] font-bold text-ink">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string | number | boolean>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-[12px] bg-chip p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 min-w-11 rounded-[9px] px-2.5 text-sm font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lapis',
              active ? 'bg-card text-ink shadow-card' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
