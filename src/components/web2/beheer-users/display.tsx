import * as React from 'react';

import { Pill } from '@/components/bq/Pill';
import { formatAdminDate } from '@/components/web2/beheer/ui';
import { METHOD_LABELS, PLATFORM_LABELS, type MethodKey, type PlatformKey } from '@/lib/admin/platform-labels';
import { PREMIUM_SOURCE_LABELS, type PremiumSource } from '@/lib/admin/grant-options';
import type { PremiumKind } from '@/lib/admin/premium-kind-labels';
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
        className={cn('whitespace-nowrap font-bold', platform === 'onbekend' ? 'text-ink-muted' : 'text-ink-soft')}
        title={derived ? 'Afgeleid uit de eerste activiteit van dit account (van voor deze meting)' : undefined}
      >
        {PLATFORM_LABELS[platform]}
      </span>
      {(method || (derived && platform !== 'onbekend')) && (
        <span className="whitespace-nowrap text-xs font-semibold leading-4 text-ink-muted">
          {[method && METHOD_LABELS[method], derived && platform !== 'onbekend' && 'afgeleid'].filter(Boolean).join(' · ')}
        </span>
      )}
    </span>
  );
}

export interface PremiumLike {
  active: boolean;
  source: PremiumSource | null;
  until: string | null;
  /** How the account has Premium (premium-status.ts); older callers may leave it out. */
  status?: {
    kind: PremiumKind;
    label: string;
    channel: string | null;
    plan: string | null;
    renews: boolean | null;
    endsAt: string | null;
  } | null;
}

const KIND_PILL: Record<PremiumKind, { tone: 'lapis' | 'green' | 'gold' | 'grey' | 'coral'; text: string }> = {
  trial: { tone: 'lapis', text: 'Proefperiode' },
  paid: { tone: 'green', text: 'Betaald' },
  lifetime: { tone: 'gold', text: 'Levenslang' },
  group: { tone: 'grey', text: 'Groepslicentie' },
  manual: { tone: 'grey', text: 'Gegeven' },
};

const CHANNEL_SHORT: Record<string, string> = { website: 'website', app_store: 'App Store', play_store: 'Google Play', app: 'app' };
const PLAN_SHORT: Record<string, string> = { yearly: 'jaarlijks', monthly: 'maandelijks' };

/**
 * How the account has Premium: "Proefperiode", "Betaald", "Levenslang",
 * "Gegeven" or "Groepslicentie", with how and until when under it; a grey
 * "Gratis" without Premium.
 */
export function PremiumCell({ premium, compact }: { premium: PremiumLike; compact?: boolean }) {
  if (!premium.active || !premium.source) {
    return <Pill tone="grey" size="sm">Gratis</Pill>;
  }
  const status = premium.status ?? null;
  const pill = status ? KIND_PILL[status.kind] : { tone: 'gold' as const, text: 'Premium' };
  const how = status
    ? [status.plan && PLAN_SHORT[status.plan], status.channel && CHANNEL_SHORT[status.channel]].filter(Boolean).join(' · ')
    : PREMIUM_SOURCE_LABELS[premium.source];
  const end = status ? status.endsAt : premium.until;
  const endWord = !status || status.renews === null ? 'tot' : status.kind === 'trial' ? (status.renews ? 'betaalt vanaf' : 'opgezegd, stopt') : status.renews ? 'verlengt' : 'opgezegd, stopt';
  return (
    <span className="inline-flex min-w-0 flex-col items-start gap-1">
      <Pill tone={pill.tone} size="sm">
        {pill.text}
      </Pill>
      {!compact && (
        <span className="flex flex-col text-xs font-semibold leading-4 text-ink-muted">
          {how && <span className="whitespace-nowrap">{how}</span>}
          {end ? (
            <span className={cn('whitespace-nowrap tabular-nums', status?.renews === false && 'text-coral-text')}>
              {endWord} {formatAdminDate(end)}
            </span>
          ) : premium.source === 'manual' ? (
            <span className="whitespace-nowrap">geen einddatum</span>
          ) : null}
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
