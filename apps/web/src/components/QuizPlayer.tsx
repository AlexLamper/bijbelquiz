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
    rewardXp?: number;
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

  const [earnedXp, setEarnedXp] = useState<number | null>(null);

  const finishQuiz = async () => {
    setIsFinished(true);
    setIsSaving(true);
    try {
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quizId: quiz._id,
                score: score,
                totalQuestions: quiz.questions.length
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.xpEarned !== undefined) {
                setEarnedXp(data.xpEarned);
            }
        }
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
            <Card className="w-full max-w-2xl mx-auto mt-12 md:mt-20 border-0 shadow-2xl bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-500 py-0 gap-0 rounded-2xl">
                <div className="bg-[#152c31]/5 p-10 md:p-14 text-center border-b border-[#152c31]/10 w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-[#152c31]"></div>
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl text-[#152c31] border border-slate-100">
                        <Award className="h-12 w-12" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#152c31] mb-3">Quiz Voltooid!</h3>
                    <p className="text-lg text-slate-600 font-medium">Je hebt alle vragen beantwoord.</p>
                </div>
                
                <CardContent className="p-8 md:p-12 space-y-8 bg-slate-50/50">
                    <div className="space-y-6">
                        <div className="text-center max-w-lg mx-auto">
                            <h4 className="text-xl font-bold text-slate-800 mb-3">Ontgrendel alle mogelijkheden</h4>
                            <p className="text-base text-slate-600 mb-6 leading-relaxed">
                                Krijg onbeperkt toegang tot alle quizzen, statistieken en diepgaande analyses met een <strong>eenmalige Premium upgrade</strong>.
                            </p>
                        </div>

                        <div className="space-y-5 max-w-sm mx-auto bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-semibold text-slate-400 text-center uppercase tracking-widest mb-4">
                                Blijf op de hoogte (Optioneel)
                            </p>
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">Naam</label>
                                <input
                                    type="text"
                                    id="name"
                                    placeholder="Jouw naam"
                                    value={leadName}
                                    onChange={(e) => setLeadName(e.target.value)}
                                    className="flex h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#152c31] focus-visible:bg-white focus-visible:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">E-mailadres</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="jouw@email.nl"
                                    value={leadEmail}
                                    onChange={(e) => setLeadEmail(e.target.value)}
                                    className="flex h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#152c31] focus-visible:bg-white focus-visible:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="max-w-sm mx-auto pt-4">
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
                            className="w-full font-bold shadow-xl text-lg h-14 rounded-xl bg-gradient-to-r from-[#152c31] to-[#1e3c42] hover:opacity-90 transition-opacity"
                        >
                            Bekijk Resultaat
                            <ArrowRight className="ml-3 h-6 w-6" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
      <Card className="w-full max-w-2xl mx-auto mt-10 md:mt-16 border shadow-sm bg-card overflow-hidden rounded-3xl animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pt-8 pb-6 relative">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
            <Award className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">Quiz Afgerond!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 px-6 md:px-10 pb-10">
           {/* Score Section */}
          <div className="py-8 bg-muted rounded-3xl border flex flex-col items-center justify-center max-w-[400px] mx-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3">JOUW RESULTAAT</p>
            <div className="flex items-baseline gap-2 mb-4">
                <p className="text-6xl md:text-7xl font-black text-foreground tracking-tighter">
                   {score}
                </p>
                <span className="text-2xl md:text-3xl text-muted-foreground font-bold">/ {quiz.questions.length}</span>
            </div>
             {isLoggedIn && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                    <Award className="h-3.5 w-3.5" /> + {earnedXp ?? Math.round((typeof quiz.rewardXp === 'number' ? quiz.rewardXp : 50) * (score / quiz.questions.length))} XP verdiend
                </div>
            )}
          </div>
          
          <p className="text-lg font-medium text-muted-foreground italic font-serif px-4 max-w-md mx-auto leading-relaxed">
            {score === quiz.questions.length ? "Uitmuntend! Een ware schriftgeleerde." : 
             score > quiz.questions.length / 2 ? "Goed gedaan! Blijf de schriften onderzoeken." : "Blijf oefenen, de volhouder wint."}
          </p>

          {/* Premium/Auth Teaser Section */}
          <div className="mt-12 space-y-4 max-w-md mx-auto">
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
        <CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12 pt-4">
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
            <RotateCcw className="mr-2 h-5 w-5" /> Opnieuw Spelen
          </Button>
          <Button onClick={() => router.push(isLoggedIn ? '/dashboard' : '/')} className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-gradient-to-r from-[#152c31] to-[#1e3c42] hover:opacity-90 shadow-lg border-0 rounded-xl" disabled={isSaving}>
             {isSaving ? "Opslaan..." : isLoggedIn ? "Naar Dashboard" : "Terug naar Home"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Calculate progress
  const progress = ((currentIndex) / quiz.questions.length) * 100;

  return (
    <div className="flex-1 w-full flex flex-col md:flex-row relative transition-all duration-700 ease-in-out bg-white rounded-2xl md:rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-[#d6e2fa]/20">
        
        {/* Left Side: Progress, Title, Controls */}
        <div className="w-full md:w-[45%] lg:w-[40%] bg-[#eef4ff] p-4 md:p-10 lg:p-12 flex flex-col justify-between border-r border-[#d6e2fa]/50 relative shrink-0">
            {/* Top Navigation */}
            <div className="flex justify-between items-center w-full mb-4 md:mb-8 font-sans">
                <Button variant="ghost" size="sm" className="text-[#547ee9] hover:bg-[#547ee9]/10 font-bold px-0 hover:text-[#3d62c2] transition-colors -ml-2" onClick={() => router.push('/quizzes')}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" strokeWidth={2.5} /> Homepage
                </Button>
                <div className="flex items-center gap-1 text-[#547ee9] relative">
                    <Badge className="md:hidden bg-[#1a2942] text-amber-400 hover:bg-[#1a2942] text-xs h-7 px-2.5 rounded-full font-black border-2 border-amber-400/20 mr-1">{score} pt</Badge>
                    <Button variant="ghost" size="icon" className="hover:bg-[#547ee9]/10 rounded-xl max-md:h-8 max-md:w-8" onClick={toggleFullscreen} title="Volledig scherm">
                        <Maximize className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className={`hover:bg-[#547ee9]/10 rounded-xl max-md:h-8 max-md:w-8 ${isSettingsOpen ? 'bg-[#547ee9]/10' : ''}`} onClick={() => setIsSettingsOpen(!isSettingsOpen)} title="Instellingen">
                        <Settings className="h-4 w-4" />
                    </Button>

                    {/* Settings Overlay */}
                    {isSettingsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                            <div className="absolute top-full mt-2 right-0 z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 animate-in fade-in zoom-in-95 duration-200 text-left font-sans">
                                <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Instellingen</h4>
                                <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Tekstgrootte</span>
                                    <div className="flex gap-1">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setTextSize('normal')}
                                            className={`h-8 px-2 ${textSize === 'normal' ? 'bg-[#547ee9]/10 border-[#547ee9] text-[#547ee9]' : ''}`}
                                        >
                                            <span className="text-xs">Aa</span>
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setTextSize('large')}
                                            className={`h-8 px-2 ${textSize === 'large' ? 'bg-[#547ee9]/10 border-[#547ee9] text-[#547ee9]' : ''}`}
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
                                            <span className="text-[10px] text-[#547ee9] font-bold uppercase tracking-tighter flex items-center gap-0.5">
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
                                        className={`h-8 w-12 ${showExplanation ? 'bg-[#547ee9] text-white' : ''} transition-all`}
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
                </div>
            </div>

            {/* Question Details */}
            <div className="flex flex-col flex-grow justify-center py-2 md:py-4">
                <p className="text-[#547ee9]/80 font-bold text-base md:text-xl mb-2 md:mb-6 tracking-wide">
                    vraag {currentIndex + 1}/{quiz.questions.length}
                </p>
                <h1 className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} text-[#1a2942] font-black ${textSize === 'large' ? 'text-[26px] md:text-4xl lg:text-5xl' : 'text-2xl md:text-4xl lg:text-4xl'} leading-[1.15] md:leading-[1.1] tracking-tight mb-2 md:mb-4`}>
                    {currentQuestion.text}
                </h1>
                <p className="text-[#648be3] font-semibold text-sm md:text-xl mt-1 md:mt-2">
                    Selecteer een antwoord
                </p>
            </div>

            {/* Bottom Brand */}
            <div className="hidden md:flex justify-between items-end mt-8">
                 <h2 className="text-3xl font-black text-[#547ee9] tracking-tighter">
                    Bijbel<span className="text-[#1a2942]">quiz</span>
                 </h2>
                 <div className="text-right">
                    <span className="text-xs font-bold text-[#648be3] uppercase tracking-widest block mb-1">Score</span>
                    <Badge className="bg-[#1a2942] text-amber-400 hover:bg-[#1a2942] text-sm md:text-base h-8 px-3 rounded-full font-black border-2 border-amber-400/20">{score}</Badge>
                 </div>
            </div>
        </div>

        {/* Right Side: Options & Actions */}
        <div className="w-full md:w-[55%] lg:w-[60%] bg-white px-4 py-6 md:px-10 md:py-8 lg:px-12 lg:py-10 flex flex-col justify-center relative overflow-y-auto">
            {/* Progress Bar (Top) */}
            <div className="absolute top-0 left-0 w-full h-1.5 md:h-2 bg-slate-100">
                <div className="bg-[#547ee9] h-full transition-all duration-700 ease-out" style={{ width: `${Math.max(2, progress)}%` }}></div>
            </div>

            <div className="w-full max-w-2xl mx-auto flex-grow flex flex-col justify-center pt-4 md:pt-8">
                {/* Answers List */}
                <div className="flex flex-col gap-2.5 md:gap-3 w-full">
                    {currentQuestion.answers.map((answer, index) => {
                        let className = `group justify-start text-left h-auto px-4 md:px-5 w-full text-sm md:text-base transition-all relative border-[2px] md:border-[2.5px] rounded-xl md:rounded-2xl font-bold active:scale-[0.99] ${textSize === 'large' ? 'py-3 md:py-5 text-base md:text-lg' : 'py-2.5 md:py-4'}`;
                        const variant: "outline" | "default" | "secondary" = "outline";

                        if (hasAnswered) {
                            if (answer.isCorrect) {
                                className += " bg-emerald-50/50 border-emerald-500 text-emerald-950 shadow-none ring-2 ring-emerald-100 ring-offset-1";
                            } else if (index === selectedAnswer) {
                                className += " bg-red-50/50 border-red-500 text-red-950 shadow-none";
                            } else {
                                className += " opacity-50 border-slate-200 bg-slate-50 text-slate-500";
                            }
                        } else {
                            className += " border-slate-200 bg-white hover:bg-slate-50/80 hover:border-[#547ee9]/40 hover:text-[#547ee9] text-slate-700 shadow-sm";
                        }

                        return (
                            <Button
                                key={index}
                                variant={variant}
                                className={className}
                                onClick={() => handleAnswer(answer.isCorrect, index)}
                                disabled={hasAnswered}
                            >
                                <span className={`mr-3 md:mr-4 inline-flex h-4 w-4 md:h-5 md:w-5 shrink-0 items-center justify-center rounded-full border-[2.5px] transition-colors ${
                                    hasAnswered && answer.isCorrect ? "bg-emerald-500 border-emerald-500" : 
                                    hasAnswered && index === selectedAnswer ? "bg-red-500 border-red-500" : 
                                    "border-[#cbd5e1] group-hover:border-[#547ee9]"
                                }`}>
                                    {hasAnswered && answer.isCorrect && <CheckCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-white" strokeWidth={3.5} />}
                                    {hasAnswered && !answer.isCorrect && index === selectedAnswer && <XCircle className="h-3 w-3 md:h-3.5 md:w-3.5 text-white" strokeWidth={3.5} />}
                                </span>
                                <span className="flex-1 leading-snug">{answer.text}</span>
                            </Button>
                        );
                    })}
                </div>
                
                {/* Explanation Section */}
                {hasAnswered && showExplanation && (
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 mt-6 md:mt-8">
                        <div className={`rounded-2xl bg-white border-2 border-slate-100 ${textSize === 'large' ? 'p-6' : 'p-5 md:p-6'} relative overflow-hidden shadow-xl shadow-[#1a2942]/5`}>
                            <div className="absolute top-0 left-0 w-full h-[4px] bg-[#1a2942]"></div>
                            <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#1a2942] mb-3 md:mb-4">
                                <BookOpen className="h-4 w-4 text-[#1a2942]" strokeWidth={2.5} /> 
                                Uitleg
                            </h4>
                            
                            {isPremium ? (
                                <>
                                    <div className={`text-slate-600 ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} leading-relaxed mb-4 ${textSize === 'large' ? 'text-lg md:text-xl' : 'text-base md:text-[17px] font-medium'}`}>
                                        {currentQuestion.explanation || "Geen extra uitleg beschikbaar."}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-center mt-2 mb-4">
                                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 w-full mb-3 select-none relative overflow-hidden">
                                        <p className="text-sm text-slate-400 italic blur-[2.5px] opacity-70 font-serif">
                                            {currentQuestion.explanation?.substring(0, 80) || "Uitleg en verdieping beschikbaar voor Premium leden, ontdek nieuwe inzichten in de Bijbel."}...
                                        </p>
                                    </div>
                                    <Button size="lg" asChild className="bg-[#1a2942] hover:bg-[#121c2d] text-amber-400 gap-2 shadow-[0_6px_15px_-4px_rgba(26,41,66,0.3)] font-bold rounded-xl h-12 px-8">
                                        <Link href="/premium">
                                            <Lock className="h-5 w-5 text-amber-400" /> Ontgrendel Uitleg
                                        </Link>
                                    </Button>
                                </div>
                            )}
                            
                            {currentQuestion.bibleReference && (
                                <div className={`inline-flex items-center gap-2 text-xs font-bold bg-[#1a2942]/5 text-[#1a2942] border border-[#1a2942]/10 px-4 py-2 rounded-xl shadow-sm ${!isPremium ? 'mt-2' : ''}`}>
                                    <BookOpen className="h-3.5 w-3.5" />
                                    <span>Referentie: <strong>{currentQuestion.bibleReference}</strong></span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {hasAnswered && (
                <div className="mt-6 pt-5 pb-0 flex justify-end w-full max-w-2xl mx-auto border-t border-slate-100">
                    <Button size="default" onClick={handeNext} className="group px-6 md:px-8 font-bold shadow-[0_8px_20px_-6px_rgba(84,126,233,0.4)] text-sm md:text-base h-12 md:h-14 w-full md:w-auto rounded-xl bg-[#547ee9] hover:bg-[#476ecc] text-white transition-all hover:shadow-[0_12px_24px_-8px_rgba(84,126,233,0.5)] active:scale-[0.98]">
                        {currentIndex < quiz.questions.length - 1 ? "Volgende Vraag" : "Quiz Afronden"}
                        <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
}
