import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Check, ShieldCheck, Crown, BookOpen, Star, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata: Metadata = {
  title: 'Premium Lidmaatschap | Ontgrendel Alles op BijbelQuiz',
  description: 'Word Premium en krijg onbeperkt toegang tot alle Bijbelquizzen, diepgaande studie-uitleg en uitgebreide statistieken. Investeer in je geloofskennis.',
  keywords: ['premium bijbelquiz', 'bijbelstudie abonnement', 'geloofsverdieping', 'onbeperkt quizzen', 'steun bijbelquiz'],
  alternates: {
    canonical: '/premium',
  },
  openGraph: {
     title: 'Premium Lidmaatschap - BijbelQuiz',
     description: 'Upgrade naar Premium voor de ultieme Bijbelquiz ervaring. Onbeperkt spelen en leren.',
     url: 'https://www.bijbelquiz.com/premium',
  }
};

const benefits = [
  { icon: BookOpen, text: "Alle 100+ quizzen" },
  { icon: Star, text: "Uitleg na elke vraag" },
  { icon: Trophy, text: "Voortgangsdashboard" },
  { icon: Zap, text: "Geen advertenties" },
];

export default async function PremiumPage() {
  const session = await getServerSession(authOptions);
  const isPremium = session?.user?.isPremium;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="pt-8 md:pt-16 pb-16">
        <div className="container mx-auto px-4 max-w-[1000px]">
          <Breadcrumb
            items={[
              { label: 'Premium' },
            ]}
            className="mb-8"
          />
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#1a2942] px-4 py-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Premium</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a2942] dark:text-foreground tracking-tight mb-4">
              Ontgrendel alles. ✨
            </h1>
            
            <p className="max-w-md mx-auto text-[#5c687e] dark:text-muted-foreground text-base leading-relaxed">
              Eenmalige betaling voor levenslange toegang.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto bg-white dark:bg-card rounded-2xl shadow-xl border border-gray-100 dark:border-border overflow-hidden">
            {/* Price Header */}
            <div className="p-6 text-center border-b border-gray-100 dark:border-border">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-lg font-bold text-[#5c687e] dark:text-muted-foreground">€</span>
                <span className="text-5xl font-bold tracking-tight text-[#1a2942] dark:text-foreground">9,99</span>
              </div>
              <p className="text-[#5c687e] dark:text-muted-foreground text-sm">Eenmalig • Levenslang</p>
            </div>

            {/* Benefits Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-muted/50">
                    <benefit.icon className="w-5 h-5 text-[#5b7dd9]" />
                    <span className="text-sm font-medium text-[#1a2942] dark:text-foreground">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              {isPremium ? (
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 rounded-full bg-[#5b7dd9]/10 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-5 w-5 text-[#5b7dd9]" />
                  </div>
                  <p className="font-bold text-[#1a2942] dark:text-foreground mb-1">Je hebt Premium!</p>
                  <p className="text-sm text-[#5c687e] dark:text-muted-foreground mb-4">Bedankt voor je steun.</p>
                  <Button asChild className="w-full h-12 text-base font-semibold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl">
                    <Link href="/quizzes">Naar de Quizzen</Link>
                  </Button>
                </div>
              ) : session ? (
                <form action="/api/stripe/checkout" method="POST">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base font-bold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Word Premium
                  </Button>
                </form>
              ) : (
                <Button asChild className="w-full h-12 text-base font-bold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all" size="lg">
                  <Link href="/api/auth/signin?callbackUrl=/premium">Maak account aan</Link>
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-muted/30 p-3 text-center border-t border-gray-100 dark:border-border">
              <p className="text-xs text-[#5c687e] dark:text-muted-foreground font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-[#5b7dd9]" />
                Veilige betaling via Stripe
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

