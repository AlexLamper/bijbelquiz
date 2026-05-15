import { AlertTriangle, BookOpen, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { QuizReviewQuestion } from '@/lib/quiz-review';
import { getQuizReviewInsights } from '@/lib/quiz-review';

interface QuizPremiumReviewSectionProps {
  questions: QuizReviewQuestion[];
  score: number;
  totalQuestions: number;
  xpEarned: number;
}

export default function QuizPremiumReviewSection({
  questions,
  score,
  totalQuestions,
  xpEarned,
}: QuizPremiumReviewSectionProps) {
  const {
    answeredCount,
    unansweredCount,
    incorrectCount,
    consistentTopicRefs,
    performanceLabel,
    recommendationText,
    xpEfficiency,
  } = getQuizReviewInsights(questions, score, totalQuestions, xpEarned);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Niveau</p>
            <p className="mt-1 text-base font-semibold text-[#24395f] dark:text-zinc-100">{performanceLabel}</p>
          </CardContent>
        </Card>
        <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Beantwoord</p>
            <p className="mt-1 text-base font-semibold text-[#24395f] dark:text-zinc-100">
              {answeredCount}/{totalQuestions}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Fouten</p>
            <p className="mt-1 text-base font-semibold text-[#24395f] dark:text-zinc-100">{incorrectCount}</p>
          </CardContent>
        </Card>
        <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">XP per vraag</p>
            <p className="mt-1 text-base font-semibold text-[#24395f] dark:text-zinc-100">{xpEfficiency}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-[#24395f] dark:text-zinc-100">Premium analyse</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{recommendationText}</p>
          {unansweredCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Je hebt <span className="font-semibold text-[#24395f] dark:text-zinc-100">{unansweredCount}</span> vraag
              {unansweredCount === 1 ? '' : 'en'} onbeantwoord gelaten. Sneller antwoorden kan direct extra punten
              opleveren.
            </p>
          )}
          {consistentTopicRefs.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Focus bijbelgedeelten
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {consistentTopicRefs.map((reference) => (
                  <Badge key={reference} variant="outline" className="bg-white dark:bg-zinc-900">
                    {reference}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.questionId} className="border-[#d8e1ee] py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[#24395f] dark:text-zinc-100">Vraag {index + 1}</p>
                {question.isCorrect ? (
                  <Badge className="bg-emerald-600 text-white">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Goed
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-600 text-white">
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    Fout
                  </Badge>
                )}
              </div>

              <p className="mt-2 text-base text-[#1f2f4b] dark:text-zinc-100">{question.questionText}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-[#d7e1ee] bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jouw antwoord</p>
                  <p className="mt-1 text-sm text-[#30466e] dark:text-zinc-200">
                    {question.selectedAnswerText ?? 'Geen antwoord'}
                  </p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Juiste antwoord
                  </p>
                  <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">{question.correctAnswerText}</p>
                </div>
              </div>

              {(question.explanation || question.bibleReference) && (
                <div className="mt-4 rounded-md border border-[#d7e1ee] bg-[#f8fafe] p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#355384]">
                    <BookOpen className="h-4 w-4" />
                    Uitleg
                  </p>
                  {question.explanation ? (
                    <p className="mt-2 text-sm text-[#30466e] dark:text-zinc-200">{question.explanation}</p>
                  ) : null}
                  {question.bibleReference ? (
                    <p className="mt-2 text-xs text-muted-foreground">Bijbelverwijzing: {question.bibleReference}</p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
