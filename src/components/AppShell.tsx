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
  '/quizzen',
  '/ranglijst',
  '/profiel',
  '/samen-spelen',
  '/premium',
  '/beheer',
  '/hulp',
  '/contact',
  '/foutmelding',
  '/privacybeleid',
  '/voorwaarden',
  '/account-verwijderen',
  '/instellingen',
  '/settings',
];

/** Full-screen routes that paint their own layout; app chrome would float on top. */
const CHROMELESS_ROUTES = ['/inloggen', '/registreren'];

function isChromeless(pathname: string): boolean {
  return CHROMELESS_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function shouldShowSidebar(pathname: string): boolean {
  return SIDEBAR_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const chromeless = isChromeless(pathname);
  const showSidebar = !chromeless && shouldShowSidebar(pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col',
        showSidebar && (isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56')
      )}
    >
      {showSidebar && <AppSidebar collapsed={isSidebarCollapsed} />}
      {!chromeless && (
        <Navbar
          withSidebar={showSidebar}
          sidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed((value) => !value)}
        />
      )}

      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}