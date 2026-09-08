'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Crown, Lock, X } from 'lucide-react';

import BibleVerseDisplay from '@/components/BibleVerseDisplay';
import type { QuizReviewQuestion } from '@/lib/quiz-review';

export interface RevealedExplanation {
  /** Index of the question in the quiz. */
  index: number;
  explanation: string;
  bibleReference: string | null;
}

interface QuizFreeReviewSectionProps {
  questions: QuizReviewQuestion[];
  /** The one explanation this free player has already chosen to see, if any. */
  reveal: RevealedExplanation | null;
  /** Index currently being fetched, so the pressed button can say so. */
  revealPending: number | null;
  revealError: string | null;
  onReveal: (index: number) => void;
  /** Paywall link carrying the `review_locked` trigger and the way back. */
  paywallHref: string;
}

/**
 * The post-quiz review for a free player.
 *
 * Which questions went wrong and what the right answer was is free: a quiz
 * that refuses to tell you the answer is frustrating, not tempting. What is
 * held back is the *why* - the explanation per question - except for the one
 * "onthulling" a free player may spend per quiz. That single, deliberate
 * choice is the wall: it shows exactly what Premium is, on the question the
 * player most wants it for.
 */
export default function QuizFreeReviewSection({
  questions,
  reveal,
  revealPending,
  revealError,
  onReveal,
  paywallHref,
}: QuizFreeReviewSectionProps) {
  const incorrect = questions.filter((question) => !question.isCorrect).length;
  const total = questions.length;

  return (
    <section aria-labelledby="free-review-heading">
      <p className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        <span aria-hidden className="h-px w-6 bg-lapis" />
        Jouw antwoorden
      </p>

      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h2 id="free-review-heading" className="font-display text-2xl font-normal leading-snug text-ink">
            {incorrect === 0
              ? 'Alles goed, en toch valt er te lezen'
              : incorrect === 1
                ? 'Eén vraag ging mis'
                : `${incorrect} van de ${total} gingen mis`}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Bij elke vraag hoort een uitleg en een bijbelverwijzing.{' '}
            {reveal
              ? `Je gratis onthulling zit bij vraag ${reveal.index + 1}. Met Premium lees je ze allemaal, ook na afloop.`
              : 'Kies hieronder één vraag om gratis te onthullen. Met Premium lees je ze allemaal, ook na afloop.'}
          </p>
        </div>

        <Link
          href={paywallHref}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
        >
          <Crown className="h-4 w-4" />
          Bekijk Premium
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {revealError && <p className="mt-4 text-sm text-vermilion">{revealError}</p>}

      <ol className="mt-7 border-t border-rule">
        {questions.map((question, index) => {
          const isRevealed = reveal?.index === index;
          const canReveal = reveal === null;

          return (
            <li key={question.questionId} className="border-b border-rule py-5">
              <div className="flex items-start gap-4">
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border text-[11px] font-medium ${
                    question.isCorrect
                      ? 'border-positive bg-positive text-ink-inverted'
                      : 'border-vermilion bg-vermilion text-ink-inverted'
                  }`}
                  aria-label={question.isCorrect ? 'Goed' : 'Fout'}
                >
                  {question.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                    Vraag {index + 1}
                  </p>
                  <p className="mt-1 font-display text-lg leading-snug text-ink">{question.questionText}</p>

                  <dl className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                        Jouw antwoord
                      </dt>
                      <dd className={`mt-0.5 ${question.isCorrect ? 'text-ink' : 'text-vermilion'}`}>
                        {question.selectedAnswerText ?? 'Geen antwoord'}
                      </dd>
                    </div>
                    {!question.isCorrect && (
                      <div>
                        <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                          Juiste antwoord
                        </dt>
                        <dd className="mt-0.5 text-positive">{question.correctAnswerText}</dd>
                      </div>
                    )}
                  </dl>

                  {/* The explanation slot: revealed, still available, or Premium. */}
                  {isRevealed && reveal ? (
                    <div className="mt-4 rounded-md border border-rule bg-paper-sunken p-4">
                      <p className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                        <BookOpen className="h-3.5 w-3.5 text-lapis" />
                        Uitleg
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{reveal.explanation}</p>
                      {reveal.bibleReference && <BibleVerseDisplay reference={reveal.bibleReference} />}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-xs text-ink-muted">
                        {canReveal ? (
                          <BookOpen className="h-3.5 w-3.5 text-lapis" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" />
                        )}
                        {question.bibleReference ? (
                          <span>
                            {question.bibleReference}
                            <span className="text-rule-strong"> · </span>
                            {canReveal ? 'uitleg beschikbaar' : 'uitleg is Premium'}
                          </span>
                        ) : (
                          <span>{canReveal ? 'Uitleg beschikbaar' : 'Uitleg is Premium'}</span>
                        )}
                      </p>

                      {canReveal ? (
                        <button
                          type="button"
                          data-analytics-id="quiz.reveal-explanation"
                          disabled={revealPending !== null}
                          onClick={() => onReveal(index)}
                          className="inline-flex h-8 items-center rounded-md border border-lapis/45 px-3 text-xs font-medium text-lapis transition-colors hover:bg-lapis-tint disabled:opacity-60"
                        >
                          {revealPending === index ? 'Ophalen...' : 'Onthul de uitleg'}
                        </button>
                      ) : (
                        <Link
                          href={paywallHref}
                          className="text-xs font-medium text-lapis underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-lapis"
                        >
                          Lees alle uitleg
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
