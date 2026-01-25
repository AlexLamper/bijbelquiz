import Link from 'next/link';
import { connectDB, Quiz } from '@bijbelquiz/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, CheckCircle2, Lock, Sparkles, Star, Trophy } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuizCard, { QuizItem } from '@/components/QuizCard';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BijbelQuiz - Gratis Online Bijbelquizzen & Geloofsverdieping',
  description: 'Test je kennis van de Bijbel met honderden gratis vragen. Van makkelijke quizzen voor beginners tot diepgaande studies voor gevorderden. Begin direct!',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'BijbelQuiz - Gratis Online Bijbelkennis Testen',
    description: 'Hoe goed ken jij de Bijbel? Doe de gratis test en leer meer over het geloof via interactieve quizzen.',
    url: 'https://www.bijbelquiz.com',
  },
};

// Removed force-dynamic to allow potential partial caching where possible
// export const dynamic = 'force-dynamic';

const getQuizzes = unstable_cache(
  async () => {
    try {
      await connectDB();
      // Get a good mix of quizzes. "Popular" mocked by just taking the first 9 for now.
      const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
      const popularQuizzes = await Quiz.find(statusFilter)
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
  },
  ['popular-quizzes-home'],
  { revalidate: 3600, tags: ['quizzes'] }
);


export default async function Home() {
  const session = await getServerSession(authOptions);
  const isPremiumUser = !!session?.user?.isPremium;
  const isLoggedIn = !!session;
  const { popular } = await getQuizzes();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
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
             <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-white dark:bg-card px-3 py-1 text-sm font-medium text-[#152c31] dark:text-primary-foreground shadow-sm hover:scale-105 transition-transform cursor-default">
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                <span className='dark:text-gray-200'>Nieuw: Meer dan 20+ nieuwe quizzen beschikbaar!</span>
              </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-foreground sm:text-5xl md:text-6xl lg:text-7xl font-serif">
              Speel gratis <span className="text-[#152c31] dark:text-[#254952] italic">bijbelquizzen</span> online
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 dark:text-muted-foreground md:text-xl leading-relaxed font-serif">
              Vergroot je bijbelkennis door quizzen over bijbelse personen, belangrijke gebeurtenissen en verschillende thema&apos;s, van Genesis tot Openbaring.
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
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
                </Link>
              </Button>
              {isLoggedIn ? (
                <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto h-14 px-8 text-base bg-white/40 backdrop-blur-md border-[#152c31]/20 text-[#152c31] rounded-full hover:bg-white/60 hover:text-black transition-all shadow-lg shadow-black/5 hover:-translate-y-0.5 dark:text-gray-200" 
                    asChild
                >
                    <Link href="/quizzes">Bekijk alle quizzen</Link>
                </Button>
              ) : (
                <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto h-14 px-8 text-base bg-white/40 backdrop-blur-md border-[#152c31]/20 text-[#152c31] dark:text-gray-200 rounded-full hover:bg-white/60 hover:text-black transition-all shadow-lg shadow-black/5 hover:-translate-y-0.5" 
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
            <h2 className="text-3xl font-bold tracking-tight text-[#152d2f] dark:text-foreground sm:text-4xl font-serif">Populaire Quizzen</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-gray-400">
              De meest gespeelde quizzen van dit moment. Waar begin jij mee?
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((quiz: QuizItem) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremiumUser} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" className="px-8 border-2 bg-[#f2f0ea] dark:bg-card dark:text-foreground dark:border-border" asChild>
              <Link href="/quizzes">Bekijk Alle Quizzen <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Premium Features Section - Redesigned */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-40">
            <div className="absolute top-0 right-0 w-125 h-125 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-125 h-125 bg-amber-200/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl text-center">
          <Badge className="mb-4 bg-[#152c31] text-white hover:bg-[#152c31] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-0">
            Premium Ervaring
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-slate-900 dark:text-foreground tracking-tight">
            Verdiep uw kennis met Premium
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed">
              Geen maandelijkse kosten. Eén eenmalige investering voor levenslange toegang tot alle tools, diepgang en voortgang.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-left mb-16">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-card p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-border hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group">
                <div className="w-14 h-14 bg-primary/5 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/10 group-hover:bg-primary dark:group-hover:bg-primary group-hover:text-white dark:group-hover:text-primary-foreground transition-colors duration-300">
                    <BookOpen className="h-7 w-7 text-primary dark:text-primary-foreground group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-foreground">Onbeperkt Toegang</h3>
                <p className="text-slate-600 dark:text-muted-foreground leading-relaxed mb-4">
                    Speel álle quizzen zonder restricties. Van beginners tot gevorderden, alle categorieën liggen voor u open.
                </p>
                <div className="pt-4 border-t border-slate-50 dark:border-border flex items-center text-primary dark:text-[#254952] font-bold text-sm">
                    Bekijk aanbod <ArrowRight className="ml-2 h-4 w-4" />
                </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#152c31] p-8 rounded-3xl shadow-2xl shadow-primary/20 border border-primary text-white -translate-y-4 md:scale-105 transition-all">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                    <Star className="h-7 w-7 text-amber-300 fill-amber-300" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Diepgaande Analyse</h3>
                <p className="text-white/80 leading-relaxed mb-4">
                    Na elke vraag ontvangt u uitgebreide uitleg, theologische context en directe Bijbelverwijzingen.
                </p>
                <Badge className="bg-amber-400 text-[#152c31] hover:bg-amber-300 border-0 font-bold">MEEST GEKOZEN</Badge>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-card p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-border hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group">
                <div className="w-14 h-14 bg-primary/5 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/10 group-hover:bg-primary dark:group-hover:bg-primary group-hover:text-white dark:group-hover:text-primary-foreground transition-colors duration-300">
                    <Trophy className="h-7 w-7 text-primary dark:text-primary-foreground group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">XP & Statistieken</h3>
                <p className="text-slate-600 dark:text-muted-foreground leading-relaxed mb-4">
                    Track uw groei op een persoonlijk dashboard. Verdien XP, verzamel badges en zie uw resultaten verbeteren.
                </p>
                <div className="pt-4 border-t border-slate-50 dark:border-border flex items-center text-primary dark:text-[#254952] font-bold text-sm">
                    Naar Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-[#152c31] p-10 md:p-16 shadow-2xl">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -m-16 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -m-16 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl"></div>
            <Star className="absolute right-10 top-10 h-32 w-32 text-white/5 rotate-12" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
                <div className="max-w-xl text-left">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-400/10 px-4 py-1.5 text-sm font-bold text-orange-400 border border-orange-400/20 backdrop-blur-sm">
                        <Star className="h-4 w-4 fill-current" /> BESTE KEUZE
                    </div>
                    <h3 className="mb-4 font-serif text-3xl font-bold text-white md:text-5xl">
                        Levenslang <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-200 to-orange-400 italic">Premium</span>
                    </h3>
                    <p className="text-lg text-slate-300">
                        Zeg vaarwel tegen maandelijkse abonnementen. Investeer één keer in je geloofskennis en geniet <strong className="text-white">voor altijd</strong> van onbeperkte toegang.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
                         <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#254952]" /> Geen terugkerende kosten</span>
                         <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#254952]" /> Alle toekomstige updates</span>
                    </div>
                </div>

                <div className="flex w-full flex-col items-center gap-4 md:w-auto">
                    <Button asChild size="lg" className="h-16 w-full rounded-xl bg-linear-to-r from-orange-400 to-orange-500 px-8 text-lg font-bold text-white shadow-[0_0_20px_rgba(251,146,60,0.4)] hover:shadow-[0_0_30px_rgba(251,146,60,0.6)] hover:scale-105 transition-all md:w-auto border border-orange-300/20">
                        <Link href="/premium">
                            Word Premium Lid <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                        <Lock className="h-4 w-4" /> Veilig via iDEAL of Card
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
