'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Star, Menu, X, ChevronRight, User } from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const linkClasses = (href: string) => 
    `hover:text-primary transition-colors ${isActive(href) ? 'text-primary dark:text-[#5b7dd9] font-semibold' : ''}`;

  return (
    <nav className="sticky top-0 z-50 w-full bg-transparent px-3 pt-4 sm:px-4 sm:pt-5">
      <div className="relative container mx-auto flex h-16 items-center justify-between rounded-3xl border border-[#d6e2fa]/80 bg-white/68 px-4 shadow-[0_14px_40px_rgba(84,126,233,0.10)] backdrop-blur-xl sm:px-8 dark:border-white/10 dark:bg-background/70">
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
            Bijbel<span className="text-[#192942] dark:text-white italic">Quiz</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
           <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-gray-300">
              {session && (
                <>
                  <Link href="/dashboard" className={linkClasses('/dashboard')}>Dashboard</Link>
                  <Link href="/quizzes" className={linkClasses('/quizzes')}>Alle Quizzen</Link>
                </>
              )}
              {!session && (
                <Link href="/dashboard" className={linkClasses('/dashboard')}>Quizzen</Link>
              )}
              <Link href="/leaderboard" className={linkClasses('/leaderboard')}>Ranglijst</Link>
              {session?.user?.role === 'admin' && (
                <Link href="/admin" className={`font-bold text-[#192942] dark:text-[#5b7dd9] hover:opacity-80 transition-colors ${isActive('/admin') ? 'underline underline-offset-4' : ''}`}>Admin</Link>
              )}
           </nav>

          <div className="flex items-center gap-3">
            <ModeToggle />
            {(session && !session.user?.isPremium) && (
              <Link href="/premium" className="hidden sm:block">
                <Button variant="default" size="sm" className="bg-[#547ee9] hover:bg-[#476ecc] text-white border-0 shadow-md shadow-blue-500/20 transition-all font-semibold rounded-full px-5">
                  Word Premium
                </Button>
              </Link>
            )}

            {status === 'authenticated' && session ? (
              <>
                {session.user.isPremium && (
                  <div className="hidden sm:flex items-center gap-1 rounded-md bg-[#1a2942] px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider shadow-sm">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>PREMIUM</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pl-3 border-l border-[#d6e2fa]/80 dark:border-border/40">
                  <Link href="/profile" className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="bg-[#547ee9] text-white rounded-full p-2 shadow-sm ring-2 ring-white dark:ring-background">
                      <User className="h-4 w-4" />
                    </div>
                  </Link>
                  
                  <Button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    variant="ghost"
                    size="icon"
                    aria-label="Uitloggen"
                    className="text-muted-foreground hover:text-destructive transition-colors"
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
                aria-label="Menu openen"
                className="md:hidden ml-1 text-muted-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute left-3 right-3 top-[4.6rem] z-99 overflow-y-auto rounded-[28px] border border-[#d6e2fa]/80 bg-[#f7faff]/92 px-4 py-6 shadow-[0_22px_60px_rgba(84,126,233,0.16)] backdrop-blur-xl animate-in slide-in-from-top-2 md:hidden">
            <div className="flex flex-col space-y-2">
                {session && (
                  <>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`group flex items-center px-2 py-2 font-medium text-lg text-slate-700 hover:text-primary transition-colors ${isActive('/dashboard') ? 'text-primary dark:text-[#5b7dd9] font-semibold' : ''}`}>
                        Dashboard
                    </Link>
                    <Link href="/quizzes" onClick={() => setIsMobileMenuOpen(false)} className={`group flex items-center px-2 py-2 font-medium text-lg text-slate-700 hover:text-primary transition-colors ${isActive('/quizzes') ? 'text-primary dark:text-[#5b7dd9] font-semibold' : ''}`}>
                        Alle Quizzen
                    </Link>
                  </>
                )}
                {!session && (
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={`group flex items-center px-2 py-2 font-medium text-lg text-slate-700 hover:text-primary transition-colors ${isActive('/dashboard') ? 'text-primary dark:text-[#5b7dd9] font-semibold' : ''}`}>
                      Quizzen
                  </Link>
                )}
                <Link href="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className={`group flex items-center px-2 py-2 font-medium text-lg text-slate-700 hover:text-primary transition-colors ${isActive('/leaderboard') ? 'text-primary dark:text-[#5b7dd9] font-semibold' : ''}`}>
                    Ranglijst
                </Link>
                {session?.user?.role === 'admin' && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center justify-between rounded-xl border border-[#192942]/15 bg-[#192942]/5 px-4 py-3 font-bold text-[#192942] shadow-sm transition-all hover:bg-[#192942]/10 active:scale-[0.99]">
                         Admin Dashboard
                     <ChevronRight className="h-4 w-4 text-[#192942] opacity-60" />
                    </Link>
                )}
                 {(session && !session.user?.isPremium) && (
                    <Link href="/premium" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 flex items-center justify-between rounded-xl border border-[#152c31] bg-linear-to-r from-[#152c31] to-[#1f3e44] px-4 py-4 font-bold text-white shadow-lg transition-transform active:scale-[0.99]">
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
                     <div className="pt-2 mt-2 space-y-2 border-t border-slate-200/60">
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:text-primary dark:text-[#5b7dd9] hover:bg-slate-50 rounded-xl transition-colors">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Mijn Profiel</span>
                        </Link>
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
