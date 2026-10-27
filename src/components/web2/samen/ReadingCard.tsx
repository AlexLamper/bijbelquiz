'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';

import { Button, Skeleton } from '@/components/bq';
import type { RoomPassageSnapshot } from '@/lib/multiplayer/types';

interface ChapterVerse {
  verse: number;
  text: string;
}

interface ReadingCardProps {
  passage: RoomPassageSnapshot | null;
  isHost: boolean;
  /** Host moves the room from reading to question 1. */
  onStart: () => void;
  isStarting: boolean;
}

/**
 * The chapter every device shows between "start" and the first question when
 * the host turned on "Lees eerst het bijbelhoofdstuk". Same
 * `/api/bible/chapter` endpoint the single-player reader uses; the host holds
 * the room here until they press "Start de vragen".
 */
export function ReadingCard({ passage, isHost, onStart, isStarting }: ReadingCardProps) {
  const [verses, setVerses] = useState<ChapterVerse[] | null>(null);
  const [failed, setFailed] = useState(false);

  const book = passage?.book ?? null;
  const chapter = passage?.chapter ?? null;

  useEffect(() => {
    if (!book || chapter == null) return;
    let cancelled = false;

    async function load() {
      setVerses(null);
      setFailed(false);
      try {
        const response = await fetch(`/api/bible/chapter?book=${encodeURIComponent(book as string)}&chapter=${chapter}`);
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

    void load();
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  return (
    <section aria-labelledby="lezen-titel" className="flex flex-col gap-4 rounded-[16px] border border-line bg-card p-6 shadow-card m:px-7">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-green-tint text-green" aria-hidden="true">
          <BookOpen className="size-[22px]" strokeWidth={2.2} />
        </span>
        <span className="flex min-w-0 flex-col">
          <h1 id="lezen-titel" className="m-0 text-[26px] leading-8">
            {passage ? passage.label : 'Lees eerst het hoofdstuk'}
          </h1>
          <span className="text-[15px] font-semibold text-ink-muted">Lees rustig door. De vragen gaan hierover.</span>
        </span>
      </div>

      {failed && (
        <p className="m-0 rounded-[12px] border border-line bg-chip px-4 py-3 text-[15px] font-semibold text-ink-soft">
          Dit hoofdstuk kon nu niet geladen worden. Je kunt gewoon met de vragen beginnen.
        </p>
      )}

      {!failed && !verses && passage && (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      )}

      {verses && (
        <div className="max-h-[58vh] overflow-y-auto rounded-[12px] border border-line-soft px-4 py-4" tabIndex={0} aria-label="Bijbeltekst">
          <div className="flex flex-col gap-3.5">
            {verses.map((verse) => (
              <p key={verse.verse} className="m-0 flex gap-3.5">
                <span className="w-6 shrink-0 pt-0.5 text-right text-xs font-extrabold tabular-nums text-ink-faint">{verse.verse}</span>
                <span className="text-[17px] font-semibold leading-[28px] text-ink-body">{verse.text}</span>
              </p>
            ))}
            <p className="m-0 border-t border-line-soft pt-3.5 text-xs font-extrabold uppercase tracking-[0.04em] text-ink-muted">
              Statenvertaling
            </p>
          </div>
        </div>
      )}

      {isHost ? (
        <Button size="xl" block onClick={onStart} loading={isStarting}>
          {isStarting ? 'Bezig...' : 'Start de vragen'}
          {!isStarting && <ArrowRight className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />}
        </Button>
      ) : (
        <p role="status" className="m-0 text-[15px] font-semibold text-ink-muted">
          Wacht tot de host de vragen start.
        </p>
      )}
    </section>
  );
}
