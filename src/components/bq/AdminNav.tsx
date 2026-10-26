'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, CreditCard, Filter, LayoutDashboard } from 'lucide-react';

import { cn } from '@/lib/utils';
import { isActivePath } from './nav';

const ADMIN_NAV = [
  { label: 'Overzicht', href: '/beheer', icon: LayoutDashboard, exact: true },
  { label: 'Quizzen', href: '/beheer/quizzen', icon: BookOpen },
  { label: 'Statistieken', href: '/beheer/statistieken', icon: BarChart3 },
  { label: 'Betalingen', href: '/beheer/betalingen', icon: CreditCard },
  { label: 'Funnel', href: '/beheer/funnel', icon: Filter },
];

/** The beheer sidebar links; a row that scrolls sideways on phones. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Beheer" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none] m:mx-0 m:flex-col m:overflow-visible m:px-0 m:pb-0">
      {ADMIN_NAV.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? pathname === href : isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-10 shrink-0 items-center gap-3 whitespace-nowrap rounded-[10px] px-3 text-[15px] no-underline m:h-11',
              active ? 'bg-lapis-tint font-extrabold text-lapis' : 'font-bold text-ink-soft hover:bg-chip hover:text-ink',
            )}
          >
            <Icon className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
