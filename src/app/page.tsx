import Link from 'next/link';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, CheckCircle2, Lock, Sparkles, Star, Layout, Trophy } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface Question {
  _id: string;
  text: string;
}

interface Category {
    title: string;
}

interface QuizItem {
  _id: string;
  title: string;
  description?: string;
  categoryId?: Category;
  questions?: Question[];
  slug?: string;
  isPremium: boolean;
}

async function getQuizzes() {
  try {
    await connectDB();
    // Get a good mix of quizzes. "Popular" mocked by just taking the first 9 for now.
    const popularQuizzes = await Quiz.find({})
        .populate('categoryId')
        .limit(9)
        .sort({ isPremium: 1, sortOrder: 1 }) // Show free first or intentional mix
        .lean();
    
    return {
      popular: JSON.parse(JSON.stringify(popularQuizzes)),
    };
  } catch (e) {
    console.error("Database connection failed", e);
    return { popular: [] };
  }
}

function QuizCard({ quiz, isPremiumUser }: { quiz: QuizItem, isPremiumUser: boolean }) {
  const isLocked = quiz.isPremium && !isPremiumUser;
  const categoryName = quiz.categoryId?.title || 'Algemeen';

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-0 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-700 hover:bg-slate-200">
             {categoryName}
          </Badge>
          {quiz.isPremium && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
              <Star className="h-3 w-3 fill-white/90 text-white/90" /> PRO
            </span>
          )}
        </div>
        <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors font-serif">
          {quiz.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground min-h-[40px]">
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
        <Button className="w-full gap-2 transition-transform active:scale-95 shadow-sm" variant={isLocked ? "outline" : "default"} asChild>
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
  const isLoggedIn = !!session;
  const { popular } = await getQuizzes();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 animate-float-in">
        <div className="absolute inset-0 z-0 pointer-events-none" 
             style={{
                backgroundImage: 'linear-gradient(to right, rgba(160, 150, 140, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 150, 140, 0.08) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
             }}
        />
        
        <div className="text-center relative z-10 px-4">
          <div className="mx-auto max-w-4xl">
             <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-sm font-medium text-primary shadow-sm hover:scale-105 transition-transform cursor-default">
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                <span>Nieuw: Meer dan 20+ nieuwe quizzen beschikbaar!</span>
              </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl font-serif">
              Test je kennis van de <span className="text-primary italic">Bijbel</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 md:text-xl leading-relaxed font-serif">
              De leukste manier om samen of alleen de Bijbel te ontdekken. Speel diverse quizzen, houd je scores bij en verbeter je kennis op een ontspannen manier.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                size="lg" 
                className="group relative w-full sm:w-auto h-14 px-10 text-lg rounded-full bg-[#152c31] hover:bg-[#1f3e44] border-t border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 active:translate-y-0 overflow-hidden" 
                asChild
              >
                <Link href="#popular">
                    <span className="relative z-10 font-bold text-white tracking-wide drop-shadow-md">Direct Spelen</span>
                     {/* Bubble shine effect */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </Link>
              </Button>
              {isLoggedIn ? (
                <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto h-14 px-8 text-base bg-white/40 backdrop-blur-md border-[#152c31]/20 text-[#152c31] rounded-full hover:bg-white/60 hover:text-black transition-all shadow-lg shadow-black/5 hover:-translate-y-0.5" 
                    asChild
                >
                    <Link href="/quizzes">Bekijk alle quizzen</Link>
                </Button>
              ) : (
                <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto h-14 px-8 text-base bg-white/40 backdrop-blur-md border-[#152c31]/20 text-[#152c31] rounded-full hover:bg-white/60 hover:text-black transition-all shadow-lg shadow-black/5 hover:-translate-y-0.5" 
                    asChild
                >
                    <Link href="/login">Aanmelden</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Quizzes Grid */}
      <section id="popular" className="py-20">
        <div className="container mx-auto px-4 max-w-7xl rounded-3xl p-4 md:p-8 animate-float-in">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#152d2f] sm:text-4xl font-serif">Populaire Quizzen</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              De meest gespeelde quizzen van dit moment. Waar begin jij mee?
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((quiz: QuizItem) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremiumUser} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" className="px-8 border-2" asChild>
                <Link href="/quizzes">Bekijk Alle Quizzen <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features / Why Join */}
      <section className="py-20 border-t border-slate-200/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
                 <Badge className="mb-4 bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Premium Functies</Badge>
                <h2 className="text-3xl font-bold font-serif mb-4 text-slate-900">Nog meer plezier & uitdaging</h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                    BijbelQuiz is gratis voor iedereen. Maar wil je onbeperkt toegang tot alle quizzen, uitgebreide uitleg per vraag en je klassement bijhouden?
                </p>
                <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span className="text-slate-700">Toegang tot <strong>Premium Quizzen</strong> (moeilijker niveau)</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span className="text-slate-700">Gedetailleerde <strong>uitleg & Bijbelverwijzingen</strong></span>
                    </li>
                    <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span className="text-slate-700">Geen afleiding, puur focus</span>
                    </li>
                </ul>
                <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Link href="/premium">Ontdek Premium</Link>
                </Button>
            </div>
            
            {/* Visual Representation */}
            <div className="grid grid-cols-2 gap-4">
                 <Card className="bg-white shadow-lg border-0 translate-y-4">
                     <CardContent className="p-6 flex flex-col items-center text-center">
                         <Layout className="h-8 w-8 text-primary mb-3" />
                         <span className="font-bold text-slate-800">Alle Categorieën</span>
                     </CardContent>
                 </Card>
                 <Card className="bg-amber-50 shadow-lg border-amber-100">
                     <CardContent className="p-6 flex flex-col items-center text-center">
                         <Star className="h-8 w-8 text-amber-500 mb-3 fill-amber-500" />
                         <span className="font-bold text-amber-900">Premium Content</span>
                     </CardContent>
                 </Card>
                 <Card className="bg-white shadow-lg border-0 col-span-2">
                     <CardContent className="p-6 flex flex-col items-center text-center flex-row justify-center gap-4">
                         <Trophy className="h-8 w-8 text-emerald-500" />
                         <div>
                            <span className="block font-bold text-slate-800 text-lg">XP & Badges</span>
                            <span className="text-xs text-slate-500">Volg je voortgang</span>
                         </div>
                     </CardContent>
                 </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
