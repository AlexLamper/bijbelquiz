import * as React from 'react';

import { cn } from '@/lib/utils';
import { Pill } from '@/components/bq/Pill';

/**
 * Building blocks for the beheer data pages (P-BeheerStatistieken,
 * P-BeheerBetalingen, P-BeheerFunnel). All server-rendered, no chart library:
 * every plot here compares a handful of magnitudes, which a row of divs does
 * responsively, without hydration and in the theme tokens.
 */

// ───────────────────────────────────────────────────────────────────────────
// Formatting
// ───────────────────────────────────────────────────────────────────────────

const NUMBER = new Intl.NumberFormat('nl-NL');
const DECIMAL = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return NUMBER.format(Math.round(value));
}

/** One decimal at most, Dutch comma: 6.8 -> "6,8", 58 -> "58". */
export function formatDecimal(value: number): string {
  return DECIMAL.format(value);
}

export function formatPct(value: number): string {
  return `${DECIMAL.format(value)}%`;
}

/** Whole percent: 38.4 -> "38%". */
export function formatWhole(value: number): string {
  return `${NUMBER.format(Math.round(value))}%`;
}

/** Whole percent, with one decimal only under 10%: 58 -> "58%", 6.8 -> "6,8%". */
export function formatShare(value: number): string {
  return value < 10 ? formatPct(value) : `${NUMBER.format(Math.round(value))}%`;
}

/** "26 okt 2026", or a plain hyphen for no date. */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date
    .toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' })
    .replace('.', '');
}

function parts(value: Date | string, withSeconds: boolean) {
  const date = new Date(value);
  const get = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('nl-NL', { ...options, timeZone: 'Europe/Amsterdam' }).format(date);
  return {
    valid: !Number.isNaN(date.getTime()),
    dd: get({ day: '2-digit' }),
    mm: get({ month: '2-digit' }),
    yyyy: get({ year: 'numeric' }),
    time: get({ hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}), hourCycle: 'h23' }),
  };
}

/** "26-10-2026 14:32:10" (seconds optional), as the payment designs print it. */
export function formatDateTime(value: Date | string | null | undefined, withSeconds = true): string {
  if (!value) return '-';
  const p = parts(value, withSeconds);
  if (!p.valid) return '-';
  return `${p.dd}-${p.mm}-${p.yyyy} ${p.time}`;
}

/** "26-10 14:31", for the raw event tail. */
export function formatShortDateTime(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const p = parts(value, false);
  if (!p.valid) return '-';
  return `${p.dd}-${p.mm} ${p.time}`;
}

// ───────────────────────────────────────────────────────────────────────────
// Layout
// ───────────────────────────────────────────────────────────────────────────

/** Section title on the canvas: 24/30 display (21/28 on phones) with a muted intro. */
export function SectionHeading({ id, title, intro, className }: { id?: string; title: string; intro?: React.ReactNode; className?: string }) {
  return (
    <div id={id} className={cn('scroll-mt-6 pt-4', className)}>
      <h2 className="m-0 text-[21px] leading-7 m:text-2xl m:leading-[30px]">{title}</h2>
      {intro && <p className="mb-0 mt-1 max-w-[70ch] text-[15px] font-semibold leading-[22px] text-ink-muted">{intro}</p>}
    </div>
  );
}

/** Grid of cards. `cols` is the desktop count; phones get one column, `stats` keeps two. */
export function Grid({
  cols,
  variant = 'default',
  className,
  children,
}: {
  cols: 2 | 3 | 4;
  variant?: 'default' | 'stats';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid min-w-0',
        cols === 4 ? 'gap-3' : 'items-start gap-5',
        variant === 'stats'
          ? 'grid-cols-2 m:grid-cols-4'
          : cols === 4
            ? 'grid-cols-1 m:grid-cols-2 min-[1101px]:grid-cols-4'
            : cols === 3
              ? 'grid-cols-1 m:grid-cols-3'
              : 'grid-cols-1 m:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A headline number in its own small card. */
export function StatCard({
  label,
  value,
  meta,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  meta?: React.ReactNode;
  tone?: 'neutral' | 'positive' | 'warning';
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[16px] border border-line bg-card px-[18px] py-4">
      <span className="text-[13px] font-bold leading-[18px] text-ink-muted">{label}</span>
      <span
        className={cn(
          'text-[28px] font-extrabold leading-[34px] tracking-[-0.01em] tabular-nums',
          tone === 'positive' ? 'text-green-text' : tone === 'warning' ? 'text-coral-text' : 'text-ink',
        )}
      >
        {value}
      </span>
      {meta && <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">{meta}</span>}
    </div>
  );
}

/** White card with a 16px title and an optional meta line on the right. */
export function Panel({
  title,
  meta,
  className,
  children,
}: {
  title?: string;
  meta?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-3.5 rounded-[16px] border border-line bg-card px-5 pb-5 pt-[18px]', className)}>
      {title && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h3 className="m-0 font-sans text-base font-extrabold leading-[22px]">{title}</h3>
          {meta && <span className="text-[13px] font-semibold leading-[18px] text-ink-muted tabular-nums">{meta}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Card title as used above tables and in the payment cards: 17/24 Nunito 800. */
export function CardTitle({
  title,
  description,
  icon,
  as: Tag = 'h2',
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  as?: 'h2' | 'h3';
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {icon && (
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-lapis-tint text-lapis">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <Tag className="m-0 font-sans text-[17px] font-extrabold leading-6">{title}</Tag>
        {description && <p className="mb-0 mt-0.5 text-sm font-semibold leading-5 text-ink-muted">{description}</p>}
      </div>
    </div>
  );
}

/** Muted paragraph inside a panel. */
export function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('m-0 text-sm font-semibold leading-5 text-ink-muted', className)}>{children}</p>;
}

/** Monospace identifier: route patterns, event names, env keys. */
export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('font-mono text-xs leading-4 text-ink-muted [overflow-wrap:anywhere]', className)}>{children}</span>;
}

const TAG_TONE = {
  neutral: 'bg-chip text-ink-soft',
  warning: 'bg-coral-tint text-coral-text',
  accent: 'bg-lapis-tint text-lapis',
  gold: 'bg-gold-tint text-gold-text',
} as const;

/** 20px square-ish tag next to a row title ("App", "Publiek", "Link"). */
export function Tag({ tone = 'neutral', children }: { tone?: keyof typeof TAG_TONE; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex h-5 items-center whitespace-nowrap rounded-[6px] px-[7px] text-xs font-extrabold', TAG_TONE[tone])}>
      {children}
    </span>
  );
}

export type ChipTone = 'green' | 'coral' | 'gold' | 'grey';

/** Round status chip ("actief", "gezet", "enabled"): the foundation Pill. */
export function StatusChip({ tone, children }: { tone: ChipTone; children: React.ReactNode }) {
  return (
    <Pill tone={tone} size="sm" className="shrink-0">
      {children}
    </Pill>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Tables
// ───────────────────────────────────────────────────────────────────────────

/**
 * A white card holding one table. The table scrolls inside the card, so a wide
 * table never widens the page; with `stack` it becomes stacked rows on phones
 * instead (each cell under its column name, from the `label` on `Td`).
 */
export function TableCard({
  title,
  description,
  action,
  caption,
  minWidth,
  head,
  footer,
  stack,
  stickyFirst,
  id,
  toolbar,
  className,
  children,
}: {
  id?: string;
  /** Filters or search between the title and the table. */
  toolbar?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Link or control on the right of the title. */
  action?: React.ReactNode;
  caption: string;
  minWidth: number;
  head: React.ReactNode;
  footer?: React.ReactNode;
  stack?: boolean;
  /** Keep the first column in view while the rest scrolls (wide number matrices). */
  stickyFirst?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-line bg-card', className)}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pb-3 pt-[18px]">
          <CardTitle title={title} description={description} />
          {action}
        </div>
      ) : (
        <div className="h-1.5" aria-hidden="true" />
      )}
      {toolbar && <div className="px-5 pb-3">{toolbar}</div>}
      <Table caption={caption} minWidth={minWidth} head={head} stack={stack} stickyFirst={stickyFirst}>
        {children}
      </Table>
      {footer ? (
        <div className="border-t border-line-soft px-5 pb-4 pt-3">{footer}</div>
      ) : (
        <div className="h-1.5" aria-hidden="true" />
      )}
    </section>
  );
}

/**
 * The bare scrolling table, for tables that sit inside a larger card. Rows
 * light up on hover; numbers are right-aligned with tabular figures (`Td
 * numeric`). `stack`: on phones the rows become blocks, the first cell as the
 * row title and every other cell as "label  value".
 */
export function Table({
  caption,
  minWidth,
  head,
  stack,
  stickyFirst,
  children,
}: {
  caption: string;
  minWidth: number;
  head: React.ReactNode;
  stack?: boolean;
  stickyFirst?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('overflow-x-auto', stack && 'max-m:overflow-visible')}>
      <table
        className={cn(
          'w-full border-collapse [&>tbody>tr]:transition-colors [&>tbody>tr:hover]:bg-chip/60',
          stack && 'm:min-w-[var(--table-min)]',
          stack && STACKED,
          stickyFirst &&
            'max-m:[&_tr>*:first-child]:sticky max-m:[&_tr>*:first-child]:left-0 max-m:[&_tr>*:first-child]:z-[1] max-m:[&_tr>*:first-child]:bg-card max-m:[&_tr>*:first-child]:shadow-[1px_0_0_var(--line-soft)]',
        )}
        style={stack ? ({ '--table-min': `${minWidth}px` } as React.CSSProperties) : { minWidth }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Phone layout of a stacked table (below the `m` breakpoint). */
const STACKED = [
  'max-m:block',
  'max-m:[&>thead]:sr-only',
  'max-m:[&>tbody]:block',
  'max-m:[&>tbody>tr]:flex max-m:[&>tbody>tr]:flex-col max-m:[&>tbody>tr]:gap-1 max-m:[&>tbody>tr]:border-t max-m:[&>tbody>tr]:border-line-soft max-m:[&>tbody>tr]:px-4 max-m:[&>tbody>tr]:py-3 max-m:[&>tbody>tr:first-child]:border-t-0',
  'max-m:[&>tbody>tr>td]:flex max-m:[&>tbody>tr>td]:items-baseline max-m:[&>tbody>tr>td]:justify-between max-m:[&>tbody>tr>td]:gap-3 max-m:[&>tbody>tr>td]:border-0 max-m:[&>tbody>tr>td]:p-0! max-m:[&>tbody>tr>td]:text-right',
  'max-m:[&>tbody>tr>td:first-child]:block max-m:[&>tbody>tr>td:first-child]:text-left max-m:[&>tbody>tr>td:first-child]:pb-1',
  'max-m:[&>tbody>tr>td[data-label]]:before:content-[attr(data-label)] max-m:[&>tbody>tr>td[data-label]]:before:shrink-0 max-m:[&>tbody>tr>td[data-label]]:before:text-left max-m:[&>tbody>tr>td[data-label]]:before:text-[13px] max-m:[&>tbody>tr>td[data-label]]:before:font-bold max-m:[&>tbody>tr>td[data-label]]:before:text-ink-muted',
  'max-m:[&>tbody>tr>td:not(:first-child)>*]:items-end max-m:[&>tbody>tr>td:not(:first-child)>*]:text-right',
  'max-m:[&>tbody>tr>td[data-empty]]:hidden',
].join(' ');

export function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-line px-4 py-2.5 text-[13px] font-bold text-ink-muted first:pl-5 last:pr-5',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  tone = 'body',
  valign = 'top',
  numeric,
  label,
  hideEmptyOnPhone,
  className,
  style,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  /** body: 600 ink-soft; strong: 800 ink; muted: 600 ink-muted. */
  tone?: 'body' | 'strong' | 'muted';
  valign?: 'top' | 'middle';
  numeric?: boolean;
  /** Column name, shown before the value when a `stack` table is on a phone. */
  label?: string;
  /** In a stacked table on a phone, leave this cell out (it is empty or repeated). */
  hideEmptyOnPhone?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={style}
      data-label={label}
      data-empty={hideEmptyOnPhone ? '' : undefined}
      className={cn(
        'border-t border-line-soft px-4 py-3 text-sm leading-5 first:pl-5 last:pr-5',
        align === 'right' ? 'text-right' : 'text-left',
        valign === 'top' ? 'align-top' : 'align-middle',
        numeric && 'whitespace-nowrap tabular-nums',
        tone === 'strong' ? 'font-extrabold text-ink' : tone === 'muted' ? 'font-semibold text-ink-muted' : 'font-semibold text-ink-soft',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={columns} className="border-t border-line-soft p-0 text-sm font-semibold text-ink-muted">
        {/* Sticky, and no wider than the card on phones, so the message stays in view in a table that scrolls sideways. */}
        <div className="sticky left-0 max-w-[calc(100vw-34px)] px-5 py-8 text-center m:max-w-none">{children}</div>
      </td>
    </tr>
  );
}

/** Row title with optional tags, a mono id under it and a meter. */
export function RowTitle({
  title,
  tags,
  mono,
  sub,
  children,
}: {
  title: React.ReactNode;
  tags?: React.ReactNode;
  mono?: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="font-extrabold text-ink">{title}</span>
        {tags}
      </span>
      {mono && <Mono className="mt-0.5 block">{mono}</Mono>}
      {sub}
      {children}
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Plots
// ───────────────────────────────────────────────────────────────────────────

const FILL = {
  lapis: 'bg-lapis',
  green: 'bg-green',
  coral: 'bg-coral',
  gold: 'bg-gold',
  muted: 'bg-edge',
} as const;

export type FillTone = keyof typeof FILL;

/** 4px in-row proportion bar. */
export function Meter({ value, max, tone = 'lapis' }: { value: number; max: number; tone?: 'lapis' | 'green' }) {
  const width = max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * 100) : 0;
  return (
    <span aria-hidden="true" className="mt-2 block h-1 rounded-full bg-line-soft">
      <span className={cn('block h-1 rounded-full', FILL[tone])} style={{ width: `${width.toFixed(1)}%` }} />
    </span>
  );
}

/**
 * A "nice" top for an axis: the smallest of 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8
 * (times a power of ten) at or above the value, so the half-way tick is clean.
 */
export function niceMax(value: number): number {
  // Counts: never below 2, so the half-way tick is a whole number too.
  if (value <= 2) return 2;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (step * base >= value) return step * base;
  }
  return 10 * base;
}

export interface ColumnPoint {
  value: number;
  /** Tooltip sentence. */
  title: string;
}

/**
 * Column chart with a 40px value axis (top, half, zero) and up to five
 * labels underneath, positioned under the centre of their column.
 */
export function ColumnChart({
  points,
  height = 120,
  tone = 'lapis',
  xLabels,
  narrow = false,
  label,
}: {
  points: ColumnPoint[];
  height?: number;
  tone?: 'lapis' | 'green';
  /** [index, text] pairs; the first sits flush left, the last flush right. */
  xLabels: Array<[number, string]>;
  /** Columns at 56% of their slot (the hour chart) instead of slot minus 2px. */
  narrow?: boolean;
  label: string;
}) {
  const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const n = Math.max(1, points.length);
  const dense = n > 90;

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
        <div className="absolute inset-0 flex items-end">
          {points.map((point, index) => {
            const h = point.value > 0 ? Math.max(2, (point.value / max) * height) : 0;
            return (
              <div key={index} className="flex h-full min-w-0 flex-1 items-end justify-center" title={point.title}>
                <div
                  className={cn(FILL[tone], dense ? 'w-full' : narrow ? 'w-[56%]' : 'w-[calc(100%-2px)]')}
                  style={{ height: h, borderRadius: dense ? 0 : `${Math.min(4, h / 2)}px ${Math.min(4, h / 2)}px 0 0` }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div aria-hidden="true" />
      <div aria-hidden="true" className="relative h-4">
        {xLabels.map(([index, text], i) => {
          const first = i === 0;
          const last = i === xLabels.length - 1 && i > 0;
          return (
            <span
              key={`${index}-${text}`}
              className={cn(
                'absolute top-0 whitespace-nowrap text-xs font-bold leading-4 text-ink-muted tabular-nums',
                !first && !last && '-translate-x-1/2',
              )}
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

export interface Share {
  label: string;
  value: number;
  tone: FillTone;
}

/** Part-to-whole bar with a 2px gap and a legend carrying the numbers. */
export function ShareBar({ shares, caption, empty = 'Nog geen metingen.' }: { shares: Share[]; caption?: React.ReactNode; empty?: string }) {
  const total = shares.reduce((sum, share) => sum + share.value, 0);
  if (total === 0) {
    return (
      <>
        <Note>{empty}</Note>
        {caption && <p className="m-0 text-[13px] font-semibold leading-[18px] text-ink-muted">{caption}</p>}
      </>
    );
  }
  return (
    <>
      <div className="flex gap-0.5" role="img" aria-label="Verdeling">
        {shares
          .filter((share) => share.value > 0)
          .map((share) => (
            <span
              key={share.label}
              title={`${share.label}: ${formatNumber(share.value)}`}
              className={cn('h-3 min-w-0.5 rounded-[3px]', FILL[share.tone])}
              style={{ flex: `${share.value} 1 0` }}
            />
          ))}
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {shares.map((share) => (
          <li key={share.label} className="flex items-baseline justify-between gap-3 text-sm leading-5">
            <span className="inline-flex items-center gap-2 font-bold text-ink-soft">
              <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-[2px]', FILL[share.tone])} />
              {share.label}
            </span>
            <span className="whitespace-nowrap font-extrabold tabular-nums">
              {formatNumber(share.value)}
              <Pct>{Math.round((share.value / total) * 100)}%</Pct>
            </span>
          </li>
        ))}
      </ul>
      {caption && <p className="m-0 text-[13px] font-semibold leading-[18px] text-ink-muted">{caption}</p>}
    </>
  );
}

/** The 40px right-aligned share next to a count. */
export function Pct({ children }: { children: React.ReactNode }) {
  return <span className="ml-1 inline-block min-w-10 text-right font-semibold text-ink-muted">{children}</span>;
}

/** Simple label / value list ("google.com 2.214 43%"). */
export function ValueList({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 flex list-none flex-col gap-2.5 p-0">{children}</ul>;
}

export function ValueItem({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-sm leading-5">
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 whitespace-nowrap text-right tabular-nums">{children}</span>
    </li>
  );
}

/** Label + id stacked, for the "never pressed" style lists. */
export function StackedLabel({ title, sub, mono = true, tone = 'ink' }: { title: React.ReactNode; sub?: React.ReactNode; mono?: boolean; tone?: 'ink' | 'soft' }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className={cn('font-bold', tone === 'ink' ? 'text-ink' : 'text-ink-soft')}>{title}</span>
      {sub && (mono ? <Mono>{sub}</Mono> : <span className="text-xs font-semibold leading-4 text-ink-muted">{sub}</span>)}
    </span>
  );
}

/**
 * Horizontal bars in a two-column grid: label, then a bar whose length is the
 * share of the largest value, with the number right after it.
 */
export function HBarList({
  rows,
  labelColumn,
  barHeight = 14,
  reserve = 56,
  tone = 'lapis',
  label,
}: {
  rows: Array<{ label: string; value: number; title?: string }>;
  labelColumn: string;
  barHeight?: number;
  /** Room kept for the number after the longest bar, in px. */
  reserve?: number;
  tone?: 'lapis' | 'green';
  label: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul
      aria-label={label}
      className="m-0 grid list-none items-center gap-x-3 gap-y-2.5 p-0"
      style={{ gridTemplateColumns: `${labelColumn} minmax(0, 1fr)` }}
    >
      {rows.map((row) => (
        <li key={row.label} className="contents">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold leading-5 text-ink-soft">{row.label}</span>
          <span className="flex min-w-0 items-center gap-2">
            <span
              title={row.title ?? `${row.label}: ${formatNumber(row.value)}`}
              className={cn('min-w-0.5 flex-none rounded-r-[4px]', FILL[tone])}
              style={{ width: `calc((100% - ${reserve}px) * ${(row.value / max).toFixed(4)})`, height: barHeight }}
            />
            <span className="whitespace-nowrap text-sm font-extrabold tabular-nums">{formatNumber(row.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
