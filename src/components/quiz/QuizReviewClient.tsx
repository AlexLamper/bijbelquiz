import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import QuizReviewSection from '@/components/quiz/QuizReviewSection';
import StudieLink from '@/components/StudieLink';
import { dominantPassage } from '@/lib/ecosystem-links';
import type { QuizReviewQuestion } from '@/lib/quiz-review';

export type { QuizReviewQuestion };

interface QuizReviewClientProps {
  quizIdOrSlug: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  completedAt: string;
  questions: QuizReviewQuestion[];
}

export default function QuizReviewClient({
  quizIdOrSlug,
  quizTitle,
  score,
  totalQuestions,
  xpEarned,
  completedAt,
  questions,
}: QuizReviewClientProps) {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passage = dominantPassage(questions);

  return (
    <div className="min-h-screen pt-10 pb-12">
      <section className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
              Quizoverzicht
            </p>
            <h1 className="mt-1 font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">{quizTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingediend op{' '}
              {new Date(completedAt).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {score}/{totalQuestions} goed
            </Badge>
            <Badge variant="outline">{percentage}%</Badge>
            <Badge variant="outline">+{xpEarned} XP</Badge>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 lg:px-8">
        <QuizReviewSection
          questions={questions}
          score={score}
          totalQuestions={totalQuestions}
          xpEarned={xpEarned}
          quizSlug={quizIdOrSlug}
        />

        {/* The next step after reading back your own mistakes is the chapter
            they came from, not the dashboard. */}
        <div className="mt-8 border-t border-rule pt-6">
          <StudieLink
            passage={passage}
            surface="result_wrong_answers"
            quizSlug={quizIdOrSlug}
            variant="primary"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={`/quiz/${quizIdOrSlug}`}>Quiz opnieuw spelen</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Naar dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
