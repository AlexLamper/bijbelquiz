'use client';

import { EmptyState, Eyebrow } from '@/components/editorial';
import type { QuizIndexQuiz } from '@/lib/quiz-index-data';
import { QuizRow } from './QuizRow';
import { isPlayed, pluralQuizzen } from './library';

interface ThemesPaneProps {
  quizzes: QuizIndexQuiz[];
  isSignedIn: boolean;
}

/** Quizzes that cut across the canon - a theme, a season, a person - as one list. */
export function ThemesPane({ quizzes, isSignedIn }: ThemesPaneProps) {
  const sorted = [...quizzes].sort((a, b) => a.title.localeCompare(b.title, 'nl'));
  const playedCount = quizzes.filter(isPlayed).length;

  return (
    <div>
      <header className="border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Eyebrow>Overig</Eyebrow>
          {isSignedIn && quizzes.length > 0 && (
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
              {playedCount} van {quizzes.length} gespeeld
            </span>
          )}
        </div>
        <h1 className="mt-5 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.02em] text-ink sm:text-[40px]">
          Thema&apos;s
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted tabular-nums">
          {pluralQuizzen(quizzes.length)} dwars door de Bijbel heen
        </p>
      </header>

      {sorted.length === 0 ? (
        <EmptyState className="mt-8" title="Nog geen themaquizzen" />
      ) : (
        <ol>
          {sorted.map((quiz) => (
            <QuizRow key={quiz._id} quiz={quiz} mark="reference" />
          ))}
        </ol>
      )}
    </div>
  );
}
