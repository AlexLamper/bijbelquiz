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
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" alt="Google Play" className="w-8 h-8" />
                  <div className="text-left flex flex-col leading-tight">
                    <span className="text-[10px] text-gray-300">Ontdek het op</span>
                    <span className="text-[17px] font-semibold tracking-wide">Google Play</span>
                  </div>
                </button>
              </div>
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
