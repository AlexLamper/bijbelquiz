'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, CheckCircle, XCircle, Share2, Award, RotateCcw } from 'lucide-react';

// Interface matching the serialized Mongoose object
interface Answer {
  text: string;
  isCorrect: boolean;
  _id: string;
}

interface Question {
  text: string;
  answers: Answer[];
  explanation?: string;
  bibleReference?: string;
  _id: string;
}

interface Quiz {
  _id: string;
  title: string;
  questions: Question[];
}

export default function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const currentQuestion = quiz.questions[currentIndex];

  const handleAnswer = (isCorrect: boolean, index: number) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(index);
    setHasAnswered(true);

    if (isCorrect) {
      setScore(score + 1);
    }
    // Wacht nu op de gebruiker om op "Volgende" te klikken (Studie modus)
  };

  const handeNext = async () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      await finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    setIsSaving(true);
    try {
        await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quizId: quiz._id,
                score: score,
                totalQuestions: quiz.questions.length
            })
        });
    } catch (e) {
        console.error("Failed to save progress", e);
    } finally {
        setIsSaving(false);
    }
  };

  if (isFinished) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 border-2 border-primary/20 shadow-xl bg-[#fffcf5]">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Award className="h-10 w-10" />
          </div>
          <CardTitle className="text-4xl font-serif font-bold text-foreground">Quiz Afgerond!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="py-6">
            <p className="text-lg text-muted-foreground uppercase tracking-widest font-semibold mb-2">Jouw Resultaat</p>
            <p className="text-6xl font-bold text-primary font-serif">
               {score} <span className="text-2xl text-muted-foreground font-sans">/ {quiz.questions.length}</span>
            </p>
          </div>
          
          <p className="text-xl font-medium text-slate-700 italic font-serif">
            {score === quiz.questions.length ? "Uitmuntend! Een ware schriftgeleerde." : 
             score > quiz.questions.length / 2 ? "Goed gedaan! Blijf de schriften onderzoeken." : "Blijf oefenen, de volhouder wint."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 pb-10">
          <Button onClick={() => window.location.reload()} variant="outline" className="border-primary/50 text-primary hover:bg-primary/5">
            <RotateCcw className="mr-2 h-4 w-4" /> Opnieuw
          </Button>
          <Button onClick={() => router.push('/')} className="px-8" disabled={isSaving}>
             {isSaving ? "Opslaan..." : "Terug naar Overzicht"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Calculate progress
  const progress = ((currentIndex) / quiz.questions.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
        {/* Progress bar */}
        <div className="w-full bg-secondary/30 h-2 rounded-full mb-6 overflow-hidden">
            <div 
                className="bg-primary h-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
            />
        </div>

        <Card className="w-full border shadow-lg bg-[#fffcf5] border-stone-200">
        <CardHeader className="pb-2">
            <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                Vraag {currentIndex + 1}
            </span>
            <span className="text-sm font-bold text-primary/80">Score: {score}</span>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif leading-tight text-foreground">
                {currentQuestion.text}
            </CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-3 pt-6">
            {currentQuestion.answers.map((answer, index) => {
                let className = "justify-start text-left h-auto py-5 px-6 text-lg transition-all relative border-2 font-medium";
                const variant: "outline" | "default" | "secondary" = "outline";

                if (hasAnswered) {
                    if (answer.isCorrect) {
                        // Correct answer always green
                        className += " bg-emerald-50 border-emerald-500 text-emerald-800";
                    } else if (index === selectedAnswer) {
                        // Selected incorrect answer red
                        className += " bg-red-50 border-red-500 text-red-900";
                    } else {
                        // Other answers faded
                        className += " opacity-60";
                    }
                } else {
                    className += " hover:border-primary/50 hover:bg-primary/5 hover:text-primary";
                }

                return (
                <Button
                    key={index}
                    variant={variant}
                    className={className}
                    onClick={() => handleAnswer(answer.isCorrect, index)}
                    disabled={hasAnswered}
                >
                    <span className="mr-4 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current text-sm opacity-70">
                        {String.fromCharCode(65 + index)}
                    </span>
                    {answer.text}
                    
                    {hasAnswered && answer.isCorrect && (
                        <CheckCircle className="absolute right-4 h-6 w-6 text-emerald-600" />
                    )}
                    {hasAnswered && !answer.isCorrect && index === selectedAnswer && (
                        <XCircle className="absolute right-4 h-6 w-6 text-red-600" />
                    )}
                </Button>
                );
            })}
        </CardContent>

        {/* Explanation Section (Appears after answering) */}
        {hasAnswered && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mx-6 mb-6 rounded-xl bg-primary/5 p-6 border border-primary/10">
                    <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary mb-3">
                        <BookOpen className="h-4 w-4" /> 
                        Uitleg & Verdieping
                    </h4>
                    
                    <p className="text-lg text-foreground font-serif leading-relaxed mb-4">
                        {currentQuestion.explanation || "Geen extra uitleg beschikbaar."}
                    </p>
                    
                    {currentQuestion.bibleReference && (
                        <div className="flex items-center gap-2 text-sm text-stone-600 font-medium italic border-t border-primary/10 pt-3">
                            <span className="bg-white px-2 py-0.5 rounded border border-stone-200 shadow-sm not-italic text-xs">
                                Lees
                            </span> 
                            {currentQuestion.bibleReference}
                        </div>
                    )}
                </div>
                
                <CardFooter className="bg-stone-50 border-t border-stone-100 py-4 flex justify-end rounded-b-xl">
                    <Button size="lg" onClick={handeNext} className="group px-8 font-semibold shadow-lg">
                        {currentIndex < quiz.questions.length - 1 ? "Volgende Vraag" : "Afronden"}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </CardFooter>
            </div>
        )}
        </Card>
    </div>
  );
}
