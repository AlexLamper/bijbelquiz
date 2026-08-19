'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, Gem, LogOut, Menu, Settings, User, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import MascotAvatar from '@/components/avatar/MascotAvatar';
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
  if (pathname.startsWith('/quizzen/aanmaken')) return 'Quiz maken';
  if (pathname.startsWith('/quizzen')) return 'Quizzen';
  if (pathname.startsWith('/quiz/')) return 'Quiz';
  if (pathname.startsWith('/ranglijst')) return 'Ranglijst';
  if (pathname.startsWith('/samen-spelen')) return 'Samen spelen';
  if (pathname.startsWith('/premium')) return 'Premium';
  if (pathname.startsWith('/profiel')) return 'Profiel';
  if (pathname.startsWith('/instellingen')) return 'Instellingen';
  if (pathname.startsWith('/beheer')) return 'Beheer';
  if (pathname.startsWith('/hulp')) return 'Help';
  if (pathname.startsWith('/contact')) return 'Contact';
  if (pathname.startsWith('/foutmelding')) return 'Foutmelding';
  if (pathname.startsWith('/privacybeleid')) return 'Privacybeleid';
  if (pathname.startsWith('/voorwaarden')) return 'Voorwaarden';
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
  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    if (pathname !== '/') return;

    const sectionIds = ['quizzen', 'premium', 'categorieen'];

    const getActiveSection = () => {
      if (window.scrollY === 0) return 'home';
      for (const id of [...sectionIds].reverse()) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 120) return id;
      }
      return 'home';
    };

    const handleScroll = () => setActiveSection(getActiveSection());
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);
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
    if (pathname !== '/') {
      if (href === '/') return pathname === '/';
      return pathname.startsWith(href);
    }
    // On the landing page, match anchor links against the observed active section
    if (href === '/') return activeSection === 'home';
    const hash = href.replace('/#', '');
    return activeSection === hash;
  };

  const navItems: NavItem[] = session
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/quizzen', label: 'Quizzen' },
        { href: '/ranglijst', label: 'Ranglijst' },
        { href: '/profiel', label: 'Profiel' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/#quizzen', label: 'Quizzen' },
        { href: '/#premium', label: 'Premium' },
        { href: '/#categorieen', label: 'Categorieën' },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-sm supports-backdrop-filter:bg-paper/75">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-4 px-5 sm:px-8 lg:px-10">
        {withSidebar && (
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onSidebarToggle}
              className="h-9 w-9 rounded-md border-rule bg-paper-raised text-ink hover:bg-paper-sunken"
              aria-label={sidebarCollapsed ? 'Sidebar openen' : 'Sidebar sluiten'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <p className="font-display text-lg font-normal tracking-[-0.015em] text-ink">{pageTitle}</p>
          </div>
        )}

        <Link href="/" className={cn('flex shrink-0 items-center gap-2.5', withSidebar && 'lg:hidden')}>
          <div className="relative h-7 w-7">
            <Image src="/icon/Logo%20-%20dark.svg" alt="BijbelQuiz Logo" fill className="object-contain dark:hidden" priority />
            <Image src="/icon/Logo%20-%20light.svg" alt="BijbelQuiz Logo" fill className="hidden object-contain dark:block" priority />
          </div>
          <span className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
            Bijbel<span className="text-lapis">Quiz</span>
          </span>
        </Link>

        <nav
          className={cn(
            'hidden min-w-0 flex-1 items-center justify-center gap-1 self-stretch md:flex',
            withSidebar && 'lg:hidden'
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-full items-center px-3 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-px after:transition-colors',
                isActive(item.href)
                  ? 'text-ink after:bg-lapis'
                  : 'text-ink-muted hover:text-ink after:bg-paper'
              )}
            >
              {item.label}
            </Link>
          ))}

          {session?.user?.role === 'admin' && (
            <Link
              href="/beheer"
              className={cn(
                'flex h-full items-center px-3 text-sm font-medium transition-colors',
                isActive('/admin') ? 'text-ink' : 'text-ink-muted hover:text-ink'
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          <ModeToggle />

          {status === 'loading' && (
            <div className="h-8 w-8 animate-pulse rounded-md bg-paper-sunken" />
          )}

          {status === 'authenticated' && session && (
            <>
              {/* A member gets a quiet mark of status; everybody else gets the
                  one solid button in the bar. Both are the same height as the
                  controls beside them, and neither shouts. */}
              {session.user?.isPremium ? (
                <Link
                  href="/premium"
                  title="Je Premium lidmaatschap beheren"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-lapis/40 bg-lapis-tint px-3 text-sm font-medium text-lapis transition-colors hover:border-lapis/70 lg:px-3.5"
                >
                  <Gem className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">Premium</span>
                </Link>
              ) : (
                <Link
                  href="/premium"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
                >
                  <Gem className="h-4 w-4 shrink-0" />
                  Premium
                </Link>
              )}

              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((value) => !value)}
                  aria-haspopup="menu"
                  aria-expanded={isAccountMenuOpen}
                  className="inline-flex h-11 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-paper-sunken"
                >
                  {/* The mascot, not the OAuth photo: it is the identity the
                      reader picked on their profile, and it is what they see
                      beside their name everywhere else in the product. */}
                  <MascotAvatar avatar={session.user?.avatar} size={32} bordered title={userName} />
                  <span className="hidden min-w-0 lg:block">
                    <span className="block max-w-36 truncate text-sm font-medium text-ink">{userName}</span>
                    <span className="block max-w-36 truncate text-xs text-ink-muted">{userEmail}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-ink-soft transition-transform',
                      isAccountMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-rule bg-paper-raised p-1.5">
                    <Link
                      href="/profiel"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-paper-sunken"
                    >
                      <User className="h-4 w-4" />
                      Profiel
                    </Link>
                    <Link
                      href="/instellingen"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-paper-sunken"
                    >
                      <Settings className="h-4 w-4" />
                      Instellingen
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-paper-sunken"
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
              <Button asChild variant="outline" className="h-9 rounded-md border-rule px-4 text-ink hover:bg-paper-sunken">
                <Link href="/inloggen">Inloggen</Link>
              </Button>
              <Button asChild className="h-9 rounded-md bg-ink px-4 text-ink-inverted hover:bg-ink-soft">
                <Link href="/registreren">Registreren</Link>
              </Button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="outline"
            className="h-9 w-9 rounded-md border-rule p-0 text-ink hover:bg-paper-sunken"
            aria-label="Menu openen"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-rule bg-paper-raised md:hidden">
          <div className="mx-auto w-full max-w-[1180px] px-4 py-3 sm:px-5 lg:px-4">
            <div className="space-y-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block px-3 py-2 text-sm font-medium text-ink-soft',
                    isActive(item.href)
                      ? 'bg-paper-sunken text-ink'
                      : 'hover:bg-paper-sunken hover:text-ink  '
                  )}
                >
                  {item.label}
                </Link>
              ))}

              {session?.user?.role === 'admin' && (
                <Link
                  href="/beheer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-sunken hover:text-ink"
                >
                  Admin
                </Link>
              )}

              <div className="mt-3 flex items-center gap-2 border-t border-rule pt-3">
                {status === 'authenticated' && session ? (
                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-2 rounded-md bg-paper-raised p-2.5">
                      <MascotAvatar avatar={session.user?.avatar} size={36} bordered title={userName} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{userName}</p>
                        <p className="truncate text-xs text-ink-soft">{userEmail}</p>
                        {session.user?.isPremium && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-ink">
                            <Gem className="h-3.5 w-3.5" />
                            Premium actief
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/profiel"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-sunken hover:text-ink"
                    >
                      <User className="h-4 w-4" />
                      Profiel
                    </Link>

                    <Link
                      href="/instellingen"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-sunken hover:text-ink"
                    >
                      <Settings className="h-4 w-4" />
                      Instellingen
                    </Link>

                    {/* Both actions are full width and the same height, with a
                        rule between them and the navigation above: the upgrade
                        used to be an odd shrink-to-fit button wedged next to
                        "Afmelden", which read as a misplaced element rather
                        than the primary action of the menu. */}
                    <div className="space-y-2 border-t border-rule pt-3">
                      {!session.user?.isPremium && (
                        <Button
                          asChild
                          className="h-11 w-full justify-center rounded-md bg-ink px-4 text-sm font-medium text-ink-inverted hover:bg-ink-soft"
                        >
                          <Link href="/premium" onClick={() => setIsMobileMenuOpen(false)}>
                            <Gem className="mr-2 h-4 w-4" />
                            Word Premium
                          </Link>
                        </Button>
                      )}

                      <Button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        variant="outline"
                        className="h-11 w-full justify-center rounded-md border-rule px-4 text-sm font-medium text-ink hover:bg-paper-sunken"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Afmelden
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-full space-y-2">
                      <Button
                        asChild
                        className="h-11 w-full justify-center rounded-md bg-ink px-4 text-sm font-medium text-ink-inverted hover:bg-ink-soft"
                      >
                        <Link href="/registreren" onClick={() => setIsMobileMenuOpen(false)}>
                          Registreren
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-11 w-full justify-center rounded-md border-rule px-4 text-sm font-medium text-ink hover:bg-paper-sunken"
                      >
                        <Link href="/inloggen" onClick={() => setIsMobileMenuOpen(false)}>
                          Inloggen
                        </Link>
                      </Button>
                    </div>
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
