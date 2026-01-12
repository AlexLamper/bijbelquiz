import Link from 'next/link';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, CheckCircle2, Lock, Sparkles, Star } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface Question {
  _id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface QuizItem {
  _id: string;
  title: string;
  description?: string;
  category: string;
  questions?: Question[];
  slug?: string;
  isPremium: boolean;
}

async function getQuizzes() {
  try {
    await connectDB();
    const freeQuizzes = await Quiz.find({ isPremium: false }).limit(6).lean();
    const premiumQuizzes = await Quiz.find({ isPremium: true }).limit(3).lean();
    
    return {
      free: JSON.parse(JSON.stringify(freeQuizzes)),
      premium: JSON.parse(JSON.stringify(premiumQuizzes))
    };
  } catch (e) {
    console.error("Database connection failed", e);
    return { free: [], premium: [] };
  }
}

function QuizCard({ quiz, isPremiumUser }: { quiz: QuizItem, isPremiumUser: boolean }) {
  const isLocked = quiz.isPremium && !isPremiumUser;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border/50 bg-card transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-1">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {quiz.category || 'Algemeen'}
          </span>
          {quiz.isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <Star className="h-3 w-3 fill-current" /> Premium
            </span>
          )}
        </div>
        <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
          {quiz.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
          {quiz.description || "Test je kennis en leer meer over dit onderwerp."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{quiz.questions?.length || 0} vragen</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Leerzaam</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button className="w-full gap-2 transition-transform active:scale-95" variant={isLocked ? "outline" : "default"} asChild>
          <Link href={`/quiz/${quiz.slug || quiz._id}`}>
            {isLocked ? (
              <>
                <Lock className="h-4 w-4" /> Ontgrendel
              </>
            ) : (
              <>
                Start Quiz <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isPremiumUser = !!session?.user?.isPremium;
  const { free, premium } = await getQuizzes();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-24">
        <div className="text-center relative z-10 slide-in">
          <div className="mx-auto max-w-3xl">
             <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary shadow-sm">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Nieuw: Premium Bijbelstudies</span>
              </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl font-serif">
              Test je kennis van de <span className="text-primary italic">Bijbel</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed font-serif">
              De ultieme plek voor Bijbelquizzen. Daag jezelf uit, leer nieuwe feiten en verdiep je in de Schrift.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow" asChild>
                <Link href="#free-quizzes">Begin nu gratis</Link>
              </Button>
              {!isPremiumUser && (
                <Button 
                    size="lg" 
                    className="h-12 px-8 text-base bg-white/20 backdrop-blur-md border border-white/30 text-foreground hover:bg-white/30 hover:text-primary transition-all shadow-xl" 
                    asChild
                >
                  <Link href="/premium">Bekijk Premium</Link>
                </Button>
              )}
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> 100+ Quizzen
                </div>
                <div className="flex items-center gap-2">
                     <CheckCircle2 className="h-4 w-4 text-primary" /> Direct feedback
                </div>
                <div className="flex items-center gap-2">
                     <CheckCircle2 className="h-4 w-4 text-primary" /> Voortgang tracking
                </div>
            </div>
          </div>
        </div>
        
        {/* Background decorative texture/pattern could go here instead of blobs */}
      </section>

      {/* Free Quizzes Section */}
      <section id="free-quizzes" className="py-16 bg-white/50 rounded-[2.5rem] my-8 shadow-sm border-none">
        <div className="px-8 mx-auto">
          <div className="mb-12 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">Aanbevolen Quizzen</h2>
              <p className="mt-2 text-muted-foreground">Populaire quizzen om mee te beginnen.</p>
            </div>
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80" asChild>
              <Link href="/quizzes">Alle quizzen <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {free.map((quiz: QuizItem) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremiumUser} />
            ))}
            
            {/* Fallback layout if no quizzes */}
            {free.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                    Nog geen quizzen beschikbaar. Check later terug!
                </div>
            )}
          </div>
        </div>
      </section>

      {/* Premium Teaser */}
      <section className="py-20">
        <div className="mx-auto">
          <div className="mb-12 text-center">
             <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
              Premium Content
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl font-serif">
              Voor de serieuze student
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
              Ontgrendel exclusieve verdiepende content en daag jezelf uit.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {premium.map((quiz: QuizItem) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremiumUser} />
            ))}
             {premium.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white/40 p-12 text-center">
                    <Lock className="mb-4 h-12 w-12 text-primary/30" />
                    <h3 className="text-lg font-medium text-foreground">Binnenkort beschikbaar</h3>
                    <p className="text-muted-foreground">We werken hard aan nieuwe premium studies.</p>
                </div>
            )}
          </div>
          
          {!isPremiumUser && (
            <div className="mt-12 text-center">
               <Button size="lg" asChild>
                  <Link href="/premium">Word Premium Lid</Link>
               </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
