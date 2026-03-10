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
      <section className="relative overflow-visible pt-16 pb-20 md:pt-28 md:pb-32 bg-linear-to-b from-[#eaf0fc] to-[#e1e9fb]">
        {/* Soft centered light gradient glow matching design background */}
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_center_center] from-white/40 via-transparent to-transparent pointer-events-none" />
        
        <div className="container relative z-10 mx-auto px-4 max-w-[1600px] flex flex-col lg:flex-row items-center justify-between">
          <div className="w-full lg:w-[52%] pr-0 lg:pr-12 text-left p-6 rounded-2xl">
            <h1 className="mb-6 text-5xl md:text-[64px] leading-[1.1] font-bold text-[#1a2333] tracking-tight">
              Test je Bijbelkennis.<br />
              Groei in je geloof.
            </h1>
            <p className="mb-10 max-w-xl text-[#5c687e] text-[19px] leading-[1.6]">
              Speel de ultieme Bijbelquiz thuis en onderweg.<br />
              Kies uit tientallen categorieën in de Statenvertaling,<br />
              verdien XP en leer elke dag iets nieuws over<br />
              het Woord.
            </p>
            
            <div className="flex flex-col items-start gap-6">
              <Button 
                size="lg" 
                className="h-16 px-12 text-xl font-semibold bg-[#547ee9] hover:bg-[#476ecc] text-white rounded-2xl shadow-[0_8px_30px_rgb(84,126,233,0.3)] hover:-translate-y-1 transition-all w-full sm:w-auto" 
                asChild
              >
                <Link href="/quizzes">
                    Speel direct online
                </Link>
              </Button>
              
              <div className="flex flex-row gap-4 w-full sm:w-auto mt-2">
                {/* App Store Badge Block mockups */}
                <button className="flex items-center justify-center gap-3 bg-[#1d1d1f] hover:bg-black text-white h-14 px-6 rounded-2xl transition-colors min-w-[160px]">
                  <svg viewBox="0 0 384 512" className="w-8 h-8 fill-current">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div className="text-left flex flex-col leading-tight">
                    <span className="text-[10px] text-gray-300">Download in de</span>
                    <span className="text-[17px] font-semibold tracking-wide">App Store</span>
                  </div>
                </button>
                
                <button className="flex items-center justify-center gap-3 bg-[#1d1d1f] hover:bg-black text-white h-14 px-6 rounded-2xl transition-colors min-w-[160px]">
                  <svg viewBox="0 0 512 512" className="w-8 h-8 overflow-visible">
                    <path fill="#4caf50" d="M38.8 36.3L275 272.5 359 188.4 65.6 22.8c-12.8-7.3-26.8 13.5-26.8 13.5z"/>
                    <path fill="#2196f3" d="M38.8 475.7c0 10.1 6.8 17.6 17.5 17.6 4.9 0 9.8-1.5 14.1-4.2l356.5-200.7-85.1-85-303 303z"/>
                    <path fill="#ffc107" d="M426.9 288.5l65.1-36.6c11.3-6.4 18.2-18 18.2-31 0-12.8-6.7-24.2-17.8-30.7l-65.7-38.3-85 85 85.2 86.6z"/>
                    <path fill="#f44336" d="M38.8 36.3v439.4L275 272.5 38.8 36.3z"/>
                  </svg>
                  <div className="text-left flex flex-col leading-tight">
                    <span className="text-[10px] text-gray-300">Ontdek het op</span>
                    <span className="text-[17px] font-semibold tracking-wide">Google Play</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-[48%] mt-16 lg:mt-0 relative h-[650px] flex justify-center items-center overflow-visible hidden md:flex p-6 rounded-2xl">
             {/* Hero mockup: smaller and nudged left so phones are not clipped */}
             <div
               className="absolute right-[-10px] top-0 w-[780px] h-[780px] scale-[1.02] transform-gpu pointer-events-none"
               style={{
                 backgroundImage: "url('/images/hero-image1.png')",
                 backgroundSize: 'contain',
                 backgroundRepeat: 'no-repeat',
                 backgroundPosition: "center right",
               }}
             />
          </div>
        </div>
      </section>

      {/* Popular Quizzes Grid */}
      <section id="popular" className="py-20 relative bg-white border-t border-[#e2e8f0]">
        <div className="container mx-auto px-4 max-w-7xl animate-float-in">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1a2333] dark:text-foreground sm:text-4xl font-serif">Populaire Quizzen</h2>
            <p className="mt-4 text-lg text-[#5c687e] dark:text-gray-400">
              De meest gespeelde quizzen van dit moment. Begin direct met spelen!
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((quiz: QuizItem) => (
              <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremiumUser} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" className="px-8 border-2 bg-transparent border-[#e2e8f0] text-[#1a2333] hover:bg-[#eaf0fc] dark:bg-card dark:text-foreground dark:border-border rounded-full font-semibold transition-colors" asChild>
              <Link href="/quizzes">Bekijk Alle Quizzen <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-24 relative overflow-hidden bg-linear-to-b from-[#f8fafc] to-white">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <Badge className="mb-4 bg-[#eaf0fc] text-[#547ee9] hover:bg-[#dfe8fa] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-0">
            Premium Ervaring
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-[#1a2333] dark:text-foreground tracking-tight">
            Verdiep uw kennis
          </h2>
          <p className="text-lg md:text-xl text-[#5c687e] dark:text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed">
              Geen maandelijkse kosten. Eén eenmalige investering voor levenslange toegang tot alle quizzen en Bijbelse verdieping.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-left mb-16">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-card p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1f5f9] dark:border-border hover:shadow-[0_8px_30px_rgb(84,126,233,0.1)] transition-all duration-300 group">
                <div className="w-14 h-14 bg-[#eaf0fc] rounded-2xl flex items-center justify-center mb-6 border border-[#dfe8fa] group-hover:bg-[#547ee9] group-hover:text-white transition-colors duration-300">
                    <BookOpen className="h-7 w-7 text-[#547ee9] group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1a2333] dark:text-foreground">Onbeperkt Toegang</h3>
                <p className="text-[#5c687e] dark:text-muted-foreground leading-relaxed mb-4">
                    Speel álle quizzen zonder restricties. Van beginners tot gevorderden, alle categorieën liggen voor u open.
                </p>
                <div className="pt-4 border-t border-[#f1f5f9] dark:border-border flex items-center text-[#547ee9] font-bold text-sm">
                    Bekijk aanbod <ArrowRight className="ml-2 h-4 w-4" />
                </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#1a2333] p-8 rounded-3xl shadow-[0_20px_40px_rgb(26,35,51,0.2)] border border-[#2d3748] text-white -translate-y-4 md:scale-105 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#547ee9]/20 rounded-full blur-[40px]"></div>
                <div className="w-14 h-14 bg-[#2d3748] rounded-2xl flex items-center justify-center mb-6 border border-[#3e4c63]">
                    <Star className="h-7 w-7 text-amber-300 fill-amber-300" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Diepgaande Analyse</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                    Na elke vraag ontvangt u uitgebreide uitleg, theologische context en directe Bijbelverwijzingen.
                </p>
                <Badge className="bg-[#547ee9] text-white hover:bg-[#476ecc] border-0 font-bold px-3 py-1 mt-2">MEEST GEKOZEN</Badge>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-card p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1f5f9] dark:border-border hover:shadow-[0_8px_30px_rgb(84,126,233,0.1)] transition-all duration-300 group">
                <div className="w-14 h-14 bg-[#eaf0fc] rounded-2xl flex items-center justify-center mb-6 border border-[#dfe8fa] group-hover:bg-[#547ee9] group-hover:text-white transition-colors duration-300">
                    <Trophy className="h-7 w-7 text-[#547ee9] group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1a2333] dark:text-foreground">XP & Statistieken</h3>
                <p className="text-[#5c687e] dark:text-muted-foreground leading-relaxed mb-4">
                    Track uw groei op een persoonlijk dashboard. Verdien XP, verzamel badges en zie uw resultaten verbeteren.
                </p>
                <div className="pt-4 border-t border-[#f1f5f9] dark:border-border flex items-center text-[#547ee9] font-bold text-sm">
                    Naar Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-[#547ee9] p-10 md:p-16 shadow-[0_20px_40px_rgb(84,126,233,0.3)]">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-[60px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-[60px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
                <div className="max-w-xl text-left">
                    <h3 className="mb-4 font-serif text-3xl font-bold text-white md:text-5xl">
                        Levenslang <span className="font-sans font-extrabold text-[#ffe270]">Premium</span>
                    </h3>
                    <p className="text-lg text-blue-100">
                        Zeg vaarwel tegen maandelijkse abonnementen. Investeer één keer in je geloofskennis en geniet <strong className="text-white">voor altijd</strong> van onbeperkte toegang.
                    </p>
                </div>

                <div className="flex w-full flex-col items-center gap-4 md:w-auto">
                    <Button asChild size="lg" className="h-16 w-full rounded-2xl bg-white px-10 text-lg font-bold text-[#547ee9] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all md:w-auto">
                        <Link href="/premium">
                            Word Premium Lid <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-200">
                        <Lock className="h-4 w-4" /> Veilig betalen in de app
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
