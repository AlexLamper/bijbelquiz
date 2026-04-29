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

  const isItemActive = (item: SidebarItem) => {
    const prefixes = item.activePrefixes || [item.href];
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  };

  const playItems: SidebarItem[] = session
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/quizzes', label: 'Quizzen', icon: BookOpen },
        { href: '/leaderboard', label: 'Ranglijst', icon: Trophy },
        { href: '/multiplayer', label: 'Multiplayer', icon: Users },
        { href: '/premium', label: 'Premium', icon: Crown },
      ]
    : [
        { href: '/quizzes', label: 'Quizzen', icon: BookOpen },
        { href: '/leaderboard', label: 'Ranglijst', icon: Trophy },
        { href: '/multiplayer', label: 'Multiplayer', icon: Users },
        { href: '/premium', label: 'Premium', icon: Crown },
      ];

  const accountItems: SidebarItem[] = session
    ? [{ href: '/profile', label: 'Profiel', icon: User }]
    : [
        { href: '/login', label: 'Inloggen', icon: LogIn },
        { href: '/register', label: 'Registreren', icon: UserPlus },
      ];

  const supportItems: SidebarItem[] = [
    { href: '/help', label: 'Help', icon: LifeBuoy },
    { href: '/contact', label: 'Contact', icon: Mail },
    { href: '/bug-report', label: 'Bug report', icon: Bug, activePrefixes: ['/bug-report'] },
    { href: '/privacy-policy', label: 'Privacybeleid', icon: ShieldCheck },
    { href: '/terms-of-service', label: 'Voorwaarden', icon: FileText },
  ];

  const sections: SidebarSection[] = [
    { title: 'Spelen', items: playItems },
    { title: 'Account', items: accountItems },
  ];

  if (session?.user?.role === 'admin') {
    sections.push({
      title: 'Beheer',
      items: [{ href: '/admin', label: 'Admin', icon: Shield }],
    });
  }

  sections.push({ title: 'Support', items: supportItems });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen border-r border-[#dbe3ef] bg-white/95 p-3 backdrop-blur supports-backdrop-filter:bg-white/90 lg:flex lg:flex-col dark:border-zinc-700 dark:bg-zinc-950/95 dark:supports-backdrop-filter:bg-zinc-950/90',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="border-b border-[#e3ebf5] pb-3 dark:border-zinc-700">
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
            <span className="font-serif text-lg font-bold tracking-tight text-[#1f2f4b] dark:text-zinc-100">
              Bijbel<span className="text-[#4f6faa] dark:text-zinc-300">Quiz</span>
            </span>
          )}
        </Link>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {sections.map((section) => (
          <section key={section.title}>
            {!collapsed && (
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#607597] dark:text-zinc-400">
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
                      'flex rounded-md text-sm font-medium text-[#4e5f79] transition-colors dark:text-zinc-300',
                      collapsed ? 'justify-center px-2 py-2.5' : 'items-center gap-2 px-3 py-2',
                      isItemActive(item)
                        ? 'bg-[#edf2fa] text-[#24395f] dark:bg-zinc-800 dark:text-zinc-100'
                        : 'hover:bg-[#f5f8fd] hover:text-[#24395f] dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
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
    </aside>
  );
}