import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User as UserIcon, Mail, Star, Calendar } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mijn Profiel - BijbelQuiz',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  await connectDB();
  const user = await User.findById(session.user.id);

  if (!user) {
    return <div>Gebruiker niet gevonden</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-serif mb-8 text-center text-foreground">Mijn Profiel</h1>

        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-primary/10">
          <CardHeader className="text-center border-b border-primary/10 pb-8">
            <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
               {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
               ) : (
                  <UserIcon className="w-12 h-12 text-primary" />
               )}
            </div>
            <CardTitle className="text-2xl font-serif">{user.name || 'Naamloos'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            
            <div className="mt-4 flex justify-center">
              {user.isPremium ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-600 border border-amber-200">
                  <Star className="h-4 w-4 fill-current" /> Premium Lid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 border border-slate-200">
                  Gratis Lid
                </span>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-background/50 border border-primary/5">
                <div className="flex items-center gap-3 mb-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email Adres</span>
                </div>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50 border border-primary/5">
                <div className="flex items-center gap-3 mb-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Lid sinds</span>
                </div>
                <p className="font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {!user.isPremium && (
              <div className="mt-8 p-6 rounded-xl bg-amber-50/50 border border-amber-200/50 text-center">
                <h3 className="font-serif font-bold text-lg mb-2 text-amber-900">Upgrade naar Premium</h3>
                <p className="text-amber-800/80 mb-4 text-sm">
                  Krijg toegang tot alle exclusieve quizzen en diepgaande studies.
                </p>
                <Button asChild className="bg-[#152c31] hover:bg-[#1f3e44] text-white">
                  <Link href="/premium">Word Premium</Link>
                </Button>
              </div>
            )}
            
            {user.isPremium && (
               <div className="mt-8 text-center text-sm text-muted-foreground">
                 Bedankt voor je steun aan BijbelQuiz!
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
