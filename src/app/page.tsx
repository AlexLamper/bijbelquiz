import { ArrowRight } from 'lucide-react';
import { connectDB, Quiz } from '@/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Eyebrow, InkButton } from '@/components/editorial';
import { PopularQuizzesSection } from '@/components/landing/PopularQuizzesSection';
import { MultiplayerHighlightSection } from '@/components/landing/MultiplayerHighlightSection';
import { PremiumSection } from '@/components/landing/PremiumSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { DownloadButtons } from '@/components/landing/DownloadButtons';
import { HeroMockup } from '@/components/landing/HeroMockup';

export const metadata: Metadata = {
  title: 'BijbelQuiz - Gratis Online Bijbelquizzen',
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

async function getQuizzes() {
  try {
    await connectDB();
    const statusFilter = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
    const popularQuizzes = await Quiz.find(statusFilter)
      .populate('categoryId')
      .limit(4)
      .sort({ isPremium: 1, sortOrder: 1 })
      .lean();

    return { popular: JSON.parse(JSON.stringify(popularQuizzes)) };
  } catch (e) {
    console.error('Database connection failed', e);
    return { popular: [] };
  }
}

const figures = [
  { value: '200+', label: 'Vragen' },
  { value: '8', label: 'Categorieën' },
  { value: '3', label: 'Niveaus' },
  { value: 'Gratis', label: 'Om te spelen' },
];

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect('/dashboard');
  }

  const isPremiumUser = !!session?.user?.isPremium;
  const { popular } = await getQuizzes();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-paper">
      {/* Hero */}
      <section id="hero">
        <div className="mx-auto w-full max-w-[1180px] px-5 pb-10 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-16">
            <div className="min-w-0">
              <Eyebrow>Gratis Bijbelquizzen</Eyebrow>

              <h1 className="mt-7 font-display text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[46px] lg:text-[58px]">
                Hoe goed ken jij de <span className="text-lapis">Bijbel</span>? Ontdek het...
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-[17px]">
                BijbelQuiz heeft tientallen quizzen. Kies uit verschillende categorieën,
                concurreer met anderen op de ranglijst en leer elke dag iets nieuws over de
                Bijbel!
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <InkButton
                  href="/registreren"
                  className="group h-13 w-full px-7 text-[15px] font-semibold sm:w-auto lg:h-14 lg:px-8 lg:text-base"
                >
                  Speel direct online
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </InkButton>
                <DownloadButtons compactOnMobile className="lg:h-14 lg:px-6" />
              </div>
            </div>

            <HeroMockup />
          </div>
        </div>

        {/* Figures rail: one line, always. */}
        <div className="border-y border-rule">
          <div className="mx-auto grid w-full max-w-[1180px] grid-cols-2 gap-x-4 gap-y-3 px-5 py-5 sm:grid-cols-4 sm:gap-x-0 sm:gap-y-0 sm:px-8 sm:divide-x sm:divide-rule lg:px-10">
            {figures.map((figure) => (
              <div key={figure.label} className="flex min-w-0 items-baseline gap-2 sm:px-5 sm:first:pl-0 sm:last:pr-0">
                <span className="font-display text-[20px] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums sm:text-[24px]">
                  {figure.value}
                </span>
                <span className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                  {figure.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PopularQuizzesSection quizzes={popular} isPremiumUser={isPremiumUser} />
      <MultiplayerHighlightSection />
      <PremiumSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
