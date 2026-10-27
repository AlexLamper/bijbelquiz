'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button, Pill, Skeleton } from '@/components/bq';
import type { QuizPassage } from '@/lib/quiz-passage';

interface ChapterVerse {
  verse: number;
  text: string;
}

interface PassageReaderProps {
  passage: QuizPassage;
  /** The reader is done and wants to start answering. */
  onContinue: () => void;
  onBack: () => void;
}

/**
 * The chapter a quiz is about, read before the first question - for players
 * who turned on "lees eerst het hoofdstuk" in their settings. A white card in
 * the player column, verse numbers in the margin, and the start button always
 * in reach at the bottom.
 */
export default function PassageReader({ passage, onContinue, onBack }: PassageReaderProps) {
  const [verses, setVerses] = useState<ChapterVerse[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/bible/chapter?book=${encodeURIComponent(passage.book)}&chapter=${passage.chapter}`,
        );
        if (!response.ok) throw new Error('chapter request failed');
        const payload = (await response.json()) as { verses?: ChapterVerse[] };
        if (cancelled) return;
        if (!payload.verses?.length) setFailed(true);
        else setVerses(payload.verses);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [passage.book, passage.chapter]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[784px] flex-col gap-5 px-4 pb-32 pt-8 m:px-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 items-center gap-2 self-start text-[15px] font-bold text-lapis hover:text-lapis-edge"
      >
        <ArrowLeft className="size-4" strokeWidth={2.4} aria-hidden="true" />
        Terug naar de quizzen
      </button>

      <section className="flex flex-col gap-4 rounded-[16px] border border-line bg-card p-5 m:px-7 m:py-6">
        <Pill kicker className="h-6 self-start px-2.5 text-lapis-edge">
          Lees eerst
        </Pill>
        <h1 className="m-0 font-display text-[30px] font-semibold leading-9 m:text-[36px] m:leading-[44px]">{passage.label}</h1>
        <p className="m-0 text-base font-semibold leading-6 text-ink-soft">
          Neem dit hoofdstuk rustig door. De vragen die hierna komen gaan hierover, dus lezen helpt echt.
        </p>

        {failed && (
          <p className="m-0 rounded-[12px] bg-chip px-4 py-3 text-[15px] font-semibold text-ink-soft">
            Dit hoofdstuk kon nu niet geladen worden. Je kunt gewoon met de quiz beginnen.
          </p>
        )}

        {!failed && !verses && (
          <div className="flex flex-col gap-3" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        )}

        {verses && (
          <div className="flex flex-col gap-3 border-t border-line-soft pt-4">
            {verses.map((verse) => (
              <p key={verse.verse} className="m-0 flex gap-3">
                <span className="w-6 shrink-0 pt-1 text-right text-xs font-extrabold tabular-nums text-ink-faint">{verse.verse}</span>
                <span className="text-[17px] font-semibold leading-7 text-ink">{verse.text}</span>
              </p>
            ))}
            <p className="m-0 border-t border-line-soft pt-3 text-[13px] font-bold text-ink-muted">Statenvertaling</p>
          </div>
        )}
      </section>

      {/* The chapter can be long; the way on is never something to scroll to. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card">
        <div className="mx-auto flex w-full max-w-[784px] items-center justify-between gap-3 px-4 py-3 m:px-8">
          <span className="hidden text-[15px] font-bold text-ink-muted m:inline">Klaar met lezen?</span>
          <Button size="xl" onClick={onContinue} className="w-full m:w-auto m:min-w-[240px]">
            Start de quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
