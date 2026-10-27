'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight } from 'lucide-react';

interface SeasonPayload {
  slug: string;
  title: string;
  description: string;
  daysRemaining: number;
  categorySlug: string | null;
}

interface SeasonQuiz {
  id: string;
  title: string;
  slug: string;
  questionCount: number;
}

/**
 * The live seasonal pack (Advent, Lent, the September opening), or nothing.
 *
 * Carried over from the old dashboard: fetched on the client and self-hiding,
 * so the ten months a year without a season cost the page nothing. Restyled
 * as a plain white card; the designs have no seasonal block of their own.
 */
export function SeasonCard() {
  const [season, setSeason] = React.useState<SeasonPayload | null>(null);
  const [quizzes, setQuizzes] = React.useState<SeasonQuiz[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/seasons/current')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.season) return;
        setSeason(payload.season as SeasonPayload);
        setQuizzes((payload.quizzes as SeasonQuiz[]) || []);
      })
      .catch(() => {
        // No season is the normal case.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!season || quizzes.length === 0) return null;

  const days = season.daysRemaining;
  const countdown = days <= 0 ? 'Loopt vandaag af' : days === 1 ? 'Nog 1 dag' : `Nog ${days} dagen`;

  return (
    <section aria-label={season.title} className="overflow-hidden rounded-[16px] border border-line bg-card">
      <div className="flex flex-col gap-1.5 px-5 pb-3 pt-[18px]">
        <span className="flex items-center gap-2 text-xs font-extrabold tracking-[0.04em] text-lapis">
          <CalendarDays className="size-4" aria-hidden="true" />
          SEIZOEN · {countdown.toUpperCase()}
        </span>
        <h2 className="m-0 text-[20px] leading-[26px]">{season.title}</h2>
        <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">{season.description}</p>
      </div>
      <ul className="m-0 list-none p-0">
        {quizzes.slice(0, 4).map((quiz) => (
          <li key={quiz.id}>
            <Link
              href={`/bijbelquiz/${quiz.slug}`}
              className="flex min-h-[52px] items-center gap-3 border-t border-line-soft px-5 text-ink no-underline hover:bg-chip hover:text-ink"
            >
              <span className="min-w-0 flex-grow truncate text-[15px] font-bold">{quiz.title}</span>
              <span className="shrink-0 text-[13px] font-semibold text-ink-muted">{quiz.questionCount} vragen</span>
              <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {season.categorySlug && (
        <Link
          href={`/quizzen?categorie=${encodeURIComponent(season.categorySlug)}`}
          className="flex h-[52px] items-center justify-center border-t border-line-soft text-[15px] font-bold no-underline"
        >
          Alles uit dit seizoen
        </Link>
      )}
    </section>
  );
}
