'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm ${className}`}>
      <Link
        href="/"
        className="flex items-center gap-1 text-muted-foreground hover:text-primary dark:text-[#5b7dd9] transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-primary dark:text-[#5b7dd9] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#1a2942] dark:text-foreground font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
