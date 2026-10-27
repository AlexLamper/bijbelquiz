'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu, Settings, Shield, User, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AvatarConfig } from '@/lib/avatar';
import { Button, IconButton } from './Button';
import { Avatar } from './Avatar';
import { Container } from './Container';
import { Logo } from './Logo';
import { Modal } from './Modal';
import { StatPill } from './Pill';
import { ACCOUNT_NAV, MAIN_NAV, isActivePath } from './nav';

/**
 * The 68px white header of every content page.
 *
 * Signed out: logo, the five main links, "Inloggen" and "Gratis beginnen".
 * Signed in: the same links, the streak and XP counters and a round profile
 * button. Below 700px the links, the XP counter and the profile button fold
 * into a menu behind the burger; the streak stays visible.
 *
 * The streak is not on the session, so it is fetched once per sign-in from
 * `/api/user/stats`; the pill appears when it is known.
 */
interface HeaderUser {
  id?: string;
  name?: string | null;
  image?: string | null;
  avatar?: AvatarConfig;
  xp?: number;
  role?: string;
}

export interface SiteHeaderPreview {
  signedIn: boolean;
  name?: string;
  xp?: number;
  streak?: number;
  isAdmin?: boolean;
}

export function SiteHeader({ preview }: { preview?: SiteHeaderPreview }) {
  const pathname = usePathname();
  const sessionState = useSession();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const fetched = useHeaderStats(preview ? undefined : sessionState.data?.user?.id);

  // `preview` (the /dev/ui gallery) shows a variant regardless of the session.
  const status = preview ? (preview.signedIn ? 'authenticated' : 'unauthenticated') : sessionState.status;
  const session = preview
    ? preview.signedIn
      ? { user: { id: 'preview', name: preview.name ?? 'Alex', xp: preview.xp ?? 0, role: preview.isAdmin ? 'admin' : 'user' } }
      : null
    : sessionState.data;
  const stats = preview ? (preview.signedIn && typeof preview.streak === 'number' ? { streak: preview.streak, xp: preview.xp ?? 0 } : null) : fetched;

  const signedIn = status === 'authenticated' && Boolean(session?.user);
  const user: HeaderUser | undefined = session?.user;
  const xp = typeof user?.xp === 'number' ? user.xp : stats?.xp;

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="h-[68px] shrink-0 border-b border-line bg-card">
      <Container className="grid h-[67px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-6">
        <Logo href={signedIn ? '/dashboard' : '/'} className="justify-self-start" />

        <nav aria-label="Hoofdmenu" className="col-start-2 hidden items-center gap-8 m:flex">
          {MAIN_NAV.map((link) => {
            const active = isActivePath(pathname, link.href, link.also);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-[67px] items-center whitespace-nowrap border-b-[3px] pt-[3px] text-[15px] font-bold no-underline',
                  active ? 'border-lapis text-lapis' : 'border-transparent text-ink-soft hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="col-start-3 flex items-center justify-self-end gap-2.5">
          {status === 'loading' ? (
            <span className="h-9 w-20 rounded-full bg-chip" aria-hidden="true" />
          ) : signedIn ? (
            <>
              {stats && <StatPill kind="streak" value={stats.streak} href="/profiel" />}
              {typeof xp === 'number' && <StatPill kind="xp" value={xp} href="/profiel" className="hidden m:inline-flex" />}
              <Link
                href="/profiel"
                aria-label="Profiel"
                className="hidden size-10 items-center justify-center rounded-full border border-line bg-card text-ink-soft no-underline hover:bg-chip hover:text-ink m:flex"
              >
                <User className="size-5" strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/inloggen" className="hidden whitespace-nowrap text-[15px] font-bold no-underline m:inline">
                Inloggen
              </Link>
              <Button href="/registreren" size="md">
                Gratis beginnen
              </Button>
            </>
          )}
          <IconButton
            shape="square"
            aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="m:hidden"
          >
            {menuOpen ? <X className="size-5" strokeWidth={2.2} /> : <Menu className="size-5" strokeWidth={2.2} />}
          </IconButton>
        </div>
      </Container>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} signedIn={signedIn} isAdmin={user?.role === 'admin'} name={user?.name} xp={xp} streak={stats?.streak} />
    </header>
  );
}

/* ── Phone menu ──────────────────────────────────────────────────────────── */

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedIn: boolean;
  isAdmin?: boolean;
  name?: string | null;
  xp?: number;
  streak?: number;
}

function MobileMenu({ open, onOpenChange, signedIn, isAdmin, name, xp, streak }: MobileMenuProps) {
  const pathname = usePathname();
  const linkClass = (active: boolean) =>
    cn(
      'flex h-12 items-center rounded-[12px] px-3.5 text-base font-bold no-underline',
      active ? 'bg-lapis-tint text-lapis' : 'text-ink-soft hover:bg-chip hover:text-ink',
    );

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Menu" hideTitle presentation="sheet" size="sm" className="m:hidden">
      <nav aria-label="Hoofdmenu" className="-mt-2 flex flex-col gap-1">
        {MAIN_NAV.map((link) => (
          <Link key={link.href} href={link.href} aria-current={isActivePath(pathname, link.href, link.also) ? 'page' : undefined} className={linkClass(isActivePath(pathname, link.href, link.also))}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-line-soft pt-4">
        {signedIn ? (
          <div className="flex flex-col gap-1">
            <div className="mb-2 flex items-center gap-3 px-1">
              <Avatar name={name} tone="solid" size={40} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-base font-extrabold">{name ?? 'Speler'}</span>
                <span className="text-[13px] font-bold text-ink-muted">
                  {[typeof xp === 'number' ? `${new Intl.NumberFormat('nl-NL').format(xp)} XP` : null, typeof streak === 'number' ? `${streak} dagen op rij` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            </div>
            {ACCOUNT_NAV.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(isActivePath(pathname, link.href))}>
                {link.label === 'Instellingen' ? <Settings className="mr-2.5 size-5" strokeWidth={2.2} aria-hidden="true" /> : <User className="mr-2.5 size-5" strokeWidth={2.2} aria-hidden="true" />}
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/beheer" className={linkClass(isActivePath(pathname, '/beheer'))}>
                <Shield className="mr-2.5 size-5" strokeWidth={2.2} aria-hidden="true" />
                Beheer
              </Link>
            )}
            <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className={cn(linkClass(false), 'w-full border-0 bg-transparent text-left')}>
              <LogOut className="mr-2.5 size-5" strokeWidth={2.2} aria-hidden="true" />
              Uitloggen
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <Button href="/registreren" size="xl" block>
              Gratis beginnen
            </Button>
            <Button href="/inloggen" variant="secondary" size="xl" block>
              Inloggen
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Stats ───────────────────────────────────────────────────────────────── */

interface HeaderStats {
  streak: number;
  xp: number;
}

function useHeaderStats(userId: string | undefined): HeaderStats | null {
  const [stats, setStats] = React.useState<HeaderStats | null>(null);
  const loadedFor = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!userId) {
      loadedFor.current = null;
      setStats(null);
      return;
    }
    if (loadedFor.current === userId) return;
    loadedFor.current = userId;

    let cancelled = false;
    fetch('/api/user/stats')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setStats({ streak: Number(data.streak) || 0, xp: Number(data.xp) || 0 });
      })
      .catch(() => {
        /* The header simply shows no streak. */
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return stats;
}
