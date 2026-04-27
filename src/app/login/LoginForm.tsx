'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Loader2, Eye, EyeOff, BookOpen, Trophy, Flame } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
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
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError('Ongeldig e-mailadres of wachtwoord.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Er is iets misgegaan. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex h-screen overflow-hidden bg-background">
      {/* Left Side - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-8 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-serif font-semibold text-[#1f2f4b] dark:text-foreground mb-2">
              Welkom terug
            </h1>
            <p className="text-muted-foreground">
              Log in op jouw persoonlijke leeromgeving
            </p>
          </div>

          {/* Google Sign In */}
          <Button 
            variant="outline" 
            onClick={() => signIn('google', { callbackUrl })} 
            className="w-full relative h-12 rounded-md border-[#d7e1ee] bg-white hover:bg-[#f5f8fd] text-[#30466e] font-medium group transition-colors mb-6"
          >
            <svg className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Inloggen met Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#d7e1ee] dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">Of</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive flex items-center gap-2 border border-destructive/20">
                <CheckCircle2 className="h-4 w-4 rotate-45 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1f2f4b] dark:text-foreground" htmlFor="email">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                placeholder="naam@voorbeeld.nl"
                className="flex h-12 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#6f8ed4] focus:outline-none focus:ring-4 focus:ring-[#6f8ed4]/15 transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1f2f4b] dark:text-foreground" htmlFor="password">
                Wachtwoord
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex h-12 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-[#6f8ed4] focus:outline-none focus:ring-4 focus:ring-[#6f8ed4]/15 transition-all duration-200 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-[#6f8ed4] hover:bg-[#5f81cc] text-white rounded-md shadow-lg shadow-[#6f8ed4]/20 transition-colors" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Inloggen
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Nog geen account?{' '}
            <Link href="/register" className="text-[#355384] hover:text-[#243a5e] font-semibold hover:underline">
              Registreer nu
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block w-1/2 relative">
        {/* Background Image - Full coverage */}
        <Image
          src="/images/quizzes/img4.png"
          alt="BijbelQuiz"
          fill
          className="object-cover"
          priority
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-[#1a2942]/60 dark:bg-[#1a2942]/75" />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-12 xl:px-16">
          <h2 className="text-3xl xl:text-4xl font-serif font-bold text-white mb-4 leading-tight">
            Ontdek de rijkdom van{' '}
            <span className="text-white">Gods Woord</span>
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed">
            Test je kennis, leer nieuwe dingen en groei in je geloof met onze interactieve bijbelquizzen.
          </p>
          
          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/90 font-medium">10+ Quizzen beschikbaar</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/90 font-medium">Verdien punten en badges</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/90 font-medium">Houd je streak bij</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary dark:text-[#6f8ed4]" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
