'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Star, Menu, X, ChevronRight } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 transition-transform group-hover:scale-110">
             <Image 
                src="/icon/Logo%20-%20dark.svg" 
                alt="BijbelQuiz Logo" 
                fill 
                className="object-contain dark:hidden"
                priority 
             />
             <Image 
                src="/icon/Logo%20-%20light.svg" 
                alt="BijbelQuiz Logo" 
                fill 
                className="object-contain hidden dark:block"
                priority 
             />
          </div>
          <span className="text-xl font-bold font-serif tracking-tight text-foreground">
            Bijbel<span className="text-primary italic">Quiz</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
           <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <Link href="/quizzes" className="hover:text-primary transition-colors">Alle Quizzen</Link>
              {session && (
                 <Link href="/dashboard" className="hover:text-primary transition-colors">Mijn Dashboard</Link>
              )}
           </nav>

          <div className="flex items-center gap-3">
            {(!session || !session.user?.isPremium) && (
              <Link href="/premium" className="hidden sm:block">
                <Button variant="default" size="sm" className="bg-[#152c31] hover:bg-[#1f3e44] text-white border-0 shadow-sm transition-all">
                  Word Premium
                </Button>
              </Link>
            )}

            {status === 'authenticated' && session ? (
              <>
                {session.user.isPremium && (
                  <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-100/50 px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-200">
                    <Star className="h-3 w-3 fill-current" />
                    <span>PRO</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pl-3 border-l border-border/40">
                  <Link href="/dashboard" className="flex items-center hidden sm:flex hover:opacity-80 transition-opacity">
                    <span className="text-sm font-bold text-foreground">{session.user.name || 'Gebruiker'}</span>
                  </Link>
                  <Button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    variant="ghost" 
                    size="icon"
                    className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : status === 'loading' ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="font-medium">Inloggen</Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <Button size="sm" className="font-semibold shadow-sm">Registreren</Button>
                </Link>
                <Link href="/login" className="sm:hidden">
                  <Button size="sm" className="font-semibold shadow-sm">Aanmelden</Button>
                </Link>
              </div>
            )}

            <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden ml-1 text-muted-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-primary/10 bg-[#eae6db] px-4 py-6 shadow-lg animate-in slide-in-from-top-2 absolute top-16 left-0 w-full h-[calc(100vh-4rem)] overflow-y-auto z-[99]">
            <div className="flex flex-col space-y-2">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 font-medium text-lg text-slate-700 hover:text-primary transition-colors">
                    Home
                </Link>
                <Link href="/quizzes" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 font-medium text-lg text-slate-700 hover:text-primary transition-colors">
                    Alle Quizzen
                </Link>
                {session && (
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center justify-between px-4 py-3 bg-white border border-slate-200 shadow-sm rounded-xl font-medium text-slate-700 active:scale-[0.99] transition-all hover:border-primary/20 hover:shadow-md">
                         Mijn Dashboard
                         <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                    </Link>
                )}
                 {(!session || !session.user?.isPremium) && (
                    <Link href="/premium" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 px-4 py-4 bg-gradient-to-r from-[#152c31] to-[#1f3e44] border border-[#152c31] text-white shadow-lg rounded-xl font-bold active:scale-[0.99] transition-transform flex items-center justify-between">
                        <div>
                            <span className="block text-sm">Upgrade naar Premium</span>
                            <span className="text-[10px] font-normal opacity-80 uppercase tracking-wider block mt-0.5">Levenslang toegang</span>
                        </div>
                        <div className="bg-white/10 p-1.5 rounded-lg">
                            <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                        </div>
                    </Link>
                )}
                {session && (
                     <div className="pt-2 mt-2">
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-4 h-12 text-sm font-medium border border-transparent hover:border-red-100 rounded-xl"
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                signOut({ callbackUrl: '/' });
                            }}
                        >
                            <LogOut className="h-4 w-4 mr-2" /> Uitloggen
                        </Button>
                     </div>
                )}
                {!session && (
                    <div className="pt-4 mt-2 grid grid-cols-2 gap-3">
                         <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full justify-center h-12 text-sm font-bold border-slate-200 bg-white hover:bg-slate-50 hover:text-primary rounded-xl">Inloggen</Button>
                         </Link>
                         <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full justify-center h-12 text-sm font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">Registreren</Button>
                         </Link>
                    </div>
                )}
            </div>
        </div>
      )}
    </nav>
  );
}
