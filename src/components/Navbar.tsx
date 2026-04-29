'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, Crown, LogOut, Menu, Settings, User, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ModeToggle';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
}

interface NavbarProps {
  withSidebar?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/quizzes/create')) return 'Quiz maken';
  if (pathname.startsWith('/quizzes')) return 'Quizzen';
  if (pathname.startsWith('/quiz/')) return 'Quiz';
  if (pathname.startsWith('/leaderboard')) return 'Ranglijst';
  if (pathname.startsWith('/multiplayer')) return 'Samen spelen';
  if (pathname.startsWith('/premium')) return 'Premium';
  if (pathname.startsWith('/profile')) return 'Profiel';
  if (pathname.startsWith('/instellingen')) return 'Instellingen';
  if (pathname.startsWith('/admin')) return 'Beheer';
  if (pathname.startsWith('/help')) return 'Help';
  if (pathname.startsWith('/contact')) return 'Contact';
  if (pathname.startsWith('/bug-report')) return 'Bug report';
  if (pathname.startsWith('/privacy-policy')) return 'Privacybeleid';
  if (pathname.startsWith('/terms-of-service')) return 'Voorwaarden';
  return 'BijbelQuiz';
}

export default function Navbar({
  withSidebar = false,
  sidebarCollapsed = false,
  onSidebarToggle,
}: NavbarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const pageTitle = getPageTitle(pathname);
  const userName = session?.user?.name?.trim() || 'Gebruiker';
  const userEmail = session?.user?.email || 'Geen e-mailadres';
  const userInitials = useMemo(() => {
    const parts = userName
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (parts.length === 0) {
      return 'G';
    }

    return parts.map((part) => part[0]?.toUpperCase() || '').join('');
  }, [userName]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current) return;
      if (!accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isAccountMenuOpen]);

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
    <header className="sticky top-0 z-50 border-b border-[#dbe3ef] bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/95 dark:supports-backdrop-filter:bg-zinc-950/90">
      <div className="relative mx-auto flex h-16 w-full max-w-340 items-center gap-4 px-4 sm:px-5 lg:px-4">
        {withSidebar && (
          <div className="hidden items-center gap-3 lg:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onSidebarToggle}
              className="h-9 w-9 rounded-md border-[#d7e1ee] bg-white text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              aria-label={sidebarCollapsed ? 'Sidebar openen' : 'Sidebar sluiten'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <p className="text-lg font-semibold text-[#1f2f4b] dark:text-zinc-100">{pageTitle}</p>
          </div>
        )}

        <Link href="/" className={cn('flex items-center gap-2.5', withSidebar && 'lg:hidden')}>
          <div className="relative h-7 w-7">
            <Image src="/icon/Logo%20-%20dark.svg" alt="BijbelQuiz Logo" fill className="object-contain dark:hidden" priority />
            <Image src="/icon/Logo%20-%20light.svg" alt="BijbelQuiz Logo" fill className="hidden object-contain dark:block" priority />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-[#1f2f4b] dark:text-zinc-100">
            Bijbel<span className="text-[#4f6faa] dark:text-zinc-300">Quiz</span>
          </span>
        </Link>

        <nav
          className={cn(
            'hidden items-center gap-1 md:absolute md:left-1/2 md:-translate-x-1/2 md:flex',
            withSidebar && 'lg:hidden'
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 text-sm font-medium text-[#4e5f79] transition-colors dark:text-zinc-300',
                isActive(item.href)
                  ? 'bg-[#edf2fa] text-[#24395f] dark:bg-zinc-800 dark:text-zinc-100'
                  : 'hover:bg-[#f5f8fd] hover:text-[#24395f] dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              )}
            >
              {item.label}
            </Link>
          ))}

          {session?.user?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'px-3 py-1.5 text-sm font-semibold text-[#4e5f79] transition-colors dark:text-zinc-300',
                isActive('/admin')
                  ? 'bg-[#edf2fa] text-[#24395f] dark:bg-zinc-800 dark:text-zinc-100'
                  : 'hover:bg-[#f5f8fd] hover:text-[#24395f] dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ModeToggle />

          {status === 'loading' && (
            <div className="h-8 w-8 animate-pulse rounded-md bg-[#eef3fb] dark:bg-zinc-800" />
          )}

          {status === 'authenticated' && session && (
            <>
              {session.user?.isPremium ? (
                <span className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#6f8ed4] px-3 text-sm font-semibold text-white dark:bg-zinc-500 dark:text-zinc-100">
                  <Crown className="h-4 w-4" />
                  Premium actief
                </span>
              ) : (
                <Button asChild className="h-10 rounded-md bg-[#6f8ed4] dark:bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc] dark:hover:bg-[#5f81cc]">
                  <Link href="/premium">Premium</Link>
                </Button>
              )}

              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((value) => !value)}
                  aria-haspopup="menu"
                  aria-expanded={isAccountMenuOpen}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-2 py-1.5 text-left hover:bg-[#f5f8fd] dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#edf2fa] text-[11px] font-semibold text-[#2f456e] dark:bg-zinc-800 dark:text-zinc-100">
                    {session.user?.image ? (
                      <img src={session.user.image} alt={userName} className="h-full w-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block max-w-40 truncate text-sm font-semibold text-[#1f2f4b] dark:text-zinc-100">{userName}</span>
                    <span className="block max-w-40 truncate text-xs text-[#607597] dark:text-zinc-400">{userEmail}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-[#607597] transition-transform dark:text-zinc-400',
                      isAccountMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-[#d7e1ee] bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#30466e] hover:bg-[#f5f8fd] dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <User className="h-4 w-4" />
                      Profiel
                    </Link>
                    <Link
                      href="/instellingen"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#30466e] hover:bg-[#f5f8fd] dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <Settings className="h-4 w-4" />
                      Instellingen
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#30466e] hover:bg-[#f5f8fd] dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <LogOut className="h-4 w-4" />
                      Afmelden
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {status === 'unauthenticated' && (
            <>
              <Button asChild variant="outline" className="h-9 rounded-md border-[#d7e1ee] px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                <Link href="/login">Inloggen</Link>
              </Button>
              <Button asChild className="h-9 rounded-md bg-[#6f8ed4] dark:bg-[#5b7dd9] px-4 text-white hover:bg-[#5f81cc] dark:hover:bg-[#4a6bc7]">
                <Link href="/register">Registreren</Link>
              </Button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="outline"
            className="h-9 w-9 rounded-md border-[#d7e1ee] p-0 text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Menu openen"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-[#dbe3ef] bg-white md:hidden dark:border-zinc-700 dark:bg-zinc-950">
          <div className="mx-auto w-full max-w-340 px-4 py-3 sm:px-5 lg:px-4">
            <div className="space-y-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3 py-2 text-sm font-medium text-[#4e5f79] dark:text-zinc-300',
                    isActive(item.href)
                      ? 'bg-[#edf2fa] text-[#24395f] dark:bg-zinc-800 dark:text-zinc-100'
                      : 'hover:bg-[#f5f8fd] hover:text-[#24395f] dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  )}
                >
                  {item.label}
                </Link>
              ))}

              {session?.user?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-[#4e5f79] hover:bg-[#f5f8fd] hover:text-[#24395f] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  Admin
                </Link>
              )}

              <div className="mt-3 flex items-center gap-2 border-t border-[#e3ebf5] pt-3 dark:border-zinc-700">
                {status === 'authenticated' && session ? (
                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-2 rounded-md bg-white p-2.5 dark:bg-zinc-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#edf2fa] text-[11px] font-semibold text-[#2f456e] dark:bg-zinc-800 dark:text-zinc-100">
                        {session.user?.image ? (
                          <img src={session.user.image} alt={userName} className="h-full w-full object-cover" />
                        ) : (
                          userInitials
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1f2f4b] dark:text-zinc-100">{userName}</p>
                        <p className="truncate text-xs text-[#607597] dark:text-zinc-400">{userEmail}</p>
                        {session.user?.isPremium && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#355384] dark:text-zinc-300">
                            <Crown className="h-3.5 w-3.5" />
                            Premium actief
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#4e5f79] hover:bg-[#f5f8fd] hover:text-[#24395f] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <User className="h-4 w-4" />
                      Profiel
                    </Link>

                    <Link
                      href="/instellingen"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#4e5f79] hover:bg-[#f5f8fd] hover:text-[#24395f] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <Settings className="h-4 w-4" />
                      Instellingen
                    </Link>

                    {!session.user?.isPremium && (
                      <Button asChild className="h-9 rounded-md bg-[#6f8ed4] dark:bg-[#6f8ed4] px-4 text-white hover:bg-[#5f81cc] dark:hover:bg-[#5f81cc]">
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
                      className="h-9 rounded-md border-[#d7e1ee] px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <LogOut className="mr-1.5 h-4 w-4" />
                      Afmelden
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button asChild variant="outline" className="h-9 rounded-md border-[#d7e1ee] px-4 text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Inloggen
                      </Link>
                    </Button>
                    <Button asChild className="h-9 rounded-md bg-[#6f8ed4] dark:bg-[#5b7dd9] px-4 text-white hover:bg-[#5f81cc] dark:hover:bg-[#4a6bc7]">
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
