'use client';

import { AlertTriangle, BookOpen, CheckCircle2 } from 'lucide-react';
import BibleVerseDisplay from '@/components/BibleVerseDisplay';
import StudieLink from '@/components/StudieLink';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { passageFromQuestion } from '@/lib/ecosystem-links';
import type { QuizReviewQuestion } from '@/lib/quiz-review';
import { getQuizReviewInsights } from '@/lib/quiz-review';

interface QuizReviewSectionProps {
  questions: QuizReviewQuestion[];
  score: number;
  totalQuestions: number;
  xpEarned: number;
  /** Carried into the outbound links so a click can be attributed to a quiz. */
  quizSlug?: string | null;
}

/**
 * The post-quiz review, for everybody.
 *
 * This used to exist twice: a free version that showed which answers were wrong
 * and sold the reasons, and a Premium version that showed the reasons. Holding
 * back "waarom had ik dit fout" earned nothing in a year and cost the product
 * the one moment where a reader genuinely wants to open their Bible. So there
 * is one review now, and the explanation is followed by the chapter it came
 * from on BijbelStudie.
 */
export default function QuizReviewSection({
  questions,
  score,
  totalQuestions,
  xpEarned,
  quizSlug,
}: QuizReviewSectionProps) {
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
        <Card className="border-rule py-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Niveau</p>
            <p className="mt-1 text-base font-semibold text-ink">{performanceLabel}</p>
          </CardContent>
        </Card>
        <Card className="border-rule py-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Beantwoord</p>
            <p className="mt-1 text-base font-semibold text-ink">
              {answeredCount}/{totalQuestions}
            </p>
          </CardContent>
        </Card>
        <Card className="border-rule py-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Fouten</p>
            <p className="mt-1 text-base font-semibold text-ink">{incorrectCount}</p>
          </CardContent>
        </Card>
        <Card className="border-rule py-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">XP per vraag</p>
            <p className="mt-1 text-base font-semibold text-ink">{xpEfficiency}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-rule py-0">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-ink">Analyse</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{recommendationText}</p>
          {unansweredCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Je hebt <span className="font-semibold text-ink">{unansweredCount}</span> vraag
              {unansweredCount === 1 ? '' : 'en'} onbeantwoord gelaten. Sneller antwoorden kan direct extra punten
              opleveren.
            </p>
          )}
          {consistentTopicRefs.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Focus bijbelgedeelten
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {consistentTopicRefs.map((reference) => (
                  <Badge key={reference} variant="outline" className="bg-paper-raised">
                    {reference}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((question, index) => {
          const passage = passageFromQuestion(question);

          return (
            <Card key={question.questionId} className="border-rule py-0">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">Vraag {index + 1}</p>
                  {question.isCorrect ? (
                    <Badge className="bg-positive text-ink-inverted">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Goed
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-vermilion text-ink-inverted">
                      <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                      Fout
                    </Badge>
                  )}
                </div>

                <p className="mt-2 text-base text-ink">{question.questionText}</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-rule bg-paper-raised p-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Jouw antwoord</p>
                    <p className="mt-1 text-sm text-ink">
                      {question.selectedAnswerText ?? 'Geen antwoord'}
                    </p>
                  </div>
                  <div className="rounded-md border border-positive/35 bg-positive-tint p-3 dark:border-positive/35 dark:bg-positive/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-positive dark:text-positive">
                      Juiste antwoord
                    </p>
                    <p className="mt-1 text-sm text-positive dark:text-positive">{question.correctAnswerText}</p>
                  </div>
                </div>

                {(question.explanation || question.bibleReference) && (
                  <div className="mt-4 rounded-md border border-rule bg-paper-sunken p-3">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                      <BookOpen className="h-4 w-4" />
                      Uitleg
                    </p>
                    {question.explanation ? (
                      <p className="mt-2 text-sm text-ink">{question.explanation}</p>
                    ) : null}
                    {question.bibleReference ? (
                      <BibleVerseDisplay reference={question.bibleReference} />
                    ) : null}
                    {passage && (
                      <div className="mt-3 border-t border-rule pt-3">
                        <StudieLink
                          passage={passage}
                          surface="review"
                          quizSlug={quizSlug}
                          label={`Lees ${passage.book} ${passage.chapter} met uitleg`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
