'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

import type { QuizPassage } from '@/lib/quiz-passage';

interface ChapterVerse {
  verse: number;
  text: string;
}

interface QuizPassageReaderProps {
  passage: QuizPassage;
  /** Called when the reader is done and wants to start answering. */
  onContinue: () => void;
  onBack: () => void;
}

/**
 * The chapter a quiz is about, read before the first question.
 *
 * This is the whole point of the "lees eerst" option: answering about Daniël 2
 * having just read Daniël 2 turns a memory test into a reading exercise, which
 * is what most people actually came here to do. The text is set as a single
 * column of verses with the numbers in the margin - a Bible page, not a list.
 */
export default function QuizPassageReader({ passage, onContinue, onBack }: QuizPassageReaderProps) {
  const [verses, setVerses] = useState<ChapterVerse[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/bible/chapter?book=${encodeURIComponent(passage.book)}&chapter=${passage.chapter}`
        );

        if (!response.ok) throw new Error('chapter request failed');

        const payload = (await response.json()) as { verses?: ChapterVerse[] };
        if (cancelled) return;

        if (!payload.verses?.length) {
          setFailed(true);
          return;
        }

        setVerses(payload.verses);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [passage.book, passage.chapter]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto w-full max-w-[760px] px-5 pb-32 pt-8 sm:px-8 lg:pt-10">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Terug naar het overzicht
        </button>

        <header className="mt-6 border-b border-rule pb-6">
          <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            <span aria-hidden className="h-px w-6 bg-lapis" />
            Lees eerst
          </span>

          <h1 className="mt-4 font-display text-[30px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[38px]">
            {passage.label}
          </h1>

          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            Neem dit hoofdstuk rustig door. De vragen die hierna komen gaan hierover, dus lezen
            helpt echt.
          </p>
        </header>

        {failed && (
          <p className="mt-8 rounded-lg border border-rule bg-paper-sunken px-5 py-4 text-sm text-ink-soft">
            Dit hoofdstuk kon nu niet geladen worden. Je kunt gewoon met de quiz beginnen.
          </p>
        )}

        {!failed && !verses && (
          <div className="mt-8 space-y-3" aria-hidden>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse rounded bg-paper-sunken" />
            ))}
          </div>
        )}

        {verses && (
          <div className="mt-8 space-y-4">
            {verses.map((verse) => (
              <p key={verse.verse} className="flex gap-4">
                <span className="w-6 shrink-0 pt-1 text-right text-[11px] tabular-nums text-ink-muted">
                  {verse.verse}
                </span>
                <span className="font-serif text-[17px] leading-[1.7] text-ink">{verse.text}</span>
              </p>
            ))}

            <p className="border-t border-rule pt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Statenvertaling
            </p>
          </div>
        )}
      </div>

      {/* Sticky action: the chapter can be long, and the way on should never be
          something you have to scroll to find. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper-raised/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-3 px-5 py-3.5 sm:px-8">
          <p className="hidden min-w-0 flex-1 items-center gap-2 text-xs text-ink-muted sm:flex">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Klaar met lezen?</span>
          </p>

          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft sm:w-auto"
          >
            Start de quiz
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
