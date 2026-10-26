import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * "Download in de App Store" / "Ontdek het op Google Play": 48px white
 * buttons with the 3px edge and the two-line label from the designs.
 *
 * The App Store link is country neutral so it opens the visitor's own
 * storefront. The Google Play link comes from `NEXT_PUBLIC_GOOGLE_PLAY_URL`;
 * until the Android app is published the badge is simply not rendered.
 */
export const APP_STORE_URL = 'https://apps.apple.com/app/id6761718680';
export const GOOGLE_PLAY_URL = process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL || null;

interface StoreBadgeProps {
  href: string;
  eyebrow: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}

function StoreBadge({ href, eyebrow, label, icon, className }: StoreBadgeProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex h-12 items-center gap-2.5 rounded-[12px] border border-line border-b-[3px] bg-card pl-3.5 pr-4 text-ink no-underline',
        'hover:bg-chip hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
        className,
      )}
    >
      {icon}
      <span className="flex flex-col whitespace-nowrap leading-[1.15]">
        <span className="text-[11px] font-bold text-ink-muted">{eyebrow}</span>
        <span className="text-base font-extrabold">{label}</span>
      </span>
    </a>
  );
}

export function AppStoreBadge({ className }: { className?: string }) {
  return (
    <StoreBadge
      href={APP_STORE_URL}
      eyebrow="Download in de"
      label="App Store"
      className={className}
      icon={
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="2.5" width="12" height="19" rx="3" />
          <path d="M10.5 18.5h3" />
        </svg>
      }
    />
  );
}

export function GooglePlayBadge({ className }: { className?: string }) {
  if (!GOOGLE_PLAY_URL) return null;
  return (
    <StoreBadge
      href={GOOGLE_PLAY_URL}
      eyebrow="Ontdek het op"
      label="Google Play"
      className={className}
      icon={
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7.5 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.7 4.1a.8.8 0 0 0-1.2.7z" />
        </svg>
      }
    />
  );
}

/** Both badges side by side, wrapping on narrow screens. */
export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2.5', className)}>
      <AppStoreBadge />
      <GooglePlayBadge />
    </div>
  );
}
