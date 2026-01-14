import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, ShieldCheck, Sparkles, BookOpen, Star, Trophy, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Premium Lidmaatschap - Word een Bijbelexpert',
  description: 'Download onbeperkt quizzen, bekijk gedetailleerde statistieken en steun BijbelQuiz.com met een eenmalige bijdrage.',
};

export default async function PremiumPage() {
  const session = await getServerSession(authOptions);
  const isPremium = session?.user?.isPremium;

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-20 flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4 max-w-3xl animate-in font-serif">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#152c31] text-white rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            Premium Toegang
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#152d2f]">
            Verdiep uw Studie
          </h1>
          <p className="text-slate-600 text-xl font-sans max-w-xl mx-auto leading-relaxed">
            Geen abonnement. Geen maandelijkse kosten. <br className="hidden md:block" />
            Eén eenmalige betaling voor levenslange toegang.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl w-full items-start">
            {/* Left side: Why Premium */}
            <div className="space-y-8 py-4">
                <h2 className="text-2xl font-bold font-serif text-[#152d2f]">Wat u krijgt</h2>
                
                <div className="space-y-6">
                    <div className="flex gap-4 group">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#152c31] group-hover:text-white transition-all">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Diepere Uitleg</h3>
                            <p className="text-slate-500 text-sm">Na elke vraag ontvangt u theologische context en Bijbelverwijzingen om direct verder te lezen.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 group">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#152c31] group-hover:text-white transition-all">
                            <Star className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Premium Content</h3>
                            <p className="text-slate-500 text-sm">Toegang tot gespecialiseerde quizzen en diepere onderwerpen die niet beschikbaar zijn in de gratis versie.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 group">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#152c31] group-hover:text-white transition-all">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Geavanceerde Statistieken</h3>
                            <p className="text-slate-500 text-sm">Track uw groei per Bijbelboek en zie exact waar uw kennis ligt en waar u nog kunt groeien.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 group">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#152c31] group-hover:text-white transition-all">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Geen Afleiding</h3>
                            <p className="text-slate-500 text-sm">Een volledig pure interface zonder advertenties of afleidingen, gericht op Gods woord.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Pricing Card */}
            <div className="relative">
                {/* Visual Accent */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary rounded-full blur-3xl opacity-20"></div>

                <Card className="w-full shadow-2xl border-0 bg-white relative overflow-hidden rounded-[32px] flex flex-col">
                    <div className="p-8 pt-12 text-center border-b border-slate-50 relative overflow-hidden">
                        {/* Subtle Background Pattern or Accent */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Sparkles className="h-24 w-24" />
                        </div>
                        
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 mb-6 font-bold uppercase tracking-widest text-[10px] px-4 py-1">
                            Premium Toegang
                        </Badge>
                        
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                            <span className="text-2xl font-bold text-slate-400">€</span>
                            <span className="text-6xl font-bold tracking-tight text-[#152c31]">9,99</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Levenslang • Eénmalige betaling</p>
                    </div>

                    <CardContent className="p-8 md:p-10 space-y-8 flex-1">
                        <ul className="space-y-5">
                            {[
                                { text: "Onbeperkte toegang tot alle quizzen", icon: Check },
                                { text: "Gedetailleerde uitleg & context", icon: Check },
                                { text: "Persoonlijk voortgangsdashboard", icon: Check },
                                { text: "Geen advertenties of afleiding", icon: Check },
                                { text: "Steun de BijbelQuiz missie", icon: Check }
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="mt-0.5 h-5 w-5 rounded-full bg-[#152c31]/5 flex items-center justify-center shrink-0">
                                        <item.icon className="h-3 w-3 text-[#152c31]" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 leading-tight">{item.text}</span>
                                </li>
                            ))}
                        </ul>

                        {isPremium ? (
                            <div className="rounded-2xl bg-[#152c31]/5 p-6 text-center border border-[#152c31]/10 animate-in fade-in duration-700">
                                <div className="mx-auto h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                                    <ShieldCheck className="h-6 w-6 text-amber-500" />
                                </div>
                                <h4 className="font-bold text-[#152c31] mb-1">Status: Premium</h4>
                                <p className="text-xs text-slate-500 font-medium mb-6">Bedankt voor uw waardevolle steun!</p>
                                <Button asChild className="w-full bg-[#152c31] hover:bg-black rounded-xl">
                                    <Link href="/quizzes">Naar de Quizzen</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-2">
                                {session ? (
                                    <form action="/api/stripe/checkout" method="POST">
                                        <Button className="w-full h-14 text-lg font-bold shadow-lg shadow-[#152c31]/10 bg-[#152c31] hover:bg-black rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5" size="lg">
                                            Nu Activeren
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="space-y-3">
                                        <Button asChild className="w-full h-14 font-bold text-lg bg-[#152c31] hover:bg-black rounded-2xl" size="lg">
                                            <Link href="/api/auth/signin?callbackUrl=/premium">Account Aanmaken</Link>
                                        </Button>
                                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Vereist voor Premium</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                    
                    <CardFooter className="bg-slate-50/80 p-6 flex flex-col items-center border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Gegarandeerd veilige betaling
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>

        {/* FAQ/Bottom Quote Section */}
        <div className="mt-32 max-w-3xl text-center">
            <h3 className="text-2xl font-serif font-bold text-[#152d2f] mb-6 italic">&quot;Onderzoekt de Schriften; want gij meent in dezelve het eeuwige leven te hebben.&quot;</h3>
            <p className="text-slate-500 leading-relaxed font-serif text-lg italic">
                De volledige opbrengst van Premium wordt gebruikt voor het platform: <br />
                Nieuwe vragen, betere techniek en meer tools voor Bijbelstudie.
            </p>
        </div>
      </main>
    </div>
  );
}

