import Link from 'next/link';
import { connectDB, Quiz } from '@bijbelquiz/database';
import { Button } from '@/components/ui/button';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unstable_cache } from 'next/cache';
import { Metadata } from 'next';

import { PopularQuizzesSection } from '@/components/landing/PopularQuizzesSection';
import { PremiumSection } from '@/components/landing/PremiumSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { DownloadButtons } from '@/components/landing/DownloadButtons';

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

const getQuizzes = unstable_cache(
  async () => {
    try {
      await connectDB();
      // Get a good mix of quizzes. "Popular" mocked by just taking the first 4 for now to fit the layout.
      const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
      const popularQuizzes = await Quiz.find(statusFilter)
          .populate('categoryId')
          .limit(4)
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

// Removed force-dynamic to allow potential partial caching where possible
// export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    redirect('/dashboard');
  }

  const isPremiumUser = !!session?.user?.isPremium;
  const { popular } = await getQuizzes();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-visible pt-16 pb-20 md:pt-28 md:pb-32">

        <div className="container relative z-10 mx-auto px-4 max-w-[1600px] flex flex-col lg:flex-row items-center justify-between">
          <div className="w-full lg:w-[52%] pr-0 lg:pr-12 text-left p-6 rounded-2xl">
            <h1 className="mb-6 text-5xl md:text-[64px] leading-[1.1] font-bold text-[#1a2333] dark:text-white tracking-tight">
              Test je Bijbelkennis.<br />
              Groei in je geloof.
            </h1>
            <p className="mb-10 max-w-xl text-[#5c687e] dark:text-white/70 text-[19px] leading-[1.6]">
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
              
              <DownloadButtons />
            </div>
          </div>
          
          <div className="w-full lg:w-[48%] mt-16 lg:mt-0 relative h-162.5 flex justify-center items-center overflow-visible hidden md:flex p-6 rounded-2xl">
             {/* Hero mockup: smaller and nudged left so phones are not clipped */}
             <div
               className="absolute -right-2.5 top-0 w-195 h-195 scale-[1.02] transform-gpu pointer-events-none"
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

      <PopularQuizzesSection quizzes={popular} isPremiumUser={isPremiumUser} />
      <PremiumSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}

