"use client";

import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoomPassageSnapshot } from '@/lib/multiplayer/types';

interface ChapterVerse {
  verse: number;
  text: string;
}

interface MultiplayerReadingViewProps {
  passage: RoomPassageSnapshot | null;
  isHost: boolean;
  /** Host advances the room out of the reading phase into question 1. */
  onStart: () => void;
  isStarting: boolean;
  onLeave: () => void;
  isLeaving: boolean;
}

/**
 * The chapter every device shows between "start" and the first question when
 * the host turned on "lees eerst het bijbelhoofdstuk". Fetches the same
 * `/api/bible/chapter` endpoint the single-player reader uses; the host holds
 * the room here until they press "Start de vragen".
 */
export default function MultiplayerReadingView({
  passage,
  isHost,
  onStart,
  isStarting,
  onLeave,
  isLeaving,
}: MultiplayerReadingViewProps) {
  const [verses, setVerses] = useState<ChapterVerse[] | null>(null);
  const [failed, setFailed] = useState(false);

  const book = passage?.book ?? null;
  const chapter = passage?.chapter ?? null;

  useEffect(() => {
    if (!book || chapter == null) return;

    let cancelled = false;
    setVerses(null);
    setFailed(false);

    async function load() {
      try {
        const response = await fetch(
          `/api/bible/chapter?book=${encodeURIComponent(book as string)}&chapter=${chapter}`,
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

    void load();
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  return (
    <Card className="border-rule bg-paper">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl font-normal">
          <BookOpen className="h-5 w-5 text-lapis dark:text-lapis" aria-hidden />
          {passage ? passage.label : 'Lees eerst het hoofdstuk'}
        </CardTitle>
        <CardDescription>
          Lees dit hoofdstuk rustig door. De vragen die hierna komen gaan hierover.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {failed && (
          <p className="rounded-md border border-rule bg-paper-sunken px-4 py-3 text-sm text-ink-soft">
            Dit hoofdstuk kon nu niet geladen worden. Je kunt gewoon met de vragen beginnen.
          </p>
        )}

        {!failed && !verses && (
          <div className="space-y-3" aria-hidden>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse rounded bg-paper-sunken" />
            ))}
          </div>
        )}

        {verses && (
          <div className="max-h-[58vh] overflow-y-auto rounded-md border border-rule bg-paper-raised p-4">
            <div className="space-y-4">
              {verses.map((verse) => (
                <p key={verse.verse} className="flex gap-4">
                  <span className="w-6 shrink-0 pt-1 text-right text-[11px] tabular-nums text-ink-muted">
                    {verse.verse}
                  </span>
                  <span className="font-serif text-[16px] leading-[1.7] text-ink">{verse.text}</span>
                </p>
              ))}
              <p className="border-t border-rule pt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Statenvertaling
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isHost ? (
            <Button onClick={onStart} disabled={isStarting} className="dark:text-ink-inverted">
              {isStarting ? (
                'Bezig...'
              ) : (
                <>
                  Start de vragen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Wacht tot de host de vragen start.</p>
          )}

          <Button variant="outline" onClick={onLeave} disabled={isLeaving}>
            {isLeaving ? 'Spel verlaten...' : 'Spel verlaten'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
