'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';

interface SeasonPayload {
  slug: string;
  title: string;
  description: string;
  endsAt: string;
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
 * The live seasonal pack, or nothing.
 *
 * Fetched client-side and self-hiding, so the pages that show it do not have
 * to thread a prop through for the ten months a year there is no season. The
 * card renders nothing at all when no pack is running or when the pack has no
 * quizzes tagged yet, which is preferable to an empty section with a heading.
 */
export default function SeasonCard() {
  const [season, setSeason] = useState<SeasonPayload | null>(null);
  const [quizzes, setQuizzes] = useState<SeasonQuiz[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/seasons/current')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.season) return;
        setSeason(payload.season as SeasonPayload);
        setQuizzes((payload.quizzes as SeasonQuiz[]) || []);
      })
      .catch(() => {
        // A missing season is the normal case; it is never worth an error.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!season || quizzes.length === 0) {
    return null;
  }

  const days = season.daysRemaining;
  const countdown =
    days <= 0 ? 'Loopt vandaag af' : days === 1 ? 'Nog 1 dag' : `Nog ${days} dagen`;

  return (
    <section className="pt-11 lg:pt-14">
      <div className="rounded-lg border border-lapis/35 bg-lapis-tint p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 border border-lapis/35 bg-paper-raised px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-lapis">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Seizoen
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            {countdown}
          </span>
        </div>

        <h2 className="mt-4 font-display text-[28px] font-normal leading-[1.1] tracking-[-0.02em] text-ink sm:text-[32px]">
          {season.title}
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
          {season.description}
        </p>

        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {quizzes.slice(0, 4).map((quiz) => (
            <li key={quiz.id}>
              <Link
                href={`/quiz/${quiz.slug}`}
                className="flex items-center justify-between gap-4 py-3 text-sm text-ink transition-colors hover:text-lapis"
              >
                <span className="min-w-0 truncate font-medium">{quiz.title}</span>
                <span className="shrink-0 text-xs text-ink-muted">
                  {quiz.questionCount} vragen
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {season.categorySlug && (
          <Link
            href={`/quizzen?category=${season.categorySlug}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Alles uit dit seizoen
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
