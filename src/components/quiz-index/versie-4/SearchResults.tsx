'use client';

import { useState } from 'react';

import { EmptyState, quietButtonClass } from '@/components/editorial';
import type { QuizIndexQuiz } from '@/lib/quiz-index-data';
import { QuizRow } from './QuizRow';
import { pluralQuizzen, type ParsedQuery } from './library';

interface SearchResultsProps {
  query: string;
  parsed: ParsedQuery;
  results: QuizIndexQuiz[];
  onClear: () => void;
  onOpenBook: (code: string) => void;
}

const PAGE = 40;

/** What the reader typed, read back in plain words. */
function describe(parsed: ParsedQuery, query: string): string {
  if (parsed.book && parsed.chapter !== null) {
    const span = parsed.chapterTo && parsed.chapterTo !== parsed.chapter ? `${parsed.chapter}-${parsed.chapterTo}` : `${parsed.chapter}`;
    return `${parsed.book.title} ${span}`;
  }
  if (parsed.book) return parsed.book.title;
  return `"${query.trim()}"`;
}

export function SearchResults({ query, parsed, results, onClear, onOpenBook }: SearchResultsProps) {
  const [limit, setLimit] = useState(PAGE);
  const [seeded, setSeeded] = useState(query);
  if (seeded !== query) {
    setSeeded(query);
    setLimit(PAGE);
  }

  const shown = results.slice(0, limit);

  return (
    <div>
      <header className="border-b border-rule pb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Zoekresultaat</span>
          <button type="button" onClick={onClear} className="text-xs font-medium text-ink-soft underline decoration-lapis underline-offset-4 hover:text-ink">
            Wissen
          </button>
        </div>
        <h1 className="mt-5 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.02em] text-ink sm:text-[40px]">
          {describe(parsed, query)}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted tabular-nums">
          {pluralQuizzen(results.length)} gevonden
          {parsed.book && (
            <>
              {' '}
              <span aria-hidden className="text-rule-strong">/</span>{' '}
              <button type="button" onClick={() => onOpenBook(parsed.book!.code)} className="text-ink-soft underline decoration-lapis underline-offset-4 hover:text-ink">
                heel {parsed.book.title} bekijken
              </button>
            </>
          )}
        </p>
      </header>

      {results.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Niets gevonden"
          description={
            parsed.book && parsed.chapter !== null
              ? `Er is nog geen quiz over ${parsed.book.title} ${parsed.chapter}. Probeer een ander hoofdstuk of open het hele boek.`
              : 'Probeer een boek met hoofdstuk, zoals "Lucas 15", of een woord uit de titel.'
          }
        />
      ) : (
        <>
          <ol>
            {shown.map((quiz) => (
              <QuizRow key={quiz._id} quiz={quiz} mark="reference" />
            ))}
          </ol>
          {results.length > shown.length && (
            <div className="mt-8 flex justify-center">
              <button type="button" onClick={() => setLimit((value) => value + PAGE)} className={quietButtonClass}>
                Toon meer ({results.length - shown.length} resterend)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
