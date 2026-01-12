import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function PremiumPage() {
  const session = await getServerSession(authOptions);
  const isPremium = session?.user?.isPremium;

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <h1 className="mb-6 text-4xl font-extrabold text-center font-serif">Premium Toegang</h1>
        
        <Card className="w-full max-w-md shadow-xl bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-amber-500">Volledige Toegang</CardTitle>
            <CardDescription>Ontgrendel alle quizzen en functies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              <li className="flex items-center">✅ Onbeperkt toegang tot alle quizzen</li>
              <li className="flex items-center">✅ Exclusieve diepgaande studies</li>
              <li className="flex items-center">✅ Geen advertenties (toekomst)</li>
              <li className="flex items-center">✅ Ondersteun de ontwikkeling</li>
            </ul>
            
            <div className="text-center py-4">
              <span className="text-4xl font-bold">€9.99</span>
              <span className="text-slate-500 text-sm ml-2">/ eenmalig</span>
            </div>

            {isPremium ? (
              <div className="rounded bg-green-100 p-4 text-center text-green-700 font-bold border border-green-300">
                Je bent al Premium lid! Bedankt!
              </div>
            ) : (
              <div className="space-y-4">
                 {session ? (
                   <form action="/api/stripe/checkout" method="POST">
                      <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold" size="lg">
                        Betaal via Stripe
                      </Button>
                   </form>
                 ) : (
                   <div className="text-center">
                      <p className="mb-4 text-sm text-slate-500">Je moet ingelogd zijn om te upgraden.</p>
                      <Button asChild className="w-full" variant="outline">
                        <Link href="/api/auth/signin?callbackUrl=/premium">Inloggen</Link>
                      </Button>
                   </div>
                 )}
              </div>
            )}
            
            <p className="text-xs text-center text-slate-400">
              Veilig betalen via Stripe. 14 dagen niet-goed-geld-terug.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
