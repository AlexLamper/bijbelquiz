'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, CheckCircle, XCircle, Award, RotateCcw, Lock, ArrowLeft, Maximize, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  const isPremium = session?.user?.isPremium;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');
  const [showExplanation, setShowExplanation] = useState(true);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [showLeadForm, setShowLeadForm] = useState(true);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const currentQuestion = quiz.questions[currentIndex];

  const toggleShowExplanation = () => setShowExplanation(prev => !prev);
  const toggleFontFamily = () => setFontFamily(prev => prev === 'serif' ? 'sans' : 'serif');

  const handleAnswer = (isCorrect: boolean, index: number) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(index);
    setHasAnswered(true);

    if (isCorrect) {
      setScore(score + 1);
    }
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
        document.exitFullscreen();
        }
    }
  };

  if (isFinished) {
    const isPremium = session?.user?.isPremium;
    const isLoggedIn = !!session;

    if (showLeadForm) {
        return (
            <Card className="w-full max-w-lg mx-auto mt-8 border-0 shadow-xl bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-500 py-0 gap-0">
                <div className="bg-[#152c31]/5 p-8 text-center border-b border-[#152c31]/10 w-full">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm text-[#152c31]">
                        <BookOpen className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#152c31] mb-2">Quiz Voltooid!</h3>
                    <p className="text-slate-600">Je hebt alle vragen beantwoord.</p>
                </div>
                
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="text-center">
                            <h4 className="font-semibold text-slate-800 mb-2">Ontgrendel alle mogelijkheden</h4>
                            <p className="text-sm text-slate-500 mb-4">
                                Krijg onbeperkt toegang tot alle quizzen, statistieken en diepgaande analyses met een <strong>eenmalige Premium upgrade</strong>.
                            </p>
                            <p className="text-xs text-slate-400">
                                Laat je gegevens achter om op de hoogte te blijven van nieuwe tools en features (optioneel).
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label htmlFor="name" className="text-xs font-medium text-slate-600 uppercase tracking-wider pl-1">Naam</label>
                                <input
                                    type="text"
                                    id="name"
                                    placeholder="Jouw naam"
                                    value={leadName}
                                    onChange={(e) => setLeadName(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#152c31] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="email" className="text-xs font-medium text-slate-600 uppercase tracking-wider pl-1">E-mailadres</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="jouw@email.nl"
                                    value={leadEmail}
                                    onChange={(e) => setLeadEmail(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#152c31] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>

                    <Button 
                        size="lg" 
                        onClick={async () => {
                            if (leadName || leadEmail) {
                                try {
                                    await fetch('/api/leads', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name: leadName, email: leadEmail }),
                                    });
                                } catch (error) {
                                    console.error('Failed to save lead:', error);
                                }
                            }
                            setShowLeadForm(false);
                        }} 
                        className="w-full font-semibold shadow-lg text-lg h-12"
                    >
                        Bekijk Antwoorden
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    
                    <p className="text-center text-xs text-slate-400">
                        Je gegevens worden veilig verwerkt.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 border-2 border-primary/20 shadow-xl bg-white overflow-y-auto max-h-[80vh]">
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
    <div className={`w-full max-w-4xl mx-auto flex flex-col relative pt-1 overflow-hidden h-full transition-all duration-700 ease-in-out ${hasAnswered ? 'justify-center' : 'justify-start md:pt-4'}`}>
        {/* Settings Overlay */}
        {isSettingsOpen && (
            <>
                {/* Backdrop to close settings when clicking outside */}
                <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                <div className="absolute top-12 right-0 z-50 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Instellingen</h4>
                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Tekstgrootte</span>
                        <div className="flex gap-1">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setTextSize('normal')}
                                className={`h-8 px-2 ${textSize === 'normal' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                            >
                                <span className="text-xs">Aa</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setTextSize('large')}
                                className={`h-8 px-2 ${textSize === 'large' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                            >
                                <span className="text-lg">Aa</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Lettertype</span>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={toggleFontFamily}
                            className="w-24 h-8 text-xs"
                        >
                            {fontFamily === 'serif' ? 'Serif' : 'Sans Serif'}
                        </Button>
                    </div>

                     <div className="flex items-center justify-between opacity-100">
                        <div className="flex flex-col">
                            <span className="text-sm text-slate-600">Toon Uitleg</span>
                            {!isPremium && (
                                <span className="text-[10px] text-primary font-bold uppercase tracking-tighter flex items-center gap-0.5">
                                    <Lock className="h-2 w-2" /> PREMIUM
                                </span>
                            )}
                        </div>
                         <Button 
                            variant={showExplanation ? "default" : "outline"}
                            size="sm" 
                            onClick={() => {
                                if (isPremium) {
                                    toggleShowExplanation();
                                } else {
                                    router.push('/premium');
                                }
                            }}
                            className={`h-8 w-12 ${showExplanation ? 'bg-primary text-white' : ''} transition-all`}
                        >
                            {showExplanation ? "Aan" : "Uit"}
                        </Button>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(false)} className="h-8 text-xs">Sluiten</Button>
                </div>
            </div>
            </>
        )}

       {/* Top Controls */}
       <div className="flex justify-between items-center mb-1 shrink-0 px-1">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 gap-2 -ml-2" onClick={() => router.push('/quizzes')}>
               <ArrowLeft className="h-4 w-4" /> Overzicht
            </Button>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="hidden md:inline-flex text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 h-8 w-8" onClick={toggleFullscreen} title="Volledig scherm">
                    <Maximize className="h-4 w-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 h-8 w-8 ${isSettingsOpen ? 'bg-slate-200/50 text-slate-900' : ''}`}
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                    title="Instellingen"
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </div>
       </div>

        {/* Progress bar */}
        <div className="w-full bg-white border border-slate-200 h-2 md:h-3 rounded-full mb-2 md:mb-4 overflow-hidden shadow-sm shrink-0">
            <div 
                className="bg-[#152c31] h-full transition-all duration-700 ease-out flex items-center justify-end pr-1" 
                style={{ width: `${Math.max(5, progress)}%` }}
            >
            </div>
        </div>

        <Card className="w-full border-0 shadow-lg bg-white text-slate-800 overflow-hidden relative flex flex-col min-h-0 shrink-1 h-auto">
            
        <CardHeader className="pb-1 pt-3 px-4 md:px-8 shrink-0">
            <div className="flex justify-between items-center mb-1">
            <Badge variant="outline" className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#152c31] border-[#152c31]/20 bg-[#152c31]/5 px-2 py-0.5">
                Vraag {currentIndex + 1} / {quiz.questions.length}
            </Badge>
            <div className="flex items-center gap-2">
                <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">Score</div>
                <Badge className="bg-[#152c31] text-white hover:bg-[#152c31] text-[10px] md:text-xs h-5 px-1.5">{score}</Badge>
            </div>
            </div>
            <CardTitle className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} leading-tight text-[#152d2f] transition-all ${textSize === 'large' ? 'text-lg md:text-xl lg:text-2xl' : 'text-base md:text-xl'}`}>
                {currentQuestion.text}
            </CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-1.5 md:gap-2 pt-0 px-4 md:px-8 pb-2 overflow-y-auto shrink-1 custom-scrollbar">
            {currentQuestion.answers.map((answer, index) => {
                let className = `justify-start text-left h-auto px-4 text-sm md:text-base transition-all relative border rounded-lg font-medium shadow-sm active:scale-[0.98] ${textSize === 'large' ? 'py-3 md:py-4 text-base md:text-lg' : 'py-2 md:py-3'}`;
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
                    className += " border-slate-200 bg-white hover:bg-[#152c31]/5 hover:border-[#152c31]/20 hover:text-[#152c31]";
                }

                return (
                <Button
                    key={index}
                    variant={variant}
                    className={className}
                    onClick={() => handleAnswer(answer.isCorrect, index)}
                    disabled={hasAnswered}
                >
                    <span className={`mr-4 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${hasAnswered && answer.isCorrect ? "bg-emerald-600 border-emerald-600 text-white" : hasAnswered && index === selectedAnswer ? "bg-red-600 border-red-600 text-white" : "border-[#152c31]/20 text-[#152c31]/50"}`}>
                        {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-sm md:text-base">{answer.text}</span>
                    
                    {hasAnswered && answer.isCorrect && (
                        <CheckCircle className="absolute right-4 h-5 w-5 text-emerald-600 animate-in zoom-in spin-in-90 duration-300" />
                    )}
                    {hasAnswered && !answer.isCorrect && index === selectedAnswer && (
                        <XCircle className="absolute right-4 h-5 w-5 text-red-600 animate-in zoom-in duration-300" />
                    )}
                </Button>
                );
            })}
        
        {/* Explanation Section (Appears after answering) */}
        {hasAnswered && showExplanation && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2 shrink-0">
                <div className={`mx-0 mb-0 rounded-xl bg-primary/5 border border-primary/10 ${textSize === 'large' ? 'p-3 md:p-5' : 'p-2 md:p-4'} relative overflow-hidden`}>
                    <h4 className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary mb-1">
                        <BookOpen className="h-3 w-3" /> 
                        Uitleg
                    </h4>
                    
                    {isPremium ? (
                        <>
                            <p className={`text-foreground ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} leading-snug mb-1 ${textSize === 'large' ? 'text-sm md:text-lg' : 'text-xs md:text-sm'}`}>
                                {currentQuestion.explanation || "Geen extra uitleg beschikbaar."}
                            </p>
                            
                            {currentQuestion.bibleReference && (
                                <div className="flex items-center gap-2 text-xs text-stone-600 font-medium italic border-t border-primary/10 pt-1.5 mt-1.5">
                                    <span className="bg-white px-1.5 py-0.5 rounded border border-stone-200 shadow-sm not-italic text-[10px]">
                                        Lees
                                    </span> 
                                    {currentQuestion.bibleReference}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-2 flex flex-col items-center text-center">
                            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-2 border border-primary/10 w-full mb-2 select-none">
                                <p className="text-[10px] md:text-xs text-slate-400 italic blur-[1px]">
                                    {currentQuestion.explanation?.substring(0, 40)}...
                                </p>
                            </div>
                            <Button size="sm" asChild className="bg-primary hover:bg-primary/90 text-white gap-2 h-7 md:h-9 text-xs w-full">
                                <Link href="/premium">
                                    <Lock className="h-3 w-3" /> Ontgrendel Uitleg
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        )}
        </CardContent>

        {hasAnswered && (
            <CardFooter className="bg-white border-t border-slate-100 py-2 md:py-2.5 flex justify-end shrink-0 rounded-b-xl z-20 shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)]">
                <Button size="lg" onClick={handeNext} className="group px-6 md:px-8 font-semibold shadow-lg text-sm h-10">
                    {currentIndex < quiz.questions.length - 1 ? "Volgende" : "Afronden"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        )}
        </Card>
    </div>
  );
}
