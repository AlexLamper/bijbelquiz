'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

import { normalizeSearchText, readSeries } from '@/lib/quiz-series';
import { cn } from '@/lib/utils';
import { questionCountLabel, quizBadge, quizDisplayTitle } from './quiz-display';

export interface PickerQuiz {
  id: string;
  title: string;
  questionCount: number;
  isPremium: boolean;
  categorySlug: string | null;
  categoryTitle: string | null;
  /** "Johannes 6" when the quiz is about one chapter. */
  passageLabel: string | null;
}

export interface PickerCategory {
  slug: string;
  title: string;
}

interface QuizPickerProps {
  quizzes: PickerQuiz[];
  categories: PickerCategory[];
  value: string;
  onChange: (quizId: string) => void;
  labelId: string;
  disabled?: boolean;
}

function metaLine(quiz: PickerQuiz): string {
  return [quiz.categoryTitle, questionCountLabel(quiz.questionCount)].filter(Boolean).join(' · ');
}

export function QuizBadge({ quiz, size = 44 }: { quiz: Pick<PickerQuiz, 'title' | 'passageLabel'>; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-[10px] bg-lapis-tint font-extrabold text-lapis"
      style={{ width: size, height: size, fontSize: size >= 44 ? 14 : 13 }}
    >
      {quizBadge(quiz.title, quiz.passageLabel)}
    </span>
  );
}

/**
 * Choosing the quiz for a room: the 68px picker button of the design, which
 * opens a search-first panel (type a book name or narrow by category) over the
 * full list of approved quizzes. The list is bounded in height so the page
 * around it never grows, and labelled by series so twenty "Handelingen"
 * quizzes read as one block.
 */
export function QuizPicker({ quizzes, categories, value, onChange, labelId, disabled = false }: QuizPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categorySlug, setCategorySlug] = useState<string>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const choiceId = useId();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selected = useMemo(() => quizzes.find((quiz) => quiz.id === value) ?? null, [quizzes, value]);

  // Only offer categories something in the list belongs to.
  const usedCategories = useMemo(() => {
    const present = new Set(quizzes.map((quiz) => quiz.categorySlug).filter((slug): slug is string => Boolean(slug)));
    return categories.filter((category) => present.has(category.slug));
  }, [categories, quizzes]);

  const results = useMemo(() => {
    const search = normalizeSearchText(query);
    return quizzes.filter((quiz) => {
      if (categorySlug !== 'all' && quiz.categorySlug !== categorySlug) return false;
      if (search.length === 0) return true;
      return (
        normalizeSearchText(quiz.title).includes(search) ||
        normalizeSearchText(quiz.passageLabel || '').includes(search) ||
        normalizeSearchText(quiz.categoryTitle || '').includes(search)
      );
    });
  }, [quizzes, query, categorySlug]);

  // The highlight returns to the top whenever the result set changes.
  const resultSignature = `${query}|${categorySlug}`;
  const [seededResults, setSeededResults] = useState(resultSignature);
  if (seededResults !== resultSignature) {
    setSeededResults(resultSignature);
    setActiveIndex(0);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const select = (quizId: string) => {
    onChange(quizId);
    setIsOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const quiz = results[activeIndex];
      if (quiz) select(quiz.id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${labelId} ${choiceId}`}
        className={cn(
          'flex min-h-[68px] w-full items-center gap-3 rounded-[12px] border border-b-[3px] border-line bg-card py-2.5 pl-3 pr-4 text-left text-ink transition-colors',
          'hover:border-input-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis disabled:opacity-50',
        )}
      >
        {selected ? <QuizBadge quiz={selected} /> : null}
        <span id={choiceId} className="flex min-w-0 flex-1 flex-col gap-px">
          {selected ? (
            <>
              <span className="text-base font-bold leading-[22px]">{quizDisplayTitle(selected.title, selected.passageLabel)}</span>
              <span className="text-sm font-semibold text-ink-muted">{metaLine(selected)}</span>
            </>
          ) : (
            <span className="text-base font-bold text-ink-muted">Kies een quiz</span>
          )}
        </span>
        <ChevronDown aria-hidden="true" className="size-[18px] shrink-0 text-ink-muted" strokeWidth={2.4} />
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 z-30 mt-2 overflow-hidden rounded-[12px] border border-line bg-card shadow-float">
          <div className="border-b border-line-soft p-3">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-ink-muted" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Zoek op titel, boek of categorie"
                aria-label="Zoek een quiz"
                aria-controls={listId}
                className="h-11 w-full rounded-[10px] border border-input-line bg-card pl-10 pr-10 text-[15px] font-semibold text-ink outline-none placeholder:text-ink-faint focus-visible:border-lapis focus-visible:ring-2 focus-visible:ring-lapis/25"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchRef.current?.focus();
                  }}
                  aria-label="Zoekterm wissen"
                  className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {usedCategories.length > 1 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Categorie">
                {[{ slug: 'all', title: 'Alle' }, ...usedCategories].map((category) => (
                  <button
                    key={category.slug}
                    type="button"
                    aria-pressed={categorySlug === category.slug}
                    onClick={() => setCategorySlug(category.slug)}
                    className={cn(
                      'h-9 whitespace-nowrap rounded-full border px-3.5 text-sm font-bold transition-colors',
                      categorySlug === category.slug
                        ? 'border-lapis bg-lapis-tint text-lapis-edge'
                        : 'border-line bg-card text-ink-soft hover:bg-chip',
                    )}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div id={listId} ref={listRef} role="listbox" aria-label="Quizzen" className="max-h-80 overflow-y-auto overscroll-contain p-1.5">
            {results.length === 0 ? (
              <p className="m-0 px-3 py-6 text-center text-sm font-semibold text-ink-muted">
                Geen quiz gevonden. Pas je zoekterm of categorie aan.
              </p>
            ) : (
              results.map((quiz, index) => {
                const previous = results[index - 1];
                const series = readSeries(quiz.title);
                const showSeriesLabel = series.part > 0 && (!previous || readSeries(previous.title).key !== series.key);
                const isSelected = quiz.id === value;

                return (
                  <div key={quiz.id}>
                    {showSeriesLabel && (
                      <p className="m-0 px-2.5 pb-1 pt-2 text-xs font-extrabold uppercase tracking-[0.04em] text-ink-muted">
                        {series.label}
                      </p>
                    )}
                    <button
                      type="button"
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(quiz.id)}
                      className={cn(
                        'flex min-h-[52px] w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors',
                        index === activeIndex ? 'bg-chip' : 'bg-transparent',
                      )}
                    >
                      <QuizBadge quiz={quiz} size={36} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[15px] font-bold text-ink">{quizDisplayTitle(quiz.title, quiz.passageLabel)}</span>
                        <span className="truncate text-[13px] font-semibold text-ink-muted">{metaLine(quiz)}</span>
                      </span>
                      {isSelected && <Check aria-hidden="true" className="size-[18px] shrink-0 text-lapis" strokeWidth={2.6} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <p className="m-0 border-t border-line-soft px-4 py-2 text-[13px] font-semibold tabular-nums text-ink-muted">
            {results.length} van {quizzes.length} quizzen
          </p>
        </div>
      )}
    </div>
  );
}
