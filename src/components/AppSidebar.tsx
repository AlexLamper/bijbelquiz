'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ComponentType } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  BookOpen,
  Bug,
  Crown,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  Mail,
  Settings,
  Shield,
  ShieldCheck,
  Trophy,
  User,
  UserPlus,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { trackEvent } from '@/components/GoogleAnalytics';
import { yearlyPricePerWeek } from '@/lib/premium-benefits';

/**
 * Read once at module scope: `NEXT_PUBLIC_` values are inlined at build time,
 * so this is a constant, not a per-render computation.
 */
const sidebarPerWeek = yearlyPricePerWeek(
  process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_LABEL || '€39,99'
);

interface SidebarItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  activePrefixes?: string[];
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface AppSidebarProps {
  collapsed?: boolean;
}

export default function AppSidebar({ collapsed = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isItemActive = (item: SidebarItem) => {
    const prefixes = item.activePrefixes || [item.href];
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  };

  const isPremium = !!session?.user?.isPremium;

  const playItems: SidebarItem[] = [
    ...(session ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { href: '/quizzen', label: 'Quizzen', icon: BookOpen },
    { href: '/ranglijst', label: 'Ranglijst', icon: Trophy },
    { href: '/samen-spelen', label: 'Samen spelen', icon: Users },
    // Members manage their membership under Account instead - nothing to sell here.
    ...(isPremium ? [] : [{ href: '/premium', label: 'Premium', icon: Crown }]),
  ];

  const accountItems: SidebarItem[] = session
    ? [
        { href: '/profiel', label: 'Profiel', icon: User },
        ...(isPremium ? [{ href: '/premium', label: 'Lidmaatschap', icon: Crown }] : []),
        { href: '/instellingen', label: 'Instellingen', icon: Settings, activePrefixes: ['/instellingen'] },
      ]
    : [
        { href: '/inloggen', label: 'Inloggen', icon: LogIn },
        { href: '/registreren', label: 'Registreren', icon: UserPlus },
      ];

  const supportItems: SidebarItem[] = [
    { href: '/hulp', label: 'Help', icon: LifeBuoy },
    { href: '/contact', label: 'Contact', icon: Mail },
    { href: '/foutmelding', label: 'Bug report', icon: Bug, activePrefixes: ['/foutmelding'] },
    { href: '/privacybeleid', label: 'Privacybeleid', icon: ShieldCheck },
    { href: '/voorwaarden', label: 'Voorwaarden', icon: FileText },
  ];

  const sections: SidebarSection[] = [
    { title: 'Spelen', items: playItems },
    { title: 'Account', items: accountItems },
  ];

  if (session?.user?.role === 'admin') {
    sections.push({
      title: 'Beheer',
      items: [{ href: '/beheer', label: 'Admin', icon: Shield }],
    });
  }

  sections.push({ title: 'Support', items: supportItems });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen border-r border-rule bg-paper p-3 lg:flex lg:flex-col',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="border-b border-rule pb-3">
        <Link
          href="/"
          title="BijbelQuiz"
          className={cn('flex rounded-md px-2 py-1.5', collapsed ? 'justify-center' : 'items-center gap-2.5')}
        >
          <div className="relative h-7 w-7">
            <Image src="/icon/Logo%20-%20dark.svg" alt="BijbelQuiz Logo" fill className="object-contain dark:hidden" priority />
            <Image src="/icon/Logo%20-%20light.svg" alt="BijbelQuiz Logo" fill className="hidden object-contain dark:block" priority />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
              Bijbel<span className="text-lapis">Quiz</span>
            </span>
          )}
        </Link>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {sections.map((section) => (
          <section key={section.title}>
            {!collapsed && (
              <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                {section.title}
              </p>
            )}

            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      'relative flex rounded-md text-sm font-medium transition-colors',
                      collapsed ? 'justify-center px-2 py-2.5' : 'items-center gap-2.5 px-3 py-2',
                      isItemActive(item)
                        ? 'bg-paper-sunken text-ink before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-lapis'
                        : 'text-ink-muted hover:bg-paper-sunken hover:text-ink'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </section>
        ))}
      </div>

      {/* Sidebar upsell. Deliberately understated - it sits under the
          navigation all day, so it is a standing offer rather than a banner:
          hairline card, one figure, one action. The figure is the per-week
          price, which is the smallest true number this product can quote. */}
      {session && !isPremium && !collapsed && (
        <section className="mt-3 shrink-0 rounded-lg border border-rule bg-paper-raised p-4">
          <p className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            <span aria-hidden className="h-px w-4 bg-lapis" />
            Premium
          </p>

          <p className="mt-3 font-display text-base leading-snug text-ink">
            Samen spelen zonder limiet
          </p>

          {sidebarPerWeek && (
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="font-display text-xl font-normal tabular-nums text-ink">
                {sidebarPerWeek}
              </span>
              <span className="text-[11px] text-ink-muted">per week, jaarlijks</span>
            </p>
          )}

          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Onbeperkt hosten tot 20 spelers, uitleg bij elke vraag.
          </p>

          <Link
            href="/premium"
            onClick={() =>
              trackEvent('multiplayer_premium_cta_clicked', { placement: 'sidebar' })
            }
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-ink px-3 py-2.5 text-xs font-medium text-ink-inverted transition-colors hover:bg-ink-soft"
          >
            <Crown className="h-3.5 w-3.5" />
            Bekijk Premium
          </Link>
        </section>
      )}
    </aside>
  );
}
