'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BookOpen, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}&registered=true`);
      } else {
        const data = await res.text();
        setError(data || 'Er is iets misgegaan bij het registreren.');
      }
    } catch {
      setError('Netwerkfout. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
           <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg mb-4 hover:scale-105 transition-transform">
             <BookOpen className="h-6 w-6" />
          </Link>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Word lid
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Start vandaag nog met het verdiepen van je kennis
          </p>
        </div>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="space-y-1 bg-slate-50/50 dark:bg-slate-900/50 border-b border-border/50 pb-6">
            <CardTitle className="text-xl font-bold text-center">Account aanmaken</CardTitle>
            <CardDescription className="text-center">
              Vul je gegevens in om te registreren
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid gap-4">
               {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive flex items-center gap-2 border border-destructive/20">
                   <AlertCircle className="h-4 w-4" />
                   {error}
                </div>
              )}

              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium leading-none">Naam</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Volledige naam"
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="naam@voorbeeld.nl"
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" title="Wachtwoord" className="text-sm font-medium leading-none">Wachtwoord</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimaal 6 tekens"
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full mt-2 h-11 text-base shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Registreren'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 py-4 border-t border-border/50 justify-center">
            <div className="text-sm text-center w-full text-slate-500">
             Heb je al een account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 hover:underline font-semibold ml-1">
              Inloggen
            </Link>
            </div>
         </CardFooter>
      </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
