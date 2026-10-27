import * as React from 'react';

import { Pill } from '@/components/bq/Pill';
import { formatAdminDate } from '@/components/web2/beheer/ui';
import { METHOD_LABELS, PLATFORM_LABELS, type MethodKey, type PlatformKey } from '@/lib/admin/platform-labels';
import { PREMIUM_SOURCE_LABELS, type PremiumSource } from '@/lib/admin/grant-options';
import { amsterdamDayKey, shiftDayKey } from '@/lib/admin/time';
import { cn } from '@/lib/utils';

/**
 * Small display pieces shared by the beheer user list, the user page and the
 * overview: platform, Premium status, "laatst actief". Server-safe.
 */

/** "iOS-app" with the method under it; a derived platform is marked as such. */
export function PlatformCell({
  platform,
  derived,
  method,
  className,
}: {
  platform: PlatformKey;
  derived?: boolean;
  method?: MethodKey;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex min-w-0 flex-col', className)}>
      <span
        className={cn('font-bold', platform === 'onbekend' ? 'text-ink-muted' : 'text-ink-soft')}
        title={derived ? 'Afgeleid uit de eerste activiteit van dit account (van voor deze meting)' : undefined}
      >
        {PLATFORM_LABELS[platform]}
        {derived && platform !== 'onbekend' && <span className="text-ink-faint"> (afgeleid)</span>}
      </span>
      {method && <span className="text-xs font-semibold leading-4 text-ink-muted">{METHOD_LABELS[method]}</span>}
    </span>
  );
}

export interface PremiumLike {
  active: boolean;
  source: PremiumSource | null;
  until: string | null;
}

/** Gold "Premium" pill (or a grey "Gratis") with the source and end date under it. */
export function PremiumCell({ premium, compact }: { premium: PremiumLike; compact?: boolean }) {
  if (!premium.active || !premium.source) {
    return <Pill tone="grey" size="sm">Gratis</Pill>;
  }
  return (
    <span className="inline-flex min-w-0 flex-col items-start gap-1">
      <Pill tone="gold" size="sm">
        Premium
      </Pill>
      {!compact && (
        <span className="text-xs font-semibold leading-4 text-ink-muted">
          {PREMIUM_SOURCE_LABELS[premium.source]}
          {premium.until ? ` · tot ${formatAdminDate(premium.until)}` : premium.source === 'manual' || premium.source === 'lifetime' ? ' · geen einddatum' : ''}
        </span>
      )}
    </span>
  );
}

/** "vandaag", "gisteren", "3 dagen geleden", or the date; "nooit" without one. */
export function lastActiveLabel(value: string | null, now: Date = new Date()): string {
  if (!value) return 'nooit';
  const key = amsterdamDayKey(new Date(value));
  const today = amsterdamDayKey(now);
  if (key === today) return 'vandaag';
  if (key === shiftDayKey(today, -1)) return 'gisteren';
  for (let days = 2; days <= 6; days += 1) {
    if (key === shiftDayKey(today, -days)) return `${days} dagen geleden`;
  }
  return formatAdminDate(value);
}

/** Label left, value right, hairline above: detail rows in a card. */
export function InfoRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line-soft py-2.5 first:border-t-0">
      <span className="text-sm font-bold text-ink-muted">{label}</span>
      <span className="min-w-0 text-right text-sm font-bold text-ink tabular-nums [overflow-wrap:anywhere]">{children}</span>
    </div>
  );
}
