import { cn } from '@/lib/utils';

/**
 * The pieces the statistics page is built from.
 *
 * All server-rendered, no charting library. Every plot here is a magnitude
 * comparison over a small number of buckets, which is exactly the case a
 * library adds the least to: a row of divs with a height percentage is
 * responsive by default, prints, needs no hydration, and cannot drift from the
 * page's own colour tokens.
 *
 * The two chart colours are `--chart-1` and `--chart-2`, which are the brand
 * accents re-stepped until they clear the colour-vision separation checks
 * against the paper ground. Anywhere two series sit next to each other they
 * also carry a text label, so identity never rests on colour alone.
 */

const NUMBER = new Intl.NumberFormat('nl-NL');

export function formatNumber(value: number): string {
  return NUMBER.format(Math.round(value));
}

export function formatDate(value: Date | string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ───────────────────────────────────────────────────────────────────────────

export function Section({
  title,
  intro,
  children,
  id,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="mt-14 scroll-mt-24">
      <h2 className="font-display text-[26px] font-normal tracking-[-0.02em] text-ink">{title}</h2>
      {intro && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** A headline number. No plot, so no hover layer - the value is the whole point. */
export function Figure({
  label,
  value,
  meta,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  meta?: string;
  tone?: 'neutral' | 'positive' | 'warning';
}) {
  return (
    <div className="md:px-6 md:first:pl-0 md:last:pr-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-[30px] leading-none tabular-nums',
          tone === 'positive' && 'text-positive',
          tone === 'warning' && 'text-vermilion',
          tone === 'neutral' && 'text-ink'
        )}
      >
        {value}
      </p>
      {meta && <p className="mt-2 text-xs leading-relaxed text-ink-muted">{meta}</p>}
    </div>
  );
}

export function FigureRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-rule py-6 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-rule">
      {children}
    </div>
  );
}

export function Panel({
  title,
  meta,
  children,
  className,
}: {
  title?: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-rule bg-paper-raised p-5', className)}>
      {title && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">{title}</p>
          {meta && <p className="text-xs tabular-nums text-ink-muted">{meta}</p>}
        </div>
      )}
      <div className={title ? 'mt-4' : undefined}>{children}</div>
    </div>
  );
}

export function EmptyRow({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-center text-sm text-ink-muted">
        {children}
      </td>
    </tr>
  );
}

/** Scroll container plus the shared table chrome. Wide tables never widen the page. */
export function DataTable({
  head,
  children,
  minWidth = 640,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rule bg-paper-raised">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-rule-strong text-[10px] uppercase tracking-[0.16em] text-ink-muted">
            {head}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th className={cn('px-4 py-3 font-medium', align === 'right' ? 'text-right' : 'text-left')}>
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  strong,
  muted,
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  strong?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        'px-4 py-3',
        align === 'right' && 'text-right tabular-nums',
        strong ? 'font-medium text-ink' : muted ? 'text-ink-muted' : 'text-ink-soft',
        className
      )}
    >
      {children}
    </td>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-rule last:border-b-0">{children}</tr>;
}

// ───────────────────────────────────────────────────────────────────────────
// Plots
// ───────────────────────────────────────────────────────────────────────────

export interface BarPoint {
  label: string;
  value: number;
  /** Full sentence for the hover tooltip. */
  title: string;
}

/**
 * One series of magnitudes over time.
 *
 * Single series on purpose. Two measures of different scale in one frame need
 * two y-axes to be readable, which makes the comparison between them a lie -
 * so page views, visits and finished quizzes are drawn as small multiples that
 * share an x-axis and each keep their own honest zero-based scale.
 */
export function BarSeries({
  points,
  height = 96,
  accent = 1,
}: {
  points: BarPoint[];
  height?: number;
  accent?: 1 | 2;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);

  return (
    <div>
      <div
        className="relative flex items-end gap-[2px] border-b border-rule"
        style={{ height }}
        role="img"
        aria-label={`${points.length} dagen, hoogste waarde ${formatNumber(max)}`}
      >
        {/* Recessive halfway rule, so the eye can judge "about half the peak". */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-chart-grid" />

        {points.map((point, index) => (
          <div key={`${point.label}-${index}`} className="group relative flex-1" title={point.title}>
            <div
              className={cn(
                'w-full rounded-t-[4px] transition-opacity group-hover:opacity-100',
                accent === 1 ? 'bg-chart-1' : 'bg-chart-2',
                point.value === 0 ? 'opacity-0' : 'opacity-80'
              )}
              style={{
                // A hairline for any non-zero value: a day with one visit that
                // renders as nothing is indistinguishable from a day with none.
                height: Math.max(point.value === 0 ? 0 : 2, (point.value / max) * height),
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-baseline justify-between text-[11px] text-ink-muted">
        <span>{points[0]?.label}</span>
        <span className="tabular-nums">
          piek {formatNumber(peak?.value ?? 0)} op {peak?.label} · totaal {formatNumber(total)}
        </span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** The 24-hour histogram. Same mark spec, labelled every six hours. */
export function HourBars({ points }: { points: Array<{ hour: number; events: number }> }) {
  const max = Math.max(1, ...points.map((point) => point.events));

  return (
    <div>
      <div className="flex h-20 items-end gap-[2px] border-b border-rule">
        {points.map((point) => (
          <div
            key={point.hour}
            className="flex-1"
            title={`${String(point.hour).padStart(2, '0')}:00 — ${formatNumber(point.events)} weergaven`}
          >
            <div
              className={cn(
                'w-full rounded-t-[4px] bg-chart-1',
                point.events === 0 ? 'opacity-0' : 'opacity-80'
              )}
              style={{ height: Math.max(point.events === 0 ? 0 : 2, (point.events / max) * 80) }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-ink-muted">
        {['00', '06', '12', '18', '23'].map((hour) => (
          <span key={hour}>{hour}u</span>
        ))}
      </div>
    </div>
  );
}

export interface Share {
  label: string;
  value: number;
  accent: 1 | 2 | 'muted';
}

/**
 * A part-to-whole split, drawn as one bar with a 2px gap between segments and
 * every segment named in the legend underneath. Never a pie: comparing two
 * angles is harder than comparing two lengths, and the legend has to carry the
 * numbers anyway.
 */
export function ShareBar({ shares, caption }: { shares: Share[]; caption?: string }) {
  const total = shares.reduce((sum, share) => sum + share.value, 0);

  if (total === 0) {
    return <p className="text-sm text-ink-muted">{caption ?? 'Nog geen metingen.'}</p>;
  }

  const fill = (accent: Share['accent']) =>
    accent === 1 ? 'bg-chart-1' : accent === 2 ? 'bg-chart-2' : 'bg-rule-strong';

  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden">
        {shares
          .filter((share) => share.value > 0)
          .map((share) => (
            <div
              key={share.label}
              className={cn('h-full rounded-[2px]', fill(share.accent))}
              style={{ width: `${(share.value / total) * 100}%` }}
              title={`${share.label}: ${formatNumber(share.value)}`}
            />
          ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {shares.map((share) => (
          <li key={share.label} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="inline-flex items-center gap-2 text-ink-soft">
              <span aria-hidden className={cn('h-2.5 w-2.5 shrink-0 rounded-[2px]', fill(share.accent))} />
              {share.label}
            </span>
            <span className="tabular-nums text-ink">
              {formatNumber(share.value)}
              <span className="ml-2 text-ink-muted">
                {Math.round((share.value / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>

      {caption && <p className="mt-3 text-xs leading-relaxed text-ink-muted">{caption}</p>}
    </div>
  );
}

/** In-table proportion bar. One hue, because it encodes magnitude, not identity. */
export function Meter({ value, max, accent = 1 }: { value: number; max: number; accent?: 1 | 2 }) {
  const width = max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * 100) : 0;

  return (
    <span aria-hidden className="mt-1.5 block h-1 w-full rounded-full bg-paper-sunken">
      <span
        className={cn('block h-full rounded-full', accent === 1 ? 'bg-chart-1' : 'bg-chart-2')}
        style={{ width: `${width}%` }}
      />
    </span>
  );
}

/** Small state chip. Carries a word, never colour alone. */
export function Tag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'positive' | 'warning' | 'accent';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        tone === 'positive' && 'bg-positive-tint text-positive',
        tone === 'warning' && 'bg-vermilion-tint text-vermilion',
        tone === 'accent' && 'bg-lapis-tint text-lapis',
        tone === 'neutral' && 'bg-paper-sunken text-ink-soft'
      )}
    >
      {children}
    </span>
  );
}
