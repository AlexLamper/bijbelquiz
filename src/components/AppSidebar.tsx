'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, type ComponentType } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Bug,
  ChevronDown,
  Crown,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Library,
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

  const [supportOpenedByHand, setSupportOpenedByHand] = useState(false);

  const isItemActive = (item: SidebarItem) => {
    const prefixes = item.activePrefixes || [item.href];
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  };

  const isPremium = !!session?.user?.isPremium;

  const playItems: SidebarItem[] = [
    ...(session ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { href: '/quizzen', label: 'Quizzen', icon: Library },
    { href: '/ranglijst', label: 'Ranglijst', icon: Trophy },
    { href: '/samen-spelen', label: 'Samen spelen', icon: Users },
  ];

  // Nothing is sold to an individual any more, so there is no offer here. A
  // member still needs a way to their own subscription, which is what this is.
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

  // Open by hand, or automatically whenever the current page is one of these.
  const supportOpen =
    supportOpenedByHand || supportItems.some((item) => isItemActive(item));
  const setSupportOpen = (next: boolean | ((open: boolean) => boolean)) =>
    setSupportOpenedByHand(typeof next === 'function' ? next(supportOpen) : next);

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

      {/* Support sits at the foot of the rail and opens upward.
          These links matter when you need them and are noise the rest of the
          time; five of them stacked under the navigation made the sidebar look
          busier than the product is. It opens itself when you are on one of
          the pages inside it, so the current page is never hidden. */}
      {!collapsed && (
        <section className="mt-3 shrink-0 border-t border-rule pt-2">
          {supportOpen && (
            <nav className="space-y-0.5 pb-2">
              {supportItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isItemActive(item)
                        ? 'bg-paper-sunken text-ink before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-lapis'
                        : 'text-ink-muted hover:bg-paper-sunken hover:text-ink'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          <button
            type="button"
            onClick={() => setSupportOpen((open) => !open)}
            aria-expanded={supportOpen}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
          >
            Support
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', supportOpen && 'rotate-180')}
            />
          </button>
        </section>
      )}

    </aside>
  );
}
