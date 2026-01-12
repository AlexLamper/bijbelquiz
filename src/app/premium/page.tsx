import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function PremiumPage() {
  const session = await getServerSession(authOptions);
  const isPremium = session?.user?.isPremium;

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center animate-float-in">
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Upgrade naar Premium</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">Ontgrendel de volledige ervaring en verdiep je kennis met onbeperkte toegang.</p>
        </div>
        
        <Card className="w-full max-w-lg shadow-lg border-primary/20 bg-background/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Volledige Toegang
            </CardTitle>
            <CardDescription>Alles wat je nodig hebt om te groeien</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="text-center">
              <span className="text-5xl font-extrabold tracking-tight">€9.99</span>
              <span className="text-muted-foreground ml-2 font-medium">eenmalig</span>
            </div>

            <ul className="space-y-4">
              {[
                "Onbeperkte toegang tot alle quiz categorieën",
                "Gedetailleerde uitleg bij elk antwoord",
                "Geen advertenties, pure focus",
                "Steun de doorontwikkeling van het platform",
                "Exclusievebadges en profielopties"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="rounded-lg bg-primary/10 p-4 text-center border border-primary/20">
                <p className="font-semibold text-primary flex items-center justify-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Je bent al Premium lid
                </p>
                <p className="text-xs text-muted-foreground mt-1">Bedankt voor je steun!</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                 {session ? (
                   <form action="/api/stripe/checkout" method="POST">
                      <Button className="w-full h-12 text-base font-semibold shadow-md active:scale-95 transition-all" size="lg">
                        Word nu Premium
                      </Button>
                   </form>
                 ) : (
                   <div className="space-y-3">
                      <Button asChild className="w-full h-12 font-semibold" size="lg">
                        <Link href="/api/auth/signin?callbackUrl=/premium">Log in om te upgraden</Link>
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">Je hebt een account nodig om Premium te koppelen.</p>
                   </div>
                 )}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 p-4 justify-center">
             <p className="text-xs text-muted-foreground flex items-center gap-1.5">
               <ShieldCheck className="h-3 w-3" />
               Veilig betalen. 14 dagen niet-goed-geld-terug garantie.
             </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
