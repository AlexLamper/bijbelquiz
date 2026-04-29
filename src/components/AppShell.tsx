'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';

import Navbar from '@/components/Navbar';
import AppSidebar from '@/components/AppSidebar';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
}

const SIDEBAR_ROUTE_PREFIXES = [
  '/dashboard',
  '/quizzes',
  '/leaderboard',
  '/profile',
  '/multiplayer',
  '/premium',
  '/admin',
  '/help',
  '/contact',
  '/bug-report',
  '/privacy-policy',
  '/terms-of-service',
  '/instellingen',
  '/settings',
];

function shouldShowSidebar(pathname: string): boolean {
  return SIDEBAR_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col',
        showSidebar && (isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56')
      )}
    >
      {showSidebar && <AppSidebar collapsed={isSidebarCollapsed} />}
      <Navbar
        withSidebar={showSidebar}
        sidebarCollapsed={isSidebarCollapsed}
        onSidebarToggle={() => setIsSidebarCollapsed((value) => !value)}
      />

      <main className="flex-1">{children}</main>
    </div>
  );
}