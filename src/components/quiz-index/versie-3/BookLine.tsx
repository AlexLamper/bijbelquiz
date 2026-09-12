'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import {
  bestScore,
  difficultyLabel,
  difficultyText,
  isPlayed,
  partLabel,
  quizHref,
  type BookEntry,
  type Quiz,
} from './contents-model';

/**
 * One line of the contents page: the book in the display serif, a dotted
 * leader, the chapter numbers 1..N, and the quiz count on the right. Books
 * without quizzes keep every number, muted, so the canon reads whole.
 */
export function BookLine({
  entry,
  dimmed,
  markedChapters,
}: {
  entry: BookEntry;
  /** True while a search matches other books: the line recedes but stays legible. */
  dimmed: boolean;
  /** Chapter numbers a "Lucas 15" query points at. */
  markedChapters: Set<string>;
}) {
  const { book, byChapter, unplaced } = entry;
  const chapters = Array.from({ length: book.chapters }, (_, index) => index + 1);
  const count = book.quizCount;

  return (
    <li
      className={cn(
        'grid gap-x-3 gap-y-1 border-b border-rule py-2 transition-opacity duration-300 sm:grid-cols-[8.75rem_minmax(0,1fr)_auto]',
        dimmed && 'opacity-30'
      )}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <span
          className={cn(
            'shrink-0 font-display text-[15px] font-normal leading-6 tracking-[-0.02em]',
            count > 0 ? 'text-ink' : 'text-ink-muted'
          )}
        >
          {book.title}
        </span>
        <span
          aria-hidden
          className="mb-[5px] h-0 min-w-3 flex-1 border-b border-dotted border-rule-strong"
        />
        <span className="shrink-0 text-[11px] leading-6 text-ink-muted tabular-nums sm:hidden">
          {count > 0 ? `${count} ${count === 1 ? 'quiz' : 'quizzen'}` : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-0.5 gap-y-0.5">
        {chapters.map((chapter) => (
          <ChapterNumber
            key={chapter}
            chapter={chapter}
            quizzes={byChapter.get(chapter) ?? []}
            marked={markedChapters.has(`${book.code}:${chapter}`)}
          />
        ))}
        {unplaced.map((quiz) => (
          <Link
            key={quiz._id}
            href={quizHref(quiz)}
            title={quiz.title}
            className="inline-flex h-6 items-center px-1 text-[12px] text-ink underline decoration-lapis underline-offset-[3px] transition-colors hover:text-lapis"
          >
            {partLabel(quiz)}
          </Link>
        ))}
      </div>

      <span className="hidden text-right text-[11px] leading-6 text-ink-muted tabular-nums sm:block sm:min-w-[4.5rem]">
        {count > 0 ? `${count} ${count === 1 ? 'quiz' : 'quizzen'}` : ''}
      </span>
    </li>
  );
}

const NUMBER_BASE =
  'inline-flex h-6 min-w-[1.6rem] items-center justify-center px-0.5 text-[12px] leading-none tabular-nums';

/**
 * A chapter number. No quiz: muted text. One quiz: a link in ink with a lapis
 * underline. Several: a button with a superscript count that opens a flyout.
 */
function ChapterNumber({
  chapter,
  quizzes,
  marked,
}: {
  chapter: number;
  quizzes: Quiz[];
  marked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const wrapper = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (quizzes.length === 0) {
    return (
      <span className={cn(NUMBER_BASE, 'text-ink-muted/70')} aria-label={`Hoofdstuk ${chapter}, nog geen quiz`}>
        {chapter}
      </span>
    );
  }

  const played = quizzes.some(isPlayed);
  const best = quizzes.map(bestScore).filter(Boolean);
  const title = played
    ? `Gespeeld, beste score ${best.join(', ')}`
    : quizzes.length === 1
      ? quizzes[0].title
      : `${quizzes.length} quizzen over hoofdstuk ${chapter}`;

  const tone = cn(
    'underline underline-offset-[3px] transition-colors',
    played ? 'text-positive decoration-positive/70 hover:text-lapis' : 'text-ink decoration-lapis hover:text-lapis',
    marked && 'rounded-md text-lapis ring-1 ring-lapis'
  );

  if (quizzes.length === 1) {
    return (
      <Link href={quizHref(quizzes[0])} title={title} className={cn(NUMBER_BASE, tone)}>
        {chapter}
      </Link>
    );
  }

  const toggle = () => {
    if (!open && wrapper.current) {
      const rect = wrapper.current.getBoundingClientRect();
      setAlignRight(window.innerWidth - rect.left < 260);
    }
    setOpen((current) => !current);
  };

  return (
    <span ref={wrapper} className="relative">
      <button
        type="button"
        onClick={toggle}
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(NUMBER_BASE, tone, open && 'text-lapis')}
      >
        {chapter}
        <sup className="ml-px text-[8px] leading-none text-ink-muted">{quizzes.length}</sup>
      </button>

      {open && (
        <ul
          role="menu"
          className={cn(
            'absolute top-full z-30 mt-1 w-60 rounded-md border border-rule-strong bg-paper-raised py-1',
            alignRight ? 'right-0' : 'left-0'
          )}
        >
          {quizzes.map((quiz) => {
            const score = bestScore(quiz);
            return (
              <li key={quiz._id} role="none">
                <Link
                  role="menuitem"
                  href={quizHref(quiz)}
                  className="flex items-baseline gap-2 px-3 py-1.5 text-[12px] text-ink transition-colors hover:bg-paper-sunken hover:text-lapis"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {partLabel(quiz)}
                    <span className="text-ink-muted"> - </span>
                    <span className={difficultyText(quiz)}>{difficultyLabel(quiz)}</span>
                    <span className="text-ink-muted"> - </span>
                    <span className="text-ink-muted tabular-nums">{quiz.questionCount} vragen</span>
                  </span>
                  {score && <span className="shrink-0 text-[11px] text-positive tabular-nums">{score}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}
