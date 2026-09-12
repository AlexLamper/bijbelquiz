'use client';

import { useMemo } from 'react';

import QuizCard from '@/components/QuizCard';
import { Eyebrow } from '@/components/editorial';
import type { QuizIndexQuiz } from '@/lib/quiz-index-data';
import { nextInLastSeries, pickFeatured } from './library';

interface FeaturedPaneProps {
  quizzes: QuizIndexQuiz[];
  isSignedIn: boolean;
  bookCount: number;
}

/**
 * The opening view. A signed-in reader is handed the next part of what they
 * were doing; everyone gets a handful of doors into the library and a nudge
 * towards the rail, which is where the real map is.
 */
export function FeaturedPane({ quizzes, isSignedIn, bookCount }: FeaturedPaneProps) {
  const resume = useMemo(() => (isSignedIn ? nextInLastSeries(quizzes) : null), [quizzes, isSignedIn]);
  const tiles = useMemo(
    () => pickFeatured(quizzes, resume ? [resume.next._id] : []),
    [quizzes, resume]
  );

  return (
    <div>
      <header className="border-b border-rule pb-6">
        <Eyebrow>Uitgelicht</Eyebrow>
        <h1 className="mt-5 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.02em] text-ink sm:text-[40px]">
          {isSignedIn ? 'Waar was je gebleven?' : 'Kies een boek, kies een hoofdstuk'}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
          {isSignedIn
            ? `De bibliotheek loopt langs ${bookCount} bijbelboeken. Kies er een in de lijst om alle quizzen per hoofdstuk te zien.`
            : `Kies een bijbelboek in de lijst en je ziet alle quizzen over dat boek, hoofdstuk voor hoofdstuk. Of zoek direct op "Lucas 15".`}
        </p>
      </header>

      {resume && (
        <section className="border-b border-rule py-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="font-display text-xl font-normal tracking-[-0.015em] text-ink">Verder gaan</h2>
            <p className="text-xs text-ink-muted">
              Je speelde laatst <span className="text-ink">{resume.last.title}</span>
            </p>
          </div>
          <div className="mt-5 grid gap-x-8 sm:grid-cols-2">
            <QuizCard quiz={resume.next} />
          </div>
        </section>
      )}

      <section className="py-8">
        <h2 className="font-display text-xl font-normal tracking-[-0.015em] text-ink">Om mee te beginnen</h2>
        <div className="mt-5 grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((quiz) => (
            <QuizCard key={quiz._id} quiz={quiz} />
          ))}
        </div>
      </section>
    </div>
  );
}
