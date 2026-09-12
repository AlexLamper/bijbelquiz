'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { bestScoreLabel, difficultyOf, isPlayed, quizHref, type Quiz } from './shelves';

/**
 * One quiz as a dense row: chapter figure, title, a meta line, progress, arrow.
 * Built for a 36-part series to stay scannable, so the chapter number leads
 * and everything else is one line.
 */
export function QuizRow({
  quiz,
  showBook = false,
  className,
}: {
  quiz: Quiz;
  /** Outside a book's panel the row says which book it belongs to. */
  showBook?: boolean;
  className?: string;
}) {
  const difficulty = difficultyOf(quiz);
  const played = isPlayed(quiz);
  const best = bestScoreLabel(quiz);

  const chapter =
    quiz.chapterFrom === null
      ? null
      : quiz.chapterTo !== null && quiz.chapterTo !== quiz.chapterFrom
        ? `${quiz.chapterFrom}-${quiz.chapterTo}`
        : String(quiz.chapterFrom);

  const meta: string[] = [];
  if (showBook && quiz.bookTitle) meta.push(chapter ? `${quiz.bookTitle} ${chapter}` : quiz.bookTitle);
  if (quiz.part > 0) meta.push(`Deel ${quiz.part}`);
  if (!showBook && chapter) meta.push(`Hoofdstuk ${chapter}`);

  return (
    <Link
      href={quizHref(quiz)}
      className={cn(
        'group flex min-w-0 items-center gap-3 border-b border-rule py-2.5 transition-colors hover:bg-paper-sunken sm:gap-4',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'w-9 shrink-0 text-right font-display text-lg font-normal leading-none tracking-[-0.02em] tabular-nums',
          chapter ? 'text-ink' : 'text-ink-muted'
        )}
      >
        {chapter ?? (quiz.part > 0 ? quiz.part : '·')}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink transition-colors group-hover:text-lapis-strong">
          {quiz.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-ink-muted">
          {meta.map((part, index) => (
            <span key={`${part}-${index}`}>
              {index > 0 && <span className="mx-1.5 text-rule-strong">/</span>}
              {part}
            </span>
          ))}
          {meta.length > 0 && <span className="mx-1.5 text-rule-strong">/</span>}
          <span className={difficulty.className}>{difficulty.label}</span>
          <span className="mx-1.5 text-rule-strong">/</span>
          <span className="tabular-nums">
            {quiz.questionCount} {quiz.questionCount === 1 ? 'vraag' : 'vragen'}
          </span>
        </span>
      </span>

      {played && (
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-positive tabular-nums">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          {best ?? 'Afgerond'}
        </span>
      )}

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-ink" />
    </Link>
  );
}
