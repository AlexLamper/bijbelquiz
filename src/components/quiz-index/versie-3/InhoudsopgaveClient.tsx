'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Search } from 'lucide-react';

import { ArrowLink, PageMasthead, SectionHead } from '@/components/editorial';
import QuizCard from '@/components/QuizCard';
import { Input } from '@/components/ui/input';
import type { QuizIndexData } from '@/lib/quiz-index-data';
import { cn } from '@/lib/utils';

import { BookLine } from './BookLine';
import {
  bestScore,
  buildContents,
  difficultyLabel,
  difficultyText,
  groupAnchor,
  isPlayed,
  pickFeatured,
  quizHref,
  searchContents,
  testamentAnchor,
  type Quiz,
} from './contents-model';

const EYEBROW = 'text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted';
const CONTAINER = 'mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10';

/** How many search rows to list before pointing at the contents below. */
const SEARCH_ROWS = 24;

interface Props extends QuizIndexData {
  isSignedIn: boolean;
}

/**
 * The quiz index as the contents page at the front of a Bible: every book on
 * its own line, every chapter a number, and a number in ink is a quiz.
 */
export default function InhoudsopgaveClient({ quizzes, books, isSignedIn }: Props) {
  const [query, setQuery] = useState('');

  const contents = useMemo(() => buildContents(quizzes, books), [quizzes, books]);
  const featured = useMemo(() => pickFeatured(quizzes, isSignedIn), [quizzes, isSignedIn]);
  const search = useMemo(() => searchContents(query, quizzes, books), [query, quizzes, books]);

  const playedCount = useMemo(() => quizzes.filter(isPlayed).length, [quizzes]);
  const thematicDimmed =
    search.active && !contents.thematic.some((quiz) => search.quizzes.includes(quiz));

  return (
    <div className="min-h-screen bg-paper pb-24 pt-10 lg:pt-14">
      <section className={CONTAINER}>
        <PageMasthead
          eyebrow="Quizbibliotheek"
          title="Inhoudsopgave"
          lead="Alle 66 boeken, hoofdstuk voor hoofdstuk. Een nummer in inkt heeft een quiz: klik erop en speel. Een grijs nummer wacht nog op een quiz."
          aside={
            <p className={cn(EYEBROW, 'tabular-nums')}>
              {quizzes.length} quizzen
              <span className="mx-2 text-rule-strong">/</span>
              {contents.chaptersCovered} hoofdstukken
              {isSignedIn && playedCount > 0 && (
                <>
                  <span className="mx-2 text-rule-strong">/</span>
                  <span className="text-positive">{playedCount} gespeeld</span>
                </>
              )}
            </p>
          }
          actions={isSignedIn ? <ArrowLink href="/quizzen/aanmaken">Zelf quiz maken</ArrowLink> : undefined}
        />
      </section>

      {/* Sticky mini-nav: the two testaments and their groups, as anchors. */}
      <nav
        aria-label="Inhoud"
        className="sticky top-16 z-20 border-b border-rule bg-paper/90 backdrop-blur-sm supports-backdrop-filter:bg-paper/75"
      >
        <div className={cn(CONTAINER, 'flex gap-x-5 overflow-x-auto py-2.5 [scrollbar-width:none]')}>
          {contents.testaments.map((testament) => (
            <div key={testament.testament} className="flex shrink-0 items-center gap-x-4">
              <a
                href={`#${testamentAnchor(testament.testament)}`}
                className="shrink-0 font-display text-[14px] tracking-[-0.02em] text-ink transition-colors hover:text-lapis"
              >
                {testament.label}
              </a>
              {testament.groups.map(({ group }) => (
                <a
                  key={group.id}
                  href={`#${groupAnchor(group.id)}`}
                  className={cn(EYEBROW, 'shrink-0 transition-colors hover:text-ink')}
                >
                  {group.label}
                </a>
              ))}
            </div>
          ))}
          {contents.thematic.length > 0 && (
            <a href="#themas" className="shrink-0 font-display text-[14px] tracking-[-0.02em] text-ink transition-colors hover:text-lapis">
              Thema&apos;s
            </a>
          )}
        </div>
      </nav>

      {/* Search */}
      <section className={cn(CONTAINER, 'pt-8')}>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zoek een boek, hoofdstuk of thema, bijvoorbeeld Lucas 15"
            aria-label="Zoek een quiz"
            className="h-10 pl-9 text-sm"
          />
        </div>

        {search.active && (
          <div className="mt-4 max-w-3xl">
            <p className={cn(EYEBROW, 'tabular-nums')}>
              {search.quizzes.length === 0
                ? 'Geen quiz gevonden'
                : `${search.quizzes.length} ${search.quizzes.length === 1 ? 'quiz' : 'quizzen'} gevonden`}
            </p>
            {search.quizzes.length > 0 && (
              <ul className="mt-2 border-t border-rule">
                {search.quizzes.slice(0, SEARCH_ROWS).map((quiz) => (
                  <SearchRow key={quiz._id} quiz={quiz} />
                ))}
              </ul>
            )}
            {search.quizzes.length > SEARCH_ROWS && (
              <p className="mt-2 text-xs text-ink-muted tabular-nums">
                En nog {search.quizzes.length - SEARCH_ROWS} meer, hieronder in de inhoudsopgave.
              </p>
            )}
            {search.quizzes.length === 0 && (
              <p className="mt-2 text-sm text-ink-muted">
                {search.bookCodes.size > 0
                  ? 'Dit boek heeft nog geen quiz. De hoofdstukken staan hieronder, grijs.'
                  : 'Probeer een boeknaam, een hoofdstuk zoals &quot;Johannes 3&quot; of een thema.'}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Uitgelicht */}
      {featured.length > 0 && (
        <section className={cn(CONTAINER, 'pt-12')}>
          <SectionHead
            eyebrow="Uitgelicht"
            title={isSignedIn ? 'Verder waar je was' : 'Om mee te beginnen'}
          />
          <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map(({ quiz, caption }) => (
              <div key={quiz._id} className="flex flex-col">
                <p className={cn(EYEBROW, 'mb-3', caption === 'Verder gaan' && 'text-lapis')}>{caption}</p>
                <QuizCard quiz={quiz} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The contents proper */}
      <section className={cn(CONTAINER, 'pt-14')}>
        <div className="grid gap-x-12 gap-y-12 md:grid-cols-2">
          {contents.testaments.map((testament) => (
            <div key={testament.testament} id={testamentAnchor(testament.testament)} className="min-w-0 scroll-mt-32">
              <div className="flex items-baseline justify-between gap-4 border-b border-rule-strong pb-3">
                <h2 className="font-display text-2xl font-normal tracking-[-0.02em] text-ink">
                  {testament.label}
                </h2>
                <span className={cn(EYEBROW, 'tabular-nums')}>{testament.quizCount} quizzen</span>
              </div>

              {testament.groups.map(({ group, books: groupBooks }) => (
                <div key={group.id} id={groupAnchor(group.id)} className="scroll-mt-32">
                  <p className={cn(EYEBROW, 'pt-7 pb-2')}>{group.label}</p>
                  <ul>
                    {groupBooks.map((entry) => (
                      <BookLine
                        key={entry.book.code}
                        entry={entry}
                        dimmed={search.active && !search.bookCodes.has(entry.book.code)}
                        markedChapters={search.chapterKeys}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Thema's */}
      {contents.thematic.length > 0 && (
        <section id="themas" className={cn(CONTAINER, 'scroll-mt-32 pt-14')}>
          <div className={cn('transition-opacity duration-300', thematicDimmed && 'opacity-30')}>
            <SectionHead
              eyebrow="Thema's"
              title="Dwars door de Bijbel"
              lead="Quizzen die niet bij een boek horen: personen, plaatsen en onderwerpen uit beide testamenten."
            />
            <ul className="mt-2 max-w-3xl">
              {contents.thematic.map((quiz) => (
                <SearchRow key={quiz._id} quiz={quiz} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

/** One compact row: title, where it sits, difficulty, length, and the reader's best. */
function SearchRow({ quiz }: { quiz: Quiz }) {
  const score = bestScore(quiz);
  const place =
    quiz.bookTitle && quiz.chapterFrom !== null
      ? `${quiz.bookTitle} ${
          quiz.chapterTo !== null && quiz.chapterTo !== quiz.chapterFrom
            ? `${quiz.chapterFrom}-${quiz.chapterTo}`
            : quiz.chapterFrom
        }`
      : quiz.bookTitle ?? quiz.categoryId?.title ?? 'Thema';

  return (
    <li className="border-b border-rule">
      <Link
        href={quizHref(quiz)}
        className="group flex flex-wrap items-baseline gap-x-4 gap-y-0.5 py-2.5"
      >
        <span className="min-w-0 flex-1 basis-56 text-sm font-medium text-ink transition-colors group-hover:text-lapis">
          {quiz.title}
        </span>
        <span className="flex shrink-0 items-baseline gap-x-3 text-[12px] text-ink-muted tabular-nums">
          <span>{place}</span>
          <span className={difficultyText(quiz)}>{difficultyLabel(quiz)}</span>
          <span>{quiz.questionCount} vragen</span>
          {score && (
            <span className="inline-flex items-center gap-1 text-positive">
              <Check className="h-3 w-3" strokeWidth={2.5} />
              {score}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
