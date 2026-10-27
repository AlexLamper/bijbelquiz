import * as React from 'react';

import { niceMax, formatNumber, type FillTone } from '@/components/web2/beheer-2/parts';
import { PLATFORM_KEYS, PLATFORM_LABELS, type PlatformKey } from '@/lib/admin/platform-labels';
import { cn } from '@/lib/utils';

/**
 * Per-platform colours and the stacked weekly chart for the beheer pages.
 * Server-rendered divs, like the rest of the beheer plots.
 */

export const PLATFORM_TONE: Record<PlatformKey, FillTone> = {
  'web-desktop': 'lapis',
  'web-mobile': 'gold',
  web: 'muted',
  ios: 'coral',
  android: 'green',
  app: 'muted',
  onbekend: 'muted',
};

const BG: Record<FillTone, string> = {
  lapis: 'bg-lapis',
  gold: 'bg-gold',
  coral: 'bg-coral',
  green: 'bg-green',
  muted: 'bg-edge',
};

export function PlatformLegend({ keys, totals }: { keys: PlatformKey[]; totals?: Partial<Record<PlatformKey, number>> }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
      {keys.map((key) => (
        <li key={key} className="inline-flex items-center gap-2 text-[13px] font-bold text-ink-soft">
          <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-[2px]', BG[PLATFORM_TONE[key]])} />
          {PLATFORM_LABELS[key]}
          {totals && <span className="font-extrabold tabular-nums text-ink">{formatNumber(totals[key] ?? 0)}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Column per week, stacked by platform, with a 3-tick value axis. */
export function StackedWeekChart({
  weeks,
  height = 140,
  label,
}: {
  weeks: Array<{ label: string; total: number; byPlatform: Partial<Record<PlatformKey, number>> }>;
  height?: number;
  label: string;
}) {
  const max = niceMax(Math.max(0, ...weeks.map((week) => week.total)));
  const n = Math.max(1, weeks.length);
  const labels: Array<[number, string]> =
    weeks.length > 2
      ? [
          [0, weeks[0].label],
          [Math.floor(weeks.length / 2), weeks[Math.floor(weeks.length / 2)].label],
          [weeks.length - 1, weeks[weeks.length - 1].label],
        ]
      : weeks.map((week, index) => [index, week.label]);

  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2">
      <div aria-hidden="true" className="relative" style={{ height }}>
        {[max, max / 2, 0].map((tick, index) => (
          <span
            key={index}
            className="absolute right-0 -translate-y-1/2 text-xs font-bold leading-3 text-ink-muted tabular-nums"
            style={{ top: `${index * 50}%` }}
          >
            {formatNumber(tick)}
          </span>
        ))}
      </div>
      <div className="relative min-w-0" style={{ height }} role="img" aria-label={label}>
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-line-soft" />
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line-soft" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-px bg-edge" />
        <div className="absolute inset-0 flex items-end gap-1">
          {weeks.map((week, index) => {
            const parts = PLATFORM_KEYS.map((key) => ({ key, value: week.byPlatform[key] ?? 0 })).filter((part) => part.value > 0);
            const title = `Week van ${week.label}: ${formatNumber(week.total)}${parts.length ? ` (${parts.map((part) => `${PLATFORM_LABELS[part.key]} ${part.value}`).join(', ')})` : ''}`;
            return (
              <div key={index} className="flex h-full min-w-0 flex-1 flex-col-reverse items-stretch" title={title}>
                {parts.map((part, partIndex) => (
                  <div
                    key={part.key}
                    className={cn(BG[PLATFORM_TONE[part.key]], partIndex === parts.length - 1 && 'rounded-t-[3px]')}
                    style={{ height: Math.max(2, (part.value / max) * height) }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div aria-hidden="true" />
      <div aria-hidden="true" className="relative h-4">
        {labels.map(([index, text], i) => {
          const first = i === 0;
          const last = i === labels.length - 1 && i > 0;
          return (
            <span
              key={`${index}-${text}`}
              className={cn('absolute top-0 whitespace-nowrap text-xs font-bold leading-4 text-ink-muted tabular-nums', !first && !last && '-translate-x-1/2')}
              style={first ? { left: 0 } : last ? { right: 0 } : { left: `${(((index + 0.5) / n) * 100).toFixed(2)}%` }}
            >
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
