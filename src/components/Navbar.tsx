'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ModeToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navItems: NavItem[] = session
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/quizzes', label: 'Quizzen' },
        { href: '/leaderboard', label: 'Ranglijst' },
        { href: '/profile', label: 'Profiel' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/quizzes', label: 'Quizzen' },
        { href: '/leaderboard', label: 'Ranglijst' },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#dbe3ef] bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/90 dark:border-slate-700 dark:bg-slate-950/95 dark:supports-backdrop-filter:bg-slate-950/90">
      <div className="mx-auto flex h-16 w-full max-w-340 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-7 w-7">
            <Image src="/icon/Logo%20-%20dark.svg" alt="BijbelQuiz Logo" fill className="object-contain dark:hidden" priority />
            <Image src="/icon/Logo%20-%20light.svg" alt="BijbelQuiz Logo" fill className="hidden object-contain dark:block" priority />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-[#1f2f4b] dark:text-slate-100">
            Bijbel<span className="text-[#4f6faa] dark:text-blue-300">Quiz</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 text-sm font-medium text-[#4e5f79] transition-colors dark:text-slate-300',
                isActive(item.href)
                  ? 'bg-[#edf2fa] text-[#24395f] dark:bg-slate-800 dark:text-slate-100'
                  : 'hover:bg-[#f5f8fd] hover:text-[#24395f] dark:hover:bg-slate-800 dark:hover:text-slate-100'
              )}
            >
              {item.label}
            </Link>
          ))}

          {session?.user?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'px-3 py-1.5 text-sm font-semibold text-[#4e5f79] transition-colors dark:text-slate-300',
                isActive('/admin')
                  ? 'bg-[#edf2fa] text-[#24395f] dark:bg-slate-800 dark:text-slate-100'
                  : 'hover:bg-[#f5f8fd] hover:text-[#24395f] dark:hover:bg-slate-800 dark:hover:text-slate-100'
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ModeToggle />

          {status === 'loading' && (
            <div className="h-8 w-8 animate-pulse rounded-md bg-[#eef3fb] dark:bg-slate-800" />
          )}

          {status === 'authenticated' && session && (
            <>
              {!session.user?.isPremium && (
                <Button asChild className="h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc]">
                  <Link href="/premium">Premium</Link>
                </Button>
              )}

              <Button asChild variant="outline" className="h-9 rounded-md border-[#d7e1ee] px-3 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                <Link href="/profile">
                  <User className="mr-1.5 h-4 w-4" />
                  Account
                </Link>
              </Button>

              <Button
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline"
                className="h-9 rounded-md border-[#d7e1ee] px-3 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Uitloggen
              </Button>
            </>
          )}

          {status === 'unauthenticated' && (
            <>
              <Button asChild variant="outline" className="h-9 rounded-md border-[#d7e1ee] px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                <Link href="/login">Inloggen</Link>
              </Button>
              <Button asChild className="h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc]">
                <Link href="/register">Registreren</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="outline"
            className="h-9 w-9 rounded-md border-[#d7e1ee] p-0 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Menu openen"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-[#dbe3ef] bg-white md:hidden dark:border-slate-700 dark:bg-slate-950">
          <div className="mx-auto w-full max-w-340 px-4 py-3 sm:px-6">
            <div className="space-y-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3 py-2 text-sm font-medium text-[#4e5f79] dark:text-slate-300',
                    isActive(item.href)
                      ? 'bg-[#edf2fa] text-[#24395f] dark:bg-slate-800 dark:text-slate-100'
                      : 'hover:bg-[#f5f8fd] hover:text-[#24395f] dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  )}
                >
                  {item.label}
                </Link>
              ))}

              {session?.user?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-[#4e5f79] hover:bg-[#f5f8fd] hover:text-[#24395f] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  Admin
                </Link>
              )}

              <div className="mt-3 flex items-center gap-2 border-t border-[#e3ebf5] pt-3 dark:border-slate-700">
                {status === 'authenticated' && session ? (
                  <>
                    {!session.user?.isPremium && (
                      <Button asChild className="h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc]">
                        <Link href="/premium" onClick={() => setIsMobileMenuOpen(false)}>
                          Premium
                        </Link>
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      variant="outline"
                      className="h-9 rounded-md border-[#d7e1ee] px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      Uitloggen
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="h-9 rounded-md border-[#d7e1ee] px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Inloggen
                      </Link>
                    </Button>
                    <Button asChild className="h-9 rounded-md bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc]">
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        Registreren
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
