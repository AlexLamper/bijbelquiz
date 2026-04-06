import Link from 'next/link';
import Image from 'next/image';
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
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-visible pt-8 pb-16 md:pt-10 md:pb-20 lg:pt-12 lg:pb-24">

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 2xl:px-32 max-w-[1800px] flex flex-col lg:flex-row items-center justify-between">
          <div className="w-full lg:w-[52%] pr-0 lg:pr-8 xl:pr-12 text-left p-4 sm:p-6 rounded-2xl">
            <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] 2xl:text-[64px] 3xl:text-[72px] leading-[1.1] font-bold text-[#1a2333] dark:text-white tracking-tight xl:max-w-none 2xl:max-w-none 3xl:max-w-none">
              Hoe goed ken jij de Bijbel? Ontdek het... 
            </h1> 
            <p className="mb-8 sm:mb-10 max-w-xl text-[#5c687e] dark:text-white/70 text-base sm:text-lg lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl leading-[1.6]">
              BijbelQuiz heeft tientallen quizzen.
              Kies uit verschillende categorieën,
              concureer tegen anderen op de ranglijst en leer elke dag iets nieuws over de Bijbel!
            </p>
            
            <div className="flex flex-col items-start gap-4 sm:gap-6 w-full sm:w-auto">
              {!session ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="h-12 sm:h-14 2xl:h-16 3xl:h-20 px-6 sm:px-8 2xl:px-12 3xl:px-16 text-base sm:text-lg 2xl:text-xl 3xl:text-2xl font-semibold bg-primary dark:bg-[#547ee9] hover:bg-primary/90 dark:hover:bg-[#476ecc] text-white rounded-2xl shadow-[0_8px_30px_rgb(84,126,233,0.3)] hover:-translate-y-1 transition-all w-full sm:w-auto" 
                    asChild
                  >
                    <Link href="/dashboard">
                        Speel direct online
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold border-2 border-[#5b7dd9]/30 text-[#5b7dd9] hover:bg-[#5b7dd9]/5 hover:border-[#5b7dd9] rounded-2xl transition-all w-full sm:w-auto" 
                    asChild
                  >
                    <Link href="/register">
                        Account aanmaken
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="h-12 sm:h-14 2xl:h-16 3xl:h-20 px-6 sm:px-8 2xl:px-12 3xl:px-16 text-base sm:text-lg 2xl:text-xl 3xl:text-2xl font-semibold bg-primary dark:bg-[#547ee9] hover:bg-primary/90 dark:hover:bg-[#476ecc] text-white rounded-2xl shadow-[0_8px_30px_rgb(84,126,233,0.3)] hover:-translate-y-1 transition-all" 
                  asChild
                >
                  <Link href="/dashboard">
                      Ga naar Dashboard
                  </Link>
                </Button>
              )}
              
              <DownloadButtons />
            </div>
          </div>
          
          <div className="w-full lg:w-[48%] mt-12 lg:mt-0 relative h-[300px] sm:h-[400px] lg:h-[450px] xl:h-[550px] flex justify-center items-center overflow-visible hidden md:flex p-6 rounded-2xl">
             {/* Hero mockup: scaled down contextually */}
             <div
               className="absolute -right-2.5 top-0 w-180 h-180 transform-gpu pointer-events-none scale-100 lg:scale-[0.8] xl:scale-90 transform-origin-right"
             >
               <Image 
                 src="/images/hero-image1.png"
                 alt="Hero image"
                 fill
                 priority
                 sizes="(max-width: 1024px) 100vw, 50vw"
                 className="object-contain object-right"
               />
             </div>
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

