'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Crown, Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { normalizeSearchText, readSeries } from '@/lib/quiz-series';
import { cn } from '@/lib/utils';

export interface PickerQuiz {
  id: string;
  title: string;
  questionCount: number;
  isPremium: boolean;
  categorySlug: string | null;
  categoryTitle: string | null;
}

export interface PickerCategory {
  slug: string;
  title: string;
}

interface QuizPickerFieldProps {
  quizzes: PickerQuiz[];
  categories: PickerCategory[];
  value: string;
  onChange: (quizId: string) => void;
  disabled?: boolean;
}

/**
 * Choosing the quiz for a room.
 *
 * A native select over a few hundred quizzes is unusable: the list is one long
 * unsearchable column, and the host has to recognise a title by scrolling past
 * every other one. This is a search-first picker instead - type a book name,
 * or narrow by category, and pick from what is left. The list is bounded in
 * height so the page around it never grows, and results are labelled by series
 * so the twenty "Handelingen" quizzes read as one block rather than twenty
 * near-identical rows.
 */
export default function QuizPickerField({
  quizzes,
  categories,
  value,
  onChange,
  disabled = false,
}: QuizPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categorySlug, setCategorySlug] = useState<string>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => quizzes.find((quiz) => quiz.id === value) ?? null,
    [quizzes, value],
  );

  // Only offer categories that something in this list actually belongs to -
  // an empty filter chip is a dead end the host has to undo.
  const usedCategories = useMemo(() => {
    const present = new Set(
      quizzes.map((quiz) => quiz.categorySlug).filter((slug): slug is string => Boolean(slug)),
    );
    return categories.filter((category) => present.has(category.slug));
  }, [categories, quizzes]);

  const results = useMemo(() => {
    const search = normalizeSearchText(query);

    return quizzes.filter((quiz) => {
      const matchesCategory = categorySlug === 'all' || quiz.categorySlug === categorySlug;
      if (!matchesCategory) return false;
      if (search.length === 0) return true;

      return (
        normalizeSearchText(quiz.title).includes(search)
        || normalizeSearchText(quiz.categoryTitle || '').includes(search)
      );
    });
  }, [quizzes, query, categorySlug]);

  // The highlight belongs to the current result set, so it returns to the top
  // whenever that set changes. Adjusting during render rather than in an
  // effect keeps this to a single render pass and avoids a frame where the
  // highlight points past the end of a narrowed list.
  const resultSignature = `${query}|${categorySlug}`;
  const [seededResults, setSeededResults] = useState(resultSignature);

  if (seededResults !== resultSignature) {
    setSeededResults(resultSignature);
    setActiveIndex(0);
  }

  // Close on an outside click or Escape, the two ways anyone expects to get
  // out of an open panel.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
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

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const select = (quizId: string) => {
    onChange(quizId);
    setIsOpen(false);
    setQuery('');
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
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-rule bg-paper px-3 text-left text-sm text-ink transition-colors hover:border-rule-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rule-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.title : <span className="text-ink-soft">Kies een quiz</span>}
        </span>
        {selected && (
          <span className="shrink-0 text-xs text-ink-soft tabular-nums">
            {selected.questionCount} vragen
          </span>
        )}
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-ink-soft" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-md border border-rule bg-paper-raised shadow-lg">
          <div className="border-b border-rule p-2">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
              />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Zoek op titel of categorie"
                className="h-9 border-rule bg-paper pl-8 pr-8 text-sm focus-visible:ring-rule-strong"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchRef.current?.focus();
                  }}
                  aria-label="Zoekterm wissen"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {usedCategories.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <CategoryChip
                  label="Alle"
                  isActive={categorySlug === 'all'}
                  onClick={() => setCategorySlug('all')}
                />
                {usedCategories.map((category) => (
                  <CategoryChip
                    key={category.slug}
                    label={category.title}
                    isActive={categorySlug === category.slug}
                    onClick={() => setCategorySlug(category.slug)}
                  />
                ))}
              </div>
            )}
          </div>

          <div ref={listRef} role="listbox" className="max-h-72 overflow-y-auto overscroll-contain p-1">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-soft">
                Geen quiz gevonden. Pas je zoekterm of categorie aan.
              </p>
            ) : (
              results.map((quiz, index) => {
                const previous = results[index - 1];
                const series = readSeries(quiz.title);
                const showSeriesLabel =
                  !previous || readSeries(previous.title).key !== series.key;

                return (
                  <div key={quiz.id}>
                    {showSeriesLabel && (
                      <p className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                        {series.label}
                      </p>
                    )}
                    <button
                      type="button"
                      data-index={index}
                      role="option"
                      aria-selected={quiz.id === value}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(quiz.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                        index === activeIndex ? 'bg-paper-sunken text-ink' : 'text-ink-soft',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-ink">{quiz.title}</span>
                      {quiz.isPremium && (
                        <Crown aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      )}
                      <span className="shrink-0 text-xs tabular-nums text-ink-soft">
                        {quiz.questionCount}
                      </span>
                      {quiz.id === value && <Check aria-hidden className="h-4 w-4 shrink-0 text-ink" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <p className="border-t border-rule px-3 py-2 text-xs text-ink-soft tabular-nums">
            {results.length} van {quizzes.length} quizzen
          </p>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium transition-colors',
        isActive
          ? 'border-ink bg-ink text-ink-inverted'
          : 'border-rule bg-paper text-ink-soft hover:border-rule-strong hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}
