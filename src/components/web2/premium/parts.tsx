import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Small pieces the Premium, Premium-succes and Groepslicentie pages share,
 * drawn as in the approved designs (P-Premium, P-PremiumSucces,
 * P-Groepslicentie). Server components.
 */

export function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

/** Green disc with a white check (benefit lists, comparison table). */
export function CheckDisc({ size = 24, label }: { size?: 22 | 24; label?: string }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-green text-white"
      style={{ width: size, height: size }}
      {...(label ? { role: 'img', 'aria-label': label } : {})}
    >
      <CheckIcon size={size === 24 ? 13 : 12} />
    </span>
  );
}

export function CrownIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3 18L5 7l5 5 2-7 2 7 5-5 2 11z" />
    </svg>
  );
}

export function LockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--green)"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mr-1.5 inline-block align-[-3px]"
    >
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/** The 3 benefit lines, copy exactly as decided in the review. */
export const PREMIUM_BENEFITS = [
  'Alle quizzen, zo vaak je wilt',
  'Uitleg bij elk antwoord',
  'Je antwoorden terugkijken na elke quiz',
] as const;

export function BenefitList({ className }: { className?: string }) {
  return (
    <ul className={cn('m-0 flex list-none flex-col gap-3 p-0', className)}>
      {PREMIUM_BENEFITS.map((benefit) => (
        <li key={benefit} className="flex items-center gap-3 text-[17px] font-bold text-ink">
          <CheckDisc />
          {benefit}
        </li>
      ))}
    </ul>
  );
}

const PREVIEW_ROWS = [
  { short: 'Gen', title: 'Genesis', testament: 'Oude Testament', tone: 'bg-green-tint text-green', free: true },
  { short: 'Ps', title: 'Psalmen', testament: 'Oude Testament', tone: 'bg-lapis-tint text-lapis', free: false },
  { short: 'Opb', title: 'Openbaring', testament: 'Nieuwe Testament', tone: 'bg-coral-tint text-coral-text', free: false },
] as const;

/**
 * The tilted quiz list with the gold sticker.
 *
 * `locked`: Genesis free, the rest behind a Premium pill ("Met Premium alles
 * open"). `open`: every row open ("Premium is actief"), on a green wash.
 */
export function PremiumPreview({ variant, className }: { variant: 'locked' | 'open'; className?: string }) {
  const open = variant === 'open';

  return (
    <div
      role="img"
      aria-label={
        open
          ? 'Alle quizzen staan nu open, ook Psalmen en Openbaring'
          : 'Gratis speel je 3 quizzen. Met Premium gaan alle bijbelboeken open, ook Psalmen en Openbaring.'
      }
      className={cn(
        'relative box-border flex max-w-full justify-center',
        open ? 'w-full max-w-[400px] pb-10 pt-[22px]' : 'w-[420px] pb-[42px] pt-[26px]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-1/2 top-0 aspect-square max-w-full -translate-x-1/2 rounded-full',
          open ? 'w-[270px] bg-green-tint' : 'w-[290px] bg-lapis-wash',
        )}
      />
      <span
        className={cn(
          'relative box-border flex max-w-[92%] -rotate-2 flex-col rounded-[16px] border border-line bg-card px-4 pb-1.5 pt-3 text-left shadow-float',
          open ? 'w-[310px]' : 'w-[320px]',
        )}
      >
        <span className="pb-0.5 text-xs font-extrabold text-ink-muted">Quizzen</span>
        {PREVIEW_ROWS.map((row, index) => (
          <span
            key={row.title}
            className={cn('flex items-center gap-3 py-2.5', index < PREVIEW_ROWS.length - 1 && 'border-b border-line-soft')}
          >
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-extrabold', row.tone)}>
              {row.short}
            </span>
            <span className="flex min-w-0 flex-grow flex-col">
              <span className="text-[15px] font-extrabold text-ink">{row.title}</span>
              <span className="text-xs font-semibold text-ink-muted">{row.testament}</span>
            </span>
            {open ? (
              <span className="flex h-6 items-center gap-1 rounded-full bg-green-tint px-[9px] text-xs font-extrabold text-green-text">
                <CheckIcon size={11} />
                Open
              </span>
            ) : row.free ? (
              <span className="flex h-6 items-center rounded-full bg-green-tint px-[9px] text-xs font-extrabold text-green-text">Gratis</span>
            ) : (
              <span className="flex h-6 items-center gap-1 rounded-full bg-gold-tint px-[9px] text-xs font-extrabold text-gold-text">
                <LockIcon />
                Premium
              </span>
            )}
          </span>
        ))}
      </span>
      <span
        className={cn(
          'absolute bottom-2 flex h-10 rotate-3 items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-3.5 text-sm font-extrabold text-gold-ink shadow-float',
          open ? 'right-[2%]' : 'right-0',
        )}
      >
        <CrownIcon className="fill-white stroke-gold-ink" />
        {open ? 'Premium is actief' : 'Met Premium alles open'}
      </span>
    </div>
  );
}

/** Label / value rows in a bordered box (success page, member state). */
export function DetailRows({ rows, className }: { rows: Array<{ label: string; value: React.ReactNode }>; className?: string }) {
  return (
    <dl className={cn('m-0 rounded-[14px] border border-line px-[18px] py-1 text-left', className)}>
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={cn('flex items-center justify-between gap-4 py-[13px]', index < rows.length - 1 && 'border-b border-line-soft')}
        >
          <dt className="text-[15px] font-semibold text-ink-muted">{row.label}</dt>
          <dd className="m-0 text-right text-[15px] font-extrabold text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** FAQ rows exactly as the designs draw them (17px summary, 16/25 body). */
export function FaqList({ items, className }: { items: Array<{ question: string; answer: React.ReactNode; open?: boolean }>; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[16px] border border-line bg-card', className)}>
      {items.map((item) => (
        <details key={item.question} open={item.open} className="group border-b border-line-soft last:border-b-0">
          <summary className="box-border flex min-h-16 cursor-pointer items-center gap-4 px-[22px] py-[18px] text-[17px] font-extrabold text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lapis">
            <span className="flex-grow">{item.question}</span>
            <span className="flex shrink-0 text-ink-muted transition-transform group-open:rotate-180">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </summary>
          <p className="m-0 max-w-[68ch] px-[22px] pb-5 text-base font-semibold leading-[25px] text-ink-soft [&_a]:font-extrabold [&_a]:no-underline">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

/** "Section title + muted subtitle", Fredoka 26/32 over 17/26. */
export function SectionHead({ title, subtitle, id }: { title: string; subtitle?: React.ReactNode; id?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 id={id} className="m-0 text-[26px] leading-8">
        {title}
      </h2>
      {subtitle && <p className="m-0 max-w-[640px] text-[17px] font-semibold leading-[26px] text-ink-muted [&_a]:font-extrabold [&_a]:no-underline">{subtitle}</p>}
    </div>
  );
}
