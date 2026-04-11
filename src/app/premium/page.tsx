import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
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

  if (!session) {
    redirect('/login?callbackUrl=/premium');
  }

  const isPremium = session?.user?.isPremium;
  const lifetimePriceLabel = process.env.NEXT_PUBLIC_PREMIUM_LIFETIME_PRICE_LABEL || '€74,99';
  const monthlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || '€5,99';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="pt-8 md:pt-16 pb-16">
        <div className="container mx-auto px-4 max-w-250">
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
              Ontgrendel alles.
            </h1>
            
            <p className="max-w-md mx-auto text-[#5c687e] dark:text-muted-foreground text-base leading-relaxed">
              Kies wat bij je past: maandelijks opzegbaar of levenslang in een keer.
            </p>

            {!session && (
              <p className="mt-4 text-sm font-medium text-[#1a2942] dark:text-foreground">
                Log eerst in om Premium te kopen, zodat je aankoop aan je account gekoppeld wordt.
              </p>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-card rounded-2xl shadow-xl border-2 border-[#5b7dd9] dark:border-[#5b7dd9]/80 overflow-hidden relative flex flex-col">
              <div className="absolute top-4 right-4 rounded-full bg-[#1a2942] text-white text-[10px] font-bold px-3 py-1 tracking-widest">MEEST GEKOZEN</div>
              <div className="p-6 text-center border-b border-gray-100 dark:border-border bg-[#5b7dd9]/5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary dark:text-[#5b7dd9] mb-3">Maandelijks</p>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-5xl font-bold tracking-tight text-[#1a2942] dark:text-foreground">{monthlyPriceLabel}</span>
                </div>
                <p className="text-[#5c687e] dark:text-muted-foreground text-sm">per maand • Opzegbaar wanneer je wil</p>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-muted/50">
                      <benefit.icon className="w-5 h-5 text-primary dark:text-[#5b7dd9]" />
                      <span className="text-sm font-medium text-[#1a2942] dark:text-foreground">{benefit.text}</span>
                    </div>
                  ))}
                </div>
                {isPremium ? (
                  <Button asChild className="w-full h-12 text-base font-semibold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl mt-auto">
                    <Link href="/quizzes">Je hebt Premium</Link>
                  </Button>
                ) : session ? (
                  <form action="/api/stripe/checkout" method="POST" className="mt-auto">
                    <input type="hidden" name="plan" value="monthly" />
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 text-base font-bold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      Start maandabonnement
                    </Button>
                  </form>
                ) : (
                  <Button asChild className="w-full h-12 text-base font-bold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all mt-auto" size="lg">
                    <Link href="/api/auth/signin?callbackUrl=/premium">Log in om te kopen</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-card rounded-2xl shadow-xl border border-gray-100 dark:border-border overflow-hidden flex flex-col">
              <div className="p-6 text-center border-b border-gray-100 dark:border-border">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary dark:text-[#5b7dd9] mb-3">Levenslang</p>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-5xl font-bold tracking-tight text-[#1a2942] dark:text-foreground">{lifetimePriceLabel}</span>
                </div>
                <p className="text-[#5c687e] dark:text-muted-foreground text-sm">eenmalig • Voor altijd toegang</p>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-2 mb-6">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-muted/50">
                      <Check className="w-4 h-4 text-primary dark:text-[#5b7dd9]" />
                      <span className="text-sm font-medium text-[#1a2942] dark:text-foreground">{benefit.text}</span>
                    </div>
                  ))}
                </div>
                {isPremium ? (
                  <div className="text-center h-full flex flex-col">
                    <div className="mx-auto h-10 w-10 rounded-full bg-[#5b7dd9]/10 flex items-center justify-center mb-3">
                      <ShieldCheck className="h-5 w-5 text-primary dark:text-[#5b7dd9]" />
                    </div>
                    <p className="font-bold text-[#1a2942] dark:text-foreground mb-1">Je hebt Premium!</p>
                    <p className="text-sm text-[#5c687e] dark:text-muted-foreground mb-4">Bedankt voor je steun.</p>
                    <Button asChild className="w-full h-12 text-base font-semibold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl mt-auto">
                      <Link href="/quizzes">Naar de Quizzen</Link>
                    </Button>
                  </div>
                ) : session ? (
                  <form action="/api/stripe/checkout" method="POST" className="mt-auto">
                    <input type="hidden" name="plan" value="lifetime" />
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 text-base font-bold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      Koop levenslang
                    </Button>
                  </form>
                ) : (
                  <Button asChild className="w-full h-12 text-base font-bold bg-[#5b7dd9] hover:bg-[#4a6bc7] text-white rounded-xl shadow-lg hover:-translate-y-0.5 transition-all mt-auto" size="lg">
                    <Link href="/api/auth/signin?callbackUrl=/premium">Log in om te kopen</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="md:col-span-2 bg-gray-50 dark:bg-muted/30 p-3 text-center border border-gray-100 dark:border-border rounded-xl">
              <p className="text-xs text-[#5c687e] dark:text-muted-foreground font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-primary dark:text-[#5b7dd9]" />
                Veilige betaling via Stripe
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

