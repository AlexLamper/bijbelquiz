import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import UserProgress from "@/models/UserProgress";
import "@/models/Quiz"; 
import "@/models/Category"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Trophy, Calendar, Star, TrendingUp, BookOpen, Plus, ShieldCheck } from "lucide-react";
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mijn Dashboard - BijbelQuiz',
  description: 'Bekijk je voortgang, streaks en behaalde badges.',
  robots: {
    index: false,
    follow: true,
  },
};

// Helper to calc streak
function calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const uniqueDates = Array.from(new Set(dates.map(d => new Date(d).setHours(0,0,0,0)))).sort((a,b) => b - a);
    
    const today = new Date().setHours(0,0,0,0);
    const yesterday = new Date(today - 86400000).setHours(0,0,0,0);
    
    // If last activity was before yesterday, streak is 0
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }
    
    let streak = 0;
    let expectedDate = uniqueDates[0];
    
    for (const d of uniqueDates) {
        if (d === expectedDate) {
            streak++;
            expectedDate -= 86400000;
        } else {
            break; 
        }
    }
    return streak;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  await connectDB();
  const userId = session.user.id;
  const isPremium = session.user.isPremium;

  // Fetch full progress with populated fields
  // Note: We use Deep Populate: Quiz -> Category
  interface PopulatedProgress {
    _id: string; 
    userId: string;
    quizId?: {
      _id: string;
      title: string;
      categoryId?: {
        _id: string;
        title: string;
        icon: string;
      };
    };
    score: number;
    totalQuestions: number;
    completedAt: Date;
  }

  const progressDocs = await UserProgress.find({ userId })
    .sort({ completedAt: -1 })
    .populate({
        path: 'quizId',
        select: 'title categoryId',
        populate: {
            path: 'categoryId',
            select: 'title icon'
        }
    })
    .lean() as unknown as PopulatedProgress[];

  // Basic Stats
  const totalQuizzes = progressDocs.length;
  const totalScore = progressDocs.reduce((acc, curr) => acc + curr.score, 0);
  const totalQuestions = progressDocs.reduce((acc, curr) => acc + curr.totalQuestions, 0);
  const averageAccuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  
  // Real Streak
  const completionDates = progressDocs.map(p => p.completedAt);
  const streak = calculateStreak(completionDates);

  // XP & Level Calculation
  const xp = totalScore * 10;
  let level = 1;
  let levelTitle = "Beginner";
  let nextLevelXp = 100;
  
  if (xp >= 1500) { level = 4; levelTitle = "Wijze"; nextLevelXp = 5000; }
  else if (xp >= 500) { level = 3; levelTitle = "Schriftgeleerde"; nextLevelXp = 1500; }
  else if (xp >= 100) { level = 2; levelTitle = "Onderzoeker"; nextLevelXp = 500; }

  const currentLevelBaseXp = level === 1 ? 0 : (level === 2 ? 100 : (level === 3 ? 500 : 1500));
  const levelProgress = Math.min(100, Math.round(((xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100));

  // Category Analysis
  const catStats: Record<string, { correct: number; total: number; title: string }> = {};
  progressDocs.forEach(p => {
      if (p.quizId?.categoryId) {
          const catTitle = p.quizId.categoryId.title;
          if (!catStats[catTitle]) {
              catStats[catTitle] = { correct: 0, total: 0, title: catTitle };
          }
          catStats[catTitle].correct += p.score;
          catStats[catTitle].total += p.totalQuestions;
      }
  });

  const categories = Object.values(catStats).map(c => ({
      title: c.title,
      percentage: Math.round((c.correct / c.total) * 100)
  })).sort((a,b) => b.percentage - a.percentage).slice(0, 3);

  // Badges Logic (Simple)
  const hasStreakBadge = streak >= 3;
  const hasPerfectScore = progressDocs.some(p => p.score === p.totalQuestions && p.totalQuestions >= 5);
  // const hasSpeedBadge = false; // Need time data for this

  return (
    <div className="container px-4 py-8 md:py-12 mx-auto max-w-6xl animate-float-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Welkom terug, {session.user.name?.split(' ')[0] || 'Bijbelstudent'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isPremium 
              ? "U bent een Premium lid. Uw studie vordert gestaag." 
              : "Upgrade naar Premium om uw volledige studievoortgang te ontsluiten."}
          </p>
        </div>
        {!isPremium && (
           <div className="flex gap-2">
             <Button asChild className="space-x-2 bg-primary hover:bg-primary/90">
                <Link href="/quizzes/create">
                    <Plus className="h-4 w-4" /> <span>Maak Quiz</span>
                </Link>
             </Button>
                         <Button asChild className="bg-[#152c31] hover:bg-[#1f3e44] text-white shadow-lg border-0 transition-transform hover:scale-105">
                             <Link href="/premium">
                                    <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" /> Word Premium
                             </Link>
                         </Button>
           </div>
        )}
        {isPremium && (
             <Button asChild className="space-x-2 bg-primary hover:bg-primary/90">
                <Link href="/quizzes/create">
                    <Plus className="h-4 w-4" /> <span>Maak Quiz</span>
                </Link>
             </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Stats */}
        <div className="md:col-span-8 flex flex-col gap-6">
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voltooide Quizzen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalQuizzes}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gemiddelde Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${averageAccuracy >= 80 ? 'text-emerald-600' : ''}`}>
                            {averageAccuracy}%
                        </div>
                    </CardContent>
                </Card>

                <Card className={`relative ${!isPremium ? 'opacity-80' : ''}`}>
                    <CardHeader className="pb-2">
                         <div className="flex justify-between items-center">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dagen Reeks</CardTitle>
                            {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                         {isPremium ? (
                             <div className="flex items-baseline gap-1">
                                <div className="text-3xl font-bold text-amber-600">{streak}</div>
                                <span className="text-sm text-muted-foreground">dagen</span>
                             </div>
                         ) : (
                             <div className="flex items-center justify-between">
                                 <div className="blur-sm select-none text-3xl font-bold text-muted-foreground">0</div>
                                 <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" asChild>
                                     <Link href="/premium">Bekijk</Link>
                                 </Button>
                             </div>
                         )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="font-serif text-xl">Recente Activiteit</CardTitle>
                </CardHeader>
                <CardContent>
                    {progressDocs.length === 0 ? (
                        <div className="text-center py-8 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground mb-4">U heeft nog geen quizzen gemaakt.</p>
                            <Button asChild variant="outline">
                                <Link href="/">Start uw eerste quiz</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {progressDocs.slice(0, 3).map((progress, i) => (
                                <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                                            ${progress.score === progress.totalQuestions 
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                : 'bg-secondary text-secondary-foreground'}
                                        `}>
                                            {progress.totalQuestions > 0 ? Math.round((progress.score / progress.totalQuestions) * 100) : 0}%
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm sm:text-base">
                                                {progress.quizId?.title || "Verwijderde Quiz"}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{new Date(progress.completedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</span>
                                                {progress.quizId?.categoryId?.title && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{progress.quizId.categoryId.title}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                       <span className="text-sm font-medium text-muted-foreground">
                                           {progress.score}/{progress.totalQuestions}
                                       </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Gamification/Profile */}
        <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* Level Card - Attempting to match height with StatsRow + Recent Activity visually or just filling space */}
             <Card className="bg-primary text-primary-foreground border-0 shadow-xl overflow-hidden relative flex-1 min-h-[300px] flex flex-col dark:bg-card dark:border-border dark:border dark:text-foreground">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-3xl dark:opacity-10"></div>
                
                <CardHeader>
                    <CardTitle className="text-primary-foreground/90 uppercase text-xs tracking-widest font-semibold flex items-center gap-2 dark:text-muted-foreground">
                        <Trophy className="h-4 w-4 text-amber-300 dark:text-amber-500" /> Uw Niveau
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8 pt-2 flex-1 flex flex-col justify-center">
                     <div className="mb-4 inline-flex items-center justify-center p-6 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-inner w-24 h-24 mx-auto dark:bg-muted/50 dark:border-border">
                        <BookOpen className="h-12 w-12 text-white dark:text-foreground" />
                     </div>
                     <h3 className="text-3xl font-serif font-bold mb-1">
                        {levelTitle}
                     </h3>
                     <p className="text-primary-foreground/70 text-sm mb-6 dark:text-muted-foreground">Niveau {level} • {xp} XP</p>

                     <div className="relative pt-1 px-2">
                        <div className="flex mb-2 items-center justify-between text-xs text-primary-foreground/80 dark:text-muted-foreground">
                            <span>Huidig</span>
                            <span>Volgend</span>
                        </div>
                        <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-black/20 dark:bg-secondary">
                            <div 
                                style={{ width: `${levelProgress}%` }} 
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-400 transition-all duration-1000"
                            ></div>
                        </div>
                        <p className="text-[10px] text-right text-primary-foreground/60 dark:text-muted-foreground/60">{nextLevelXp - xp} XP tot upgrade</p>
                     </div>
                </CardContent>
             </Card>

             {/* Badges - Will sit below and align with next row if any */}
        </div>

        {/* Full width row for remaining items to align bottom cards */}
        <div className="md:col-span-8">
             {/* Detailed Analytics (Locked for free users) */}
             <Card className={`overflow-hidden h-full ${!isPremium ? 'border-dashed' : ''}`}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                             <CardTitle className="font-serif flex items-center gap-2 text-xl">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Kennisanalyse
                             </CardTitle>
                             <CardDescription>Uw prestaties per categorie (Top 3).</CardDescription>
                        </div>
                        {!isPremium && <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900/50">Premium</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="relative min-h-[160px]">
                    {!isPremium && (
                         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                            {/* Blurred Background with gradient overlay */}
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-md dark:bg-background/80"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/90 dark:from-background/60 dark:to-background"></div>
                            
                            <div className="relative z-20 flex flex-col items-center">
                                <div className="mb-3 p-3 bg-orange-100 rounded-full border border-orange-200 shadow-sm animate-pulse-slow dark:bg-orange-900/30 dark:border-orange-800">
                                     <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="font-serif font-bold text-slate-800 mb-1 text-lg dark:text-foreground">Ontgrendel uw statistieken</h3>
                                <p className="text-slate-600 text-sm mb-5 max-w-xs leading-relaxed dark:text-muted-foreground">
                                    Zie precies welke onderwerpen u beheerst en waar u nog kunt groeien.
                                </p>
                                <Button size="sm" asChild className="bg-[#152c31] hover:bg-[#152c31]/90 text-white shadow-md rounded-lg px-6 dark:bg-primary dark:text-primary-foreground">
                                    <Link href="/premium">Bekijk Premium</Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-5 pt-2">
                        {categories.length > 0 ? categories.map((cat, i) => (
                             <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-2">
                                        <BookOpen className="h-3 w-3 text-muted-foreground" /> {cat.title}
                                    </span>
                                    <span className="font-bold text-primary">{cat.percentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all duration-1000 ease-out" 
                                        style={{ width: `${cat.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Maak meer quizzen om analyse te zien.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-4">
             {/* Badges */}
             <Card className="h-full">
                <CardHeader>
                     <CardTitle className="font-serif text-lg">Mijn Badges</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Streak Badge */}
                        <div className={`flex flex-col items-center p-2 text-center transition-all ${!hasStreakBadge ? 'opacity-40 grayscale blur-[0.5px]' : ''}`}>
                            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-2 border border-amber-200">
                                <Calendar className="h-6 w-6 text-amber-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Volhouder</span>
                        </div>

                         {/* Perfect Score Badge */}
                        <div className={`flex flex-col items-center p-2 text-center transition-all ${!hasPerfectScore ? 'opacity-40 grayscale blur-[0.5px]' : ''}`}>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 border border-blue-200">
                                <Trophy className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Expert</span>
                        </div>

                         {/* Premium Badge */}
                         {isPremium ? (
                               <div className="flex flex-col items-center p-2 text-center animate-float-in">
                                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-2 border border-purple-200 shadow-sm">
                                        <Star className="h-6 w-6 text-purple-600 fill-purple-200" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Supporter</span>
                                </div>
                         ) : (
                            <div className="flex flex-col items-center p-2 text-center opacity-50 grayscale group relative">
                                <Link href="/premium">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2 border border-dashed border-slate-300 hover:bg-slate-200 transition-colors">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                </Link>
                                <span className="text-xs font-medium text-slate-500">Premium</span>
                            </div>
                         )}
                    </div>
                </CardContent>
             </Card>
        </div>

      </div>
    </div>
  );
}
