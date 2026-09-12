'use client';

import Link from 'next/link';

import { cn } from '@/lib/utils';
import { EmptyState, Eyebrow } from '@/components/editorial';
import { BOOK_GROUPS } from '@/lib/bible-books';
import type { QuizIndexBook, QuizIndexQuiz } from '@/lib/quiz-index-data';
import { QuizRow } from './QuizRow';
import { isPlayed, pluralQuizzen } from './library';

interface BookPaneProps {
  book: QuizIndexBook;
  /** The book's quizzes in timeline order. */
  quizzes: QuizIndexQuiz[];
  isSignedIn: boolean;
}

function rowId(book: string, chapter: number) {
  return `hfst-${book}-${chapter}`;
}

/**
 * One book: title, a lead with the numbers, the chapter strip, then every quiz
 * of the book down the page in chapter order.
 */
export function BookPane({ book, quizzes, isSignedIn }: BookPaneProps) {
  const covered = new Set(book.chaptersCovered);
  const playedCount = quizzes.filter(isPlayed).length;
  const group = BOOK_GROUPS.find((entry) => entry.id === book.group);

  // The first quiz whose span includes a chapter is where that chapter's
  // square scrolls to. Rows carry an id only for the chapters they open.
  const anchorFor = new Map<number, string>();
  const idForQuiz = new Map<string, string>();
  for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
    if (!covered.has(chapter)) continue;
    const first = quizzes.find(
      (quiz) => quiz.chapterFrom !== null && quiz.chapterTo !== null && quiz.chapterFrom <= chapter && quiz.chapterTo >= chapter
    );
    if (!first) continue;
    const id = idForQuiz.get(first._id) ?? rowId(book.code, chapter);
    idForQuiz.set(first._id, id);
    anchorFor.set(chapter, id);
  }

  const lead =
    book.quizCount === 0
      ? `${book.chapters} ${book.chapters === 1 ? 'hoofdstuk' : 'hoofdstukken'}, nog geen quizzen`
      : `${pluralQuizzen(book.quizCount)} over ${book.chaptersCovered.length}${
          book.chaptersCovered.length === book.chapters ? '' : ` van de ${book.chapters}`
        } hoofdstukken`;

  const scrollTo = (chapter: number) => {
    const id = anchorFor.get(chapter);
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      <header className="border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Eyebrow>{book.testament === 'OT' ? 'Oude Testament' : 'Nieuwe Testament'}{group ? ` / ${group.label}` : ''}</Eyebrow>
          {isSignedIn && book.quizCount > 0 && (
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted tabular-nums">
              {playedCount} van {book.quizCount} gespeeld
            </span>
          )}
        </div>
        <h1 className="mt-5 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.02em] text-ink sm:text-[40px]">
          {book.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted tabular-nums">{lead}</p>
      </header>

      {book.quizCount > 0 && (
        <div className="border-b border-rule py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">Hoofdstukken</p>
          <ol className="mt-3 flex flex-wrap gap-1" aria-label="Spring naar hoofdstuk">
            {Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => {
              const has = covered.has(chapter);
              return (
                <li key={chapter}>
                  <button
                    type="button"
                    disabled={!has}
                    onClick={() => scrollTo(chapter)}
                    aria-label={has ? `Naar hoofdstuk ${chapter}` : `Hoofdstuk ${chapter}, geen quiz`}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md border-b-2 text-xs tabular-nums transition-colors',
                      has
                        ? 'border-lapis text-ink hover:bg-paper-sunken'
                        : 'cursor-default border-transparent text-ink-muted/60'
                    )}
                  >
                    {chapter}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {quizzes.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={`Nog geen quizzen over ${book.title}`}
          description="Dit boek staat nog niet in de bibliotheek. Kies een boek met een aantal erachter, of zoek op een titel."
          action={
            isSignedIn ? (
              <Link href="/quizzen/aanmaken" className="text-sm font-medium text-ink-soft underline decoration-lapis underline-offset-4 hover:text-ink">
                Zelf een quiz over {book.title} maken
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ol className="scroll-smooth-region">
          {quizzes.map((quiz) => (
            <QuizRow key={quiz._id} quiz={quiz} mark="chapter" id={idForQuiz.get(quiz._id)} />
          ))}
        </ol>
      )}
    </div>
  );
}
