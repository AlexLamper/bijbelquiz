'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, CheckCircle, XCircle, Share2, Award, RotateCcw, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  const { data: session } = useSession();
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
    const isPremium = session?.user?.isPremium;
    const isLoggedIn = !!session;

    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 border-2 border-primary/20 shadow-xl bg-[#fffcf5]">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Award className="h-10 w-10" />
          </div>
          <CardTitle className="text-4xl font-serif font-bold text-foreground">Quiz Afgerond!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
           {/* Score Section */}
          <div className="py-6">
            <p className="text-lg text-muted-foreground uppercase tracking-widest font-semibold mb-2">Jouw Resultaat</p>
            <p className="text-6xl font-bold text-primary font-serif">
               {score} <span className="text-2xl text-muted-foreground font-sans">/ {quiz.questions.length}</span>
            </p>
             {isLoggedIn && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    + {score * 10} XP verdiend
                </div>
            )}
          </div>
          
          <p className="text-xl font-medium text-slate-700 italic font-serif px-6">
            {score === quiz.questions.length ? "Uitmuntend! Een ware schriftgeleerde." : 
             score > quiz.questions.length / 2 ? "Goed gedaan! Blijf de schriften onderzoeken." : "Blijf oefenen, de volhouder wint."}
          </p>

          {/* Premium/Auth Teaser Section */}
          <div className="mt-8 space-y-4 max-w-sm mx-auto">
             {!isLoggedIn ? (
                 <div className="bg-[#152c31]/5 rounded-lg p-4 border border-[#152c31]/20">
                     <p className="text-sm text-[#152c31] font-medium mb-2">Log in om uw score op te slaan en XP te verzamelen!</p>
                     <Button size="sm" asChild className="w-full bg-[#152c31] hover:bg-[#152c31]/90">
                         <Link href="/login">Inloggen</Link>
                     </Button>
                 </div>
             ) : !isPremium ? (
                 <div className="relative group">
                    <div className="bg-slate-100/50 rounded-lg p-4 border border-slate-200 blur-[1px] select-none">
                         <h4 className="font-bold text-slate-400 mb-2">Gedetailleerde Foutenanalyse</h4>
                         <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
                         <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
                        <Lock className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-xs font-semibold text-slate-600 mb-2">Premium Analyse</p>
                        <Button size="sm" variant="secondary" asChild className="h-8">
                             <Link href="/premium">Ontgrendel</Link>
                        </Button>
                    </div>
                 </div>
             ) : (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <p className="text-sm text-emerald-800 font-medium">Volledige analyse opgeslagen in uw dashboard.</p>
                </div>
             )}
          </div>

        </CardContent>
        <CardFooter className="flex justify-center gap-4 pb-10">
          <Button onClick={() => window.location.reload()} variant="outline" className="border-primary/50 text-primary hover:bg-primary/5">
            <RotateCcw className="mr-2 h-4 w-4" /> Opnieuw
          </Button>
          <Button onClick={() => router.push(isLoggedIn ? '/dashboard' : '/')} className="px-8" disabled={isSaving}>
             {isSaving ? "Opslaan..." : isLoggedIn ? "Naar Dashboard" : "Terug naar Home"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Calculate progress
  const progress = ((currentIndex) / quiz.questions.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="w-full bg-slate-200/50 h-3 rounded-full mb-8 overflow-hidden shadow-inner">
            <div 
                className="bg-[#152c31] h-full transition-all duration-700 ease-out flex items-center justify-end pr-1" 
                style={{ width: `${Math.max(5, progress)}%` }}
            >
                {progress > 10 && <div className="h-1.5 w-1.5 rounded-full bg-white/50 mr-1" />}
            </div>
        </div>

        <Card className="w-full border-0 shadow-xl bg-[#f5f1e6] text-slate-800 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#152c31] via-[#2a4a52] to-[#152c31]"></div>
        <CardHeader className="pb-4 pt-8 px-6 md:px-10">
            <div className="flex justify-between items-center mb-6">
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-[#152c31] border-[#152c31]/20 bg-[#152c31]/5 px-3 py-1">
                Vraag {currentIndex + 1} / {quiz.questions.length}
            </Badge>
            <div className="flex items-center gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Score</div>
                <Badge className="bg-[#152c31] text-white hover:bg-[#152c31]">{score}</Badge>
            </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif leading-snug text-[#152d2f]">
                {currentQuestion.text}
            </CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-3 pt-4 px-6 md:px-10 pb-8">
            {currentQuestion.answers.map((answer, index) => {
                let className = "justify-start text-left h-auto py-4 px-6 text-lg transition-all relative border-2 rounded-xl font-medium shadow-sm hover:shadow-md";
                const variant: "outline" | "default" | "secondary" = "outline";

                if (hasAnswered) {
                    if (answer.isCorrect) {
                        // Correct answer always green
                        className += " bg-emerald-100 border-emerald-500 text-emerald-900 shadow-none";
                    } else if (index === selectedAnswer) {
                        // Selected incorrect answer red
                        className += " bg-red-50 border-red-500 text-red-900 shadow-none";
                    } else {
                        // Other answers faded
                        className += " opacity-50 border-transparent bg-slate-50";
                    }
                } else {
                    className += " border-[#152c31]/10 bg-white hover:bg-[#152c31]/5 hover:border-[#152c31]/30 hover:text-[#152c31]";
                }

                return (
                <Button
                    key={index}
                    variant={variant}
                    className={className}
                    onClick={() => handleAnswer(answer.isCorrect, index)}
                    disabled={hasAnswered}
                >
                    <span className={`mr-4 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors ${hasAnswered && answer.isCorrect ? "bg-emerald-600 border-emerald-600 text-white" : hasAnswered && index === selectedAnswer ? "bg-red-600 border-red-600 text-white" : "border-[#152c31]/20 text-[#152c31]/50"}`}>
                        {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{answer.text}</span>
                    
                    {hasAnswered && answer.isCorrect && (
                        <CheckCircle className="absolute right-4 h-6 w-6 text-emerald-600 animate-in zoom-in spin-in-90 duration-300" />
                    )}
                    {hasAnswered && !answer.isCorrect && index === selectedAnswer && (
                        <XCircle className="absolute right-4 h-6 w-6 text-red-600 animate-in zoom-in duration-300" />
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
