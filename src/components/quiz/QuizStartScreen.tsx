'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Timer, Type } from 'lucide-react';

import type { QuizPassage } from '@/lib/quiz-passage';
import {
  QUESTION_TIMER_CHOICES,
  type QuestionFontSize,
  type QuestionTimerSeconds,
} from '@/lib/user-settings';
import { useUserSettings } from '@/lib/user-settings-client';
import { cn } from '@/lib/utils';

export interface QuizStartQuiz {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  difficulty?: string;
  isPremium?: boolean;
  rewardXp?: number;
  categoryTitle?: string;
  questionCount: number;
}

export interface QuizLastResult {
  correctAnswers: number;
  totalQuestions: number;
  completedAtLabel: string;
  attempts: number;
}

interface QuizStartScreenProps {
  quiz: QuizStartQuiz;
  /** The chapter this quiz is about, when its questions agree on one. */
  passage: QuizPassage | null;
  lastResult: QuizLastResult | null;
  /**
   * Whether this reader has set up how they want to play before. Read on the
   * server so the panel renders in the right state on the first paint instead
   * of collapsing itself once the session arrives.
   */
  setupSeen: boolean;
  onStart: (choice: { readPassageFirst: boolean; timerSeconds: number }) => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Makkelijk',
  beginner: 'Makkelijk',
  medium: 'Gemiddeld',
  intermediate: 'Gemiddeld',
  hard: 'Moeilijk',
  advanced: 'Moeilijk',
};

/**
 * The screen between choosing a quiz and answering its first question.
 *
 * It is deliberately two things at once. It tells you what you are about to
 * play - and, if you already played it, how you did - and it is where you set
 * up *how* you want to play: with or without a clock, and whether to read the
 * chapter first. Those choices are saved to the account, so this screen asks
 * once rather than every time: after the first quiz the setup folds into a
 * single line that says what is currently set, and opens on request.
 */
export default function QuizStartScreen({ quiz, passage, lastResult, setupSeen, onStart }: QuizStartScreenProps) {
  const { settings, saveSettings, isAuthenticated } = useUserSettings();

  const [readPassageFirst, setReadPassageFirst] = useState(settings.readPassageFirst);
  const [timerSeconds, setTimerSeconds] = useState<QuestionTimerSeconds>(settings.questionTimerSeconds);
  const [fontSize, setFontSize] = useState<QuestionFontSize>(settings.questionFontSize);
  const [setupOpen, setSetupOpen] = useState(!setupSeen);

  // Seeded from the session, which resolves after first paint. Adopting a later
  // change during render (rather than in an effect) keeps this to one pass, and
  // comparing against what was last seeded means a choice made here is not
  // undone by the session catching up.
  const [seeded, setSeeded] = useState(settings);
  if (seeded !== settings) {
    setSeeded(settings);
    setReadPassageFirst(settings.readPassageFirst);
    setTimerSeconds(settings.questionTimerSeconds);
    setFontSize(settings.questionFontSize);
  }

  const persist = (patch: Parameters<typeof saveSettings>[0]) => {
    if (!isAuthenticated) return;
    saveSettings(patch).catch(() => {
      // Applied locally already; a failed write costs persistence, and an error
      // toast on the way into a quiz is worse than silently not remembering.
    });
  };

  // What the collapsed row has to say for itself: the settings that are on,
  // short enough to sit on one line next to the heading.
  const setupSummary = [
    timerSeconds === 0 ? 'Geen tijdslimiet' : `${timerSeconds}s per vraag`,
    fontSize === 'large' ? 'Grote tekst' : null,
    passage && readPassageFirst ? `Leest ${passage.label} eerst` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleStart = () => {
    // Marked on the way into the quiz rather than on opening the panel: what
    // matters is that the reader has been past these choices once.
    if (!setupSeen) persist({ quizSetupSeen: true });
    onStart({ readPassageFirst: Boolean(passage) && readPassageFirst, timerSeconds });
  };

  const difficultyLabel = DIFFICULTY_LABELS[(quiz.difficulty || '').toLowerCase()] || 'Gemiddeld';
  const minutes = Math.min(25, Math.max(3, Math.ceil(quiz.questionCount / 2)));
  const bestLabel = lastResult
    ? `${lastResult.correctAnswers}/${lastResult.totalQuestions}`
    : null;

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto w-full max-w-[820px] px-5 pb-10 pt-5 sm:px-8 lg:pt-7">
        <Link
          href="/quizzen"
          className="group inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Alle quizzen
        </Link>

        {/* ── What this quiz is ─────────────────────────────────────────── */}
        <header className="mt-4">
          {quiz.imageUrl && (
            <div className="relative aspect-[21/6] w-full overflow-hidden rounded-lg bg-paper-sunken ring-1 ring-rule ring-inset sm:aspect-[32/7]">
              <Image
                src={quiz.imageUrl}
                alt=""
                fill
                sizes="(max-width: 880px) 100vw, 880px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            {quiz.categoryTitle || 'Algemeen'}
            <span className="mx-2 text-rule-strong">/</span>
            {difficultyLabel}
          </p>

          <h1 className="mt-2 font-display text-[26px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[32px]">
            {quiz.title}
          </h1>

          {quiz.description && (
            <p className="mt-2.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {quiz.description}
            </p>
          )}
        </header>

        {/* ── Figures ───────────────────────────────────────────────────── */}
        <div className="mt-5 grid grid-cols-3 gap-x-6 border-y border-rule py-3.5 sm:divide-x sm:divide-rule">
          {[
            { label: 'Vragen', value: String(quiz.questionCount) },
            { label: 'Duur', value: `${minutes} min` },
            { label: 'XP', value: String(quiz.rewardXp ?? 50) },
          ].map((figure) => (
            <div key={figure.label} className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                {figure.label}
              </p>
              <p className="mt-1 font-display text-[19px] font-normal leading-none tabular-nums text-ink">
                {figure.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Already played ────────────────────────────────────────────── */}
        {lastResult && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-positive/35 bg-positive-tint px-4 py-2.5 text-sm">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
              <span
                aria-hidden
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive"
              >
                <Check className="h-3 w-3 text-ink-inverted" strokeWidth={3} />
              </span>
              Deze quiz heb je al gedaan
            </span>
            <span className="text-sm text-ink-soft">
              Beste score <span className="font-medium tabular-nums text-ink">{bestLabel}</span> ·
              laatst op {lastResult.completedAtLabel}
              {lastResult.attempts > 1 ? ` · ${lastResult.attempts} pogingen` : ''}
            </span>
          </div>
        )}

        {/* ── How you want to play ──────────────────────────────────────── */}
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setSetupOpen((open) => !open)}
            aria-expanded={setupOpen}
            aria-controls="quiz-setup-panel"
            className="group flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-1 text-left"
          >
            <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors group-hover:text-ink">
              <span aria-hidden className="h-px w-6 bg-lapis" />
              {setupOpen ? 'Hoe wil je spelen?' : 'Quiz instellingen'}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-ink-muted transition-colors group-hover:text-ink">
              <span className="truncate">{setupOpen ? 'Wordt onthouden' : setupSummary}</span>
              <ChevronDown
                aria-hidden
                className={cn('h-3.5 w-3.5 shrink-0 transition-transform', setupOpen && 'rotate-180')}
              />
            </span>
          </button>

          <div
            id="quiz-setup-panel"
            hidden={!setupOpen}
            className="mt-3 divide-y divide-rule overflow-hidden rounded-lg border border-rule"
          >
            {/* Read the chapter first - only offered when there is one. */}
            {passage && (
              <label className="flex cursor-pointer items-center gap-3.5 bg-paper-raised px-4 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paper-sunken text-ink-soft">
                  <BookOpen className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    Lees eerst {passage.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    Het hoofdstuk waar deze quiz over gaat.
                  </span>
                </span>

                <input
                  type="checkbox"
                  className="sr-only"
                  checked={readPassageFirst}
                  onChange={(event) => {
                    setReadPassageFirst(event.target.checked);
                    persist({ readPassageFirst: event.target.checked });
                  }}
                />
                <span
                  aria-hidden
                  className={cn(
                    'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
                    readPassageFirst ? 'bg-ink' : 'bg-rule-strong'
                  )}
                >
                  <span
                    className={cn(
                      'h-5 w-5 rounded-full bg-paper-raised transition-transform',
                      readPassageFirst && 'translate-x-5'
                    )}
                  />
                </span>
              </label>
            )}

            {/* Timer */}
            <div className="flex flex-wrap items-center gap-3.5 bg-paper-raised px-4 py-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paper-sunken text-ink-soft">
                <Timer className="h-4 w-4" />
              </span>

              <div className="min-w-[9rem] flex-1">
                <p className="text-sm font-medium text-ink">Tijd per vraag</p>
                <p className="mt-0.5 text-xs text-ink-muted">Standaard uit.</p>
              </div>

              <div className="flex w-full shrink-0 gap-1.5 sm:w-auto">
                {QUESTION_TIMER_CHOICES.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => {
                      setTimerSeconds(choice);
                      persist({ questionTimerSeconds: choice });
                    }}
                    className={cn(
                      'h-9 flex-1 rounded-md border px-3 text-sm font-medium transition-colors sm:flex-none',
                      timerSeconds === choice
                        ? 'border-ink bg-ink text-ink-inverted'
                        : 'border-rule bg-paper text-ink-soft hover:border-rule-strong hover:text-ink'
                    )}
                  >
                    {choice === 0 ? 'Uit' : `${choice}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Question text size */}
            <div className="flex flex-wrap items-center gap-3.5 bg-paper-raised px-4 py-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paper-sunken text-ink-soft">
                <Type className="h-4 w-4" />
              </span>

              <div className="min-w-[9rem] flex-1">
                <p className="text-sm font-medium text-ink">Tekstgrootte</p>
                <p className="mt-0.5 text-xs text-ink-muted">Grootte van de vraag.</p>
              </div>

              <div className="flex w-full shrink-0 gap-1.5 sm:w-auto">
                {(['normal', 'large'] as QuestionFontSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setFontSize(size);
                      persist({ questionFontSize: size });
                    }}
                    className={cn(
                      'h-9 flex-1 rounded-md border px-4 text-sm font-medium transition-colors sm:flex-none',
                      fontSize === size
                        ? 'border-ink bg-ink text-ink-inverted'
                        : 'border-rule bg-paper text-ink-soft hover:border-rule-strong hover:text-ink'
                    )}
                  >
                    {size === 'normal' ? 'Normaal' : 'Groot'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
          >
            {passage && readPassageFirst
              ? `Lees ${passage.label} en start`
              : lastResult
                ? 'Opnieuw spelen'
                : 'Start de quiz'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-2 text-center text-xs text-ink-muted">
            Tijdens de quiz aanpasbaar via het instellingen-icoon.
          </p>
        </section>
      </div>
    </div>
  );
}
